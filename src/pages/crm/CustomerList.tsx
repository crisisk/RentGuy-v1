import { useState, useEffect, useMemo, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { formatDate } from '../../core/storage'
import crmStore, {
  type Customer as StoreCustomer,
  type CustomerStatus,
} from '../../stores/crmStore'

const CustomerList = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<CustomerStatus | null>(null)

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

  const statusOptions: CustomerStatus[] = ['active', 'inactive']

  const getStatusColor = (status: CustomerStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading)
    return (
      <div className="p-4 text-gray-500" data-testid="customer-list-loading">
        Loading customers...
      </div>
    )
  if (error)
    return (
      <div className="p-4 text-red-500" data-testid="customer-list-error">
        Error: {error}
      </div>
    )

  return (
    <div className="p-4" data-testid="customer-list-root">
      <div className="mb-4 space-y-4" data-testid="customer-list-filters">
        <input
          type="text"
          placeholder="Search customers..."
          className="w-full p-2 border rounded-lg"
          value={searchQuery}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchQuery(event.target.value)}
          data-testid="customer-list-search"
        />

        <div className="flex gap-2 overflow-x-auto pb-2" data-testid="customer-list-status-filter">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus((prev) => (prev === status ? null : status))}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedStatus === status
                  ? `${getStatusColor(status)} ring-1 ring-inset ring-black/10`
                  : 'bg-gray-100 text-gray-600'
              }`}
              data-testid={`customer-list-status-${status}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="text-gray-500" data-testid="customer-list-empty">
          No customers found
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-lg border"
          data-testid="customer-list-table-wrapper"
        >
          <table className="min-w-full divide-y divide-gray-200" data-testid="customer-list-table">
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
            <tbody className="bg-white divide-y divide-gray-200" data-testid="customer-list-body">
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-gray-50"
                  data-testid={`customer-list-row-${customer.id}`}
                >
                  <td
                    className="px-6 py-4 whitespace-nowrap"
                    data-testid={`customer-list-name-${customer.id}`}
                  >
                    <Link
                      to={`/customers/${customer.id}`}
                      className="text-blue-600 hover:underline"
                      data-testid={`customer-list-link-${customer.id}`}
                    >
                      {customer.name}
                    </Link>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap"
                    data-testid={`customer-list-email-${customer.id}`}
                  >
                    {customer.email}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap"
                    data-testid={`customer-list-phone-${customer.id}`}
                  >
                    {customer.phone}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap"
                    data-testid={`customer-list-status-cell-${customer.id}`}
                  >
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}
                      data-testid={`customer-list-status-badge-${customer.id}`}
                    >
                      {customer.status}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap"
                    data-testid={`customer-list-joined-${customer.id}`}
                  >
                    {formatDate(customer.createdAt)}
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
