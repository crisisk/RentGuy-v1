from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class CrewMemberIn(BaseModel):
    name: str
    role: str = "crew"
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    active: bool = True

class CrewMemberOut(BaseModel):
    id: int
    name: str
    role: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    active: bool
    class Config:
        from_attributes = True

class BookingIn(BaseModel):
    project_id: int
    crew_id: int
    start: datetime
    end: datetime
    role: str = "crew"

class BookingOut(BaseModel):
    id: int
    project_id: int
    crew_id: int
    start: datetime
    end: datetime
    role: str
    status: str
    class Config:
        from_attributes = True
