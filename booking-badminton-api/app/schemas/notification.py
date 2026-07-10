from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    title: str
    message: str
    target_role: Optional[str] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[UUID4] = None

class NotificationCreate(NotificationBase):
    user_id: UUID4

class NotificationResponse(NotificationBase):
    id: UUID4
    user_id: UUID4
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str

class PushSubscriptionRequest(BaseModel):
    endpoint: str
    keys: PushSubscriptionKeys
