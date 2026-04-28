from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.portal_sync import PortalSyncLog, SyncStatus, PortalType
from app.models.vault import EncryptedCredential
from app.models.compliance import Compliance, ComplianceType, ComplianceStatus
from app.core.crypto import decrypt_string
from app.services.portals.gst import GSTScraper
from app.services.portals.mca import MCAScraper
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class PortalSyncEngine:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def sync_client_portal(self, firm_id, client_id, portal_type: PortalType, sync_type: str, triggered_by=None):
        # 1. Create Log
        log = PortalSyncLog(
            firm_id=firm_id,
            client_id=client_id,
            portal_type=portal_type,
            sync_type=sync_type,
            status=SyncStatus.RUNNING,
            triggered_by=triggered_by
        )
        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(log)

        try:
            # 2. Get Credentials from Vault
            res = await self.db.execute(
                select(EncryptedCredential).where(
                    EncryptedCredential.client_id == client_id,
                    EncryptedCredential.portal_name.ilike(f"%{portal_type.value}%")
                )
            )
            cred = res.scalar_one_or_none()
            
            if not cred:
                raise Exception(f"No credentials found in Vault for {portal_type.value}")

            # Decrypt password
            password = decrypt_string(cred.encrypted_password)
            
            # 3. Initialize Scraper
            scraper = None
            if portal_type == PortalType.GST:
                scraper = GSTScraper()
            elif portal_type == PortalType.MCA:
                scraper = MCAScraper()
            else:
                raise Exception(f"Scraper for {portal_type} not yet implemented")

            # 4. Run Sync
            success = await scraper.login(cred.username, password)
            if not success:
                raise Exception("Portal login failed (Invalid credentials)")

            if sync_type == "return_status":
                result = await scraper.fetch_return_status("2026-27")
                
                # 5. Auto-update Compliance records
                # Map portal categories to our internal ComplianceType
                type_map = {
                    "GSTR-1": ComplianceType.GST,
                    "GSTR-3B": ComplianceType.GST,
                    "AOC-4": ComplianceType.ROC,
                    "MGT-7": ComplianceType.ROC,
                }
                
                for form_name, filings in result.items():
                    if form_name == "source": continue
                    
                    internal_type = type_map.get(form_name)
                    if not internal_type: continue
                    
                    # Ensure filings is a list (GST format) or a single dict (MCA format)
                    if isinstance(filings, dict):
                        filings = [filings]
                    
                    for filing in filings:
                        if filing.get("status") == "Filed":
                            # Try to find a matching pending compliance record
                            # We match by client, type, and period (if provided)
                            period = filing.get("period")
                            
                            comp_query = select(Compliance).where(
                                Compliance.client_id == client_id,
                                Compliance.type == internal_type,
                                Compliance.status != ComplianceStatus.filed
                            )
                            
                            if period:
                                comp_query = comp_query.where(Compliance.period.ilike(f"%{period}%"))
                            
                            comp_res = await self.db.execute(comp_query)
                            comp = comp_res.scalars().first()
                            
                            if comp:
                                logger.info(f"Auto-mapping filing: Found {comp.type} for {period}. Updating to FILED.")
                                comp.status = ComplianceStatus.filed
                                comp.filing_reference = filing.get("srn") or filing.get("date")
                                # Record the sync in notes
                                comp.notes = (comp.notes or "") + f"\n[Auto-Sync] Verified filed on {portal_type.value} portal."

            # 6. Update Log
            log.status = SyncStatus.COMPLETED
            log.result_data = result
            log.completed_at = datetime.utcnow()
            
        except Exception as e:
            logger.error(f"Portal sync failed: {str(e)}")
            log.status = SyncStatus.FAILED
            log.error_message = str(e)
            log.completed_at = datetime.utcnow()
        
        await self.db.commit()
        return log
