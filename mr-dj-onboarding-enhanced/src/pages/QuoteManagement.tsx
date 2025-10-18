import React, { useState } from 'react';

interface Quote {
  id: string;
  quoteNumber: string;
  client: string;
  eventType: string;
  eventDate: string;
  value: number;
  margin: number;
  createdDate: string;
  expiryDate: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  viewCount: number;
  lastViewed?: string;
}

const QuoteManagement: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<'all' | Quote['status']>('sent');

  const quotes: Quote[] = [
    {
      id: '1',
      quoteNumber: 'OFF-2025-015',
      client: 'Van der Berg Familie',
      eventType: 'Bruiloft',
      eventDate: '15 Jun 2025',
      value: 8500,
      margin: 32,
      createdDate: '10 Jan 2025',
      expiryDate: '24 Jan 2025',
      status: 'viewed',
      viewCount: 3,
      lastViewed: '12 Jan 2025, 14:30'
    },
    {
      id: '2',
      quoteNumber: 'OFF-2025-016',
      client: 'TechCorp BV',
      eventType: 'Corporate Event',
      eventDate: '22 Feb 2025',
      value: 15600,
      margin: 28,
      createdDate: '11 Jan 2025',
      expiryDate: '25 Jan 2025',
      status: 'sent',
      viewCount: 0
    },
    {
      id: '3',
      quoteNumber: 'OFF-2025-014',
      client: 'Gemeente Utrecht',
      eventType: 'Festival',
      eventDate: '5 Jul 2025',
      value: 42000,
      margin: 18,
      createdDate: '8 Jan 2025',
      expiryDate: '22 Jan 2025',
      status: 'accepted',
      viewCount: 5,
      lastViewed: '10 Jan 2025, 09:15'
    },
    {
      id: '4',
      quoteNumber: 'OFF-2025-017',
      client: 'ACME Inc',
      eventType: 'Bedrijfsfeest',
      eventDate: '15 Mar 2025',
      value: 12300,
      margin: 35,
      createdDate: '12 Jan 2025',
      expiryDate: '26 Jan 2025',
      status: 'viewed',
      viewCount: 2,
      lastViewed: '13 Jan 2025, 11:20'
    },
    {
      id: '5',
      quoteNumber: 'DRAFT-2025-003',
      client: 'InnovateTech',
      eventType: 'Conferentie',
      eventDate: '10 Apr 2025',
      value: 28900,
      margin: 26,
      createdDate: '13 Jan 2025',
      expiryDate: '-',
      status: 'draft',
      viewCount: 0
    }
  ];

  const getStatusBadge = (status: Quote['status']) => {
    const badges = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Concept', icon: 'fa-file-alt' },
      sent: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Verzonden', icon: 'fa-paper-plane' },
      viewed: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Bekeken', icon: 'fa-eye' },
      accepted: { bg: 'bg-green-100', text: 'text-green-800', label: 'Geaccepteerd', icon: 'fa-check-circle' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Afgewezen', icon: 'fa-times-circle' },
      expired: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Verlopen', icon: 'fa-clock' }
    };
    return badges[status];
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 30) return 'text-green-600';
    if (margin >= 20) return 'text-blue-600';
    return 'text-yellow-600';
  };

  const filteredQuotes = filterStatus === 'all' 
    ? quotes 
    : quotes.filter(quote => quote.status === filterStatus);

  const totalValue = filteredQuotes.reduce((sum, quote) => sum + quote.value, 0);
  const acceptedValue = quotes.filter(q => q.status === 'accepted').reduce((sum, q) => sum + q.value, 0);
  const pendingValue = quotes.filter(q => ['sent', 'viewed'].includes(q.status)).reduce((sum, q) => sum + q.value, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Offerte Management</h1>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            <i className="fas fa-chart-line mr-2"></i>
            Conversie Analyse
          </button>
          <button className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
            <i className="fas fa-plus mr-2"></i>
            Nieuwe Offerte
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 border-l-4 border-green-500 shadow-sm">
          <div className="text-sm font-bold text-gray-500 uppercase mb-2">Geaccepteerd</div>
          <div className="text-3xl font-bold text-green-600">€{acceptedValue.toLocaleString()}</div>
          <div className="text-sm text-gray-600 mt-1">
            {quotes.filter(q => q.status === 'accepted').length} offertes
          </div>
        </div>
        <div className="bg-white p-6 border-l-4 border-purple-500 shadow-sm">
          <div className="text-sm font-bold text-gray-500 uppercase mb-2">In Behandeling</div>
          <div className="text-3xl font-bold text-purple-600">€{pendingValue.toLocaleString()}</div>
          <div className="text-sm text-gray-600 mt-1">
            {quotes.filter(q => ['sent', 'viewed'].includes(q.status)).length} offertes
          </div>
        </div>
        <div className="bg-white p-6 border-l-4 border-blue-500 shadow-sm">
          <div className="text-sm font-bold text-gray-500 uppercase mb-2">Conversie Ratio</div>
          <div className="text-3xl font-bold text-blue-600">
            {quotes.length > 0 ? Math.round((quotes.filter(q => q.status === 'accepted').length / quotes.length) * 100) : 0}%
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {quotes.filter(q => q.status === 'accepted').length} van {quotes.length}
          </div>
        </div>
        <div className="bg-white p-6 border-l-4 border-yellow-500 shadow-sm">
          <div className="text-sm font-bold text-gray-500 uppercase mb-2">Binnenkort Verlopen</div>
          <div className="text-3xl font-bold text-yellow-600">
            {quotes.filter(q => ['sent', 'viewed'].includes(q.status)).length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Actie vereist</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 mb-6 shadow-sm">
        <div className="flex gap-2">
          {(['all', 'sent', 'viewed', 'accepted', 'rejected', 'draft'] as const).map((status) => (
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
               status === 'sent' ? 'Verzonden' :
               status === 'viewed' ? 'Bekeken' :
               status === 'accepted' ? 'Geaccepteerd' :
               status === 'rejected' ? 'Afgewezen' :
               'Concept'}
              <span className="ml-2 text-xs">
                ({status === 'all' ? quotes.length : quotes.filter(q => q.status === status).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white shadow-sm">
        <div className="grid grid-cols-[1.5fr_2fr_1.5fr_1fr_1fr_1fr_1.2fr] gap-4 px-6 py-4 bg-gray-100 text-sm font-bold text-gray-600 uppercase tracking-wide">
          <div>Offertenummer</div>
          <div>Klant / Evenement</div>
          <div>Datum Evenement</div>
          <div>Waarde</div>
          <div>Marge</div>
          <div>Engagement</div>
          <div>Status</div>
        </div>
        {filteredQuotes.map((quote) => {
          const statusBadge = getStatusBadge(quote.status);
          
          return (
            <div
              key={quote.id}
              className="grid grid-cols-[1.5fr_2fr_1.5fr_1fr_1fr_1fr_1.2fr] gap-4 px-6 py-5 border-b border-gray-200 hover:bg-gray-50 transition-colors items-center"
            >
              <div className="font-semibold text-gray-900">{quote.quoteNumber}</div>
              <div>
                <div className="font-semibold text-gray-900">{quote.client}</div>
                <div className="text-sm text-gray-500">{quote.eventType}</div>
              </div>
              <div className="text-sm text-gray-600">{quote.eventDate}</div>
              <div className="text-lg font-bold text-gray-900">€{quote.value.toLocaleString()}</div>
              <div className={`font-bold ${getMarginColor(quote.margin)}`}>{quote.margin}%</div>
              <div>
                {quote.viewCount > 0 ? (
                  <div className="flex items-center gap-2">
                    <i className="fas fa-eye text-purple-500"></i>
                    <span className="text-sm font-semibold text-gray-900">{quote.viewCount}x</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Niet bekeken</span>
                )}
                {quote.lastViewed && (
                  <div className="text-xs text-gray-500 mt-1">{quote.lastViewed}</div>
                )}
              </div>
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

      {/* Action Bar */}
      <div className="bg-white p-6 mt-6 shadow-sm flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {filteredQuotes.length} offertes weergegeven
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-purple-500 text-white text-sm font-semibold rounded-md hover:bg-purple-600">
            <i className="fas fa-envelope mr-2"></i>
            Verstuur Follow-up
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-md hover:bg-blue-600">
            <i className="fas fa-copy mr-2"></i>
            Dupliceer Offerte
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteManagement;

