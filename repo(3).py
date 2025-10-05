from sqlalchemy.orm import Session
from sqlalchemy import select
from .models import Invoice, Payment

class BillingRepo:
    def __init__(self, db: Session):
        self.db = db

    def add_invoice(self, inv: Invoice) -> Invoice:
        self.db.add(inv); self.db.flush(); return inv

    def get_invoice(self, iid: int) -> Invoice | None:
        return self.db.get(Invoice, iid)

    def list_invoices(self) -> list[Invoice]:
        return self.db.execute(select(Invoice).order_by(Invoice.issued_at.desc())).scalars().all()

    def add_payment(self, p: Payment) -> Payment:
        self.db.add(p); self.db.flush(); return p
