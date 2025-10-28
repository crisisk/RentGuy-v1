import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatDate } from '../../core/storage'
import crmStore, { type Customer, type Activity } from '../../stores/crmStore'

const CustomerDetails: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const formatDateLabel = (dateString: string): string =>
    formatDate(dateString, {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    })

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        setLoading(true)
        if (!customerId) {
          throw new Error('Customer id missing')
        }
        const customerData = await crmStore.getCustomerById(customerId)
        const customerActivities = await crmStore.getCustomerActivities(customerId)

        if (customerData) {
          setCustomer(customerData)
        } else {
          setCustomer(null)
          setError('Customer not found')
        }
        setActivities(customerActivities)
      } catch {
        setError('Failed to load customer details')
      } finally {
        setLoading(false)
      }
    }

    fetchCustomerDetails()
  }, [customerId])

  if (loading) {
    return (
      <div
        className="flex justify-center items-center h-screen"
        data-testid="customer-details-loading"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
        data-testid="customer-details-error"
      >
        {error}
      </div>
    )
  }

  if (!customer) {
    return <div data-testid="customer-details-empty">No customer found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="customer-details-root">
      <div className="grid md:grid-cols-2 gap-8" data-testid="customer-details-grid">
        {/* Customer Info Card */}
        <div className="bg-white shadow-md rounded-lg p-6" data-testid="customer-details-card">
          <h2 className="text-2xl font-bold mb-4 text-gray-800" data-testid="customer-details-name">
            {customer.name}
          </h2>
          <div className="space-y-2">
            <p className="text-gray-600" data-testid="customer-details-email">
              <strong>Email:</strong> {customer.email}
            </p>
            <p className="text-gray-600" data-testid="customer-details-phone">
              <strong>Phone:</strong> {customer.phone}
            </p>
            <p className="text-gray-600" data-testid="customer-details-company">
              <strong>Company:</strong> {customer.company ?? '—'}
            </p>
          </div>
        </div>

        {/* Activities Table */}
        <div
          className="bg-white shadow-md rounded-lg p-6"
          data-testid="customer-details-activities"
        >
          <h3
            className="text-xl font-semibold mb-4 text-gray-800"
            data-testid="customer-details-activities-title"
          >
            Recent Activities
          </h3>
          {activities.length === 0 ? (
            <p className="text-gray-500" data-testid="customer-details-activities-empty">
              No recent activities
            </p>
          ) : (
            <table
              className="w-full text-sm text-left"
              data-testid="customer-details-activities-table"
            >
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">Type</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="border-b"
                    data-testid={`customer-details-activity-${activity.id}`}
                  >
                    <td className="p-2">{activity.type}</td>
                    <td className="p-2">{formatDateLabel(activity.date)}</td>
                    <td className="p-2">{activity.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mt-8 text-center" data-testid="customer-details-back">
        <Link
          to="/customers"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          data-testid="customer-details-back-button"
        >
          Back to Customers
        </Link>
      </div>
    </div>
  )
}

export default CustomerDetails
