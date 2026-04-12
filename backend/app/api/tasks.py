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
    query = select(Task).where(Task.firm_id == current_user.firm_id)
    if client_id:
        query = query.where(Task.client_id == client_id)
    if status:
        query = query.where(Task.status == status)
    if priority:
        query = query.where(Task.priority == priority)
    if assigned_to:
        query = query.where(Task.assigned_to == assigned_to)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    query = query.offset((page - 1) * size).limit(size).order_by(Task.created_at.desc())
    result = await db.execute(query)
    tasks = result.scalars().all()

    items = []
    for t in tasks:
        r = TaskResponse.model_validate(t)
        if t.client_id:
            c_res = await db.execute(select(Client).where(Client.id == t.client_id))
            client = c_res.scalar_one_or_none()
            if client:
                r.client_name = client.name
        if t.assigned_to:
            p_res = await db.execute(select(Profile).where(Profile.user_id == t.assigned_to))
            prof = p_res.scalar_one_or_none()
            if prof:
                r.assignee_name = prof.name
        items.append(r)

    return TaskListResponse(items=items, total=total, page=page, size=size)


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(
    data: TaskCreate,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    task = Task(
        firm_id=current_user.firm_id,
        created_by=current_user.id,
        **data.model_dump()
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.firm_id == current_user.firm_id)
    )
    task = result.scalar_one_or_none()
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
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.firm_id == current_user.firm_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.firm_id == current_user.firm_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    await db.commit()
