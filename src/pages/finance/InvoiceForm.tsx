import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import financeStore from '../../stores/financeStore';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

const InvoiceForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [clientName, setClientName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateUniqueId = () => Math.random().toString(36).substr(2, 9);

  const addLineItem = () => {
    const newLineItem: LineItem = {
      id: generateUniqueId(),
      description: '',
      quantity: 1,
      unitPrice: 0
    };
    setLineItems([...lineItems, newLineItem]);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    const updatedItems = lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setLineItems(updatedItems);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return lineItems.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const invoiceData = {
        clientName,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        lineItems,
        total: calculateTotal()
      };

      if (id) {
        await financeStore.updateInvoice(id, invoiceData);
      } else {
        await financeStore.createInvoice(invoiceData);
      }
      navigate('/invoices');
    } catch (err) {
      setError('Failed to save invoice');
    }
  };

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        if (id) {
          const invoice = await financeStore.getInvoiceById(id);
          setClientName(invoice.clientName);
          setInvoiceDate(invoice.invoiceDate.toISOString().split('T')[0]);
          setDueDate(invoice.dueDate.toISOString().split('T')[0]);
          setLineItems(invoice.lineItems);
        }
      } catch (err) {
        setError('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Client Name
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              required
            />
          </label>
        </div>

        <div className="flex mb-4">
          <div className="w-1/2 mr-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Invoice Date
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                required
              />
            </label>
          </div>
          <div className="w-1/2 ml-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Due Date
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                required
              />
            </label>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-bold mb-2">Line Items</h3>
          <button 
            type="button" 
            onClick={addLineItem}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2"
          >
            Add Line Item
          </button>

          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Description</th>
                <th className="border p-2">Quantity</th>
                <th className="border p-2">Unit Price</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      className="w-full"
                      required
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                      className="w-full"
                      min="1"
                      required
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                      className="w-full"
                      min="0"
                      step="0.01"
                      required
                    />
                  </td>
                  <td className="border p-2">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </td>
                  <td className="border p-2">
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-4 text-right">
          <strong>Total: ${calculateTotal().toFixed(2)}</strong>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            {id ? 'Update Invoice' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
