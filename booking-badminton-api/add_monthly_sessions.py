"""
Migration Script: Add Monthly Sessions Support
Otomatis menambahkan kolom dan table untuk fitur 3 sesi member bulanan
"""

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env file")

# Create engine
engine = create_engine(DATABASE_URL)

def run_migration():
    """Run the migration to add monthly sessions support"""
    
    sql_commands = [
        # 1. Add columns to bookings table
        """
        ALTER TABLE bookings 
        ADD COLUMN IF NOT EXISTS sessions JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS is_full_access BOOLEAN DEFAULT TRUE;
        """,
        
        # 2. Create monthly_sessions table
        """
        CREATE TABLE IF NOT EXISTS monthly_sessions (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            duration_hours INTEGER NOT NULL,
            price_multiplier DECIMAL(3,2) NOT NULL DEFAULT 0.40,
            is_prime_time BOOLEAN DEFAULT FALSE,
            display_order INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        
        # 3. Insert default sessions
        """
        INSERT INTO monthly_sessions (id, name, start_time, end_time, duration_hours, price_multiplier, is_prime_time, display_order) VALUES
        ('morning', 'Sesi Pagi', '08:00:00', '13:00:00', 5, 0.40, FALSE, 1),
        ('afternoon', 'Sesi Siang', '13:00:00', '18:00:00', 5, 0.40, FALSE, 2),
        ('evening', 'Sesi Malam', '18:00:00', '23:00:00', 5, 0.50, TRUE, 3)
        ON CONFLICT (id) DO NOTHING;
        """,
        
        # 4. Create booking_sessions junction table
        """
        CREATE TABLE IF NOT EXISTS booking_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
            session_id VARCHAR(50) NOT NULL REFERENCES monthly_sessions(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(booking_id, session_id)
        );
        """,
        
        # 5. Create indexes for performance
        """
        CREATE INDEX IF NOT EXISTS idx_bookings_is_full_access ON bookings(is_full_access);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_booking_sessions_booking_id ON booking_sessions(booking_id);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_booking_sessions_session_id ON booking_sessions(session_id);
        """
    ]
    
    try:
        with engine.connect() as conn:
            print("🚀 Starting migration: Add Monthly Sessions Support...")
            
            for i, sql in enumerate(sql_commands, 1):
                print(f"   [{i}/{len(sql_commands)}] Executing SQL command...")
                conn.execute(text(sql))
                conn.commit()
            
            print("✅ Migration completed successfully!")
            print("\n📊 Verifying installation...")
            
            # Verify the installation
            result = conn.execute(text("SELECT * FROM monthly_sessions ORDER BY display_order;"))
            sessions = result.fetchall()
            
            print(f"\n✨ Found {len(sessions)} sessions in database:")
            for session in sessions:
                print(f"   - {session.name} ({session.start_time} - {session.end_time})")
            
            print("\n🎉 Monthly Sessions feature is ready to use!")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    run_migration()
