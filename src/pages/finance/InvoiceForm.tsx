import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useFinanceStore } from '@stores/financeStore'
import type { InvoiceDraft, InvoiceLineItem } from '@rg-types/financeTypes'

const generateId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11)

const createEmptyLineItem = (): InvoiceLineItem => ({
  id: generateId(),
  description: '',
  quantity: 1,
  unitPrice: 0,
})

const normaliseDateInput = (value?: string) =>
  value ? new Date(value).toISOString().slice(0, 10) : ''

const InvoiceForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const [clientName, setClientName] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([createEmptyLineItem()])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createInvoice = useFinanceStore((state) => state.createInvoice)
  const updateInvoice = useFinanceStore((state) => state.updateInvoice)
  const getInvoiceById = useFinanceStore((state) => state.getInvoiceById)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    getInvoiceById(id)
      .then((invoice) => {
        setClientName(invoice.clientName)
        setInvoiceDate(normaliseDateInput(invoice.invoiceDate))
        setDueDate(normaliseDateInput(invoice.dueDate))
        setLineItems(
          invoice.lineItems.length > 0
            ? invoice.lineItems.map((item) => ({
                id: item.id ?? generateId(),
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
              }))
            : [createEmptyLineItem()],
        )
      })
      .catch(() => setLoadError('Failed to load invoice'))
      .finally(() => setLoading(false))
  }, [id, getInvoiceById])

  const addLineItem = () => {
    setLineItems((current) => [...current, createEmptyLineItem()])
  }

  const updateLineItem = (itemId: string, field: keyof InvoiceLineItem, value: string | number) => {
    setLineItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: field === 'description' ? value : Number(value),
            }
          : item,
      ),
    )
  }

  const removeLineItem = (itemId: string) => {
    setLineItems((current) => {
      const updated = current.filter((item) => item.id !== itemId)
      return updated.length > 0 ? updated : [createEmptyLineItem()]
    })
  }

  const total = useMemo(
    () =>
      lineItems.reduce(
        (accumulator, item) => accumulator + Number(item.quantity) * Number(item.unitPrice),
        0,
      ),
    [lineItems],
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)

    if (!invoiceDate || !dueDate) {
      setSubmitError('Invoice and due dates are required.')
      setIsSubmitting(false)
      return
    }

    const payload: InvoiceDraft = {
      clientName,
      invoiceDate: new Date(invoiceDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      lineItems: lineItems.map((item) => ({
        ...item,
        total: item.total ?? Number(item.quantity) * Number(item.unitPrice),
      })),
      total,
    }

    try {
      if (id) {
        await updateInvoice(id, payload)
      } else {
        await createInvoice(payload)
      }
      navigate('/invoices')
    } catch {
      setSubmitError('Failed to save invoice')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  if (loadError) {
    return <div className="p-4 text-red-500">{loadError}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleSubmit} className="mb-4 rounded bg-white px-8 pt-6 pb-8 shadow-md">
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold text-gray-700">
            Client Name
            <input
              type="text"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 text-gray-700 shadow"
              required
            />
          </label>
        </div>

        <div className="mb-4 flex flex-col gap-4 md:flex-row">
          <label className="flex-1 text-sm font-bold text-gray-700">
            Invoice Date
            <input
              type="date"
              value={invoiceDate}
              onChange={(event) => setInvoiceDate(event.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 text-gray-700 shadow"
              required
            />
          </label>
          <label className="flex-1 text-sm font-bold text-gray-700">
            Due Date
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 text-gray-700 shadow"
              required
            />
          </label>
        </div>

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-bold">Line Items</h3>
            <button
              type="button"
              onClick={addLineItem}
              className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
            >
              Add Line Item
            </button>
          </div>

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
                      onChange={(event) => updateLineItem(item.id!, 'description', event.target.value)}
                      className="w-full"
                      required
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(event) => updateLineItem(item.id!, 'quantity', Number(event.target.value))}
                      className="w-full"
                      min="1"
                      required
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(event) => updateLineItem(item.id!, 'unitPrice', Number(event.target.value))}
                      className="w-full"
                      min="0"
                      step="0.01"
                      required
                    />
                  </td>
                  <td className="border p-2">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                  <td className="border p-2">
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id!)}
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
          <strong>Total: ${total.toFixed(2)}</strong>
        </div>

        {submitError && <div className="mb-4 text-red-500">{submitError}</div>}

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-700 ${
              isSubmitting ? 'opacity-75' : ''
            }`}
          >
            {isSubmitting ? 'Saving…' : id ? 'Update Invoice' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default InvoiceForm
