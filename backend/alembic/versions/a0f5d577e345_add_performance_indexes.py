"""add_performance_indexes

Revision ID: a0f5d577e345
Revises: add_perf_idx
Create Date: 2026-04-28 15:44:11.283531

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a0f5d577e345'
down_revision: Union[str, None] = 'aa25a45f7d0e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # op.create_index('ix_compliance_due_date', 'compliance', ['due_date'], unique=False)
    op.create_index('ix_compliance_firm_id_status', 'compliance', ['firm_id', 'status'], unique=False)
    op.create_index('ix_activity_logs_firm_id_created_at', 'activity_logs', ['firm_id', 'created_at'], unique=False)
    op.create_index('ix_portal_sync_logs_client_id', 'portal_sync_logs', ['client_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_portal_sync_logs_client_id', table_name='portal_sync_logs')
    op.drop_index('ix_activity_logs_firm_id_created_at', table_name='activity_logs')
    op.drop_index('ix_compliance_firm_id_status', table_name='compliance')
    op.drop_index('ix_compliance_due_date', table_name='compliance')
