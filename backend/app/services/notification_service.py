from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert
from app.models.compliance import Compliance
from app.models.client import Client
from app.models.user import User, UserStatus
from app.models.notification import Notification
from app.models.notification_preference import NotificationPreference

async def generate_due_date_notifications(db: AsyncSession):
    """Create Notification entries for compliance items based on user preferences.
    This job runs daily and notifies users according to their 'reminder_days' setting.
    """
    today = datetime.utcnow().date()

    # Join User with NotificationPreference to get specific horizons for each user
    # We filter for active users
    stmt = (
        select(User, NotificationPreference)
        .join(NotificationPreference, User.id == NotificationPreference.user_id)
        .where(User.status == UserStatus.active)
    )
    result = await db.execute(stmt)
    user_pref_pairs = result.all()

    for user, pref in user_pref_pairs:
        firm_id = user.firm_id
        # The target date is today + the user's preferred reminder days
        target_date = today + timedelta(days=pref.reminder_days)

        # Find compliance records for this firm due within the user's reminder window
        # and that are not already filed
        comp_stmt = (
            select(Compliance)
            .where(
                Compliance.firm_id == firm_id,
                Compliance.due_date >= today,
                Compliance.due_date <= target_date,
                Compliance.status != "filed",
            )
        )
        comp_res = await db.execute(comp_stmt)
        compliances = comp_res.scalars().all()

        for comp in compliances:
            # Check if we already sent this specific reminder to this user today
            # to prevent duplicates if the job runs multiple times
            check_stmt = (
                select(Notification)
                .where(
                    Notification.user_id == user.id,
                    Notification.entity_type == "compliance",
                    Notification.entity_id == comp.id,
                    Notification.type == "reminder"
                )
            )
            check_res = await db.execute(check_stmt)
            if check_res.scalar_one_or_none():
                continue

            # Get client name for better message
            client_res = await db.execute(select(Client.name).where(Client.id == comp.client_id))
            client_name = client_res.scalar() or "Unknown Client"

            title = f"Filing Reminder: {comp.type} due in {pref.reminder_days} days"
            message = f"{comp.type} for {client_name} is due on {comp.due_date.strftime('%d %b %Y')}."
            
            notif = Notification(
                user_id=user.id,
                firm_id=firm_id,
                title=title,
                message=message,
                type="reminder",
                entity_type="compliance",
                entity_id=comp.id,
            )
            db.add(notif)
    
    await db.commit()

async def dispatch_notifications(db: AsyncSession):
    """
    Processes the notification queue and "sends" them via Email/WhatsApp.
    """
    stmt = (
        select(Notification, User)
        .join(User, Notification.user_id == User.id)
        .where(Notification.sent_at == None)
        .limit(100)
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    for notif, user in rows:
        # Get user preferences
        pref_stmt = select(NotificationPreference).where(NotificationPreference.user_id == user.id)
        pref = (await db.execute(pref_stmt)).scalar_one_or_none()
        
        email_sent = False
        whatsapp_sent = False
        
        # Determine channels based on preference or default to email
        if pref:
            if pref.email_enabled:
                # Mock email sending logic
                print(f"[MAIL] Sending reminder to {user.email}: {notif.title}")
                email_sent = True
            
            if pref.whatsapp_enabled:
                # Mock WhatsApp sending logic (Twilio/SendGrid)
                print(f"[WHATSAPP] Sending reminder to {user.id}: {notif.title}")
                whatsapp_sent = True
        else:
            # Default fallback
            print(f"[MAIL] Sending default reminder to {user.email}: {notif.title}")
            email_sent = True

        if email_sent or whatsapp_sent:
            notif.sent_at = datetime.utcnow()
    
    await db.commit()
