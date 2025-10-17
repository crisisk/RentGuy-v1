from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List

router = APIRouter(prefix="/crew")

# Pydantic Models
class CrewMemberCreate(BaseModel):
    name: str
    role: str
    email: str

class CrewMember(CrewMemberCreate):
    id: int

class ShiftCreate(BaseModel):
    crew_member_id: int
    start_time: datetime
    end_time: datetime

class Shift(ShiftCreate):
    id: int

class TimeApprovalCreate(BaseModel):
    approver_id: int

class TimeApproval(TimeApprovalCreate):
    id: int
    shift_id: int
    approved: bool

# In-memory Data Stores
crew_members: List[CrewMember] = [
    CrewMember(
        id=i,
        name=f"Member {i}",
        role=f"Role {(i % 3) + 1}",
        email=f"member{i}@example.com"
    ) for i in range(1, 13)
]

base_date = datetime(2023, 1, 1, 8, 0)
shifts: List[Shift] = [
    Shift(
        id=i,
        crew_member_id=((i-1) % 12) + 1,
        start_time=base_date + timedelta(days=i-1),
        end_time=base_date + timedelta(days=i-1, hours=8)
    ) for i in range(1, 21)
]

time_approvals: List[TimeApproval] = []

# Crew Members Endpoints
@router.get("/members", response_model=List[CrewMember])
async def get_members():
    return crew_members

@router.post("/members", response_model=CrewMember)
async def create_member(member: CrewMemberCreate):
    new_id = len(crew_members) + 1
    new_member = CrewMember(id=new_id, **member.dict())
    crew_members.append(new_member)
    return new_member

@router.put("/members/{member_id}", response_model=CrewMember)
async def update_member(member_id: int, member: CrewMemberCreate):
    index = next((i for i, m in enumerate(crew_members) if m.id == member_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Member not found")
    
    updated_member = CrewMember(id=member_id, **member.dict())
    crew_members[index] = updated_member
    return updated_member

@router.delete("/members/{member_id}")
async def delete_member(member_id: int):
    index = next((i for i, m in enumerate(crew_members) if m.id == member_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Member not found")
    
    crew_members.pop(index)
    return {"message": "Member deleted"}

# Shifts Endpoints
@router.get("/shifts", response_model=List[Shift])
async def get_shifts():
    return shifts

@router.post("/shifts", response_model=Shift)
async def create_shift(shift: ShiftCreate):
    new_id = len(shifts) + 1
    new_shift = Shift(id=new_id, **shift.dict())
    shifts.append(new_shift)
    return new_shift

# Time Approvals Endpoints
@router.get("/time-approvals", response_model=List[TimeApproval])
async def get_time_approvals():
    return time_approvals

@router.post("/time-approvals/{shift_id}/approve", response_model=TimeApproval)
async def approve_time_approval(shift_id: int, approval: TimeApprovalCreate):
    if not any(s.id == shift_id for s in shifts):
        raise HTTPException(status_code=404, detail="Shift not found")
    
    new_approval = TimeApproval(
        id=len(time_approvals) + 1,
        shift_id=shift_id,
        approved=True,
        **approval.dict()
    )
    time_approvals.append(new_approval)
    return new_approval
