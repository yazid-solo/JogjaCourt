import asyncio
from app.database import engine
from sqlalchemy import text

async def alter_table():
    async with engine.begin() as conn:
        try:
            # Alter password_hash to allow NULL
            await conn.execute(text("ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL"))
            
            # Add google_id
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE"))
            
            # Add is_email_verified
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE"))
            
            # Add verification_token
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255)"))
            
            # Add reset_password_token
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255)"))
            
            # Add reset_password_expires
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP"))
            
            print("Successfully altered users table.")
        except Exception as e:
            print(f"Error altering table: {e}")

if __name__ == "__main__":
    asyncio.run(alter_table())
