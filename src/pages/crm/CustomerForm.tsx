import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import crmStore, { type CustomerInput, type CustomerStatus } from '../../stores/crmStore'

const CustomerForm: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(!!id)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<CustomerInput>({
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'active',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInput, string>>>({})

  const statusOptions: CustomerStatus[] = ['active', 'inactive']

  useEffect(() => {
    if (id) {
      crmStore
        .getCustomer(id)
        .then((customer) => {
          if (customer) {
            setFormData({
              id: customer.id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              address: customer.address,
              status: customer.status,
              ...(customer.company ? { company: customer.company } : {}),
              ...(customer.notes ? { notes: customer.notes } : {}),
            })
          } else {
            setFormError('Customer not found')
          }
          setLoading(false)
        })
        .catch(() => {
          setFormError('Failed to load customer')
          setLoading(false)
        })
    }
  }, [id])

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerInput, string>> = {}
    const name = formData.name?.trim() ?? ''
    const email = formData.email ?? ''
    const phone = formData.phone ?? ''
    const address = formData.address?.trim() ?? ''

    if (!name) newErrors.name = 'Name is required'
    if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Invalid email'
    if (!/^\d{10,15}$/.test(phone)) newErrors.phone = 'Invalid phone number'
    if (!address) newErrors.address = 'Address is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await crmStore.saveCustomer(formData)
      navigate('/customers')
    } catch {
      setFormError('Failed to save customer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange =
    (field: keyof CustomerInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        field === 'status' ? (e.target.value as CustomerStatus) : (e.target.value as string)
      setFormData((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }

  if (loading)
    return (
      <div className="p-4 text-center" data-testid="customer-form-loading">
        Loading...
      </div>
    )
  if (formError)
    return (
      <div className="p-4 text-red-500" data-testid="customer-form-error">
        {formError}
      </div>
    )

  return (
    <div
      className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md"
      data-testid="customer-form-root"
    >
      <h1 className="text-2xl font-bold mb-6" data-testid="customer-form-title">
        {id ? 'Edit' : 'Create'} Customer
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4" data-testid="customer-form">
        {formError && (
          <div className="text-red-500 text-sm" data-testid="customer-form-inline-error">
            {formError}
          </div>
        )}

        <div data-testid="customer-form-field-name">
          <label className="block text-sm font-medium mb-1" htmlFor="customer-name">
            Name *
          </label>
          <input
            id="customer-name"
            value={formData.name ?? ''}
            onChange={handleChange('name')}
            className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            data-testid="customer-form-input-name"
          />
          {errors.name && (
            <span className="text-red-500 text-sm" data-testid="customer-form-error-name">
              {errors.name}
            </span>
          )}
        </div>

        <div data-testid="customer-form-field-email">
          <label className="block text-sm font-medium mb-1" htmlFor="customer-email">
            Email *
          </label>
          <input
            id="customer-email"
            type="email"
            value={formData.email ?? ''}
            onChange={handleChange('email')}
            className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            data-testid="customer-form-input-email"
          />
          {errors.email && (
            <span className="text-red-500 text-sm" data-testid="customer-form-error-email">
              {errors.email}
            </span>
          )}
        </div>

        <div data-testid="customer-form-field-phone">
          <label className="block text-sm font-medium mb-1" htmlFor="customer-phone">
            Phone *
          </label>
          <input
            id="customer-phone"
            value={formData.phone ?? ''}
            onChange={handleChange('phone')}
            className={`w-full p-2 border rounded ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
            data-testid="customer-form-input-phone"
          />
          {errors.phone && (
            <span className="text-red-500 text-sm" data-testid="customer-form-error-phone">
              {errors.phone}
            </span>
          )}
        </div>

        <div data-testid="customer-form-field-address">
          <label className="block text-sm font-medium mb-1" htmlFor="customer-address">
            Address *
          </label>
          <input
            id="customer-address"
            value={formData.address ?? ''}
            onChange={handleChange('address')}
            className={`w-full p-2 border rounded ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
            data-testid="customer-form-input-address"
          />
          {errors.address && (
            <span className="text-red-500 text-sm" data-testid="customer-form-error-address">
              {errors.address}
            </span>
          )}
        </div>

        <div data-testid="customer-form-field-status">
          <label className="block text-sm font-medium mb-1" htmlFor="customer-status">
            Status
          </label>
          <select
            id="customer-status"
            value={formData.status ?? 'active'}
            onChange={handleChange('status')}
            className="w-full p-2 border border-gray-300 rounded"
            data-testid="customer-form-select-status"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 mt-6" data-testid="customer-form-actions">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            data-testid="customer-form-submit"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            data-testid="customer-form-cancel"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default CustomerForm
