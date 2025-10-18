import React from 'react';
import { KPI, Alert } from '../types';

const ExecutiveDashboard: React.FC = () => {
  const kpis: KPI[] = [
    {
      label: 'Winstmarge',
      value: '28%',
      subtitle: 'Deze maand',
      icon: 'fa-chart-line',
      color: 'primary'
    },
    {
      label: 'Crew Bezetting',
      value: '87%',
      subtitle: 'Komende 2 weken',
      icon: 'fa-users',
      color: 'success'
    },
    {
      label: 'Openstaand',
      value: '€45K',
      subtitle: 'Te innen facturen',
      icon: 'fa-euro-sign',
      color: 'warning'
    },
    {
      label: 'Conflicten',
      value: 3,
      subtitle: 'Vereist actie',
      icon: 'fa-exclamation-triangle',
      color: 'destructive'
    }
  ];

  const alerts: Alert[] = [
    {
      id: '1',
      type: 'equipment',
      title: 'Materiaaltekort: LED Schermen',
      description: '5 projecten gepland, slechts 3 sets beschikbaar',
      severity: 'critical',
      action: 'Bekijk Planning'
    },
    {
      id: '2',
      type: 'crew',
      title: 'Dubbele Boeking: Jan de Vries',
      description: 'Ingepland voor 2 projecten op 15 januari',
      severity: 'critical',
      action: 'Los Op'
    },
    {
      id: '3',
      type: 'invoice',
      title: 'Achterstallige Betaling: ACME Inc',
      description: 'Factuur €8.900 meer dan 60 dagen openstaand',
      severity: 'warning',
      action: 'Verstuur Herinnering'
    }
  ];

  const getKPIStyles = (color: string) => {
    const styles = {
      primary: {
        border: 'border-t-blue-500',
        icon: 'text-blue-500'
      },
      success: {
        border: 'border-t-green-500',
        icon: 'text-green-500'
      },
      warning: {
        border: 'border-t-yellow-500',
        icon: 'text-yellow-500'
      },
      destructive: {
        border: 'border-t-red-500',
        icon: 'text-red-500'
      }
    };
    return styles[color as keyof typeof styles];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-12">Executive Dashboard</h1>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        {kpis.map((kpi, index) => {
          const styles = getKPIStyles(kpi.color);
          return (
            <div
              key={index}
              className={`bg-white p-7 min-h-[160px] flex flex-col justify-between border-t-4 ${styles.border} shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <i className={`fas ${kpi.icon} text-2xl ${styles.icon}`}></i>
              </div>
              <div>
                <div className="text-5xl font-bold text-gray-900 mb-1">{kpi.value}</div>
                <div className="text-sm text-gray-500">{kpi.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Critical Alerts */}
      <div className="bg-white p-8 border-l-4 border-red-500 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <i className="fas fa-bell"></i>
          Kritieke Waarschuwingen
        </h2>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-4 py-4 border-b border-gray-200 last:border-b-0"
            >
              <div className="w-10 h-10 bg-red-100 text-red-800 rounded-full flex items-center justify-center flex-shrink-0">
                <i className={`fas ${
                  alert.type === 'equipment' ? 'fa-box-open' :
                  alert.type === 'crew' ? 'fa-user-times' :
                  'fa-file-invoice-dollar'
                } text-lg`}></i>
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-gray-900 mb-1">
                  {alert.title}
                </div>
                <div className="text-sm text-gray-600">{alert.description}</div>
              </div>
              {alert.action && (
                <button className="bg-blue-500 text-white px-4 py-2 text-sm font-semibold rounded-md hover:bg-blue-600 transition-colors whitespace-nowrap">
                  {alert.action}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;

