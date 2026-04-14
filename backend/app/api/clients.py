from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.db.database import get_db
from app.models.client import Client
from app.models.user import User
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse, ClientListResponse
from app.core.dependencies import get_current_user, get_current_staff
from app.services.client_service import ClientRepository
import uuid

router = APIRouter()


@router.get("", response_model=ClientListResponse)
async def list_clients(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    status: str = Query(None),
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    repo = ClientRepository(db, current_user.firm_id)
    skip = (page - 1) * size
    
    filters = {}
    if status: filters["status"] = status
    
    # Base repository doesn't have search via OR_, but we can just use the DB context query here for count or pass search.
    # To properly map it, we will construct a clean list query
    query = select(Client).where(Client.firm_id == current_user.firm_id)
    if search:
        query = query.where(
            or_(
                Client.name.ilike(f"%{search}%"),
                Client.gstin.ilike(f"%{search}%"),
                Client.pan.ilike(f"%{search}%"),
                Client.email.ilike(f"%{search}%"),
            )
        )
    if status:
        query = query.where(Client.status == status)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    query = query.offset(skip).limit(size).order_by(Client.created_at.desc())
    result = await db.execute(query)
    clients = result.scalars().all()
    return ClientListResponse(items=clients, total=total, page=page, size=size)


@router.post("", response_model=ClientResponse, status_code=201)
async def create_client(
    data: ClientCreate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    repo = ClientRepository(db, current_user.firm_id)
    client = await repo.create(data.model_dump())
    return client


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    repo = ClientRepository(db, current_user.firm_id)
    client = await repo.get(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: uuid.UUID,
    data: ClientUpdate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    repo = ClientRepository(db, current_user.firm_id)
    client = await repo.get(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = await repo.update(client, data.model_dump(exclude_none=True))
    return client


@router.delete("/{client_id}", status_code=204)
async def delete_client(
    client_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    repo = ClientRepository(db, current_user.firm_id)
    deleted = await repo.delete(client_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Client not found")
