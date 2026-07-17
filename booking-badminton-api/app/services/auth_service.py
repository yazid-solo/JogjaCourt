from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status, UploadFile
import uuid
import hashlib
from datetime import datetime, timedelta
import os
from google.oauth2 import id_token
from google.auth.transport import requests

from app.models.user import User, RoleEnum
from app.models.notification import Notification
from app.config import settings
from app.schemas.user import UserCreate
from app.utils.jwt import get_password_hash
from app.utils.helpers import upload_image_to_supabase

async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()

from app.models.push_subscription import PushSubscription
from app.utils.push import send_web_push
import json

async def notify_super_admins(db: AsyncSession, title: str, message: str, related_type: str = None, related_id: str = None):
    result = await db.execute(select(User).where(User.role == RoleEnum.super_admin))
    super_admins = result.scalars().all()
    
    payload = json.dumps({
        "title": title,
        "body": message,
        "icon": "/assets/logo.png",
        "url": "/admin/dashboard.html"
    })

    for admin in super_admins:
        notif = Notification(
            user_id=admin.id,
            title=title,
            message=message,
            target_role="super_admin",
            related_entity_type=related_type,
            related_entity_id=related_id
        )
        db.add(notif)
        
        # Get user's push subscriptions
        sub_result = await db.execute(select(PushSubscription).where(PushSubscription.user_id == admin.id))
        subscriptions = sub_result.scalars().all()
        
        for sub in subscriptions:
            sub_info = {
                "endpoint": sub.endpoint,
                "keys": {
                    "p256dh": sub.p256dh,
                    "auth": sub.auth
                }
            }
            send_web_push(sub_info, payload)
            
    await db.commit()

async def create_user(db: AsyncSession, user: UserCreate, role: RoleEnum = RoleEnum.customer, mitra_status: str = None):
    # Cek apakah email sudah terdaftar
    existing = await get_user_by_email(db, email=user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar. Silakan gunakan email lain.")

    hashed_password = get_password_hash(user.password)
    verification_token = str(uuid.uuid4())
    
    db_user = User(
        name=user.name,
        email=user.email,
        phone=user.phone,
        password_hash=hashed_password,
        role=role,
        verification_token=verification_token,
        mitra_status=mitra_status,
        mitra_gor_name=user.mitra_gor_name,
        mitra_gor_address=user.mitra_gor_address
    )

    db.add(db_user)
    try:
        await db.commit()
        await db.refresh(db_user)
        
        # Jika pendaftaran mitra (pending), beri notifikasi ke super_admin
        if mitra_status == 'pending':
            await notify_super_admins(
                db,
                title="Pengajuan Mitra Baru",
                message=f"{db_user.name} telah mendaftar sebagai calon Mitra. Silakan tinjau pengajuannya.",
                related_type="mitra_request",
                related_id=str(db_user.id)
            )
            
        # Mock sending email
        print(f"MOCK EMAIL: Tolong verifikasi email {db_user.email} dengan token: {verification_token}")
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Email sudah terdaftar. Silakan gunakan email lain.")
    return db_user

async def update_profile_image(db: AsyncSession, current_user: User, file: UploadFile) -> User:
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File harus berupa gambar")
        
    try:
        contents = await file.read()
        filename = f"profiles/{current_user.id}_{file.filename}"
        
        # Simpan di bucket "payments" sebagai default Supabase Storage bucket.
        image_url = await upload_image_to_supabase(contents, filename, bucket_name="payments")
        
        current_user.profile_image = image_url
        await db.commit()
        await db.refresh(current_user)
        return current_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.services.email_service import send_reset_password_email
import asyncio

async def handle_forgot_password(db: AsyncSession, email: str):
    user = await get_user_by_email(db, email)
    if not user:
        return # Do not expose that user doesn't exist
    
    token = str(uuid.uuid4())
    user.reset_password_token = token
    user.reset_password_expires = datetime.utcnow() + timedelta(hours=1)
    
    await db.commit()
    
    # Send email asynchronously
    asyncio.create_task(send_reset_password_email(email, token))
    
    return token

async def handle_reset_password(db: AsyncSession, token: str, new_password: str):
    result = await db.execute(
        select(User).where(User.reset_password_token == token)
    )
    user = result.scalars().first()
    
    if not user or not user.reset_password_expires or user.reset_password_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token reset password tidak valid atau sudah kadaluarsa.")
        
    user.password_hash = get_password_hash(new_password)
    user.reset_password_token = None
    user.reset_password_expires = None
    
    await db.commit()
    return user

async def handle_verify_email(db: AsyncSession, token: str):
    result = await db.execute(
        select(User).where(User.verification_token == token)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Token verifikasi tidak valid.")
        
    user.is_email_verified = True
    user.verification_token = None
    
    await db.commit()
    return user

async def process_google_login(db: AsyncSession, google_token: str, is_mitra: bool = False, mitra_gor_name: str = None, mitra_gor_address: str = None):
    client_id = settings.GOOGLE_CLIENT_ID
    if not client_id:
        raise HTTPException(status_code=500, detail="Google Login belum dikonfigurasi oleh admin.")

    try:
        # Verify the Google ID Token
        idinfo = id_token.verify_oauth2_token(google_token, requests.Request(), client_id)
        
        # Verify issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', f"User {google_id[:4]}")
        picture = idinfo.get('picture')
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Token Google tidak valid: {str(e)}")

    user = await get_user_by_email(db, email)
    
    if not user:
        # Create user via Google
        user = User(
            name=name,
            email=email,
            role=RoleEnum.customer,
            mitra_status='pending' if is_mitra else None,
            mitra_gor_name=mitra_gor_name if is_mitra else None,
            mitra_gor_address=mitra_gor_address if is_mitra else None,
            google_id=google_id,
            profile_image=picture,
            is_email_verified=True # Google emails are already verified
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        if is_mitra:
            await notify_super_admins(
                db,
                title="Pengajuan Mitra Baru (Menunggu Persetujuan)",
                message=f"Pengguna '{user.name}' ({user.email}) mengajukan diri sebagai Admin GOR via Google Login. Silakan tinjau."
            )
    else:
        # Update google_id and maybe picture if they don't have one
        if not user.google_id:
            user.google_id = google_id
        if not user.profile_image and picture:
            user.profile_image = picture
            
        # Set mitra_status to pending if they register as mitra but were customer
        is_new_mitra = False
        if is_mitra and user.role == RoleEnum.customer and user.mitra_status != 'approved':
            user.mitra_status = 'pending'
            if mitra_gor_name:
                user.mitra_gor_name = mitra_gor_name
            if mitra_gor_address:
                user.mitra_gor_address = mitra_gor_address
            is_new_mitra = True

        await db.commit()
        await db.refresh(user)
        
        if is_new_mitra:
            await notify_super_admins(
                db,
                title="Pengajuan Mitra Baru",
                message=f"{user.name} telah mengajukan permohonan sebagai Mitra via Google Login. Silakan tinjau pengajuannya.",
                related_type="mitra_request",
                related_id=str(user.id)
            )
        
    return user
