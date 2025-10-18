import React, { useState } from 'react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  projectName: string;
  client: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
}

const InvoiceOverview: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<'all' | Invoice['status']>('all');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const invoices: Invoice[] = [
    {
      id: '1',
      invoiceNumber: 'INV-2025-001',
      projectName: 'Bruiloft Van der Berg',
      client: 'Van der Berg Familie',
      amount: 8500,
      issueDate: '15 Jan 2025',
      dueDate: '29 Jan 2025',
      status: 'paid'
    },
    {
      id: '2',
      invoiceNumber: 'INV-2025-002',
      projectName: 'Corporate Event TechCorp',
      client: 'TechCorp BV',
      amount: 15600,
      issueDate: '18 Jan 2025',
      dueDate: '1 Feb 2025',
      status: 'pending'
    },
    {
      id: '3',
      invoiceNumber: 'INV-2024-089',
      projectName: 'Festival Zomerfeest',
      client: 'Gemeente Utrecht',
      amount: 42000,
      issueDate: '15 Dec 2024',
      dueDate: '29 Dec 2024',
      status: 'overdue'
    },
    {
      id: '4',
      invoiceNumber: 'INV-2025-003',
      projectName: 'Bedrijfsfeest ACME Inc',
      client: 'ACME Inc',
      amount: 12300,
      issueDate: '20 Jan 2025',
      dueDate: '3 Feb 2025',
      status: 'pending'
    },
    {
      id: '5',
      invoiceNumber: 'DRAFT-2025-001',
      projectName: 'Conferentie InnovateTech',
      client: 'InnovateTech',
      amount: 28900,
      issueDate: '-',
      dueDate: '-',
      status: 'draft'
    }
  ];

  const getStatusBadge = (status: Invoice['status']) => {
    const badges = {
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Betaald', icon: 'fa-check-circle' },
      pending: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In behandeling', icon: 'fa-clock' },
      overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'Achterstallig', icon: 'fa-exclamation-triangle' },
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Concept', icon: 'fa-file-alt' }
    };
    return badges[status];
  };

  const filteredInvoices = filterStatus === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.status === filterStatus);

  const toggleInvoiceSelection = (id: string) => {
    setSelectedInvoices(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Facturatie Overzicht</h1>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            <i className="fas fa-download mr-2"></i>
            Exporteer naar Exact
          </button>
          <button className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
            <i className="fas fa-plus mr-2"></i>
            Nieuwe Factuur
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 border-l-4 border-green-500 shadow-sm">
          <div className="text-sm font-bold text-gray-500 uppercase mb-2">Totaal Betaald</div>
          <div className="text-3xl font-bold text-green-600">€{paidAmount.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 border-l-4 border-blue-500 shadow-sm">
          <div className="text-sm font-bold text-gray-500 uppercase mb-2">In Behandeling</div>
          <div className="text-3xl font-bold text-blue-600">
            €{invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 border-l-4 border-red-500 shadow-sm">
          <div className="text-sm font-bold text-gray-500 uppercase mb-2">Achterstallig</div>
          <div className="text-3xl font-bold text-red-600">€{overdueAmount.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 mb-6 shadow-sm flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'pending', 'paid', 'overdue', 'draft'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                filterStatus === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Alle' :
               status === 'pending' ? 'In behandeling' :
               status === 'paid' ? 'Betaald' :
               status === 'overdue' ? 'Achterstallig' :
               'Concept'}
              <span className="ml-2 text-xs">
                ({status === 'all' ? invoices.length : invoices.filter(inv => inv.status === status).length})
              </span>
            </button>
          ))}
        </div>
        {selectedInvoices.length > 0 && (
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-md hover:bg-green-600">
              <i className="fas fa-check mr-2"></i>
              Markeer als Betaald ({selectedInvoices.length})
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-md hover:bg-blue-600">
              <i className="fas fa-envelope mr-2"></i>
              Verstuur Herinnering ({selectedInvoices.length})
            </button>
          </div>
        )}
      </div>

      {/* Invoice Table */}
      <div className="bg-white shadow-sm">
        <div className="grid grid-cols-[50px_1.5fr_2fr_1.5fr_1fr_1fr_1.2fr] gap-4 px-6 py-4 bg-gray-100 text-sm font-bold text-gray-600 uppercase tracking-wide">
          <div></div>
          <div>Factuurnummer</div>
          <div>Project / Klant</div>
          <div>Bedrag</div>
          <div>Uitgiftedatum</div>
          <div>Vervaldatum</div>
          <div>Status</div>
        </div>
        {filteredInvoices.map((invoice) => {
          const statusBadge = getStatusBadge(invoice.status);
          const isSelected = selectedInvoices.includes(invoice.id);
          
          return (
            <div
              key={invoice.id}
              className={`grid grid-cols-[50px_1.5fr_2fr_1.5fr_1fr_1fr_1.2fr] gap-4 px-6 py-5 border-b border-gray-200 items-center transition-colors ${
                isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleInvoiceSelection(invoice.id)}
                  className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <div className="font-semibold text-gray-900">{invoice.invoiceNumber}</div>
              <div>
                <div className="font-semibold text-gray-900">{invoice.projectName}</div>
                <div className="text-sm text-gray-500">{invoice.client}</div>
              </div>
              <div className="text-lg font-bold text-gray-900">€{invoice.amount.toLocaleString()}</div>
              <div className="text-sm text-gray-600">{invoice.issueDate}</div>
              <div className="text-sm text-gray-600">{invoice.dueDate}</div>
              <div>
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                  <i className={`fas ${statusBadge.icon}`}></i>
                  {statusBadge.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-white p-6 mt-6 shadow-sm flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {filteredInvoices.length} facturen weergegeven
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 mb-1">Totaal bedrag</div>
          <div className="text-2xl font-bold text-gray-900">€{totalAmount.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceOverview;

