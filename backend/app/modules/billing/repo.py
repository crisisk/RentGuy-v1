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

    def list_payments_for_invoice(self, invoice_id: int) -> list[Payment]:
        return self.db.execute(select(Payment).where(Payment.invoice_id==invoice_id)).scalars().all()

    def get_payment_by_external(self, provider: str, external_id: str) -> Payment | None:
        stmt = select(Payment).where(Payment.provider==provider, Payment.external_id==external_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def touch_invoice(self, invoice: Invoice) -> Invoice:
        self.db.add(invoice); self.db.flush(); return invoice

    def touch_payment(self, payment: Payment) -> Payment:
        self.db.add(payment); self.db.flush(); return payment
