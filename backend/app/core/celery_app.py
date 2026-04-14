from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.task_routes = {
    "app.workers.tasks.*": "main-queue"
}

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

celery_app.conf.beat_schedule = {
    "generate-recurring-tasks-every-midnight": {
        "task": "app.workers.tasks.generate_recurring_tasks",
        "schedule": crontab(hour=0, minute=0), # Run daily at midnight
    },
    "dispatch-daily-reminders": {
        "task": "app.workers.tasks.dispatch_client_reminders",
        "schedule": crontab(hour=8, minute=0), # Run daily at 8AM
    }
}
