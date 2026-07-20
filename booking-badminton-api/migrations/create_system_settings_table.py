import asyncio
from app.database import Base, engine, async_session
from sqlalchemy.future import select
from app.models.system_setting import SystemSetting
from app.models.user import User
from app.models.push_subscription import PushSubscription

async def run():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("SystemSetting table created.")

    async with async_session() as db:
        # Seed default values
        defaults = [
            ("maintenance_mode", "false", "Status Maintenance Mode (true/false)"),
            ("platform_fee_hourly", "5000", "Potongan platform per transaksi sewa per jam"),
            ("platform_fee_monthly", "15000", "Potongan platform per transaksi member bulanan"),
            ("xendit_api_key", "xnd_production_key_placeholder", "API Key untuk Xendit"),
            ("webhook_url", "https://api.jogjacourt.com/payments/webhook", "Webhook URL untuk gateway pembayaran")
        ]
        
        for k, v, d in defaults:
            res = await db.execute(select(SystemSetting).where(SystemSetting.key == k))
            existing = res.scalars().first()
            if not existing:
                new_setting = SystemSetting(key=k, value=v, description=d)
                db.add(new_setting)
        
        await db.commit()
        print("Seeded default settings.")

if __name__ == "__main__":
    asyncio.run(run())
