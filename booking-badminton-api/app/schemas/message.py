from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class MessageBase(BaseModel):
    content: str = Field(default="", description="Isi pesan")
    message_type: str = Field(default="text", description="Tipe pesan: text, file, image")
    attachment_url: Optional[str] = Field(default=None, description="URL lampiran file/gambar jika ada")

class MessageCreate(MessageBase):
    receiver_id: UUID

class MessageResponse(MessageBase):
    id: UUID
    sender_id: UUID
    receiver_id: UUID
    is_read: bool
    created_at: datetime
    sender_name: Optional[str] = Field(default=None)
    sender_role: Optional[str] = Field(default=None)

    class Config:
        from_attributes = True

class ChatHistoryResponse(BaseModel):
    messages: List[MessageResponse]
