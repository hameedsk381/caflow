from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.models.invoice import Invoice
from app.models.client import Client
from app.models.user import User
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse, InvoiceListResponse
from app.core.dependencies import get_current_staff
import uuid

router = APIRouter()


@router.get("", response_model=InvoiceListResponse)
async def list_invoices(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    client_id: uuid.UUID = Query(None),
    status: str = Query(None),
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    query = select(Invoice).where(Invoice.firm_id == current_user.firm_id)
    if client_id:
        query = query.where(Invoice.client_id == client_id)
    if status:
        query = query.where(Invoice.status == status)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    query = query.offset((page - 1) * size).limit(size).order_by(Invoice.created_at.desc())
    result = await db.execute(query)
    invoices = result.scalars().all()

    items = []
    for inv in invoices:
        r = InvoiceResponse.model_validate(inv)
        if inv.client_id:
            c_res = await db.execute(select(Client).where(Client.id == inv.client_id))
            client = c_res.scalar_one_or_none()
            if client:
                r.client_name = client.name
        items.append(r)

    return InvoiceListResponse(items=items, total=total, page=page, size=size)


@router.post("", response_model=InvoiceResponse, status_code=201)
async def create_invoice(
    data: InvoiceCreate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    total_amount = data.amount + data.tax_amount
    invoice = Invoice(
        firm_id=current_user.firm_id,
        total_amount=total_amount,
        **data.model_dump()
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return invoice


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.firm_id == current_user.firm_id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.put("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: uuid.UUID,
    data: InvoiceUpdate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.firm_id == current_user.firm_id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(invoice, field, value)
    if data.amount is not None or data.tax_amount is not None:
        amt = data.amount if data.amount is not None else invoice.amount
        tax = data.tax_amount if data.tax_amount is not None else invoice.tax_amount
        invoice.total_amount = amt + tax
    await db.commit()
    await db.refresh(invoice)
    return invoice


@router.delete("/{invoice_id}", status_code=204)
async def delete_invoice(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.firm_id == current_user.firm_id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    await db.delete(invoice)
    await db.commit()

from fastapi.responses import Response
from sqlalchemy.orm import joinedload

@router.get("/export/tally")
async def export_to_tally(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    # Fetch all paid/sent invoices for the firm
    result = await db.execute(
        select(Invoice)
        .options(joinedload(Invoice.client))
        .where(
            Invoice.firm_id == current_user.firm_id,
            Invoice.status.in_(["paid", "sent"])
        )
    )
    invoices = result.scalars().all()

    # Build Tally XML
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<ENVELOPE>\n'
    xml += '  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>\n'
    xml += '  <BODY>\n    <IMPORTDATA>\n      <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>\n      <REQUESTDATA>\n'
    
    for inv in invoices:
        client_name = inv.client.name if inv.client else "Walk-in Client"
        vch_date = inv.created_at.strftime("%Y%m%d")
        
        xml += f'        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n'
        xml += f'          <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="AccountingVoucherView">\n'
        xml += f'            <DATE>{vch_date}</DATE>\n'
        xml += f'            <VOUCHERNUMBER>{inv.invoice_number}</VOUCHERNUMBER>\n'
        xml += f'            <PARTYLEDGERNAME>{client_name}</PARTYLEDGERNAME>\n'
        xml += f'            <PERSISTEDVIEW>AccountingVoucherView</PERSISTEDVIEW>\n'
        
        # Debiting the Party
        xml += f'            <ALLLEDGERENTRIES.LIST>\n'
        xml += f'              <LEDGERNAME>{client_name}</LEDGERNAME>\n'
        xml += f'              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n'
        xml += f'              <AMOUNT>-{inv.total_amount}</AMOUNT>\n'
        xml += f'            </ALLLEDGERENTRIES.LIST>\n'
        
        # Crediting the Sales Account
        xml += f'            <ALLLEDGERENTRIES.LIST>\n'
        xml += f'              <LEDGERNAME>Professional Fees Sales</LEDGERNAME>\n'
        xml += f'              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n'
        xml += f'              <AMOUNT>{inv.total_amount}</AMOUNT>\n'
        xml += f'            </ALLLEDGERENTRIES.LIST>\n'
        
        xml += f'          </VOUCHER>\n'
        xml += f'        </TALLYMESSAGE>\n'
        
    xml += '      </REQUESTDATA>\n    </IMPORTDATA>\n  </BODY>\n</ENVELOPE>'
    
    return Response(
        content=xml, 
        media_type="application/xml",
        headers={"Content-Disposition": f"attachment; filename=invoices_tally_{date.today()}.xml"}
    )
