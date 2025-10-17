Here's a comprehensive `InvoiceForm.tsx` implementation:

```typescript
import React, { useState, useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from '@/stores/root-store';
import { Invoice, InvoiceLine, Customer } from '@/types/finance';
import { Button, Input, Select, Card } from '@/components/ui';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

interface InvoiceFormProps {
  initialInvoice?: Invoice;
  onSubmit?: (invoice: Invoice) => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = observer(({ 
  initialInvoice, 
  onSubmit 
}) => {
  const { financeStore, customerStore } = useStores();
  
  const [invoice, setInvoice] = useState<Invoice>({
    id: initialInvoice?.id || '',
    customerId: initialInvoice?.customerId || '',
    lines: initialInvoice?.lines || [createEmptyInvoiceLine()],
    paymentTerms: initialInvoice?.paymentTerms || '30',
    status: initialInvoice?.status || 'draft'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Fetch customers on component mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const fetchedCustomers = await customerStore.fetchCustomers();
        setCustomers(fetchedCustomers);
      } catch (error) {
        toast.error('Failed to load customers');
      }
    };
    loadCustomers();
  }, []);

  // Compute total calculations
  const invoiceSummary = useMemo(() => {
    const subtotal = invoice.lines.reduce((sum, line) => 
      sum + (line.quantity * line.unitPrice), 0);
    const taxRate = 0.1; // 10% tax example
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return { subtotal, tax, total };
  }, [invoice.lines]);

  // Helper to create empty invoice line
  function createEmptyInvoiceLine(): InvoiceLine {
    return {
      id: '',
      description: '',
      quantity: 1,
      unitPrice: 0
    };
  }

  const handleLineChange = (index: number, updates: Partial<InvoiceLine>) => {
    const updatedLines = [...invoice.lines];
    updatedLines[index] = { ...updatedLines[index], ...updates };
    setInvoice(prev => ({ ...prev, lines: updatedLines }));
  };

  const addInvoiceLine = () => {
    setInvoice(prev => ({
      ...prev, 
      lines: [...prev.lines, createEmptyInvoiceLine()]
    }));
  };

  const removeInvoiceLine = (index: number) => {
    if (invoice.lines.length > 1) {
      const updatedLines = invoice.lines.filter((_, i) => i !== index);
      setInvoice(prev => ({ ...prev, lines: updatedLines }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const savedInvoice = await financeStore.saveInvoice(invoice);
      toast.success('Invoice saved successfully');
      onSubmit?.(savedInvoice);
    } catch (error) {
      toast.error('Failed to save invoice');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <form onSubmit={handleSubmit} className="grid gap-4">
        {/* Customer Selection */}
        <Select
          label="Customer"
          value={invoice.customerId}
          onChange={(value) => setInvoice(prev => ({ ...prev, customerId: value }))}
          options={customers.map(c => ({ 
            value: c.id, 
            label: c.name 
          }))}
        />

        {/* Invoice Lines */}
        <div className="space-y-2">
          {invoice.lines.map((line, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <Input
                className="col-span-5"
                placeholder="Description"
                value={line.description}
                onChange={(e) => handleLineChange(index, { description: e.target.value })}
              />
              <Input
                type="number"
                className="col-span-2"
                placeholder="Qty"
                value={line.quantity}
                onChange={(e) => handleLineChange(index, { 
                  quantity: Number(e.target.value) 
                })}
              />
              <Input
                type="number"
                className="col-span-3"
                placeholder="Unit Price"
                value={line.unitPrice}
                onChange={(e) => handleLineChange(index, { 
                  unitPrice: Number(e.target.value) 
                })}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => removeInvoiceLine(index)}
                disabled={invoice.lines.length <= 1}
              >
                <TrashIcon className="h-5 w-5" />
              </Button>
            </div>
          ))}
          <Button 
            variant="outline" 
            onClick={addInvoiceLine}
            className="w-full"
          >
            <PlusIcon className="mr-2 h-5 w-5" /> Add Line
          </Button>
        </div>

        {/* Invoice Summary */}
        <div className="grid grid-cols-2 gap-2 text-right">
          <span>Subtotal:</span>
          <span>${invoiceSummary.subtotal.toFixed(2)}</span>
          <span>Tax (10%):</span>
          <span>${invoiceSummary.tax.toFixed(2)}</span>
          <strong>Total:</strong>
          <strong>${invoiceSummary.total.toFixed(2)}</strong>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Invoice'}
        </Button>
      </form>
    </Card>
  );
});

export default InvoiceForm;
```

Key Features:
- TypeScript with strong typing
- MobX store integration
- Dynamic line item management
- Tax and total calculations
- Error handling with toast notifications
- Responsive Tailwind CSS design
- Loading states
- Modular and reusable component

Note: This assumes you have corresponding types, stores, and UI components defined in your project structure.
