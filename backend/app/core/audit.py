from sqlalchemy import event
from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog
from app.core.tenant import get_tenant_id, get_actor_id

def log_activity(mapper, connection, target, action):
    # Determine what type of entity we are auditing. Exclude self logging.
    if target.__class__.__name__ in ("ActivityLog", "User", "Profile"):
        return
        
    tenant_id = getattr(target, 'firm_id', None) or get_tenant_id()
    actor_id = get_actor_id()

    if not tenant_id or not actor_id:
        return

    entity_name = getattr(target, 'name', getattr(target, 'title', str(target.id)))
    
    connection.execute(
        ActivityLog.__table__.insert().values(
            firm_id=tenant_id,
            actor_id=actor_id,
            action=action,
            entity_type=target.__class__.__name__.lower(),
            entity_id=target.id,
            entity_name=entity_name
        )
    )

def register_audit_listeners():
    from app.models.client import Client
    from app.models.task import Task
    from app.models.invoice import Invoice
    
    for model in [Client, Task, Invoice]:
        event.listen(model, 'after_insert', lambda m, c, t: log_activity(m, c, t, 'created'))
        event.listen(model, 'after_update', lambda m, c, t: log_activity(m, c, t, 'updated'))
        event.listen(model, 'after_delete', lambda m, c, t: log_activity(m, c, t, 'deleted'))
