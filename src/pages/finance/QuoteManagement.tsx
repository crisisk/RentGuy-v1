import { useState, useEffect, useCallback } from 'react';
import { useFinanceStore } from '@/stores/financeStore';
import { DataTable, DataTableColumn, ActionItem } from '@/components/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Quote, QuoteStatus } from '@/types/finance';
import { formatDate } from '@/utils/dateUtils';
import { CreateQuoteForm } from './CreateQuoteForm';

export const QuoteManagement = () => {
  const { quotes, loading, error, fetchQuotes, createQuote, convertQuoteToInvoice } = useFinanceStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const filteredQuotes = quotes.filter(quote =>
    quote.client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadQuotes = useCallback(async () => {
    try {
      await fetchQuotes();
      setLocalError(null);
    } catch (err) {
      setLocalError('Failed to load quotes');
    }
  }, [fetchQuotes]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const handleConvertToInvoice = async (quoteId: string) => {
    try {
      await convertQuoteToInvoice(quoteId);
      // Optional: Show success notification
    } catch (err) {
      setLocalError('Failed to convert quote to invoice');
    }
  };

  const columns: DataTableColumn<Quote>[] = [
    { header: 'Quote ID', accessor: 'id' },
    { header: 'Client', accessor: (item) => item.client.name },
    { header: 'Amount', accessor: (item) => `$${item.amount.toFixed(2)}` },
    { header: 'Status', accessor: (item) => item.status },
    { header: 'Date', accessor: (item) => formatDate(item.date) },
    {
      header: 'Actions',
      accessor: (item) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm">View</Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleConvertToInvoice(item.id)}
            disabled={item.status !== QuoteStatus.DRAFT}
          >
            Convert to Invoice
          </Button>
          <Button variant="destructive" size="sm">Delete</Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || localError) {
    return (
      <Card className="p-4 mb-4 bg-red-50 text-red-600">
        {error || localError}
        <Button variant="ghost" onClick={loadQuotes} className="ml-4">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="w-full md:w-auto"
        >
          Create Quote
        </Button>
        <Input
          placeholder="Search quotes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredQuotes}
        emptyMessage="No quotes found"
        responsive
        className="bg-white rounded-lg shadow-sm"
      />

      {showCreateForm && (
        <CreateQuoteForm
          onClose={() => setShowCreateForm(false)}
          onSubmit={async (values) => {
            try {
              await createQuote(values);
              setShowCreateForm(false);
            } catch (err) {
              setLocalError('Failed to create quote');
            }
          }}
        />
      )}
    </div>
  );
};

// CreateQuoteForm component would typically be in a separate file
// Included here for completeness
const CreateQuoteForm = ({ onClose, onSubmit }: { 
  onClose: () => void;
  onSubmit: (values: Omit<Quote, 'id' | 'date'>) => Promise<void>;
}) => {
  const [formValues, setFormValues] = useState<Omit<Quote, 'id' | 'date'>>({
    client: { name: '', email: '' },
    amount: 0,
    status: QuoteStatus.DRAFT,
    items: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formValues);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <Card className="w-full max-w-md p-4">
        <h2 className="text-xl font-semibold mb-4">Create New Quote</h2>
        <form onSubmit={handleSubmit}>
          {/* Form fields implementation */}
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
