import React, { useState, useEffect } from 'react';
import { crewAPI } from '../api/crew';

interface TimeEntry {
  id: string;
  project: string;
  crew: string;
  hours: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  user: string;
}

export const TimeApproval: React.FC = () => {
  const [data, setData] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [filters, setFilters] = useState<{
    fromDate?: string;
    toDate?: string;
    status?: string;
    crew?: string;
  }>({});
  const [totalHours, setTotalHours] = useState(0);
  const [crews, setCrews] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [filters]);

  useEffect(() => {
    const uniqueCrews = [...new Set(data.map(entry => entry.crew))];
    setCrews(uniqueCrews);
  }, [data]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await crewAPI.getAll(filters);
      setData(result);
      setTotalHours(result.reduce((acc, entry) => acc + entry.hours, 0));
    } catch (error) {
      console.error('Fout bij laden data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (status: 'approved' | 'rejected') => {
    if (!selected.length) return;
    try {
      await crewAPI.updateStatus(selected, status);
      await loadData();
      setSelected([]);
    } catch (error) {
      console.error('Actie mislukt:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <i className="fas fa-spinner fa-spin text-3xl text-primary"></i>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rentguy-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="heading-rentguy text-3xl mb-8">Tijdsregistratie Goedkeuring</h1>

        <div className="card-rentguy p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input
              type="date"
              className="input-mr-dj"
              onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
            />
            <input
              type="date"
              className="input-mr-dj"
              onChange={e => setFilters({ ...filters, toDate: e.target.value })}
            />
            <select
              className="input-mr-dj"
              onChange={e => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Alle statussen</option>
              <option value="pending">In afwachting</option>
              <option value="approved">Goedgekeurd</option>
              <option value="rejected">Afgewezen</option>
            </select>
            <select
              className="input-mr-dj"
              onChange={e => setFilters({ ...filters, crew: e.target.value })}
            >
              <option value="">Alle crews</option>
              {crews.map(crew => (
                <option key={crew} value={crew}>{crew}</option>
              ))}
            </select>
          </div>

          {selected.length > 0 && (
            <div className="flex gap-4 mb-4">
              <button
                className="btn-rentguy bg-rentguy-success hover:bg-green-600"
                onClick={() => handleBulkAction('approved')}
              >
                <i className="fas fa-check mr-2"></i>Goedkeuren ({selected.length})
              </button>
              <button
                className="btn-rentguy bg-rentguy-destructive hover:bg-red-600"
                onClick={() => handleBulkAction('rejected')}
              >
                <i className="fas fa-times mr-2"></i>Afwijzen ({selected.length})
              </button>
            </div>
          )}

          <div className="text-lg font-semibold">
            Totaal uren: {totalHours} uur
          </div>
        </div>

        <div className="card-rentguy overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-rentguy-secondary bg-opacity-10">
                <th className="p-4"></th>
                <th className="p-4 text-left">Datum</th>
                <th className="p-4 text-left">Project</th>
                <th className="p-4 text-left">Crew</th>
                <th className="p-4 text-left">Uren</th>
                <th className="p-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map(entry => (
                <tr key={entry.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(entry.id)}
                      onChange={() => handleSelect(entry.id)}
                      className="form-checkbox h-5 w-5 text-primary"
                    />
                  </td>
                  <td className="p-4">{new Date(entry.date).toLocaleDateString('nl-NL')}</td>
                  <td className="p-4">{entry.project}</td>
                  <td className="p-4">{entry.crew}</td>
                  <td className="p-4">{entry.hours}</td>
                  <td className="p-4">
                    <span className={`inline-block px-3 py-1 rounded-full 
                      ${entry.status === 'approved' ? 'bg-rentguy-success' : 
                       entry.status === 'rejected' ? 'bg-rentguy-destructive' : 
                       'bg-rentguy-warning'} text-white`}>
                      {entry.status === 'approved' ? 'Goedgekeurd' : 
                       entry.status === 'rejected' ? 'Afgewezen' : 'In afwachting'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};