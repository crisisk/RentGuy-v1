import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../api/reports';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faFileExport, faMagic, faClock, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
}

interface ReportSchedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  lastRun: string;
}

interface ExportFormat {
  type: 'excel' | 'pdf';
  size: string;
}

export const ReportsAnalytics: React.FC = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [exportData, setExportData] = useState<ExportFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const [tpls, sch, exp] = await Promise.all([
          reportsAPI.getTemplates(),
          reportsAPI.getSchedules(),
          reportsAPI.getExportFormats()
        ]);
        setTemplates(tpls);
        setSchedules(sch);
        setExportData(exp);
      } catch (err) {
        setError('Fout bij laden van rapportgegevens');
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, []);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation for schedule creation
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-destructive text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="heading-rentguy text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Rapportage Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card-rentguy p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              <FontAwesomeIcon icon={faChartLine} className="mr-2 text-secondary" />
              Snelle Analyses
            </h2>
            <div className="bg-rentguy-secondary h-32 rounded-lg mb-4"></div>
            <button className="btn-rentguy bg-primary hover:bg-primary-dark w-full">
              Analyse Maken
            </button>
          </div>

          <div className="card-rentguy p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              <FontAwesomeIcon icon={faMagic} className="mr-2 text-warning" />
              Rapportbouwer
            </h2>
            <div className="space-y-3">
              <input className="input-mr-dj w-full" placeholder="Rapportnaam" />
              <select className="input-mr-dj w-full">
                <option>Selecteer sjabloon</option>
                {templates.map(tpl => (
                  <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                ))}
              </select>
              <button className="btn-rentguy bg-secondary hover:bg-secondary-dark w-full">
                Aanpassen
              </button>
            </div>
          </div>

          <div className="card-rentguy p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              <FontAwesomeIcon icon={faFileExport} className="mr-2 text-success" />
              Exporteer Gegevens
            </h2>
            <div className="space-y-3">
              {exportData.map(format => (
                <button key={format.type} className={`btn-rentguy w-full ${
                  format.type === 'excel' ? 'bg-success hover:bg-success-dark' : 'bg-destructive hover:bg-destructive-dark'
                }`}>
                  {format.type.toUpperCase()} ({format.size})
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card-rentguy p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            <FontAwesomeIcon icon={faClock} className="mr-2 text-primary" />
            Geplande Rapporten
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map(schedule => (
              <div key={schedule.id} className="bg-rentguy-primary p-4 rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-white">{schedule.name}</h3>
                  <p className="text-sm text-white opacity-90">{schedule.frequency} • Laatste run: {schedule.lastRun}</p>
                </div>
                <button className="btn-rentguy bg-background text-foreground hover:bg-gray-100">
                  Bewerken
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleScheduleSubmit} className="mt-6 space-y-3">
            <div className="flex gap-3">
              <input className="input-mr-dj flex-1" placeholder="Nieuw schema naam" />
              <select className="input-mr-dj flex-1">
                <option value="daily">Dagelijks</option>
                <option value="weekly">Wekelijks</option>
                <option value="monthly">Maandelijks</option>
              </select>
            </div>
            <button type="submit" className="btn-rentguy bg-warning hover:bg-warning-dark w-full">
              Schema Toevoegen
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};