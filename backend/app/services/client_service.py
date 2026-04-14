from app.db.repository import BaseRepository
from app.models.client import Client
from sqlalchemy.ext.asyncio import AsyncSession

class ClientRepository(BaseRepository[Client]):
    def __init__(self, db: AsyncSession, firm_id: str):
        super().__init__(Client, db, firm_id)
