import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import crmStore from '../../stores/crmStore'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company: string
}

interface Activity {
  id: string
  type: string
  date: string
  description: string
}

const CustomerDetails: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        setLoading(true)
        const customerData = await crmStore.getCustomerById(customerId)
        const customerActivities = await crmStore.getCustomerActivities(customerId)

        setCustomer(customerData)
        setActivities(customerActivities)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load customer details', error)
        setError('Failed to load customer details')
        setLoading(false)
      }
    }

    fetchCustomerDetails()
  }, [customerId])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        {error}
      </div>
    )
  }

  if (!customer) {
    return <div>No customer found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Customer Info Card */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">{customer.name}</h2>
          <div className="space-y-2">
            <p className="text-gray-600">
              <strong>Email:</strong> {customer.email}
            </p>
            <p className="text-gray-600">
              <strong>Phone:</strong> {customer.phone}
            </p>
            <p className="text-gray-600">
              <strong>Company:</strong> {customer.company}
            </p>
          </div>
        </div>

        {/* Activities Table */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Activities</h3>
          {activities.length === 0 ? (
            <p className="text-gray-500">No recent activities</p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">Type</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id} className="border-b">
                    <td className="p-2">{activity.type}</td>
                    <td className="p-2">{formatDate(activity.date)}</td>
                    <td className="p-2">{activity.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/customers"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Back to Customers
        </Link>
      </div>
    </div>
  )
}

export default CustomerDetails
