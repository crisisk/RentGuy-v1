
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from uuid import uuid4, UUID

from app.modules.crm.schemas import DashboardSummary

from .crm_dashboard import build_dashboard_summary

class CustomerModel(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    email: str
    phone: Optional[str] = None

class CustomerCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None

class ActivityModel(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    customer_id: UUID
    type: str
    description: str

class ActivityCreate(BaseModel):
    customer_id: UUID
    type: str
    description: str

crm_router = APIRouter(prefix="/crm")

# In-memory storage
customers = [
    CustomerModel(name=f"Customer {i}", email=f"customer{i}@example.com", phone=f"123-456-{i:04d}")
    for i in range(1, 11)
]

activities = []

@crm_router.get("/customers", response_model=List[CustomerModel])
async def list_customers():
    return customers

@crm_router.post("/customers", response_model=CustomerModel, status_code=201)
async def create_customer(customer: CustomerCreate):
    new_customer = CustomerModel(**customer.dict())
    customers.append(new_customer)
    return new_customer

@crm_router.get("/customers/{customer_id}", response_model=CustomerModel)
async def get_customer(customer_id: UUID):
    customer = next((c for c in customers if c.id == customer_id), None)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@crm_router.put("/customers/{customer_id}", response_model=CustomerModel)
async def update_customer(customer_id: UUID, customer_update: CustomerCreate):
    for idx, customer in enumerate(customers):
        if customer.id == customer_id:
            customers[idx] = CustomerModel(id=customer_id, **customer_update.dict())
            return customers[idx]
    raise HTTPException(status_code=404, detail="Customer not found")

@crm_router.delete("/customers/{customer_id}", status_code=204)
async def delete_customer(customer_id: UUID):
    global customers
    customers = [c for c in customers if c.id != customer_id]
    return None

@crm_router.get("/activities", response_model=List[ActivityModel])
async def list_activities(customerId: Optional[UUID] = None):
    if customerId:
        return [a for a in activities if a.customer_id == customerId]
    return activities

@crm_router.post("/activities", response_model=ActivityModel, status_code=201)
async def create_activity(activity: ActivityCreate):
    new_activity = ActivityModel(**activity.dict())
    activities.append(new_activity)
    return new_activity


@crm_router.get("/analytics/dashboard", response_model=DashboardSummary)
async def dashboard_summary() -> DashboardSummary:
    return build_dashboard_summary()


