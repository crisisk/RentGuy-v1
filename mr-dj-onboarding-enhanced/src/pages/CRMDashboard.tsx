import React, { useState } from 'react';

interface Customer {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  totalRevenue: number;
  projectCount: number;
  lastContact: string;
  status: 'active' | 'inactive' | 'lead';
  segment: 'vip' | 'regular' | 'new';
}

interface Activity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'quote' | 'project';
  customer: string;
  description: string;
  date: string;
  outcome?: 'success' | 'pending' | 'failed';
}

const CRMDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSegment, setFilterSegment] = useState<'all' | Customer['segment']>('all');

  const customers: Customer[] = [
    {
      id: '1',
      name: 'Van der Berg Familie',
      email: 'contact@vanderberg.nl',
      phone: '+31 6 12345678',
      totalRevenue: 8500,
      projectCount: 1,
      lastContact: '10 Jan 2025',
      status: 'active',
      segment: 'new'
    },
    {
      id: '2',
      name: 'TechCorp BV',
      company: 'TechCorp BV',
      email: 'events@techcorp.nl',
      phone: '+31 20 1234567',
      totalRevenue: 125600,
      projectCount: 8,
      lastContact: '11 Jan 2025',
      status: 'active',
      segment: 'vip'
    },
    {
      id: '3',
      name: 'Gemeente Utrecht',
      company: 'Gemeente Utrecht',
      email: 'evenementen@utrecht.nl',
      phone: '+31 30 2860000',
      totalRevenue: 342000,
      projectCount: 15,
      lastContact: '8 Jan 2025',
      status: 'active',
      segment: 'vip'
    },
    {
      id: '4',
      name: 'ACME Inc',
      company: 'ACME Inc',
      email: 'info@acme.com',
      phone: '+31 10 9876543',
      totalRevenue: 45300,
      projectCount: 4,
      lastContact: '5 Jan 2025',
      status: 'active',
      segment: 'regular'
    }
  ];

  const recentActivities: Activity[] = [
    {
      id: '1',
      type: 'quote',
      customer: 'Van der Berg Familie',
      description: 'Offerte verzonden voor bruiloft (€8.500)',
      date: '10 Jan 2025, 14:30',
      outcome: 'pending'
    },
    {
      id: '2',
      type: 'call',
      customer: 'TechCorp BV',
      description: 'Telefonisch contact over corporate event',
      date: '11 Jan 2025, 10:15',
      outcome: 'success'
    },
    {
      id: '3',
      type: 'meeting',
      customer: 'Gemeente Utrecht',
      description: 'Locatiebezoek voor festival planning',
      date: '8 Jan 2025, 15:00',
      outcome: 'success'
    },
    {
      id: '4',
      type: 'email',
      customer: 'ACME Inc',
      description: 'Follow-up email verstuurd',
      date: '5 Jan 2025, 09:30',
      outcome: 'pending'
    }
  ];

  const getSegmentBadge = (segment: Customer['segment']) => {
    const badges = {
      vip: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'VIP', icon: 'fa-crown' },
      regular: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Regulier', icon: 'fa-user' },
      new: { bg: 'bg-green-100', text: 'text-green-800', label: 'Nieuw', icon: 'fa-star' }
    };
    return badges[segment];
  };

  const getActivityIcon = (type: Activity['type']) => {
    const icons = {
      email: { icon: 'fa-envelope', color: 'text-blue-500', bg: 'bg-blue-100' },
      call: { icon: 'fa-phone', color: 'text-green-500', bg: 'bg-green-100' },
      meeting: { icon: 'fa-handshake', color: 'text-purple-500', bg: 'bg-purple-100' },
      quote: { icon: 'fa-file-invoice-dollar', color: 'text-yellow-500', bg: 'bg-yellow-100' },
      project: { icon: 'fa-project-diagram', color: 'text-indigo-500', bg: 'bg-indigo-100' }
    };
    return icons[type];
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSegment = filterSegment === 'all' || customer.segment === filterSegment;
    return matchesSearch && matchesSegment;
  });

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalRevenue, 0);
  const vipCustomers = customers.filter(c => c.segment === 'vip').length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900">CRM Dashboard</h1>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            <i className="fas fa-download mr-2"></i>
            Exporteer Contacten
          </button>
          <button className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
            <i className="fas fa-user-plus mr-2"></i>
            Nieuwe Klant
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 border-l-4 border-blue-500 shadow-sm">
          <div className="text-sm font-bold text-gray-500 uppercase mb-2">Totale Omzet</div>
          <div className="text-3xl font-bold text-gray-900">€{totalRevenue.toLocaleString()}</div>
          <div className="text-sm text-gray-600 mt-1">Lifetime value</div>
        </div>
        <div className="bg-white p-6 border-l-4 border-purple-500 shadow-sm">
          <div className="text-sm font-bold text-gray-500 uppercase mb-2">VIP Klanten</div>
          <div className="text-3xl font-bold text-purple-600">{vipCustomers}</div>
          <div className="text-sm text-gray-600 mt-1">Premium segment</div>
        </div>
        <div className="bg-white p-6 border-l-4 border-green-500 shadow-sm">
          <div className="text-sm font-bold text-gray-500 uppercase mb-2">Actieve Klanten</div>
          <div className="text-3xl font-bold text-green-600">{activeCustomers}</div>
          <div className="text-sm text-gray-600 mt-1">Afgelopen 90 dagen</div>
        </div>
        <div className="bg-white p-6 border-l-4 border-yellow-500 shadow-sm">
          <div className="text-sm font-bold text-gray-500 uppercase mb-2">Gemiddelde Waarde</div>
          <div className="text-3xl font-bold text-yellow-600">
            €{Math.round(totalRevenue / customers.length).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 mt-1">Per klant</div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_400px] gap-8">
        {/* Customer List */}
        <div>
          {/* Search & Filter */}
          <div className="bg-white p-4 mb-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3 bg-gray-50 border-2 border-gray-200 px-4 py-2 rounded-lg flex-1 max-w-md">
              <i className="fas fa-search text-gray-400"></i>
              <input
                type="text"
                placeholder="Zoek op naam of email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 outline-none bg-transparent text-sm text-gray-900 placeholder-gray-400"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'vip', 'regular', 'new'] as const).map((segment) => (
                <button
                  key={segment}
                  onClick={() => setFilterSegment(segment)}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    filterSegment === segment
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {segment === 'all' ? 'Alle' :
                   segment === 'vip' ? 'VIP' :
                   segment === 'regular' ? 'Regulier' :
                   'Nieuw'}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Cards */}
          <div className="space-y-4">
            {filteredCustomers.map(customer => {
              const segmentBadge = getSegmentBadge(customer.segment);
              
              return (
                <div
                  key={customer.id}
                  className="bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg mb-1">{customer.name}</div>
                        {customer.company && (
                          <div className="text-sm text-gray-500">{customer.company}</div>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold ${segmentBadge.bg} ${segmentBadge.text}`}>
                      <i className={`fas ${segmentBadge.icon}`}></i>
                      {segmentBadge.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <i className="fas fa-envelope text-gray-400"></i>
                      {customer.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <i className="fas fa-phone text-gray-400"></i>
                      {customer.phone}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Totale Omzet</div>
                      <div className="text-lg font-bold text-gray-900">€{customer.totalRevenue.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Projecten</div>
                      <div className="text-lg font-bold text-gray-900">{customer.projectCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Laatste Contact</div>
                      <div className="text-sm font-semibold text-gray-900">{customer.lastContact}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 shadow-sm h-fit sticky top-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <i className="fas fa-history text-blue-500"></i>
            Recente Activiteit
          </h2>
          <div className="space-y-4">
            {recentActivities.map(activity => {
              const activityIcon = getActivityIcon(activity.type);
              
              return (
                <div key={activity.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                  <div className={`w-10 h-10 ${activityIcon.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <i className={`fas ${activityIcon.icon} ${activityIcon.color}`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm mb-1">
                      {activity.customer}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {activity.description}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">{activity.date}</div>
                      {activity.outcome && (
                        <span className={`text-xs font-semibold ${
                          activity.outcome === 'success' ? 'text-green-600' :
                          activity.outcome === 'pending' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {activity.outcome === 'success' ? '✓ Succesvol' :
                           activity.outcome === 'pending' ? '⏱ In behandeling' :
                           '✗ Mislukt'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRMDashboard;

