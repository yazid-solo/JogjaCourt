import asyncio
from app.database import engine
from sqlalchemy import text

async def migrate_court_rental_types():
    """
    Migration untuk memastikan semua court memiliki rental_type yang tepat.
    - Jika court memiliki price_monthly, set rental_type ke 'both'
    - Jika tidak, set rental_type ke 'hourly'
    """
    async with engine.begin() as conn:
        try:
            # Update courts yang memiliki price_monthly (> 0 atau NOT NULL) ke 'both'
            await conn.execute(text("""
                UPDATE courts 
                SET rental_type = 'both' 
                WHERE price_monthly IS NOT NULL AND price_monthly > 0 AND rental_type != 'both'
            """))
            
            # Update courts tanpa price_monthly ke 'hourly'
            await conn.execute(text("""
                UPDATE courts 
                SET rental_type = 'hourly' 
                WHERE (price_monthly IS NULL OR price_monthly = 0) AND rental_type != 'hourly'
            """))
            
            # Fetch hasil update untuk konfirmasi
            result = await conn.execute(text("SELECT COUNT(*) as total FROM courts"))
            count = result.scalar()
            
            print(f"✅ Migration complete! Total {count} courts updated.")
            
            # Show summary
            hourly_count = await conn.execute(text("SELECT COUNT(*) FROM courts WHERE rental_type = 'hourly'"))
            both_count = await conn.execute(text("SELECT COUNT(*) FROM courts WHERE rental_type = 'both'"))
            
            print(f"   - Hourly only: {hourly_count.scalar()}")
            print(f"   - Both (Hourly + Monthly): {both_count.scalar()}")
            
        except Exception as e:
            print(f"❌ Error during migration: {e}")

if __name__ == "__main__":
    asyncio.run(migrate_court_rental_types())
