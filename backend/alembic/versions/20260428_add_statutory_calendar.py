"""add statutory_calendar table

Revision ID: add_stat_cal
Revises: <previous_revision_id>
Create Date: 2026-04-28 08:48:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "add_stat_cal"
down_revision = "e1f733c3dd45"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "statutory_calendar",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("day_of_month", sa.Integer(), nullable=False),
        sa.Column(
            "frequency",
            sa.Enum("monthly", "quarterly", "annual", name="frequency_enum"),
            nullable=False,
        ),
        sa.Column("description", sa.String(), nullable=True),
    )
    # Optional: create a unique constraint on (type, name, day_of_month, frequency)
    op.create_index(
        "ix_statutory_calendar_type_name",
        "statutory_calendar",
        ["type", "name"],
        unique=False,
    )


def downgrade():
    op.drop_index("ix_statutory_calendar_type_name", table_name="statutory_calendar")
    op.drop_table("statutory_calendar")
    # Drop the enum type
    frequency_enum = postgresql.ENUM("monthly", "quarterly", "annual", name="frequency_enum")
    frequency_enum.drop(op.get_bind())
