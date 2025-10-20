import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useFinanceStore from '../../stores/financeStore';

const QuoteManagement = () => {
  const navigate = useNavigate();
  const quotes = useFinanceStore((state) => state.quotes);
  const loading = useFinanceStore((state) => state.loading);
  const error = useFinanceStore((state) => state.error);
  const fetchQuotes = useFinanceStore((state) => state.fetchQuotes);
  const convertQuoteToInvoice = useFinanceStore((state) => state.convertQuoteToInvoice);
  const clearError = useFinanceStore((state) => state.clearError);

  useEffect(() => {
    fetchQuotes().catch(() => {
      /* error state handled in store */
    });

    return () => {
      clearError();
    };
  }, [fetchQuotes, clearError]);

  const handleConvert = async (quoteId: string) => {
    try {
      const invoiceId = await convertQuoteToInvoice(quoteId);
      navigate(`/invoices/${invoiceId}`);
    } catch {
      /* error already reflected in store state */
    }
  };

  const formatDate = (value: Date) => {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" role="status" aria-live="polite">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto mt-6 max-w-xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Offertes</h1>
          <p className="text-sm text-slate-500">Beheer verzonden offertes en zet succesvolle voorstellen direct om naar een factuur.</p>
        </div>
        <select
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:w-56"
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}
        >
          <option value="all">Alle statussen</option>
          <option value="draft">Concept</option>
          <option value="sent">Verzonden</option>
          <option value="converted">Geconverteerd</option>
        </select>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Offertenummer</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Klant</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Datum</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Bedrag</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleQuotes.map(quote => (
              <tr key={quote.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">{quote.number}</td>
                <td className="px-6 py-4 text-sm text-slate-700">{quote.clientName}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{formatDate(quote.issuedAt)}</td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                  {quote.amount.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      quote.status === 'converted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : quote.status === 'sent'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {quote.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <button
                    type="button"
                    onClick={() => handleConvert(quote.id)}
                    disabled={quote.status === 'converted'}
                    className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      quote.status === 'converted'
                        ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Converteer naar factuur
                  </button>
                </td>
              </tr>
            ))}
            {visibleQuotes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-sm text-slate-500">
                  Er zijn geen offertes die voldoen aan de geselecteerde statusfilter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default QuoteManagement
