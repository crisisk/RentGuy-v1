import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useFinanceStore from '../../stores/financeStore';
import type { FinanceStats, Invoice } from '../../stores/financeStore';

const calculateFallbackStats = (items: Invoice[]): FinanceStats => {
  const pendingInvoicesTotal = items
    .filter((invoice) => invoice.status === 'pending')
    .reduce((total, invoice) => total + invoice.amount, 0);

  const paidInvoicesTotal = items
    .filter((invoice) => invoice.status === 'paid' || invoice.status === 'completed')
    .reduce((total, invoice) => total + invoice.amount, 0);

  return {
    monthlyRevenue: paidInvoicesTotal,
    pendingInvoicesTotal,
    paidInvoicesTotal,
  };
};

const FinanceDashboard: React.FC = () => {
  const invoices = useFinanceStore((state) => state.invoices);
  const stats = useFinanceStore((state) => state.stats);
  const loading = useFinanceStore((state) => state.loading);
  const error = useFinanceStore((state) => state.error);
  const getDashboardData = useFinanceStore((state) => state.getDashboardData);
  const clearError = useFinanceStore((state) => state.clearError);

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
    getDashboardData().catch(() => {
      /* handled via store state */
    });

    return () => {
      clearError();
    };
  }, [getDashboardData, clearError]);

  const resolvedStats = useMemo<FinanceStats>(() => {
    if (stats) {
      return stats;
    }
    return calculateFallbackStats(invoices);
  }, [stats, invoices]);

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

  const visibleInvoices = invoices.slice(0, 10);

  return (
    <div className="container mx-auto px-4 py-8 md:px-8">
      <h1 className="text-3xl font-bold mb-6">Finance Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Monthly Revenue</h2>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(resolvedStats.monthlyRevenue)}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Pending Invoices</h2>
          <p className="text-2xl font-bold text-yellow-600">
            {formatCurrency(resolvedStats.pendingInvoicesTotal)}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Paid Invoices</h2>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(resolvedStats.paidInvoicesTotal)}
          </p>
        </div>
      </div>

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
            {visibleInvoices.map((invoice) => (
              <tr key={invoice.id} className="border-b">
                <td className="px-4 py-3">{invoice.clientName}</td>
                <td className="px-4 py-3">{formatCurrency(invoice.amount)}</td>
                <td className="px-4 py-3">{formatDate(invoice.dueDate ?? invoice.date)}</td>
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
