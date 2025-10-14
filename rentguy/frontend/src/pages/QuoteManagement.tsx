import React, { useState, useEffect } from 'react';
import { financeAPI } from '../api/finance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFileInvoice, faFilePdf, faTrash, faEdit, faFileAlt } from '@fortawesome/free-solid-svg-icons';

interface Quote {
  id: string;
  titel: string;
  klant: string;
  status: 'concept' | 'verzonden' | 'geaccepteerd' | 'geweigerd';
  aanmaakDatum: string;
  template?: string;
  conversieDatum?: string;
}

interface Template {
  id: string;
  naam: string;
  omschrijving: string;
}

export const QuoteManagement: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const [quotesRes, templatesRes] = await Promise.all([
          financeAPI.getAll('quotes'),
          financeAPI.getAll('templates')
        ]);
        setQuotes(quotesRes);
        setTemplates(templatesRes);
      } catch (err) {
        setError('Fout bij laden van gegevens');
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, []);

  const handleNieuweOfferte = async (templateId: string) => {
    try {
      const newQuote = await financeAPI.createQuote(templateId);
      setQuotes([...quotes, newQuote]);
      setShowTemplateModal(false);
    } catch (err) {
      setError('Fout bij aanmaken offerte');
    }
  };

  const converteerNaarFactuur = async (quoteId: string) => {
    try {
      await financeAPI.convertToInvoice(quoteId);
      setQuotes(quotes.map(q => q.id === quoteId ? {...q, conversieDatum: new Date().toISOString()} : q));
    } catch (err) {
      setError('Conversie naar factuur mislukt');
    }
  };

  const exporteerPDF = async (quoteId: string) => {
    try {
      await financeAPI.exportPdf(quoteId);
    } catch (err) {
      setError('PDF export mislukt');
    }
  };

  const updateStatus = async (quoteId: string, nieuweStatus: Quote['status']) => {
    try {
      await financeAPI.updateStatus(quoteId, nieuweStatus);
      setQuotes(quotes.map(q => q.id === quoteId ? {...q, status: nieuweStatus} : q));
    } catch (err) {
      setError('Status update mislukt');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="mr-dj-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="heading-rentguy mb-8">
          <h1 className="text-3xl font-bold">Offertes Beheer</h1>
        </div>

        {error && (
          <div className="bg-rentguy-destructive text-white p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex justify-between mb-6">
          <button 
            onClick={() => setShowTemplateModal(true)}
            className="btn-rentguy bg-rentguy-primary hover:bg-blue-600 text-white"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Nieuwe offerte
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotes.map((quote) => (
            <div key={quote.id} className="card-rentguy p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-foreground">{quote.titel}</h3>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  quote.status === 'geaccepteerd' ? 'bg-rentguy-success' :
                  quote.status === 'concept' ? 'bg-rentguy-warning' :
                  quote.status === 'verzonden' ? 'bg-rentguy-secondary' :
                  'bg-rentguy-destructive'
                } text-white`}>
                  {quote.status}
                </span>
              </div>
              
              <div className="space-y-2 text-foreground/80">
                <p><strong>Klant:</strong> {quote.klant}</p>
                <p><strong>Aangemaakt:</strong> {new Date(quote.aanmaakDatum).toLocaleDateString()}</p>
                {quote.conversieDatum && (
                  <p><strong>Geconverteerd:</strong> {new Date(quote.conversieDatum).toLocaleDateString()}</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <select
                  value={quote.status}
                  onChange={(e) => updateStatus(quote.id, e.target.value as Quote['status'])}
                  className="input-mr-dj bg-background text-foreground flex-1"
                >
                  {['concept', 'verzonden', 'geaccepteerd', 'geweigerd'].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                
                <button
                  onClick={() => exporteerPDF(quote.id)}
                  className="btn-rentguy bg-rentguy-primary flex items-center"
                >
                  <FontAwesomeIcon icon={faFilePdf} className="mr-2" />
                  PDF
                </button>

                {quote.status === 'geaccepteerd' && (
                  <button
                    onClick={() => converteerNaarFactuur(quote.id)}
                    className="btn-rentguy bg-rentguy-secondary flex items-center"
                  >
                    <FontAwesomeIcon icon={faFileInvoice} className="mr-2" />
                    Factuur
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {showTemplateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="card-rentguy p-6 w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4">Selecteer Template</h2>
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleNieuweOfferte(template.id)}
                    className="cursor-pointer p-4 hover:bg-rentguy-primary/10 rounded-lg border border-rentguy-primary/20"
                  >
                    <FontAwesomeIcon icon={faFileAlt} className="text-rentguy-primary mr-2" />
                    <span className="font-medium">{template.naam}</span>
                    <p className="text-sm text-foreground/60 mt-1">{template.omschrijving}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="btn-rentguy bg-rentguy-destructive mt-4"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};