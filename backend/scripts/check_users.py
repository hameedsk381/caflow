import asyncio
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.models.user import User
from app.models.firm import Firm
from app.models.profile import Profile

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User.email))
        emails = res.scalars().all()
        print("Registered Emails:")
        for email in emails:
            print(f" - {email}")

if __name__ == "__main__":
    asyncio.run(check())
