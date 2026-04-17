from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.db.database import get_db
from app.models.vault import EncryptedCredential, DSCToken
from app.models.user import User
from app.schemas.vault import (
    CredentialCreate, CredentialResponse, CredentialRevealResponse,
    DSCTokenCreate, DSCTokenResponse, DSCTokenRevealResponse
)
from app.core.dependencies import get_current_staff, require_permission
from app.core.crypto import encrypt_string, decrypt_string
from app.core.rbac import Permissions

from app.models.client import Client
from sqlalchemy.orm import joinedload

router = APIRouter()

@router.post("/credentials", response_model=CredentialResponse, status_code=status.HTTP_201_CREATED)
async def create_credential(
    data: CredentialCreate,
    current_user: User = Depends(require_permission(Permissions.WRITE_VAULT)),
    db: AsyncSession = Depends(get_db)
):
    cred = EncryptedCredential(
        firm_id=current_user.firm_id,
        client_id=data.client_id,
        portal_name=data.portal_name,
        username=data.username,
        encrypted_password=encrypt_string(data.password),
        notes=data.notes
    )
    db.add(cred)
    await db.commit()
    await db.refresh(cred)
    
    # Reload with client
    res = await db.execute(select(EncryptedCredential).options(joinedload(EncryptedCredential.client)).where(EncryptedCredential.id == cred.id))
    new_cred = res.scalar_one()
    return {**new_cred.__dict__, "client_name": new_cred.client.name if new_cred.client else None}

@router.get("/credentials/client/{client_id}", response_model=List[CredentialResponse])
async def list_credentials(
    client_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(EncryptedCredential)
        .options(joinedload(EncryptedCredential.client))
        .where(
            EncryptedCredential.firm_id == current_user.firm_id,
            EncryptedCredential.client_id == client_id
        )
    )
    items = result.scalars().all()
    return [{**i.__dict__, "client_name": i.client.name if i.client else None} for i in items]

@router.get("/credentials", response_model=List[CredentialResponse])
async def list_all_credentials(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(EncryptedCredential)
        .options(joinedload(EncryptedCredential.client))
        .where(EncryptedCredential.firm_id == current_user.firm_id)
    )
    items = result.scalars().all()
    return [{**i.__dict__, "client_name": i.client.name if i.client else None} for i in items]

@router.get("/credentials/{cred_id}/reveal", response_model=CredentialRevealResponse)
async def reveal_credential(
    cred_id: uuid.UUID,
    current_user: User = Depends(require_permission(Permissions.READ_VAULT)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(EncryptedCredential)
        .options(joinedload(EncryptedCredential.client))
        .where(
            EncryptedCredential.id == cred_id,
            EncryptedCredential.firm_id == current_user.firm_id
        )
    )
    cred = result.scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
        
    response_data = {**cred.__dict__, "client_name": cred.client.name if cred.client else None}
    response_data["password"] = decrypt_string(cred.encrypted_password)
    return response_data

@router.post("/dsc", response_model=DSCTokenResponse, status_code=status.HTTP_201_CREATED)
async def create_dsc_token(
    data: DSCTokenCreate,
    current_user: User = Depends(require_permission(Permissions.WRITE_VAULT)),
    db: AsyncSession = Depends(get_db)
):
    dsc = DSCToken(
        firm_id=current_user.firm_id,
        client_id=data.client_id,
        holder_name=data.holder_name,
        expiry_date=data.expiry_date,
        physical_location=data.physical_location,
        encrypted_pin=encrypt_string(data.pin) if data.pin else None
    )
    db.add(dsc)
    await db.commit()
    await db.refresh(dsc)
    
    # Reload with client
    res = await db.execute(select(DSCToken).options(joinedload(DSCToken.client)).where(DSCToken.id == dsc.id))
    new_dsc = res.scalar_one()
    return {**new_dsc.__dict__, "client_name": new_dsc.client.name if new_dsc.client else None}

@router.get("/dsc/client/{client_id}", response_model=List[DSCTokenResponse])
async def list_dsc_tokens(
    client_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DSCToken)
        .options(joinedload(DSCToken.client))
        .where(
            DSCToken.firm_id == current_user.firm_id,
            DSCToken.client_id == client_id,
            DSCToken.is_active == True
        )
    )
    items = result.scalars().all()
    return [{**i.__dict__, "client_name": i.client.name if i.client else None} for i in items]

@router.get("/dsc", response_model=List[DSCTokenResponse])
async def list_all_dsc(
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DSCToken)
        .options(joinedload(DSCToken.client))
        .where(DSCToken.firm_id == current_user.firm_id)
    )
    items = result.scalars().all()
    return [{**i.__dict__, "client_name": i.client.name if i.client else None} for i in items]

@router.delete("/credentials/{cred_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_credential(
    cred_id: uuid.UUID,
    current_user: User = Depends(require_permission(Permissions.WRITE_VAULT)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(EncryptedCredential).where(
            EncryptedCredential.id == cred_id,
            EncryptedCredential.firm_id == current_user.firm_id
        )
    )
    cred = result.scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    await db.delete(cred)
    await db.commit()

@router.delete("/dsc/{dsc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dsc_token(
    dsc_id: uuid.UUID,
    current_user: User = Depends(require_permission(Permissions.WRITE_VAULT)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DSCToken).where(
            DSCToken.id == dsc_id,
            DSCToken.firm_id == current_user.firm_id
        )
    )
    dsc = result.scalar_one_or_none()
    if not dsc:
        raise HTTPException(status_code=404, detail="DSC Token not found")
    await db.delete(dsc)
    await db.commit()

@router.get("/dsc/{dsc_id}/reveal", response_model=DSCTokenRevealResponse)
async def reveal_dsc_pin(
    dsc_id: uuid.UUID,
    current_user: User = Depends(require_permission(Permissions.READ_VAULT)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DSCToken)
        .options(joinedload(DSCToken.client))
        .where(
            DSCToken.id == dsc_id,
            DSCToken.firm_id == current_user.firm_id
        )
    )
    dsc = result.scalar_one_or_none()
    if not dsc:
        raise HTTPException(status_code=404, detail="DSC Token not found")
        
    response_data = {**dsc.__dict__, "client_name": dsc.client.name if dsc.client else None}
    response_data["pin"] = decrypt_string(dsc.encrypted_pin) if dsc.encrypted_pin else None
    return response_data
