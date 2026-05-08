"""ProviderCallLog: one row per external provider API call.

Used for per-firm cost reporting, runaway detection, and incident triage.
Rows are append-only — no updates after insert.
"""
from datetime import datetime, timezone

from sqlalchemy import BigInteger, Column, DateTime, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class ProviderCallLog(Base):
    __tablename__ = "provider_call_log"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    firm_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    provider = Column(String(64), nullable=False, index=True)
    endpoint = Column(String(128), nullable=False)
    status = Column(String(16), nullable=False)
    latency_ms = Column(Integer, nullable=False)
    cost_paise = Column(Integer, nullable=False, default=0)
    request_id = Column(String(64), nullable=True, index=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    __table_args__ = (
        Index(
            "ix_provider_call_log_firm_provider_created",
            "firm_id",
            "provider",
            "created_at",
        ),
    )
