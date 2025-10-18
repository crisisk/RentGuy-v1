import React, { useState } from 'react';

interface CustomerInfo {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  address: string;
  segment: 'vip' | 'regular' | 'new';
  status: 'active' | 'inactive';
  since: string;
}

interface ProjectHistory {
  id: string;
  name: string;
  date: string;
  value: number;
  status: 'completed' | 'active' | 'cancelled';
}

interface Communication {
  id: string;
  type: 'email' | 'call' | 'meeting';
  subject: string;
  date: string;
  notes: string;
}

interface Document {
  id: string;
  name: string;
  type: 'contract' | 'invoice' | 'quote';
  date: string;
  size: string;
}

const CustomerDetails: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'communication' | 'documents'>('overview');

  const customer: CustomerInfo = {
    id: '2',
    name: 'TechCorp BV',
    company: 'TechCorp BV',
    email: 'events@techcorp.nl',
    phone: '+31 20 1234567',
    address: 'Hoofdstraat 123, 1012 AB Amsterdam',
    segment: 'vip',
    status: 'active',
    since: '15 Mrt 2022'
  };

  const projectHistory: ProjectHistory[] = [
    {
      id: '1',
      name: 'Corporate Event 2025',
      date: '18 Jan 2025',
      value: 15600,
      status: 'active'
    },
    {
      id: '2',
      name: 'Kerstborrel 2024',
      date: '20 Dec 2024',
      value: 8900,
      status: 'completed'
    },
    {
      id: '3',
      name: 'Zomer BBQ 2024',
      date: '15 Jul 2024',
      value: 12400,
      status: 'completed'
    },
    {
      id: '4',
      name: 'Teambuilding Event',
      date: '10 Apr 2024',
      value: 18700,
      status: 'completed'
    }
  ];

  const communications: Communication[] = [
    {
      id: '1',
      type: 'call',
      subject: 'Bespreking Corporate Event 2025',
      date: '11 Jan 2025, 10:15',
      notes: 'Klant wil graag LED schermen en professionele audio setup. Budget €15-20K.'
    },
    {
      id: '2',
      type: 'email',
      subject: 'Offerte Corporate Event verzonden',
      date: '12 Jan 2025, 14:30',
      notes: 'Offerte van €15.600 verzonden. Wachten op goedkeuring.'
    },
    {
      id: '3',
      type: 'meeting',
      subject: 'Evaluatie Kerstborrel 2024',
      date: '8 Jan 2025, 15:00',
      notes: 'Zeer tevreden over de service. Willen graag volgend jaar weer samenwerken.'
    }
  ];

  const documents: Document[] = [
    {
      id: '1',
      name: 'Offerte Corporate Event 2025.pdf',
      type: 'quote',
      date: '12 Jan 2025',
      size: '245 KB'
    },
    {
      id: '2',
      name: 'Factuur Kerstborrel 2024.pdf',
      type: 'invoice',
      date: '20 Dec 2024',
      size: '189 KB'
    },
    {
      id: '3',
      name: 'Contract 2024-2025.pdf',
      type: 'contract',
      date: '15 Mrt 2024',
      size: '512 KB'
    }
  ];

  const getStatusBadge = (status: ProjectHistory['status']) => {
    const badges = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Afgerond' },
      active: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Actief' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Geannuleerd' }
    };
    return badges[status];
  };

  const getCommunicationIcon = (type: Communication['type']) => {
    const icons = {
      email: { icon: 'fa-envelope', color: 'text-blue-500', bg: 'bg-blue-100' },
      call: { icon: 'fa-phone', color: 'text-green-500', bg: 'bg-green-100' },
      meeting: { icon: 'fa-handshake', color: 'text-purple-500', bg: 'bg-purple-100' }
    };
    return icons[type];
  };

  const getDocumentIcon = (type: Document['type']) => {
    const icons = {
      contract: { icon: 'fa-file-contract', color: 'text-purple-500' },
      invoice: { icon: 'fa-file-invoice-dollar', color: 'text-green-500' },
      quote: { icon: 'fa-file-alt', color: 'text-blue-500' }
    };
    return icons[type];
  };

  const totalRevenue = projectHistory.reduce((sum, p) => sum + p.value, 0);
  const completedProjects = projectHistory.filter(p => p.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="bg-white p-8 shadow-sm mb-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-3xl">
              {customer.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{customer.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <i className="fas fa-envelope"></i>
                  {customer.email}
                </span>
                <span className="flex items-center gap-2">
                  <i className="fas fa-phone"></i>
                  {customer.phone}
                </span>
                <span className="flex items-center gap-2">
                  <i className="fas fa-map-marker-alt"></i>
                  {customer.address}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
              <i className="fas fa-edit mr-2"></i>
              Bewerk
            </button>
            <button className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
              <i className="fas fa-plus mr-2"></i>
              Nieuw Project
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-6 mt-8 pt-8 border-t border-gray-200">
          <div>
            <div className="text-sm text-gray-500 mb-1">Totale Omzet</div>
            <div className="text-2xl font-bold text-gray-900">€{totalRevenue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Projecten</div>
            <div className="text-2xl font-bold text-gray-900">{projectHistory.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Klant Sinds</div>
            <div className="text-2xl font-bold text-gray-900">{customer.since}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Segment</div>
            <div>
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm font-semibold ${
                customer.segment === 'vip' ? 'bg-purple-100 text-purple-800' :
                customer.segment === 'regular' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                <i className={`fas ${customer.segment === 'vip' ? 'fa-crown' : customer.segment === 'regular' ? 'fa-user' : 'fa-star'}`}></i>
                {customer.segment === 'vip' ? 'VIP' : customer.segment === 'regular' ? 'Regulier' : 'Nieuw'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm mb-8">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overzicht', icon: 'fa-chart-line' },
            { id: 'projects', label: 'Projecten', icon: 'fa-project-diagram' },
            { id: 'communication', label: 'Communicatie', icon: 'fa-comments' },
            { id: 'documents', label: 'Documenten', icon: 'fa-folder-open' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-8 py-4 font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-8 shadow-sm">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Klant Overzicht</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Omzet per Maand</h3>
                <div className="space-y-3">
                  {[
                    { month: 'Jan 2025', amount: 15600 },
                    { month: 'Dec 2024', amount: 8900 },
                    { month: 'Jul 2024', amount: 12400 },
                    { month: 'Apr 2024', amount: 18700 }
                  ].map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">{data.month}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                            style={{ width: `${(data.amount / 20000) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-20 text-right">
                          €{(data.amount / 1000).toFixed(1)}K
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Klant Notities</h3>
                <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <strong>Voorkeuren:</strong> Professionele audio en LED schermen. Altijd op tijd betalen.
                    Zeer tevreden over de service. Potentieel voor jaarcontract.
                  </p>
                </div>
                <button className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700">
                  <i className="fas fa-edit mr-2"></i>
                  Notitie Bewerken
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Geschiedenis</h2>
            <div className="space-y-4">
              {projectHistory.map(project => {
                const statusBadge = getStatusBadge(project.status);
                
                return (
                  <div key={project.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
                        <i className="fas fa-project-diagram"></i>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-lg">{project.name}</div>
                        <div className="text-sm text-gray-500">{project.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">€{project.value.toLocaleString()}</div>
                      </div>
                      <span className={`inline-block px-4 py-2 rounded text-sm font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'communication' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Communicatie Geschiedenis</h2>
            <div className="space-y-6">
              {communications.map(comm => {
                const commIcon = getCommunicationIcon(comm.type);
                
                return (
                  <div key={comm.id} className="flex gap-4 pb-6 border-b border-gray-200 last:border-b-0">
                    <div className={`w-12 h-12 ${commIcon.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <i className={`fas ${commIcon.icon} ${commIcon.color} text-lg`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-gray-900 text-lg">{comm.subject}</div>
                        <div className="text-sm text-gray-500">{comm.date}</div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{comm.notes}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="mt-6 px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
              <i className="fas fa-plus mr-2"></i>
              Nieuwe Communicatie Toevoegen
            </button>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Documenten</h2>
            <div className="space-y-3">
              {documents.map(doc => {
                const docIcon = getDocumentIcon(doc.type);
                
                return (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <i className={`fas ${docIcon.icon} ${docIcon.color} text-xl`}></i>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{doc.name}</div>
                        <div className="text-sm text-gray-500">{doc.date} • {doc.size}</div>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-md hover:bg-blue-600 transition-colors">
                      <i className="fas fa-download mr-2"></i>
                      Download
                    </button>
                  </div>
                );
              })}
            </div>
            <button className="mt-6 px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
              <i className="fas fa-upload mr-2"></i>
              Document Uploaden
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetails;

