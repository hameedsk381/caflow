from datetime import date
from typing import List, Dict

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.client import Client
from app.models.statutory_calendar import StatutoryCalendar


async def get_due_dates(db: AsyncSession, client: Client, year: int) -> List[Dict]:
    """Return a list of concrete due‑date dictionaries for the given client.
    The function respects the client's registration type and the statutory calendar.
    """
    result = await db.execute(
        select(StatutoryCalendar).where(
            StatutoryCalendar.frequency.in_(["monthly", "quarterly", "annual"])  # type: ignore
        )
    )
    entries = result.scalars().all()

    due_dates: List[Dict] = []
    for e in entries:
        if e.frequency == "monthly":
            for month in range(1, 13):
                try:
                    d = date(year, month, e.day_of_month)
                except ValueError:
                    continue
                due_dates.append(
                    {
                        "type": e.type,
                        "name": e.name,
                        "due_date": d.isoformat(),
                        "frequency": e.frequency,
                        "description": e.description,
                    }
                )
        elif e.frequency == "quarterly":
            for start_month in (1, 4, 7, 10):
                month = start_month + 2
                try:
                    d = date(year, month, e.day_of_month)
                except ValueError:
                    continue
                due_dates.append(
                    {
                        "type": e.type,
                        "name": e.name,
                        "due_date": d.isoformat(),
                        "frequency": e.frequency,
                        "description": e.description,
                    }
                )
        elif e.frequency == "annual":
            try:
                d = date(year, 12, e.day_of_month)
            except ValueError:
                continue
            due_dates.append(
                {
                    "type": e.type,
                    "name": e.name,
                    "due_date": d.isoformat(),
                    "frequency": e.frequency,
                    "description": e.description,
                }
            )
    due_dates.sort(key=lambda x: x["due_date"])
    return due_dates
