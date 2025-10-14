import React, { useState, useEffect } from 'react';
import { financeAPI } from '../api/finance';

interface Invoice {
  id: string;
  klantNaam: string;
  bedrag: number;
  status: 'concept' | 'verzonden' | 'betaald' | 'verlopen';
  vervalDatum: string;
  betaaldDatum?: string;
}

export const InvoiceOverview: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    status: 'concept'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await financeAPI.getAll();
      setInvoices(result);
    } catch (error) {
      console.error('Fout bij laden facturen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeAPI.create(newInvoice);
      setShowCreateForm(false);
      await loadData();
    } catch (error) {
      console.error('Fout bij aanmaken factuur:', error);
    }
  };

  const handleSendEmail = async (id: string) => {
    try {
      await financeAPI.sendEmail(id);
      await loadData();
    } catch (error) {
      console.error('Fout bij verzenden email:', error);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await financeAPI.markPaid(id);
      await loadData();
    } catch (error) {
      console.error('Fout bij markeren als betaald:', error);
    }
  };

  const handleExportPDF = async (id: string) => {
    try {
      await financeAPI.exportPDF(id);
    } catch (error) {
      console.error('Fout bij exporteren PDF:', error);
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
        <div className="card-rentguy p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="heading-rentguy text-2xl">Facturenoverzicht</h1>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-rentguy bg-rentguy-primary"
            >
              <i className="fas fa-plus mr-2"></i>
              Nieuwe Factuur
            </button>
          </div>

          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="card-rentguy p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Nieuwe Factuur Aanmaken</h3>
                <form onSubmit={handleCreateInvoice}>
                  <input
                    className="input-mr-dj w-full mb-4"
                    placeholder="Klantnaam"
                    required
                    onChange={(e) => setNewInvoice({...newInvoice, klantNaam: e.target.value})}
                  />
                  <input
                    type="number"
                    className="input-mr-dj w-full mb-4"
                    placeholder="Bedrag"
                    required
                    onChange={(e) => setNewInvoice({...newInvoice, bedrag: Number(e.target.value)})}
                  />
                  <input
                    type="date"
                    className="input-mr-dj w-full mb-4"
                    required
                    onChange={(e) => setNewInvoice({...newInvoice, vervalDatum: e.target.value})}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="btn-rentguy bg-rentguy-secondary"
                    >
                      Annuleren
                    </button>
                    <button
                      type="submit"
                      className="btn-rentguy bg-rentguy-primary"
                    >
                      Opslaan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="card-rentguy p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-foreground">{invoice.klantNaam}</h3>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    invoice.status === 'betaald' ? 'bg-rentguy-success' :
                    invoice.status === 'verlopen' ? 'bg-rentguy-warning' :
                    invoice.status === 'concept' ? 'bg-rentguy-secondary' :
                    'bg-rentguy-primary'
                  } text-white`}>
                    {invoice.status}
                  </span>
                </div>
                <p className="text-foreground mb-2">€{invoice.bedrag.toFixed(2)}</p>
                <p className="text-sm text-foreground/80 mb-4">
                  Vervaldatum: {new Date(invoice.vervalDatum).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSendEmail(invoice.id)}
                    className="btn-rentguy bg-rentguy-primary flex-1"
                    disabled={invoice.status === 'betaald'}
                  >
                    <i className="fas fa-envelope mr-2"></i>
                    Versturen
                  </button>
                  <button
                    onClick={() => handleMarkPaid(invoice.id)}
                    className="btn-rentguy bg-rentguy-success flex-1"
                    disabled={invoice.status === 'betaald'}
                  >
                    <i className="fas fa-check mr-2"></i>
                  </button>
                  <button
                    onClick={() => handleExportPDF(invoice.id)}
                    className="btn-rentguy bg-rentguy-secondary"
                  >
                    <i className="fas fa-file-pdf"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};