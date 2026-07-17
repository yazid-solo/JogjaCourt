from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from typing import List
import uuid

from app.database import get_db
from app.models.notification import Notification
from app.models.push_subscription import PushSubscription
from app.models.user import User
from app.schemas.notification import NotificationResponse, PushSubscriptionRequest
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)

@router.post("/subscribe")
async def subscribe_push(
    payload: PushSubscriptionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Save web push subscription to the database.
    """
    # Check if subscription already exists
    stmt = select(PushSubscription).where(PushSubscription.endpoint == payload.endpoint)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        existing.user_id = current_user.id
        existing.p256dh = payload.keys.p256dh
        existing.auth = payload.keys.auth
    else:
        new_sub = PushSubscription(
            user_id=current_user.id,
            endpoint=payload.endpoint,
            p256dh=payload.keys.p256dh,
            auth=payload.keys.auth
        )
        db.add(new_sub)

    await db.commit()
    return {"message": "Subscribed to push notifications successfully"}

@router.get("/", response_model=List[NotificationResponse])
async def get_my_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all notifications for the current logged-in user.
    Filtered by their current role.
    """
    stmt = select(Notification).where(
        Notification.user_id == current_user.id,
        Notification.target_role == current_user.role
    ).order_by(Notification.created_at.desc()).limit(100)
    result = await db.execute(stmt)
    notifications = result.scalars().all()
    return notifications

@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a specific notification as read.
    """
    stmt = select(Notification).where(
        Notification.id == notification_id, 
        Notification.user_id == current_user.id,
        Notification.target_role == current_user.role
    )
    result = await db.execute(stmt)
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return notification

@router.put("/read-all")
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark all notifications for the current user as read.
    """
    stmt = update(Notification).where(
        Notification.user_id == current_user.id,
        Notification.target_role == current_user.role,
        Notification.is_read == False
    ).values(is_read=True)
    
    await db.execute(stmt)
    await db.commit()
    return {"message": "All notifications marked as read"}
