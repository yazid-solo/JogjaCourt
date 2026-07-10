from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.database import get_db
from app.models.system_setting import SystemSetting
from app.schemas.setting import SystemSettingResponse, SystemSettingsBulkUpdate
from app.utils.dependencies import require_super_admin, get_current_user
from app.models.user import RoleEnum

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/public", response_model=List[SystemSettingResponse])
async def get_public_settings(db: AsyncSession = Depends(get_db)):
    """Ambil konfigurasi sistem untuk publik (tanpa token). Hanya mengembalikan konfigurasi yang tidak sensitif."""
    result = await db.execute(
        select(SystemSetting).where(
            SystemSetting.key.in_(['maintenance_mode', 'cs_whatsapp', 'cs_email', 'global_marquee', 'platform_fee_hourly'])
        )
    )
    return result.scalars().all()

@router.get("", response_model=List[SystemSettingResponse])
async def get_all_settings(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Ambil semua konfigurasi sistem. Super Admin dapat melihat semuanya, role lain mungkin dibatasi (masking)."""
    result = await db.execute(select(SystemSetting))
    settings = result.scalars().all()
    
    # Mask sensitive info if not super admin
    if current_user.role != RoleEnum.super_admin:
        for s in settings:
            if s.key == "xendit_api_key":
                s.value = "********"
                
    return settings

@router.put("", response_model=List[SystemSettingResponse], dependencies=[Depends(require_super_admin)])
async def update_settings(payload: SystemSettingsBulkUpdate, db: AsyncSession = Depends(get_db)):
    """Update konfigurasi sistem secara massal (Super Admin Only)."""
    updated_settings = []
    
    for key, val in payload.settings.items():
        result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
        setting = result.scalars().first()
        if setting:
            setting.value = val
        else:
            setting = SystemSetting(key=key, value=val, description="")
            db.add(setting)
        updated_settings.append(setting)
            
    await db.commit()
    for s in updated_settings:
        await db.refresh(s)
        
    # Return updated list
    final_res = await db.execute(select(SystemSetting))
    return final_res.scalars().all()
