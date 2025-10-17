import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { financeStore } from '@/stores/financeStore';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

type InvoiceFilters = {
  status?: InvoiceStatus;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
};

const InvoiceOverview = () => {
  const { invoices, loading, error, fetchInvoices } = financeStore();
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: undefined,
    startDate: undefined,
    endDate: undefined,
    searchQuery: '',
  });

  // Debounce search input to prevent excessive API calls
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchInvoices(filters);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [filters.searchQuery]);

  // Handle date and status filter changes
  useEffect(() => {
    fetchInvoices(filters);
  }, [filters.status, filters.startDate, filters.endDate]);

  const handleStatusChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      status: value as InvoiceStatus || undefined
    }));
  };

  const handleExport = () => {
    // Export logic here
    console.log('Exporting invoices...');
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Invoice Overview</h1>
          <Button onClick={handleExport} variant="primary">
            Export CSV
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-2 flex gap-4">
              <DatePicker
                selected={filters.startDate}
                onChange={(date: Date) => setFilters(prev => ({ ...prev, startDate: date }))}
                placeholderText="Start Date"
                className="w-full p-2 border rounded"
              />
              <DatePicker
                selected={filters.endDate}
                onChange={(date: Date) => setFilters(prev => ({ ...prev, endDate: date }))}
                placeholderText="End Date"
                className="w-full p-2 border rounded"
              />
            </div>
            <Select
              options={statusOptions}
              value={filters.status || ''}
              onChange={handleStatusChange}
            />
            <Input
              type="text"
              placeholder="Search invoices..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <Spinner className="w-12 h-12 mx-auto" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            Error loading invoices: {error.message}
          </div>
        )}

        {/* Data Table */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.customer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${invoice.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {invoices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No invoices found matching your criteria
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceOverview;
