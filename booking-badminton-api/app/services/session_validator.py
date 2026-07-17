"""
Session Validator Service
Validasi apakah user boleh booking hourly berdasarkan sesi member bulanan mereka
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, or_
from datetime import datetime, date, time
from uuid import UUID
from typing import Optional, Tuple, List, Dict

from app.models.booking import Booking, BookingTypeEnum, BookingStatusEnum

# Definisi 3 sesi berdasarkan requirement
SESSIONS_CONFIG = {
    'morning': {
        'id': 'morning',
        'name': 'Sesi Pagi',
        'start_time': time(8, 0),
        'end_time': time(13, 0),
    },
    'afternoon': {
        'id': 'afternoon',
        'name': 'Sesi Siang',
        'start_time': time(13, 0),
        'end_time': time(18, 0),
    },
    'evening': {
        'id': 'evening',
        'name': 'Sesi Malam',
        'start_time': time(18, 0),
        'end_time': time(23, 0),
    }
}


async def get_active_monthly_membership(
    db: AsyncSession,
    user_id: UUID,
    court_id: UUID,
    booking_date: date
) -> Optional[Booking]:
    """
    Cek apakah user memiliki member bulanan aktif untuk lapangan tertentu
    pada bulan yang mencakup booking_date
    
    Returns:
        Booking object jika ada membership aktif, None jika tidak ada
    """
    # Cari booking bulanan yang:
    # 1. Milik user ini
    # 2. Untuk lapangan ini
    # 3. Status confirmed
    # 4. Tanggal booking berada di bulan yang sama dengan membership
    
    stmt = select(Booking).where(
        and_(
            Booking.user_id == user_id,
            Booking.court_id == court_id,
            Booking.booking_type == BookingTypeEnum.monthly,
            Booking.status == BookingStatusEnum.confirmed,
            # Check if booking_date is in the same month as the membership
            Booking.booking_date.between(
                date(booking_date.year, booking_date.month, 1),
                date(booking_date.year, booking_date.month, 28 if booking_date.month == 2 else 30)
            )
        )
    )
    
    result = await db.execute(stmt)
    membership = result.scalars().first()
    
    return membership


def check_time_within_session(
    start_time: time,
    end_time: time,
    session_id: str
) -> bool:
    """
    Cek apakah waktu booking berada dalam rentang sesi tertentu
    
    Args:
        start_time: Waktu mulai booking
        end_time: Waktu selesai booking
        session_id: ID sesi (morning, afternoon, evening)
    
    Returns:
        True jika waktu booking sepenuhnya berada dalam sesi, False jika tidak
    """
    if session_id not in SESSIONS_CONFIG:
        return False
    
    session = SESSIONS_CONFIG[session_id]
    session_start = session['start_time']
    session_end = session['end_time']
    
    # Booking harus sepenuhnya berada dalam sesi
    # (start >= session_start) AND (end <= session_end)
    return start_time >= session_start and end_time <= session_end


def get_user_allowed_sessions(membership: Booking) -> List[str]:
    """
    Dapatkan list session IDs yang diizinkan untuk user berdasarkan membership
    
    Args:
        membership: Booking object dengan tipe monthly
    
    Returns:
        List of session IDs yang diizinkan
    """
    if not membership or membership.booking_type != BookingTypeEnum.monthly:
        return []
    
    # Jika full access, izinkan semua sesi
    if membership.is_full_access:
        return list(SESSIONS_CONFIG.keys())
    
    # Jika tidak, ambil dari data sessions
    if not membership.sessions:
        return []
    
    allowed_sessions = []
    for session_data in membership.sessions:
        session_id = session_data.get('session_id')
        if session_id in SESSIONS_CONFIG:
            allowed_sessions.append(session_id)
    
    return allowed_sessions


async def validate_hourly_booking_against_membership(
    db: AsyncSession,
    user_id: UUID,
    court_id: UUID,
    booking_date: date,
    start_time: time,
    end_time: time
) -> Tuple[bool, str, Optional[Dict]]:
    """
    Validasi apakah user dengan member bulanan boleh melakukan booking hourly
    pada waktu tertentu
    
    Args:
        db: Database session
        user_id: ID user yang booking
        court_id: ID lapangan
        booking_date: Tanggal booking
        start_time: Waktu mulai
        end_time: Waktu selesai
    
    Returns:
        Tuple of (is_allowed, message, membership_info)
        - is_allowed: True jika diizinkan, False jika ditolak
        - message: Pesan penjelasan
        - membership_info: Dict berisi info membership (jika ada)
    """
    # 1. Cek apakah user punya membership aktif
    membership = await get_active_monthly_membership(db, user_id, court_id, booking_date)
    
    # Jika tidak punya membership, izinkan booking hourly biasa
    if not membership:
        return True, "Tidak ada membership aktif, booking hourly diizinkan", None
    
    # 2. Dapatkan sesi yang diizinkan untuk user
    allowed_sessions = get_user_allowed_sessions(membership)
    
    if not allowed_sessions:
        # Member tanpa sesi? Anomali data, tapi izinkan saja
        return True, "Membership tidak memiliki sesi, booking hourly diizinkan", None
    
    # 3. Cek apakah waktu booking berada dalam salah satu sesi yang diizinkan
    booking_within_allowed_session = False
    matching_session_name = None
    
    for session_id in allowed_sessions:
        if check_time_within_session(start_time, end_time, session_id):
            booking_within_allowed_session = True
            matching_session_name = SESSIONS_CONFIG[session_id]['name']
            break
    
    # 4. Tentukan hasil validasi
    if booking_within_allowed_session:
        # Booking dalam sesi yang sudah dibayar via membership
        # TOLAK karena user sudah punya akses
        membership_info = {
            'has_membership': True,
            'is_full_access': membership.is_full_access,
            'allowed_sessions': [SESSIONS_CONFIG[sid]['name'] for sid in allowed_sessions]
        }
        
        return False, (
            f"Anda sudah memiliki akses member untuk {matching_session_name} "
            f"({SESSIONS_CONFIG[[s for s in allowed_sessions if check_time_within_session(start_time, end_time, s)][0]]['start_time'].strftime('%H:%M')} - "
            f"{SESSIONS_CONFIG[[s for s in allowed_sessions if check_time_within_session(start_time, end_time, s)][0]]['end_time'].strftime('%H:%M')}). "
            f"Tidak perlu booking hourly lagi!"
        ), membership_info
    else:
        # Booking di luar sesi member, izinkan (user mau booking tambahan)
        return True, "Booking di luar sesi membership, diizinkan sebagai booking tambahan", {
            'has_membership': True,
            'is_full_access': membership.is_full_access,
            'allowed_sessions': [SESSIONS_CONFIG[sid]['name'] for sid in allowed_sessions]
        }


async def get_user_membership_info(
    db: AsyncSession,
    user_id: UUID,
    court_id: UUID,
    booking_date: date
) -> Optional[Dict]:
    """
    Dapatkan informasi membership user untuk ditampilkan di frontend
    
    Returns:
        Dict berisi info membership atau None jika tidak ada
    """
    membership = await get_active_monthly_membership(db, user_id, court_id, booking_date)
    
    if not membership:
        return None
    
    allowed_sessions = get_user_allowed_sessions(membership)
    
    return {
        'has_membership': True,
        'is_full_access': membership.is_full_access,
        'membership_start': membership.booking_date.isoformat(),
        'allowed_sessions': [
            {
                'id': session_id,
                'name': SESSIONS_CONFIG[session_id]['name'],
                'time_range': f"{SESSIONS_CONFIG[session_id]['start_time'].strftime('%H:%M')} - {SESSIONS_CONFIG[session_id]['end_time'].strftime('%H:%M')}"
            }
            for session_id in allowed_sessions
        ]
    }

