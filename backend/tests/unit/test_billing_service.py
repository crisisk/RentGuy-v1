from datetime import date

import pytest

from app.modules.billing.models import Invoice, Payment
from app.modules.billing.repo import BillingRepo
from app.modules.billing.schemas import InvoiceLineIn
from app.modules.billing.usecases import BillingService


class DummyMollieAdapter:
    def __init__(self, payload):
        self.payload = payload

    def get_payment(self, payment_id: str):
        return self.payload


def test_create_invoice_calculates_totals(db_session):
    repo = BillingRepo(db_session)
    service = BillingService(repo)

    invoice = service.create_invoice(
        project_id=1,
        client_name='ACME',
        currency='EUR',
        issued_at=date(2024, 1, 1),
        due_at=date(2024, 1, 15),
        reference='2024-001',
        vat_rate=None,
        line_items=[
            InvoiceLineIn(description='Audio', quantity=2, unit_price=100.0, vat_rate=21.0),
            InvoiceLineIn(description='Lights', quantity=1, unit_price=50.0, vat_rate=None),
        ],
        total_net_override=None,
        total_vat_override=None,
        sync_with_invoice_ninja=False,
    )

    assert float(invoice.total_net) == pytest.approx(250.0)
    assert float(invoice.total_vat) == pytest.approx(52.5)
    assert float(invoice.total_gross) == pytest.approx(302.5)
    assert invoice.status == 'draft'


def test_handle_stripe_event_marks_invoice_paid(db_session):
    repo = BillingRepo(db_session)
    invoice = repo.add_invoice(
        Invoice(
            project_id=1,
            client_name='Client',
            currency='EUR',
            total_gross=100,
            total_net=100,
            total_vat=0,
            vat_rate=21,
            status='sent',
            issued_at=date(2024, 1, 1),
            due_at=date(2024, 1, 10),
            reference='INV-1',
        )
    )
    payment = repo.add_payment(
        Payment(
            invoice_id=invoice.id,
            provider='stripe',
            external_id='cs_test_123',
            amount=0,
            status='pending',
        )
    )

    service = BillingService(repo)
    result = service.handle_stripe_event(
        {
            'type': 'checkout.session.completed',
            'data': {'object': {'id': 'cs_test_123', 'amount_total': 1234}},
        }
    )

    assert result == 'checkout.session.completed'
    assert payment.status == 'succeeded'
    assert float(payment.amount) == pytest.approx(12.34)
    assert invoice.status == 'paid'


def test_handle_mollie_notification_updates_invoice(db_session):
    repo = BillingRepo(db_session)
    invoice = repo.add_invoice(
        Invoice(
            project_id=2,
            client_name='Client',
            currency='EUR',
            total_gross=25,
            total_net=20.66,
            total_vat=4.34,
            vat_rate=21,
            status='sent',
            issued_at=date(2024, 2, 1),
            due_at=date(2024, 2, 5),
            reference='INV-2',
        )
    )
    payment = repo.add_payment(
        Payment(
            invoice_id=invoice.id,
            provider='mollie',
            external_id='tr_test_123',
            amount=0,
            status='open',
        )
    )

    service = BillingService(repo)
    service._mollie = DummyMollieAdapter({'id': 'tr_test_123', 'status': 'paid', 'amount': {'value': '25.00'}})

    payload = service.handle_mollie_notification('tr_test_123')

    assert payload['status'] == 'paid'
    assert payment.status == 'paid'
    assert float(payment.amount) == pytest.approx(25.0)
    assert invoice.status == 'paid'
