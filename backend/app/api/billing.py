from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.firm import Firm
from app.core.config import settings

router = APIRouter()

@router.post("/stripe-webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing Stripe signature")

    # In a real environment, you would use stripe.Webhook.construct_event
    # and verify the signature using settings.STRIPE_WEBHOOK_SECRET.
    # For now, we mock the parsing of the JSON payload.
    try:
        event = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid payload: {e}")

    # Handle the event
    if event.get("type") == "customer.subscription.updated":
        subscription = event["data"]["object"]
        # In a real application, you map customer_id to firm_id here.
        # firm_id = get_firm_from_stripe_customer(subscription["customer"])
        
        # Mock logic
        firm_id = subscription.get("metadata", {}).get("firm_id")
        if firm_id:
            result = await db.execute(select(Firm).where(Firm.id == firm_id))
            firm = result.scalar_one_or_none()
            if firm:
                status = subscription.get("status")
                # Example: update firm plan
                if status == "active":
                    firm.plan = subscription.get("items", {}).get("data", [{}])[0].get("price", {}).get("lookup_key", "pro")
                elif status in ("canceled", "unpaid"):
                    firm.plan = "free"
                await db.commit()

    elif event.get("type") == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        firm_id = subscription.get("metadata", {}).get("firm_id")
        if firm_id:
            result = await db.execute(select(Firm).where(Firm.id == firm_id))
            firm = result.scalar_one_or_none()
            if firm:
                firm.plan = "free"
                await db.commit()

    return {"status": "success"}
