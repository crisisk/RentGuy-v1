import { Invoice, Payment, TransactionType } from '../types/financeTypes';
import { useFinanceStore } from '../stores/financeStore';
import { z } from 'zod';
import { APIError } from '../errors';

const InvoiceSchema = z.object({
  clientId: z.string().min(1, 'Klant is verplicht'),
  amount: z.number().min(0.01, 'Bedrag moet positief zijn'),
  dueDate: z.date().min(new Date(), 'Vervaldatum moet in de toekomst liggen'),
  description: z.string().min(1, 'Omschrijving is verplicht'),
});

export const validateInvoice = (invoice: Partial<Invoice>) => {
  try {
    InvoiceSchema.parse(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0].message);
    }
    throw new Error('Ongeldige factuurgegevens');
  }
};

export const createInvoice = async (invoiceData: Partial<Invoice>): Promise<Invoice> => {
  const store = useFinanceStore.getState();
  
  try {
    validateInvoice(invoiceData);
    
    const newInvoice: Invoice = {
      ...invoiceData as Invoice,
      id: `inv-${Date.now()}`,
      issuedDate: new Date(),
      paid: false,
      transactions: [],
    };

    store.addInvoice(newInvoice);
    return newInvoice;
  } catch (error) {
    throw new APIError(
      `Factuur aanmaken mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`,
      'INVOICE_CREATE_FAILED'
    );
  }
};

export const registerPayment = async (invoiceId: string, payment: Payment): Promise<Invoice> => {
  const store = useFinanceStore.getState();
  const invoice = store.invoices.find(i => i.id === invoiceId);
  
  if (!invoice) {
    throw new APIError('Factuur niet gevonden', 'INVOICE_NOT_FOUND');
  }

  if (invoice.paid) {
    throw new APIError('Factuur is al betaald', 'INVOICE_ALREADY_PAID');
  }

  try {
    const updatedInvoice: Invoice = {
      ...invoice,
      paid: payment.amount >= invoice.amount,
      transactions: [
        ...invoice.transactions,
        {
          ...payment,
          id: `txn-${Date.now()}`,
          date: new Date(),
          type: TransactionType.INCOME,
        }
      ]
    };

    store.updateInvoice(invoiceId, updatedInvoice);
    return updatedInvoice;
  } catch (error) {
    throw new APIError(
      `Betaling registreren mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`,
      'PAYMENT_FAILED'
    );
  }
};

/* Testscenarios:
1. createInvoice met vervaldatum in verleden → fout
2. registerPayment voor niet-bestaande factuur → not found
3. registerPayment voor al betaalde factuur → fout
4. Betaling met bedrag onder factuurbedrag → markeert niet als betaald
*/