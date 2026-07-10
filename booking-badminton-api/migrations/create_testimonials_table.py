import asyncio
from app.database import Base, engine
# Import all models to ensure they are registered with Base.metadata
from app.models.user import User
from app.models.testimonial import Testimonial

async def run():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("Testimonials table created successfully.")

if __name__ == "__main__":
    asyncio.run(run())
