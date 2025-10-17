
from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/finance")

class InvoiceBase(BaseModel):
    amount: float
    client: str
    date: datetime
    description: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    pass

class Invoice(InvoiceBase):
    id: str
    status: str = "created"
    created_at: datetime = datetime.now()

class QuoteBase(BaseModel):
    amount: float
    client: str
    valid_until: datetime

class QuoteCreate(QuoteBase):
    pass

class Quote(QuoteBase):
    id: str
    status: str = "draft"
    converted: bool = False
    created_at: datetime = datetime.now()

class PaymentBase(BaseModel):
    amount: float
    invoice_id: str
    method: str

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: str
    processed_at: datetime = datetime.now()

class StatsResponse(BaseModel):
    total_invoices: int
    total_quotes: int
    total_payments: int
    revenue: float

# In-memory data storage
invoices_db = [Invoice(
    id=str(uuid4()),
    amount=100.0 * (i+1),
    client=f"Client {i+1}",
    date=datetime.now(),
    status="paid" if i % 2 else "unpaid"
) for i in range(8)]

quotes_db = [Quote(
    id=str(uuid4()),
    amount=500.0 - (i*50),
    client=f"Prospect {i+1}",
    valid_until=datetime(2024, 12, 31),
    status="active" if i % 2 else "expired"
) for i in range(5)]

payments_db = []

@router.get("/invoices", response_model=List[Invoice])
def get_invoices():
    return invoices_db

@router.post("/invoices", response_model=Invoice)
def create_invoice(invoice: InvoiceCreate):
    new_invoice = Invoice(
        id=str(uuid4()),
        **invoice.dict()
    )
    invoices_db.append(new_invoice)
    return new_invoice

@router.put("/invoices/{id}", response_model=Invoice)
def update_invoice(id: str, invoice: InvoiceCreate):
    index = next((i for i, inv in enumerate(invoices_db) if inv.id == id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    updated = invoices_db[index].copy(update=invoice.dict())
    invoices_db[index] = updated
    return updated

@router.delete("/invoices/{id}")
def delete_invoice(id: str):
    global invoices_db
    invoices_db = [inv for inv in invoices_db if inv.id != id]
    return {"message": "Invoice deleted"}

@router.get("/quotes", response_model=List[Quote])
def get_quotes():
    return quotes_db

@router.post("/quotes", response_model=Quote)
def create_quote(quote: QuoteCreate):
    new_quote = Quote(
        id=str(uuid4()),
        **quote.dict()
    )
    quotes_db.append(new_quote)
    return new_quote

@router.post("/quotes/{id}/convert", response_model=Invoice)
def convert_quote(id: str):
    quote = next((q for q in quotes_db if q.id == id), None)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    if quote.converted:
        raise HTTPException(status_code=400, detail="Quote already converted")
    
    new_invoice = InvoiceCreate(
        amount=quote.amount,
        client=quote.client,
        date=datetime.now()
    )
    created_invoice = create_invoice(new_invoice)
    quote.converted = True
    return created_invoice

@router.get("/payments", response_model=List[Payment])
def get_payments():
    return payments_db

@router.post("/payments", response_model=Payment)
def create_payment(payment: PaymentCreate):
    new_payment = Payment(
        id=str(uuid4()),
        **payment.dict()
    )
    payments_db.append(new_payment)
    return new_payment

@router.get("/stats", response_model=StatsResponse)
def get_stats():
    return StatsResponse(
        total_invoices=len(invoices_db),
        total_quotes=len(quotes_db),
        total_payments=len(payments_db),
        revenue=sum(p.amount for p in payments_db)
    )

# Include this router in your FastAPI app with:
# from fastapi import APIRouter
# app = FastAPI()
# app.include_router(router)
