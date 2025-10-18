from pydantic import BaseModel
from typing import List
from datetime import date

class ProjectIn(BaseModel):
    name: str
    client_name: str
    start_date: date
    end_date: date
    notes: str = ""

class ProjectOut(BaseModel):
    id: int
    name: str
    client_name: str
    start_date: date
    end_date: date
    notes: str = ""
    class Config:
        from_attributes = True

class ReserveItemIn(BaseModel):
    item_id: int
    qty: int

class ReserveRequest(BaseModel):
    items: List[ReserveItemIn]

class ProjectItemOut(BaseModel):
    id: int
    project_id: int
    item_id: int
    qty_reserved: int
    class Config:
        from_attributes = True

class ProjectDetail(BaseModel):
    project: ProjectOut
    items: List[ProjectItemOut]
