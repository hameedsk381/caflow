from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.models.task import Task
from app.models.client import Client
from app.models.profile import Profile
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskListResponse
from app.core.dependencies import get_current_user, get_current_staff
from app.services.task_service import TaskRepository
import uuid

router = APIRouter()


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    client_id: uuid.UUID = Query(None),
    status: str = Query(None),
    priority: str = Query(None),
    assigned_to: uuid.UUID = Query(None),
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db, current_user.firm_id)
    skip = (page - 1) * size
    
    filters = {}
    if client_id: filters["client_id"] = client_id
    if status: filters["status"] = status
    if priority: filters["priority"] = priority
    if assigned_to: filters["assigned_to"] = assigned_to

    tasks, total = await repo.list_with_relations(skip=skip, limit=size, **filters)

    items = []
    for t in tasks:
        r = TaskResponse.model_validate(t)
        if hasattr(t, "client") and t.client:
            r.client_name = t.client.name
        if hasattr(t, "assignee") and t.assignee and hasattr(t.assignee, "profile") and t.assignee.profile:
            r.assignee_name = t.assignee.profile.name
        items.append(r)

    return TaskListResponse(items=items, total=total, page=page, size=size)


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(
    data: TaskCreate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db, current_user.firm_id)
    obj_in = data.model_dump()
    obj_in["created_by"] = current_user.id
    task = await repo.create(obj_in)
    return task


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db, current_user.firm_id)
    task = await repo.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    data: TaskUpdate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db, current_user.firm_id)
    task = await repo.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = await repo.update(task, data.model_dump(exclude_none=True))
    return task


@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db, current_user.firm_id)
    deleted = await repo.delete(task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
