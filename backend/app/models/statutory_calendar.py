from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class StatutoryCalendar(Base):
    __tablename__ = "statutory_calendar"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)                # e.g., "GST", "TDS"
    name = Column(String, nullable=False)                # e.g., "GSTR-3B"
    day_of_month = Column(Integer, nullable=False)       # 20 for GSTR-3B
    frequency = Column(Enum("monthly", "quarterly", "annual", name="frequency_enum"), nullable=False)
    description = Column(String, nullable=True)
