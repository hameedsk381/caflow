"""add indexes for activity_logs and notifications

Revision ID: add_perf_idx
Revises: create_act_logs
Create Date: 2026-04-30 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_perf_idx'
down_revision = 'create_act_logs'
branch_labels = None
depends_on = None

def upgrade():
    # activity_logs: index on firm_id + created_at for fast range queries
    op.create_index(
        'ix_activity_logs_firm_created',
        'activity_logs',
        ['firm_id', 'created_at'],
        unique=False
    )
    # notifications: index on scheduled_at and sent_at for scheduler look-ups
    op.create_index(
        'ix_notifications_sched_sent',
        'notifications',
        ['scheduled_at', 'sent_at'],
        unique=False
    )

def downgrade():
    op.drop_index('ix_activity_logs_firm_created', table_name='activity_logs')
    op.drop_index('ix_notifications_sched_sent', table_name='notifications')
