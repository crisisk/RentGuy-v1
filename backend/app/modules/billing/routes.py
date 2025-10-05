from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
import csv, io
from datetime import date
from app.modules.auth.deps import get_db, require_role
from .schemas import InvoiceIn, InvoiceOut
from .models import Invoice, Payment
from .repo import BillingRepo

router = APIRouter()

@router.get("/billing/invoices", response_model=list[InvoiceOut])
def list_invoices(db: Session = Depends(get_db), user=Depends(require_role("admin","planner","finance","viewer"))):
    return BillingRepo(db).list_invoices()

@router.post("/billing/invoices", response_model=InvoiceOut)
def create_invoice(payload: InvoiceIn, db: Session = Depends(get_db), user=Depends(require_role("admin","planner","finance"))):
    inv = Invoice(**payload.model_dump(), total_gross=0, status="draft")
    BillingRepo(db).add_invoice(inv); db.commit(); return inv

@router.get("/billing/export.csv")
def export_csv(from_date: str, to_date: str, db: Session = Depends(get_db), user=Depends(require_role("admin","finance"))):
    repo = BillingRepo(db)
    invs = repo.list_invoices()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["invoice_id","date","client","currency","total_gross","status"])
    for i in invs:
        if str(i.issued_at) >= from_date and str(i.issued_at) <= to_date:
            w.writerow([i.id, i.issued_at, i.client_name, i.currency, float(i.total_gross), i.status])
    return Response(content=buf.getvalue(), media_type="text/csv")
