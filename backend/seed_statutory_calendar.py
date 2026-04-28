#!/usr/bin/env python3
"""Seed the statutory_calendar table with Indian compliance deadlines.
Run with: `python backend/seed_statutory_calendar.py`
"""
import csv
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.statutory_calendar import StatutoryCalendar, Base

# Adjust the DATABASE_URL as per your .env or settings
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:password@localhost:5432/caflow")
# Use sync engine for seeding
engine = create_engine(DATABASE_URL.replace('+asyncpg', ''), echo=False)
SessionLocal = sessionmaker(bind=engine)

# Hard‑coded data (you may replace with a CSV file if preferred)
DATA = [
    # GST
    {"type": "GST", "name": "GSTR-1", "day_of_month": 11, "frequency": "monthly", "description": "Monthly sales return"},
    {"type": "GST", "name": "GSTR-3B", "day_of_month": 20, "frequency": "monthly", "description": "Monthly summary return"},
    {"type": "GST", "name": "Annual GST Return", "day_of_month": 31, "frequency": "annual", "description": "Year‑end filing"},
    # TDS
    {"type": "TDS", "name": "TDS Payment", "day_of_month": 7, "frequency": "quarterly", "description": "Quarterly TDS payment"},
    {"type": "TDS", "name": "TDS Return", "day_of_month": 31, "frequency": "quarterly", "description": "Quarterly TDS return"},
    # Income Tax (ITR)
    {"type": "ITR", "name": "ITR Filing (Individual)", "day_of_month": 31, "frequency": "annual", "description": "Due date for ITR filing"},
    {"type": "ITR", "name": "ITR Filing (Company)", "day_of_month": 30, "frequency": "annual", "description": "Due date for company ITR"},
    # ROC
    {"type": "ROC", "name": "Annual Return", "day_of_month": 30, "frequency": "annual", "description": "ROC annual return filing"},
    {"type": "ROC", "name": "Balance Sheet", "day_of_month": 30, "frequency": "annual", "description": "ROC balance sheet filing"},
]

def seed():
    Base.metadata.create_all(bind=engine)  # ensure tables exist
    with SessionLocal() as db:
        for row in DATA:
            existing = db.query(StatutoryCalendar).filter_by(
                type=row["type"], name=row["name"], day_of_month=row["day_of_month"], frequency=row["frequency"]
            ).first()
            if not existing:
                record = StatutoryCalendar(**row)
                db.add(record)
        db.commit()
    print("Statutory calendar seeded with", len(DATA), "records.")

if __name__ == "__main__":
    seed()
