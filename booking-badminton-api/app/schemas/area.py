from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class AreaBase(BaseModel):
    name: str
    province: str
    description: Optional[str] = None

class AreaCreate(AreaBase):
    pass

class AreaUpdate(BaseModel):
    name: Optional[str] = None
    province: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class AreaResponse(AreaBase):
    id: UUID
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
