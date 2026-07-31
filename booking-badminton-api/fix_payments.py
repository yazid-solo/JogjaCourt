import asyncio
from app.database import async_session
from app.models.payment import Payment, PaymentStatusEnum
from sqlalchemy import select, update
from datetime import datetime

async def fix_payments():
    async with async_session() as db:
        stmt = select(Payment).where(
            Payment.status == PaymentStatusEnum.paid,
            Payment.confirmed_at == None
        )
        res = await db.execute(stmt)
        payments = res.scalars().all()
        
        if payments:
            print(f"Fixing {len(payments)} payments...")
            for p in payments:
                p.confirmed_at = datetime.utcnow()
            await db.commit()
            print("Successfully fixed payments.")
        else:
            print("No payments needed fixing.")

if __name__ == "__main__":
    asyncio.run(fix_payments())
