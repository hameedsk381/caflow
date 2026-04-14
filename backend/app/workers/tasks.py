from app.core.celery_app import celery_app
import time

@celery_app.task(name="app.workers.tasks.send_welcome_email")
def send_welcome_email(email: str, name: str):
    # Simulate sending an email
    time.sleep(2)
    print(f"Sent welcome email to {name} <{email}>")
    return True

@celery_app.task(name="app.workers.tasks.generate_client_report")
def generate_client_report(client_id: str, firm_id: str):
    # Simulate heavy PDF generation or aggregation
    time.sleep(5)
    print(f"Generated report for client {client_id} (Firm: {firm_id})")
    return {"status": "completed", "client_id": client_id}

@celery_app.task(name="app.workers.tasks.generate_recurring_tasks")
def generate_recurring_tasks():
    # In a real environment, this spins up an async event loop
    # or executes synchronous SQLAlchemy code to read `RecurringTaskConfig`
    # and duplicate templates into actual `Task` generation.
    print("[Beat] Sweeping RecurringTaskConfig and generating Monthly routines.")
    return True

@celery_app.task(name="app.workers.tasks.dispatch_client_reminders")
def dispatch_client_reminders():
    # Simulate sweeping Compliance & Notice deadlines and triggering WhatsApp/Twilio
    print("[Beat] Dispatching critical WhatsApp and email reminders to missing client signatures.")
    return True
