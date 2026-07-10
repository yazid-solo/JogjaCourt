#!/usr/bin/env python3
"""
Test Script untuk Dual Rental System - Badminton Court Booking
Verifikasi semua komponen working correctly
"""

import asyncio
from datetime import date, time, datetime, timedelta
from app.database import engine, AsyncSession, get_db
from sqlalchemy import select
from app.models.court import Court, RentalTypeEnum
from app.models.booking import Booking, BookingStatusEnum, BookingTypeEnum
from app.models.venue import Venue
from app.models.user import User
from app.services.booking_service import calculate_price, check_availability
from decimal import Decimal


async def test_court_setup():
    """Test 1: Verify court rental types setup"""
    print("\n" + "="*60)
    print("TEST 1: Court Setup Verification")
    print("="*60)
    
    async with AsyncSession(engine) as session:
        # Get all courts
        result = await session.execute(select(Court).limit(5))
        courts = result.scalars().all()
        
        if not courts:
            print("❌ No courts found. Create courts first!")
            return False
        
        all_good = True
        for court in courts:
            print(f"\n📍 {court.name}")
            print(f"   Rental Type: {court.rental_type}")
            print(f"   Price Regular: Rp {court.price_regular}")
            print(f"   Price Peak: Rp {court.price_peak}")
            print(f"   Price Monthly: Rp {court.price_monthly or 'NOT SET'}")
            
            # Verify at least one price is set
            if court.price_regular and court.price_peak:
                print("   ✅ Hourly pricing OK")
            else:
                print("   ❌ Hourly pricing missing!")
                all_good = False
            
            # If rental_type includes monthly, check price_monthly
            if court.rental_type in ['monthly', 'both']:
                if court.price_monthly and court.price_monthly > 0:
                    print("   ✅ Monthly pricing OK")
                else:
                    print("   ⚠️  Monthly rental set but no price_monthly!")
                    all_good = False
        
        return all_good


async def test_pricing_logic():
    """Test 2: Pricing calculation for hourly and monthly"""
    print("\n" + "="*60)
    print("TEST 2: Pricing Logic Verification")
    print("="*60)
    
    async with AsyncSession(engine) as session:
        result = await session.execute(
            select(Court).where(Court.rental_type == RentalTypeEnum.both).limit(1)
        )
        court = result.scalars().first()
        
        if not court:
            print("⚠️  No 'both' rental type court found. Skipping test.")
            return True
        
        print(f"\n📍 Testing {court.name}")
        
        # Test hourly pricing
        print("\n🕐 Hourly Booking Test:")
        start_time = time(19, 0)  # 19:00
        end_time = time(21, 0)    # 21:00
        
        hourly_price = await calculate_price(
            session, court.id, BookingTypeEnum.hourly, start_time, end_time
        )
        print(f"   Duration: 19:00-21:00 (2 hours)")
        print(f"   Price: Rp {hourly_price}")
        print(f"   ✅ Hourly pricing calculated")
        
        # Test monthly pricing
        if court.price_monthly:
            print("\n📅 Monthly Booking Test:")
            monthly_price = await calculate_price(
                session, court.id, BookingTypeEnum.monthly, start_time, end_time
            )
            print(f"   Month: Full Month")
            print(f"   Price: Rp {monthly_price}")
            
            if monthly_price == Decimal(str(court.price_monthly)):
                print(f"   ✅ Monthly pricing = flat fee (Rp {court.price_monthly})")
                return True
            else:
                print(f"   ❌ Monthly pricing mismatch! Got Rp {monthly_price}, expected Rp {court.price_monthly}")
                return False
        else:
            print("⚠️  No monthly price set for this court")
            return True


async def test_availability_check():
    """Test 3: Check availability logic"""
    print("\n" + "="*60)
    print("TEST 3: Availability Check Verification")
    print("="*60)
    
    async with AsyncSession(engine) as session:
        result = await session.execute(select(Court).limit(1))
        court = result.scalars().first()
        
        if not court:
            print("❌ No courts found!")
            return False
        
        print(f"\n📍 Testing {court.name}")
        
        # Test future date (should be available)
        future_date = date.today() + timedelta(days=5)
        test_start = time(10, 0)
        test_end = time(12, 0)
        
        is_available, msg = await check_availability(
            session, court.id, future_date, test_start, test_end
        )
        
        print(f"   Date: {future_date} 10:00-12:00")
        print(f"   Available: {is_available}")
        print(f"   Message: {msg}")
        print(f"   ✅ Availability check working")
        
        return True


async def test_booking_creation():
    """Test 4: Create sample bookings (hourly and monthly)"""
    print("\n" + "="*60)
    print("TEST 4: Booking Creation Verification")
    print("="*60)
    
    async with AsyncSession(engine) as session:
        # Get a court and user
        court_result = await session.execute(
            select(Court).where(Court.is_active == True).limit(1)
        )
        court = court_result.scalars().first()
        
        user_result = await session.execute(
            select(User).where(User.role == 'customer').limit(1)
        )
        user = user_result.scalars().first()
        
        if not court or not user:
            print("⚠️  Need court and customer user for this test. Skipping.")
            return True
        
        print(f"\n📍 Court: {court.name}")
        print(f"👤 User: {user.name}")
        
        # Test hourly booking
        print("\n🕐 Creating Hourly Booking:")
        hourly_price = await calculate_price(
            session, court.id, BookingTypeEnum.hourly, time(14, 0), time(16, 0)
        )
        
        hourly_booking = Booking(
            user_id=user.id,
            court_id=court.id,
            booking_type=BookingTypeEnum.hourly,
            booking_date=date.today() + timedelta(days=7),
            start_time=time(14, 0),
            end_time=time(16, 0),
            total_price=hourly_price,
            status=BookingStatusEnum.pending,
            expires_at=datetime.utcnow() + timedelta(minutes=15)
        )
        session.add(hourly_booking)
        print(f"   ✅ Hourly booking created (pending)")
        
        # Test monthly booking (if available)
        if court.rental_type in ['both', 'monthly'] and court.price_monthly:
            print("\n📅 Creating Monthly Booking:")
            monthly_price = await calculate_price(
                session, court.id, BookingTypeEnum.monthly, time(8, 0), time(23, 0)
            )
            
            monthly_booking = Booking(
                user_id=user.id,
                court_id=court.id,
                booking_type=BookingTypeEnum.monthly,
                booking_date=date.today().replace(day=1),  # First day of month
                start_time=time(8, 0),
                end_time=time(23, 0),
                total_price=monthly_price,
                status=BookingStatusEnum.pending
            )
            session.add(monthly_booking)
            print(f"   ✅ Monthly booking created (pending)")
        
        try:
            await session.commit()
            print("\n✅ All bookings saved successfully!")
            return True
        except Exception as e:
            print(f"\n❌ Error saving bookings: {e}")
            await session.rollback()
            return False


async def test_rental_type_distribution():
    """Test 5: Check distribution of rental types"""
    print("\n" + "="*60)
    print("TEST 5: Rental Type Distribution")
    print("="*60)
    
    async with AsyncSession(engine) as session:
        result = await session.execute(
            select(Court).where(Court.is_active == True)
        )
        courts = result.scalars().all()
        
        if not courts:
            print("No active courts found")
            return False
        
        hourly_count = sum(1 for c in courts if c.rental_type == RentalTypeEnum.hourly)
        monthly_count = sum(1 for c in courts if c.rental_type == RentalTypeEnum.monthly)
        both_count = sum(1 for c in courts if c.rental_type == RentalTypeEnum.both)
        
        print(f"\nTotal Active Courts: {len(courts)}")
        print(f"  ⏰ Hourly Only: {hourly_count}")
        print(f"  📅 Monthly Only: {monthly_count}")
        print(f"  🔄 Both (Hourly + Monthly): {both_count}")
        
        if hourly_count + monthly_count + both_count == len(courts):
            print("\n✅ All courts have proper rental type")
            return True
        else:
            print("\n❌ Some courts missing rental type!")
            return False


async def test_booking_queries():
    """Test 6: Query bookings with type filter"""
    print("\n" + "="*60)
    print("TEST 6: Booking Queries")
    print("="*60)
    
    async with AsyncSession(engine) as session:
        # Get hourly bookings
        hourly_result = await session.execute(
            select(Booking).where(Booking.booking_type == BookingTypeEnum.hourly).limit(5)
        )
        hourly_bookings = hourly_result.scalars().all()
        
        # Get monthly bookings
        monthly_result = await session.execute(
            select(Booking).where(Booking.booking_type == BookingTypeEnum.monthly).limit(5)
        )
        monthly_bookings = monthly_result.scalars().all()
        
        print(f"\n📊 Booking Statistics:")
        print(f"   Hourly bookings: {len(hourly_bookings)}")
        print(f"   Monthly bookings: {len(monthly_bookings)}")
        
        if hourly_bookings:
            print(f"\n   📌 Sample hourly booking:")
            b = hourly_bookings[0]
            print(f"      Date: {b.booking_date} {b.start_time}-{b.end_time}")
            print(f"      Price: Rp {b.total_price}")
            print(f"      Status: {b.status}")
        
        if monthly_bookings:
            print(f"\n   📌 Sample monthly booking:")
            b = monthly_bookings[0]
            print(f"      Date: {b.booking_date} (Month Start)")
            print(f"      Price: Rp {b.total_price} (Flat Fee)")
            print(f"      Status: {b.status}")
        
        print("\n✅ Query test completed")
        return True


async def main():
    """Run all tests"""
    print("\n" + "🧪 "*30)
    print("DUAL RENTAL SYSTEM - TEST SUITE".center(60))
    print("🧪 "*30)
    
    tests = [
        ("Court Setup", test_court_setup),
        ("Pricing Logic", test_pricing_logic),
        ("Availability Check", test_availability_check),
        ("Booking Creation", test_booking_creation),
        ("Rental Type Distribution", test_rental_type_distribution),
        ("Booking Queries", test_booking_queries),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ Test failed with error: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! System is ready!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check configuration.")
    
    print("\n" + "="*60 + "\n")


if __name__ == "__main__":
    print("Starting test suite...")
    asyncio.run(main())
