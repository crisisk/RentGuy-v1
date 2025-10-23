import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import crmStore from '../../stores/crmStore'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  status: 'active' | 'pending' | 'inactive' | 'archived'
  createdAt: string
}

const CustomerList = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await crmStore.loadCustomers()
        setCustomers(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load customers')
      } finally {
        setLoading(false)
      }
    }
    loadCustomers()
  }, [])

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch = [customer.name, customer.email, customer.phone].some((field) =>
        field.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      const matchesStatus = !selectedStatus || customer.status === selectedStatus
      return matchesSearch && matchesStatus
    })
  }, [customers, searchQuery, selectedStatus])

  const statusOptions = ['active', 'pending', 'inactive', 'archived']

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'archived':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) return <div className="p-4 text-gray-500">Loading customers...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>

  return (
    <div className="p-4">
      <div className="mb-4 space-y-4">
        <input
          type="text"
          placeholder="Search customers..."
          className="w-full p-2 border rounded-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus((prev) => (prev === status ? null : status))}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedStatus === status
                  ? `${getStatusColor(status)} ring-1 ring-inset ring-black/10`
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="text-gray-500">No customers found</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/customers/${customer.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}
                    >
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default CustomerList
