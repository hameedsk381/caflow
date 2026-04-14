from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from app.db.repository import BaseRepository
from app.models.task import Task
from app.models.user import User

class TaskRepository(BaseRepository[Task]):
    def __init__(self, db: AsyncSession, firm_id: str):
        super().__init__(Task, db, firm_id)

    async def list_with_relations(
        self, skip: int = 0, limit: int = 100, **filters
    ) -> tuple[List[Task], int]:
        query = select(self.model).options(
            joinedload(self.model.client),
            joinedload(self.model.assignee).joinedload(User.profile)
        )
        query = self._apply_tenant_filter(query)

        # Apply filters
        for key, value in filters.items():
            if hasattr(self.model, key) and value is not None:
                query = query.where(getattr(self.model, key) == value)

        # Count total matches 
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.scalar(count_query)

        # Get instances
        query = query.offset(skip).limit(limit).order_by(self.model.created_at.desc())
        result = await self.db.execute(query)
        return result.scalars().all(), total
