import smtplib
import asyncio
from email.message import EmailMessage
from email.utils import formatdate
from app.config import settings

def send_reset_password_email_sync(to_email: str, token: str):
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"MOCK EMAIL (No SMTP credentials): Reset password untuk {to_email}. Link reset: /reset-password?token={token}")
        return

    # In a real app, this domain would be configurable via env
    domain = settings.FRONTEND_URL.rstrip('/')
    reset_link = f"{domain}/reset-password?token={token}"

    msg = EmailMessage()
    msg['Subject'] = "Reset Password JogjaCourt Anda"
    msg['From'] = f"JogjaCourt <{settings.SMTP_USER}>"
    msg['To'] = to_email
    msg['Date'] = formatdate(localtime=True)

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Inter', sans-serif; background-color: #080808; color: #ffffff; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #111111; border: 1px solid #333333; border-radius: 12px; padding: 32px; text-align: center; }}
            .logo {{ font-size: 24px; font-weight: 800; color: #D4AF37; letter-spacing: 2px; margin-bottom: 24px; }}
            h1 {{ font-size: 22px; margin-bottom: 16px; color: #ffffff; }}
            p {{ font-size: 15px; line-height: 1.6; color: #aaaaaa; margin-bottom: 24px; }}
            .btn {{ display: inline-block; background-color: #D4AF37; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; transition: background-color 0.3s; }}
            .footer {{ margin-top: 32px; font-size: 12px; color: #666666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">JOGJACOURT</div>
            <h1>Permintaan Reset Password</h1>
            <p>Halo,<br><br>Kami menerima permintaan untuk mereset kata sandi akun JogjaCourt Anda. Tautan ini akan kedaluwarsa dalam waktu 1 jam demi keamanan Anda.</p>
            <a href="{reset_link}" class="btn">Reset Password Sekarang</a>
            <p style="margin-top: 24px;">Jika Anda tidak pernah meminta reset password, Anda dapat mengabaikan email ini dengan aman.</p>
            <div class="footer">
                &copy; 2026 JogjaCourt. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    """

    msg.add_alternative(html_content, subtype='html')

    try:
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.ehlo()
            server.starttls()
            server.ehlo()
        
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Email reset password berhasil dikirim ke {to_email}")
    except Exception as e:
        print(f"Gagal mengirim email SMTP: {e}")

async def send_reset_password_email(to_email: str, token: str):
    """Jalankan pengiriman email secara asinkron agar tidak memblokir API"""
    await asyncio.to_thread(send_reset_password_email_sync, to_email, token)
