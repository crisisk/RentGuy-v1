import { useState, useEffect } from 'react';
import { crmStore } from '../stores/crmStore';
import { observer } from 'mobx-react-lite';
import { Customer, CustomerStatus } from '../types/customer';
import Spinner from './ui/Spinner';
import ErrorMessage from './ui/ErrorMessage';

const CustomerList = observer(() => {
  // Local filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CustomerStatus | 'all'>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      crmStore.setSearchFilter(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Update status filter
  useEffect(() => {
    crmStore.setStatusFilter(selectedStatus === 'all' ? null : selectedStatus);
  }, [selectedStatus]);

  // Update company filter
  useEffect(() => {
    crmStore.setCompanyFilter(selectedCompany === 'all' ? null : selectedCompany);
  }, [selectedCompany]);

  // Pagination handlers
  const handlePreviousPage = () => {
    if (crmStore.currentPage > 1) {
      crmStore.setCurrentPage(crmStore.currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (crmStore.currentPage < crmStore.totalPages) {
      crmStore.setCurrentPage(crmStore.currentPage + 1);
    }
  };

  // Loading and error states
  if (crmStore.error) return <ErrorMessage message={crmStore.error} />;
  if (crmStore.loading) return <Spinner />;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search customers..."
          className="p-2 border rounded-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <select
          className="p-2 border rounded-lg"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as CustomerStatus | 'all')}
        >
          <option value="all">All Statuses</option>
          {Object.values(CustomerStatus).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          className="p-2 border rounded-lg"
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
        >
          <option value="all">All Companies</option>
          {crmStore.uniqueCompanies.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Company</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Last Contact</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {crmStore.filteredCustomers.map((customer: Customer) => (
              <tr key={customer.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{customer.name}</td>
                <td className="px-4 py-2">{customer.company}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    customer.status === CustomerStatus.ACTIVE
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {customer.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {new Date(customer.lastContact).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  <button
                    className="text-blue-600 hover:text-blue-800 mr-2"
                    onClick={() => crmStore.editCustomer(customer.id)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() => crmStore.deleteCustomer(customer.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-6 flex justify-between items-center">
        <div className="text-gray-600">
          Page {crmStore.currentPage} of {crmStore.totalPages}
        </div>
        <div className="space-x-2">
          <button
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
            onClick={handlePreviousPage}
            disabled={crmStore.currentPage === 1}
          >
            Previous
          </button>
          <button
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
            onClick={handleNextPage}
            disabled={crmStore.currentPage === crmStore.totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
});

export default CustomerList;
