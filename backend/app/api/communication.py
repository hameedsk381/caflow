from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List
import uuid
import re
import logging

from app.db.database import get_db
from app.models.communication import CommunicationTemplate, CommunicationLog
from app.models.client import Client
from app.models.user import User
from app.schemas.communication import (
    CommunicationTemplateCreate, CommunicationTemplateResponse,
    CommunicationLogResponse, SendManualMessage
)
from app.core.dependencies import get_current_staff
from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_whatsapp(to_number: str, body: str) -> str:
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.warning("Twilio credentials not configured — WhatsApp not sent")
        return "not_configured"
    from twilio.rest import Client as TwilioClient
    client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    message = client.messages.create(
        from_=settings.TWILIO_WHATSAPP_FROM,
        to=f"whatsapp:{to_number}",
        body=body,
    )
    return message.sid


def _send_email(to_email: str, subject: str, body: str) -> str:
    if not settings.SENDGRID_API_KEY:
        logger.warning("SendGrid API key not configured — Email not sent")
        return "not_configured"
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail
    message = Mail(
        from_email=settings.SENDGRID_FROM_EMAIL,
        to_emails=to_email,
        subject=subject or "Message from CAFlow",
        plain_text_content=body,
    )
    sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
    response = sg.send(message)
    return str(response.status_code)

router = APIRouter()

@router.post("/templates", response_model=CommunicationTemplateResponse)
async def create_template(
    data: CommunicationTemplateCreate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    template = CommunicationTemplate(firm_id=current_user.firm_id, **data.model_dump())
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template

@router.get("/templates", response_model=List[CommunicationTemplateResponse])
async def list_templates(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CommunicationTemplate).where(CommunicationTemplate.firm_id == current_user.firm_id)
    )
    return result.scalars().all()

@router.post("/send", status_code=status.HTTP_201_CREATED)
async def send_message(
    data: SendManualMessage,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch Template
    t_res = await db.execute(select(CommunicationTemplate).where(CommunicationTemplate.id == data.template_id))
    template = t_res.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    # 2. Fetch Client Info
    c_res = await db.execute(select(Client).where(Client.id == data.client_id))
    client = c_res.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    # 3. Render Body
    body = template.body
    body = body.replace("{{client_name}}", client.name)
    body = body.replace("{{pan}}", client.pan or "—")
    body = body.replace("{{gstin}}", client.gstin or "—")
    # Add more placeholders as needed
    
    # 4. Dispatch via provider
    delivery_status = "sent"
    provider_ref = None
    try:
        if template.channel == "whatsapp":
            if not client.phone:
                raise HTTPException(status_code=400, detail="Client has no phone number on record")
            provider_ref = _send_whatsapp(client.phone, body)
        elif template.channel == "email":
            if not client.email:
                raise HTTPException(status_code=400, detail="Client has no email on record")
            provider_ref = _send_email(client.email, template.subject, body)
        if provider_ref == "not_configured":
            delivery_status = "not_configured"
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Provider send failed: %s", exc)
        delivery_status = "failed"

    # 5. Log the attempt
    sent_to = client.email if template.channel == "email" else (client.phone or "Unknown")
    log = CommunicationLog(
        firm_id=current_user.firm_id,
        client_id=client.id,
        template_id=template.id,
        channel=template.channel,
        sent_to=sent_to,
        content=body,
        status=delivery_status,
    )
    db.add(log)
    await db.commit()
    return {"message": f"{template.channel.capitalize()} dispatched ({delivery_status})", "log_id": str(log.id), "status": delivery_status}

@router.get("/logs", response_model=List[CommunicationLogResponse])
async def list_logs(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CommunicationLog)
        .options(joinedload(CommunicationLog.client))
        .where(CommunicationLog.firm_id == current_user.firm_id)
        .order_by(CommunicationLog.created_at.desc())
        .limit(100)
    )
    items = result.scalars().all()
    return [{**i.__dict__, "client_name": i.client.name if i.client else None} for i in items]
