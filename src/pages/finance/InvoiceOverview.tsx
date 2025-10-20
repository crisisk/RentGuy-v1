import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useFinanceStore from '../../stores/financeStore';

const InvoiceOverview: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientNameFilter, setClientNameFilter] = useState<string>('');
  const navigate = useNavigate();

  const invoices = useFinanceStore((state) => state.invoices);
  const loading = useFinanceStore((state) => state.loading);
  const error = useFinanceStore((state) => state.error);
  const fetchInvoices = useFinanceStore((state) => state.fetchInvoices);
  const clearError = useFinanceStore((state) => state.clearError);

  useEffect(() => {
    fetchInvoices().catch(() => {
      /* handled via store error state */
    });

    return () => {
      clearError();
    };
  }, [fetchInvoices, clearError]);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    const matchesName = invoice.clientName.toLowerCase().includes(clientNameFilter.toLowerCase())
    return matchesStatus && matchesName
  })

  const formatDate = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return <div className="p-6 text-center text-sm text-slate-500">Facturen worden geladen…</div>
  }

  if (loading) return <div className="p-4 text-center">Loading invoices...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facturen</h1>
          <p className="text-sm text-slate-500">Filter op klantnaam of status om snel de juiste factuur te vinden.</p>
        </div>
        <Link
          to="/invoices/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          Nieuwe factuur
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="text"
          placeholder="Zoek op klantnaam"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={clientNameFilter}
          onChange={event => setClientNameFilter(event.target.value)}
        />
        <select
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:w-56"
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}
        >
          <option value="all">Alle statussen</option>
          <option value="paid">Betaald</option>
          <option value="pending">Openstaand</option>
          <option value="overdue">Achterstallig</option>
          <option value="sent">Verzonden</option>
          <option value="draft">Concept</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Klant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Bedrag</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Factuurdatum</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-3">{invoice.clientName}</td>
                  <td className="px-4 py-3">${invoice.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">{formatDate(invoice.invoiceDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-sm ${statusClasses[invoice.status] ?? 'bg-gray-100 text-gray-800'}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      Bekijken
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                    Geen facturen gevonden voor de huidige filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default InvoiceOverview
