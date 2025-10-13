import React, { useState } from 'react';

interface TimeEntry {
  id: string;
  crewMember: string;
  role: string;
  project: string;
  date: string;
  plannedHours: number;
  actualHours: number;
  deviation: number;
  status: 'approved' | 'pending' | 'rejected';
  notes?: string;
}

const TimeApproval: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<'all' | TimeEntry['status']>('pending');
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  const timeEntries: TimeEntry[] = [
    {
      id: '1',
      crewMember: 'Jan de Vries',
      role: 'Senior Technicus',
      project: 'Bruiloft Van der Berg',
      date: '15 Jan 2025',
      plannedHours: 8,
      actualHours: 9.5,
      deviation: 1.5,
      status: 'pending',
      notes: 'Extra tijd nodig voor setup'
    },
    {
      id: '2',
      crewMember: 'Lisa Bakker',
      role: 'Licht Specialist',
      project: 'Corporate Event TechCorp',
      date: '18 Jan 2025',
      plannedHours: 10,
      actualHours: 10,
      deviation: 0,
      status: 'approved'
    },
    {
      id: '3',
      crewMember: 'Mark Jansen',
      role: 'Audio Engineer',
      project: 'Festival Zomerfeest',
      date: '22 Jan 2025',
      plannedHours: 12,
      actualHours: 15,
      deviation: 3,
      status: 'pending',
      notes: 'Technische problemen tijdens soundcheck'
    },
    {
      id: '4',
      crewMember: 'Sophie de Jong',
      role: 'Allround Technicus',
      project: 'Bedrijfsfeest ACME Inc',
      date: '25 Jan 2025',
      plannedHours: 6,
      actualHours: 5.5,
      deviation: -0.5,
      status: 'approved'
    },
    {
      id: '5',
      crewMember: 'Jan de Vries',
      role: 'Senior Technicus',
      project: 'Conferentie InnovateTech',
      date: '28 Jan 2025',
      plannedHours: 8,
      actualHours: 12,
      deviation: 4,
      status: 'rejected',
      notes: 'Afwijking te groot zonder goedkeuring'
    }
  ];

  const getStatusBadge = (status: TimeEntry['status']) => {
    const badges = {
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Goedgekeurd', icon: 'fa-check-circle' },
      pending: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In behandeling', icon: 'fa-clock' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Afgekeurd', icon: 'fa-times-circle' }
    };
    return badges[status];
  };

  const getDeviationColor = (deviation: number) => {
    if (deviation === 0) return 'text-green-600';
    if (Math.abs(deviation) <= 1) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredEntries = filterStatus === 'all' 
    ? timeEntries 
    : timeEntries.filter(entry => entry.status === filterStatus);

  const toggleEntrySelection = (id: string) => {
    setSelectedEntries(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const totalPlannedHours = filteredEntries.reduce((sum, entry) => sum + entry.plannedHours, 0);
  const totalActualHours = filteredEntries.reduce((sum, entry) => sum + entry.actualHours, 0);
  const totalDeviation = totalActualHours - totalPlannedHours;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Urenregistratie Goedkeuring</h1>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            <i className="fas fa-download mr-2"></i>
            Exporteer naar AFAS
          </button>
          <button className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
            <i className="fas fa-file-export mr-2"></i>
            Genereer Salarisrapport
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 border-l-4 border-blue-500 shadow-sm">
          <div className="text-sm font-bold text-gray-500 uppercase mb-2">Gepland</div>
          <div className="text-3xl font-bold text-gray-900">{totalPlannedHours}u</div>
        </div>
        <div className="bg-white p-6 border-l-4 border-green-500 shadow-sm">
          <div className="text-sm font-bold text-gray-500 uppercase mb-2">Werkelijk</div>
          <div className="text-3xl font-bold text-gray-900">{totalActualHours}u</div>
        </div>
        <div className={`bg-white p-6 border-l-4 ${totalDeviation >= 0 ? 'border-yellow-500' : 'border-green-500'} shadow-sm`}>
          <div className="text-sm font-bold text-gray-500 uppercase mb-2">Afwijking</div>
          <div className={`text-3xl font-bold ${totalDeviation >= 0 ? 'text-yellow-600' : 'text-green-600'}`}>
            {totalDeviation > 0 ? '+' : ''}{totalDeviation}u
          </div>
        </div>
        <div className="bg-white p-6 border-l-4 border-blue-500 shadow-sm">
          <div className="text-sm font-bold text-gray-500 uppercase mb-2">Te Beoordelen</div>
          <div className="text-3xl font-bold text-blue-600">
            {timeEntries.filter(e => e.status === 'pending').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 mb-6 shadow-sm flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
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
               status === 'approved' ? 'Goedgekeurd' :
               'Afgekeurd'}
              <span className="ml-2 text-xs">
                ({status === 'all' ? timeEntries.length : timeEntries.filter(e => e.status === status).length})
              </span>
            </button>
          ))}
        </div>
        {selectedEntries.length > 0 && (
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-md hover:bg-green-600">
              <i className="fas fa-check mr-2"></i>
              Keur Goed ({selectedEntries.length})
            </button>
            <button className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-md hover:bg-red-600">
              <i className="fas fa-times mr-2"></i>
              Keur Af ({selectedEntries.length})
            </button>
          </div>
        )}
      </div>

      {/* Time Entries Table */}
      <div className="bg-white shadow-sm">
        <div className="grid grid-cols-[50px_2fr_2fr_1fr_1fr_1fr_1fr_1.2fr] gap-4 px-6 py-4 bg-gray-100 text-sm font-bold text-gray-600 uppercase tracking-wide">
          <div></div>
          <div>Crew Lid</div>
          <div>Project</div>
          <div>Datum</div>
          <div>Gepland</div>
          <div>Werkelijk</div>
          <div>Afwijking</div>
          <div>Status</div>
        </div>
        {filteredEntries.map((entry) => {
          const statusBadge = getStatusBadge(entry.status);
          const isSelected = selectedEntries.includes(entry.id);
          
          return (
            <div key={entry.id}>
              <div
                className={`grid grid-cols-[50px_2fr_2fr_1fr_1fr_1fr_1fr_1.2fr] gap-4 px-6 py-5 border-b border-gray-200 items-center transition-colors ${
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleEntrySelection(entry.id)}
                    disabled={entry.status !== 'pending'}
                    className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{entry.crewMember}</div>
                  <div className="text-sm text-gray-500">{entry.role}</div>
                </div>
                <div className="font-medium text-gray-900">{entry.project}</div>
                <div className="text-sm text-gray-600">{entry.date}</div>
                <div className="text-gray-900 font-semibold">{entry.plannedHours}u</div>
                <div className="text-gray-900 font-bold">{entry.actualHours}u</div>
                <div className={`font-bold ${getDeviationColor(entry.deviation)}`}>
                  {entry.deviation > 0 ? '+' : ''}{entry.deviation}u
                </div>
                <div>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                    <i className={`fas ${statusBadge.icon}`}></i>
                    {statusBadge.label}
                  </span>
                </div>
              </div>
              {entry.notes && (
                <div className="px-6 py-3 bg-yellow-50 border-b border-gray-200 text-sm text-gray-700">
                  <i className="fas fa-sticky-note text-yellow-600 mr-2"></i>
                  <strong>Notitie:</strong> {entry.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimeApproval;

