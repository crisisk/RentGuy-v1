import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import financeStore, { type QuoteRecord } from '../../stores/financeStore';

const QuoteManagement = () => {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadQuotes = async () => {
      try {
        const data = await financeStore.getQuotes();
        setQuotes(data);
      } catch (err) {
        setError('Failed to load quotes');
      } finally {
        setLoading(false);
      }
    };
    loadQuotes();
  }, []);

  const handleConvert = async (quoteId: string) => {
    try {
      const invoiceId = await financeStore.convertQuoteToInvoice(quoteId);
      setQuotes(prev =>
        prev.map(quote =>
          quote.id === quoteId
            ? { ...quote, status: 'converted', invoiceId }
            : quote
        )
      );
      navigate(`/invoices/${invoiceId}`);
    } catch (err) {
      setError('Failed to convert quote to invoice');
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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-100 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Quotes</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {quotes.map((quote) => (
              <tr key={quote.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{quote.number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{quote.client}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(quote.date)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  ${quote.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${quote.status === 'converted' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {quote.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleConvert(quote.id)}
                    disabled={quote.status === 'converted'}
                    className={`px-3 py-1 rounded-md text-sm font-medium 
                      ${quote.status === 'converted' 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  >
                    Convert
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuoteManagement;
