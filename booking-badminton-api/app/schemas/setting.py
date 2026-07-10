from pydantic import BaseModel
from typing import Dict, Optional

class SystemSettingResponse(BaseModel):
    key: str
    value: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True

class SystemSettingsBulkUpdate(BaseModel):
    settings: Dict[str, str]
