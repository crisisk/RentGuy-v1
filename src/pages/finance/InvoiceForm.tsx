import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import financeStore, {
  type Invoice,
  type InvoiceUpsertPayload,
} from '../../stores/financeStore'

type EditableLineItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

const InvoiceForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const [clientName, setClientName] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [lineItems, setLineItems] = useState<EditableLineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const generateUniqueId = () => Math.random().toString(36).slice(2, 11)

  const addLineItem = () => {
    const newLineItem: EditableLineItem = {
      id: generateUniqueId(),
      description: '',
      quantity: 1,
      unitPrice: 0,
    }
    setLineItems(previous => [...previous, newLineItem])
  }

  const updateLineItem = (lineId: string, field: keyof EditableLineItem, value: string | number) => {
    setLineItems(previous =>
      previous.map(item =>
        item.id === lineId ? { ...item, [field]: field === 'description' ? value : Number(value) } : item,
      ),
    )
  }

  const removeLineItem = (lineId: string) => {
    setLineItems(previous => previous.filter(item => item.id !== lineId))
  }

  const calculateTotal = () => {
    return lineItems.reduce((total, item) => total + item.quantity * item.unitPrice, 0)
  }

  const buildPayload = (): InvoiceUpsertPayload => ({
    clientName,
    invoiceDate,
    dueDate,
    lineItems: lineItems.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    total: calculateTotal(),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const invoiceData = buildPayload()
      if (id) {
        await financeStore.updateInvoice(id, invoiceData)
      } else {
        await financeStore.createInvoice(invoiceData)
      }
      navigate('/invoices')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save invoice')
    }
  }

  const applyInvoice = (invoice: Invoice) => {
    setClientName(invoice.clientName)
    setInvoiceDate(invoice.invoiceDate.slice(0, 10))
    setDueDate(invoice.dueDate.slice(0, 10))
    setLineItems(
      invoice.lineItems.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    )
  }

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        if (id) {
          const invoice = await financeStore.getInvoiceById(id)
          applyInvoice(invoice)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [id])

  if (loading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-500">{error}</div>

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Client Name
            <input
              type="text"
              value={clientName}
              onChange={event => setClientName(event.target.value)}
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
                onChange={event => setInvoiceDate(event.target.value)}
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
                onChange={event => setDueDate(event.target.value)}
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
                      onChange={event => updateLineItem(item.id, 'description', event.target.value)}
                      className="w-full"
                      required
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={event => updateLineItem(item.id, 'quantity', event.target.value)}
                      className="w-full"
                      min="1"
                      required
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={event => updateLineItem(item.id, 'unitPrice', event.target.value)}
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
  )
}

export default InvoiceForm
