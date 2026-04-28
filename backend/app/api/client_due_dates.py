from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

from app.db.database import get_db
from app.models.client import Client
from app.models.user import User
from app.schemas.due_dates import DueDateResponse, DueDateListResponse
from app.core.dependencies import get_current_staff
from app.utils.compliance_dates import get_due_dates

router = APIRouter()

@router.get("/clients/{client_id}/due-dates", response_model=DueDateListResponse)
async def get_client_due_dates(
    client_id: str,
    year: int = Query(date.today().year),
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    # Verify client belongs to the firm
    client = await db.get(Client, client_id)
    if not client or client.firm_id != current_user.firm_id:
        raise HTTPException(status_code=404, detail="Client not found")
    # Compute due dates
    due_dates = get_due_dates(db, client, year)
    return DueDateListResponse(items=due_dates)
