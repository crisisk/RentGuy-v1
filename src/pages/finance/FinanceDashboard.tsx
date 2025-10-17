import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import financeStore from '../../stores/financeStore';

interface Invoice {
  id: string;
  clientName: string;
  amount: number;
  status: 'pending' | 'paid';
  dueDate: string;
}

interface RevenueStats {
  monthlyRevenue: number;
  pendingInvoicesTotal: number;
  paidInvoicesTotal: number;
}

const FinanceDashboard: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        setLoading(true);
        const financeData = await financeStore.getDashboardData();
        setInvoices(financeData.invoices);
        setStats(financeData.stats);
        setLoading(false);
      } catch (err) {
        setError('Failed to load finance data');
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-8">
      <h1 className="text-3xl font-bold mb-6">Finance Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2">Monthly Revenue</h2>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.monthlyRevenue)}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2">Pending Invoices</h2>
            <p className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats.pendingInvoicesTotal)}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2">Paid Invoices</h2>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.paidInvoicesTotal)}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Due Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b">
                <td className="px-4 py-3">{invoice.clientName}</td>
                <td className="px-4 py-3">{formatCurrency(invoice.amount)}</td>
                <td className="px-4 py-3">{formatDate(invoice.dueDate)}</td>
                <td className="px-4 py-3">
                  <span 
                    className={`px-2 py-1 rounded text-xs ${
                      invoice.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link 
                    to={`/invoices/${invoice.id}`} 
                    className="text-blue-500 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceDashboard;
