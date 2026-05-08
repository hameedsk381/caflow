"""add provider_call_log

Revision ID: add_provider_call_log
Revises: 4f8c07d683d5
Create Date: 2026-05-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision = "add_provider_call_log"
down_revision = "4f8c07d683d5"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "provider_call_log",
        sa.Column("id", sa.BigInteger(), autoincrement=True, primary_key=True),
        sa.Column("firm_id", UUID(as_uuid=True), nullable=True),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("endpoint", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("latency_ms", sa.Integer(), nullable=False),
        sa.Column("cost_paise", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("request_id", sa.String(length=64), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_provider_call_log_firm_id",
        "provider_call_log",
        ["firm_id"],
    )
    op.create_index(
        "ix_provider_call_log_provider",
        "provider_call_log",
        ["provider"],
    )
    op.create_index(
        "ix_provider_call_log_request_id",
        "provider_call_log",
        ["request_id"],
    )
    op.create_index(
        "ix_provider_call_log_created_at",
        "provider_call_log",
        ["created_at"],
    )
    op.create_index(
        "ix_provider_call_log_firm_provider_created",
        "provider_call_log",
        ["firm_id", "provider", "created_at"],
    )


def downgrade():
    op.drop_index("ix_provider_call_log_firm_provider_created", table_name="provider_call_log")
    op.drop_index("ix_provider_call_log_created_at", table_name="provider_call_log")
    op.drop_index("ix_provider_call_log_request_id", table_name="provider_call_log")
    op.drop_index("ix_provider_call_log_provider", table_name="provider_call_log")
    op.drop_index("ix_provider_call_log_firm_id", table_name="provider_call_log")
    op.drop_table("provider_call_log")
