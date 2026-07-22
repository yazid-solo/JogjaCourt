import json
import uuid
import os
import shutil
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, union, text, func
from typing import List, Dict

from app.database import get_db, async_session
from app.models.message import Message
from app.models.user import User, RoleEnum
from app.schemas.message import ChatHistoryResponse, MessageResponse
from app.utils.dependencies import get_current_user
from pydantic import BaseModel
from app.services.notification_service import send_web_push

class SendMessageRequest(BaseModel):
    receiver_id: str
    content: str
    message_type: str = "text"
    attachment_url: str = None

class BotMessageRequest(BaseModel):
    content: str

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)

@router.post("/send")
async def send_message_rest(
    payload: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    HTTP POST Endpoint untuk mengirim pesan (Fallback dari WebSocket)
    Mendukung Web Push Notification secara langsung
    """
    receiver_query = select(User).where(User.id == uuid.UUID(payload.receiver_id))
    receiver_res = await db.execute(receiver_query)
    receiver_user = receiver_res.scalars().first()
    
    if not receiver_user:
        raise HTTPException(status_code=404, detail="Receiver not found")

    # Anti-Fraud: Customer & Admin hanya boleh chat dengan Super Admin
    if current_user.role in [RoleEnum.customer, RoleEnum.admin] and receiver_user.role != RoleEnum.super_admin:
        raise HTTPException(status_code=403, detail="Tidak diizinkan chat dengan user ini")

    new_message = Message(
        sender_id=current_user.id,
        receiver_id=uuid.UUID(payload.receiver_id),
        content=payload.content,
        message_type=payload.message_type,
        attachment_url=payload.attachment_url
    )
    
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    
    msg_json = json.dumps({
        "id": str(new_message.id),
        "sender_id": str(new_message.sender_id),
        "receiver_id": str(new_message.receiver_id),
        "content": new_message.content,
        "message_type": new_message.message_type,
        "attachment_url": new_message.attachment_url,
        "created_at": new_message.created_at.isoformat(),
        "sender_name": current_user.name,
        "sender_role": current_user.role.value if current_user.role else ""
    })
    
    # Broadcast via WebSocket jika secara kebetulan terhubung (lokal/non-serverless)
    await manager.send_personal_message(msg_json, payload.receiver_id)
    
    # TRIGER WEB PUSH NOTIFICATION KE PENERIMA
    title = f"Pesan dari {current_user.name}"
    body = payload.content[:100] + ("..." if len(payload.content) > 100 else "")
    if payload.attachment_url:
        body = "📷 Mengirim lampiran"
    
    await send_web_push(db=db, user_id=payload.receiver_id, title=title, body=body)

    return {"status": "success", "message": "Pesan terkirim"}

@router.post("/bot-send")
async def send_bot_message(
    payload: BotMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint khusus agar sistem membalas pesan otomatis atas nama Super Admin ke current_user.
    Hanya bisa dipicu oleh Customer.
    """
    if current_user.role != RoleEnum.customer:
        raise HTTPException(status_code=403, detail="Hanya customer yang bisa memicu bot")

    # Cari Super Admin
    result = await db.execute(select(User).where(User.role == RoleEnum.super_admin).limit(1))
    sa = result.scalars().first()
    if not sa:
        raise HTTPException(status_code=404, detail="Super Admin tidak ditemukan")

    new_message = Message(
        sender_id=sa.id,
        receiver_id=current_user.id,
        content=payload.content,
        message_type="bot_text"
    )
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)

    msg_json = json.dumps({
        "id": str(new_message.id),
        "sender_id": str(new_message.sender_id),
        "receiver_id": str(new_message.receiver_id),
        "content": new_message.content,
        "message_type": new_message.message_type,
        "created_at": new_message.created_at.isoformat(),
        "sender_name": "Asisten JogjaCourt",
        "is_bot": True
    })

    # Broadcast ke customer
    await manager.send_personal_message(msg_json, str(current_user.id))
    
    # Web push (opsional, mungkin tidak perlu karena user sedang membuka chat)
    await send_web_push(db=db, user_id=str(current_user.id), title="Asisten JogjaCourt", body=payload.content[:100])

    return {"status": "success"}


class ConnectionManager:
    def __init__(self):
        # Maps user_id (str) to their active WebSocket
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

manager = ConnectionManager()

@router.post("/upload")
async def upload_chat_file(file: UploadFile = File(...)):
    """Menerima dan menyimpan lampiran file/gambar untuk Chat"""
    try:
        contents = await file.read()
        file_ext = file.filename.split('.')[-1]
        unique_filename = f"chat_{uuid.uuid4().hex}.{file_ext}"
        
        # Simpan di bucket "payments" sebagai default Supabase Storage bucket.
        image_url = await upload_image_to_supabase(contents, unique_filename, bucket_name="payments")
        
        return {"attachment_url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/contacts")
async def get_chat_contacts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mendapatkan daftar kontak yang pernah mengobrol dengan user saat ini, serta cross-role untuk Admin dan Super Admin"""
    contact_ids = set()
    
    if current_user.role == RoleEnum.admin:
        # Admin HANYA bisa melihat Super Admin
        sa_query = select(User.id).where(User.role == RoleEnum.super_admin)
        sa_res = await db.execute(sa_query)
        for row in sa_res.all():
            contact_ids.add(row[0])
            
    elif current_user.role == RoleEnum.super_admin:
        # Super Admin bisa melihat semua Admin dan user lain yang pernah chat dengannya
        sent_to = select(Message.receiver_id).where(Message.sender_id == current_user.id)
        received_from = select(Message.sender_id).where(Message.receiver_id == current_user.id)
        
        contact_ids_query = union(sent_to, received_from)
        result_ids = await db.execute(contact_ids_query)
        for row in result_ids.all():
            contact_ids.add(row[0])
            
        admin_query = select(User.id).where(User.role == RoleEnum.admin)
        admin_res = await db.execute(admin_query)
        for row in admin_res.all():
            contact_ids.add(row[0])
            
    else:
        # Role lain (seperti Customer) HANYA bisa melihat Super Admin
        sa_query = select(User.id).where(User.role == RoleEnum.super_admin)
        sa_res = await db.execute(sa_query)
        for row in sa_res.all():
            contact_ids.add(row[0])
    
    # Hapus user dirinya sendiri dari daftar kontak agar tidak bisa chat diri sendiri
    if current_user.id in contact_ids:
        contact_ids.remove(current_user.id)
        
    if not contact_ids:
        return {"contacts": []}
        
    users_query = select(User).where(User.id.in_(list(contact_ids)))
    users_result = await db.execute(users_query)
    contacts = users_result.scalars().all()
    
    contact_list = []
    for contact in contacts:
        last_msg_query = select(Message).where(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == contact.id),
                and_(Message.sender_id == contact.id, Message.receiver_id == current_user.id)
            )
        ).order_by(Message.created_at.desc()).limit(1)
        
        last_msg_result = await db.execute(last_msg_query)
        last_msg = last_msg_result.scalars().first()
        
        unread_query = select(func.count(Message.id)).where(
            and_(
                Message.sender_id == contact.id,
                Message.receiver_id == current_user.id,
                Message.is_read == False
            )
        )
        unread_result = await db.execute(unread_query)
        unread_count = unread_result.scalar() or 0
        
        contact_list.append({
            "id": str(contact.id),
            "name": contact.name,
            "email": contact.email,
            "role": contact.role.value if hasattr(contact, 'role') and contact.role else "",
            "lastMessage": last_msg.content if last_msg else (last_msg.message_type if last_msg else ""),
            "lastMessageSenderId": str(last_msg.sender_id) if last_msg else "",
            "time": last_msg.created_at.isoformat() if last_msg else "",
            "is_read": last_msg.is_read if last_msg else True,
            "unreadCount": unread_count
        })
        
    contact_list.sort(key=lambda x: x["time"], reverse=True)
    return {"contacts": contact_list}

@router.get("/history/{contact_id}", response_model=ChatHistoryResponse)
async def get_chat_history(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mendapatkan riwayat obrolan antara user yang login dan contact_id"""
    query = select(Message).where(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == contact_id),
            and_(Message.sender_id == contact_id, Message.receiver_id == current_user.id)
        )
    ).order_by(Message.created_at.desc()).limit(200)
    
    result = await db.execute(query)
    messages = list(result.scalars().all())
    messages.reverse()
    
    # Tandai pesan sebagai dibaca (is_read = True) jika penerimanya adalah current_user
    messages_updated = False
    for msg in messages:
        if msg.receiver_id == current_user.id and not msg.is_read:
            msg.is_read = True
            messages_updated = True
            
    if messages_updated:
        await db.commit()
    
    # Ambil data kontak untuk mendapatkan nama dan role
    contact_query = select(User).where(User.id == contact_id)
    contact_res = await db.execute(contact_query)
    contact_user = contact_res.scalars().first()
    
    msg_list = []
    for msg in messages:
        msg_dict = {
            "id": msg.id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "content": msg.content,
            "message_type": msg.message_type,
            "attachment_url": msg.attachment_url,
            "is_read": msg.is_read,
            "created_at": msg.created_at,
            "is_bot": msg.message_type == 'bot_text'
        }
        if msg.sender_id == current_user.id:
            msg_dict["sender_name"] = current_user.name
            msg_dict["sender_role"] = current_user.role.value if current_user.role else ""
        elif contact_user and msg.sender_id == contact_id:
            msg_dict["sender_name"] = contact_user.name
            msg_dict["sender_role"] = contact_user.role.value if contact_user.role else ""
        else:
            msg_dict["sender_name"] = "Unknown"
            msg_dict["sender_role"] = ""
            
        msg_list.append(msg_dict)
    
    return {"messages": msg_list}

@router.post("/read/{contact_id}")
async def mark_messages_as_read(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tandai semua pesan dari contact_id sebagai telah dibaca"""
    query = select(Message).where(
        and_(
            Message.sender_id == contact_id,
            Message.receiver_id == current_user.id,
            Message.is_read == False
        )
    )
    result = await db.execute(query)
    messages = result.scalars().all()
    
    for msg in messages:
        msg.is_read = True
        
    if messages:
        await db.commit()
        
    return {"status": "success", "updated_count": len(messages)}

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            
            try:
                payload = json.loads(data)
                receiver_id = payload.get("receiver_id")
                content = payload.get("content", "")
                message_type = payload.get("message_type", "text")
                attachment_url = payload.get("attachment_url")
                
                # WebRTC Signaling & Read Receipts bypasses DB saving
                if message_type in ["offer", "answer", "ice_candidate", "call_end", "read_receipt"]:
                    if receiver_id:
                        msg_json = json.dumps({
                            "sender_id": user_id,
                            "receiver_id": receiver_id,
                            "message_type": message_type,
                            "content": content
                        })
                        await manager.send_personal_message(msg_json, receiver_id)
                    continue
                
                if receiver_id and (content or attachment_url):
                    # Simpan pesan biasa ke database dengan validasi
                    async with async_session() as db:
                        sender_query = select(User).where(User.id == uuid.UUID(user_id))
                        sender_res = await db.execute(sender_query)
                        sender_user = sender_res.scalars().first()
                        
                        receiver_query = select(User).where(User.id == uuid.UUID(receiver_id))
                        receiver_res = await db.execute(receiver_query)
                        receiver_user = receiver_res.scalars().first()

                        if not sender_user or not receiver_user:
                            continue

                        # Anti-Fraud: Customer & Admin hanya boleh chat dengan Super Admin
                        if sender_user.role in [RoleEnum.customer, RoleEnum.admin] and receiver_user.role != RoleEnum.super_admin:
                            continue # BLOKIR PESAN

                        new_message = Message(
                            sender_id=uuid.UUID(user_id),
                            receiver_id=uuid.UUID(receiver_id),
                            content=content,
                            message_type=message_type,
                            attachment_url=attachment_url
                        )
                        db.add(new_message)
                        await db.commit()
                        await db.refresh(new_message)
                        
                        msg_json = json.dumps({
                            "id": str(new_message.id),
                            "sender_id": str(new_message.sender_id),
                            "receiver_id": str(new_message.receiver_id),
                            "content": new_message.content,
                            "message_type": new_message.message_type,
                            "attachment_url": new_message.attachment_url,
                            "created_at": new_message.created_at.isoformat(),
                            "sender_name": sender_user.name if sender_user else "Unknown",
                            "sender_role": sender_user.role.value if sender_user and sender_user.role else ""
                        })
                        await manager.send_personal_message(msg_json, receiver_id)
            except json.JSONDecodeError:
                pass
            except Exception as e:
                print(f"WS Error: {e}")
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)

@router.delete("/history/{contact_id}")
async def clear_chat_history(contact_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("""
            DELETE FROM messages 
            WHERE (sender_id = :current_user AND receiver_id = :contact_id) 
            OR (sender_id = :contact_id AND receiver_id = :current_user)
        """), {"current_user": current_user.id, "contact_id": contact_id})
        await db.commit()
        return {"status": "success", "message": "Chat history cleared"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/block/{contact_id}")
async def block_user(contact_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("""
            INSERT INTO blocked_users (blocker_id, blocked_id) 
            VALUES (:blocker_id, :blocked_id)
            ON CONFLICT DO NOTHING
        """), {"blocker_id": current_user.id, "blocked_id": contact_id})
        await db.commit()
        return {"status": "success", "message": "User blocked successfully"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
