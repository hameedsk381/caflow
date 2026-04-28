from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_notif_fields'
down_revision = 'add_stat_cal'
branch_labels = None
depends_on = None

def upgrade():
    # Add scheduled_at and sent_at columns to notifications table
    op.add_column('notifications', sa.Column('scheduled_at', sa.DateTime(), nullable=True))
    op.add_column('notifications', sa.Column('sent_at', sa.DateTime(), nullable=True))

    # Create indexes for performance
    op.create_index('ix_compliance_due_date', 'compliance', ['due_date'], unique=False)
    op.create_index('ix_notifications_scheduled_at', 'notifications', ['scheduled_at'], unique=False)
    op.create_index('ix_notifications_sent_at', 'notifications', ['sent_at'], unique=False)

def downgrade():
    # Drop indexes
    op.drop_index('ix_notifications_sent_at', table_name='notifications')
    op.drop_index('ix_notifications_scheduled_at', table_name='notifications')
    op.drop_index('ix_compliance_due_date', table_name='compliance')

    # Remove columns
    op.drop_column('notifications', 'sent_at')
    op.drop_column('notifications', 'scheduled_at')
