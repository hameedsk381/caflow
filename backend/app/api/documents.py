from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.models.document import Document
from app.models.user import User
from app.core.dependencies import get_current_staff
from app.core.config import settings
import uuid
import os
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

router = APIRouter()


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    firm_id: uuid.UUID
    client_id: Optional[uuid.UUID] = None
    file_name: str
    file_url: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    category: Optional[str] = None
    uploaded_by: Optional[uuid.UUID] = None
    created_at: datetime


@router.get("")
async def list_documents(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    client_id: uuid.UUID = Query(None),
    category: str = Query(None),
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    query = select(Document).where(Document.firm_id == current_user.firm_id)
    if client_id:
        query = query.where(Document.client_id == client_id)
    if category:
        query = query.where(Document.category == category)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    query = query.offset((page - 1) * size).limit(size).order_by(Document.created_at.desc())
    result = await db.execute(query)
    docs = result.scalars().all()
    return {"items": [DocumentResponse.model_validate(d) for d in docs], "total": total, "page": page, "size": size}


@router.post("/upload", status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    client_id: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    # For local development, save to /uploads directory
    # In production, upload to S3
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1]
    unique_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    file_url = f"/uploads/{unique_name}"

    doc = Document(
        firm_id=current_user.firm_id,
        client_id=uuid.UUID(client_id) if client_id else None,
        file_name=file.filename,
        file_url=file_url,
        file_type=file.content_type,
        file_size=len(content),
        category=category,
        uploaded_by=current_user.id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return DocumentResponse.model_validate(doc)


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.firm_id == current_user.firm_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    await db.delete(doc)
    await db.commit()
