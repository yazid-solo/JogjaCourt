import logging
import httpx
import smtplib
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pywebpush import webpush, WebPushException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.config import settings
from app.models.push_subscription import PushSubscription

logger = logging.getLogger("notification_service")
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    ch.setFormatter(formatter)
    logger.addHandler(ch)

async def send_whatsapp_message(phone_number: str, message: str):
    """
    Mengirim pesan WhatsApp secara nyata melalui Fonnte API.
    """
    if not phone_number:
        return
        
    if not settings.FONNTE_TOKEN:
        logger.warning(f"[WA GATEWAY] FONNTE_TOKEN belum diatur. Pesan ke {phone_number} dibatalkan.")
        logger.info(f"[DEBUG WA PENDING]:\n{message}")
        return

    url = "https://api.fonnte.com/send"
    headers = {
        "Authorization": settings.FONNTE_TOKEN
    }
    
    # Bersihkan nomor HP jika diawali 0, ganti ke 62
    if phone_number.startswith('0'):
        phone_number = '62' + phone_number[1:]
        
    data = {
        "target": phone_number,
        "message": message,
        "countryCode": "62"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, data=data, timeout=15.0)
            if response.status_code == 200:
                logger.info(f"✅ [WA GATEWAY] Pesan berhasil dikirim ke {phone_number}")
            else:
                logger.error(f"❌ [WA GATEWAY] Gagal mengirim ke {phone_number}. Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        logger.error(f"❌ [WA GATEWAY] Error koneksi saat mengirim ke {phone_number}: {e}")

def send_email(email_address: str, subject: str, body: str):
    """
    Mengirim Email HTML secara nyata menggunakan SMTP Server (misal Gmail).
    """
    if not email_address:
        return
        
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(f"[EMAIL GATEWAY] SMTP kredensial belum diatur. Email ke {email_address} dibatalkan.")
        return

    msg = MIMEMultipart("alternative")
    msg['Subject'] = subject
    msg['From'] = f"Jogjacourt System <{settings.SMTP_USER}>"
    msg['To'] = email_address

    html_body = f"""
    <html>
      <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <div style="max-w-md; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #D4AF37;">Jogjacourt - Pemesanan Lapangan</h2>
          <p>{body}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777;">Email ini dibuat secara otomatis oleh sistem, harap jangan dibalas.</p>
        </div>
      </body>
    </html>
    """
    
    msg.attach(MIMEText(html_body, 'html'))

    try:
        # Menggunakan smtplib dalam thread terpisah akan lebih ideal, 
        # namun untuk kesederhanaan kita panggil langsung di sini
        # (BackgroundTasks FastAPI sudah menjalakannya di thread pool)
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            logger.info(f"✅ [EMAIL GATEWAY] Email berhasil dikirim ke {email_address}")
    except Exception as e:
        logger.error(f"❌ [EMAIL GATEWAY] Error mengirim email ke {email_address}: {e}")

async def send_web_push(db: AsyncSession, user_id: str, title: str, body: str, url: str = "/dashboard/chat"):
    """
    Mengirim Web Push Notification ke perangkat user (Mobile/Desktop) melalui service worker.
    """
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_CLAIM_EMAIL:
        logger.warning("[WEB PUSH] VAPID keys belum lengkap. Push notif dibatalkan.")
        return

    # Ambil semua langganan push untuk user ini
    stmt = select(PushSubscription).where(PushSubscription.user_id == user_id)
    result = await db.execute(stmt)
    subscriptions = result.scalars().all()

    if not subscriptions:
        return

    payload = json.dumps({
        "title": title,
        "body": body,
        "url": url,
        "icon": "/Logo.svg",
        "badge": "/favicon.ico"
    })

    for sub in subscriptions:
        try:
            sub_info = {
                "endpoint": sub.endpoint,
                "keys": {
                    "p256dh": sub.p256dh,
                    "auth": sub.auth
                }
            }
            webpush(
                subscription_info=sub_info,
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_CLAIM_EMAIL}
            )
            logger.info(f"✅ [WEB PUSH] Berhasil mengirim push ke endpoint {sub.endpoint[:30]}...")
        except WebPushException as ex:
            logger.error(f"❌ [WEB PUSH] Gagal: {repr(ex)}")
            # Optional: Jika status 410 (Gone), langganan sudah kedaluwarsa, bisa dihapus dari DB
            if ex.response and ex.response.status_code == 410:
                await db.delete(sub)
                await db.commit()
        except Exception as e:
            logger.error(f"❌ [WEB PUSH] Error internal: {e}")
