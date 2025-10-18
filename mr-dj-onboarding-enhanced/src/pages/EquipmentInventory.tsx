import React from 'react';
import { Equipment, MaintenanceTask } from '../types';

const EquipmentInventory: React.FC = () => {
  const equipment: Equipment[] = [
    {
      id: '1',
      name: 'LED Schermen 3x2m',
      category: 'video',
      total: 8,
      available: 3,
      status: 'limited',
      icon: 'fa-tv'
    },
    {
      id: '2',
      name: 'Line Array Speakers',
      category: 'audio',
      total: 12,
      available: 10,
      status: 'available',
      icon: 'fa-volume-up'
    },
    {
      id: '3',
      name: 'Moving Heads',
      category: 'lighting',
      total: 24,
      available: 18,
      status: 'available',
      icon: 'fa-lightbulb'
    },
    {
      id: '4',
      name: 'Draadloze Microfoons',
      category: 'audio',
      total: 16,
      available: 4,
      status: 'critical',
      icon: 'fa-microphone'
    },
    {
      id: '5',
      name: 'Mengpanelen',
      category: 'audio',
      total: 6,
      available: 6,
      status: 'available',
      icon: 'fa-sliders-h'
    }
  ];

  const maintenanceTasks: MaintenanceTask[] = [
    {
      id: '1',
      equipmentName: 'LED Schermen',
      scheduledDate: '20 Jan',
      type: 'routine'
    },
    {
      id: '2',
      equipmentName: 'Line Array Speakers',
      scheduledDate: '25 Jan',
      type: 'routine'
    },
    {
      id: '3',
      equipmentName: 'Moving Heads',
      scheduledDate: '28 Jan',
      type: 'inspection'
    }
  ];

  const getStatusBadge = (status: Equipment['status']) => {
    const badges = {
      available: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Beschikbaar',
        icon: 'fa-check-circle'
      },
      limited: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'Beperkt',
        icon: 'fa-exclamation-circle'
      },
      critical: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Kritiek',
        icon: 'fa-times-circle'
      }
    };
    return badges[status];
  };

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage >= 70) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (percentage >= 40) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-12">Materiaal & Inventaris</h1>

      <div className="flex gap-12">
        {/* Inventory List */}
        <div className="flex-[1.2]">
          <div className="bg-white shadow-sm">
            <div className="grid grid-cols-[2fr_1fr_1fr_1.2fr] gap-6 px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-700 text-sm font-bold text-white uppercase tracking-wide">
              <div>Materiaal</div>
              <div>Totaal</div>
              <div>Beschikbaar</div>
              <div>Status</div>
            </div>
            {equipment.map((item) => {
              const availabilityPercentage = (item.available / item.total) * 100;
              const statusBadge = getStatusBadge(item.status);
              
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1.2fr] gap-6 px-6 py-5 border-b border-gray-200 hover:bg-blue-50 transition-colors items-center"
                >
                  {/* Equipment Name */}
                  <div className="flex items-center gap-3 font-semibold text-gray-900">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-lg shadow-md">
                      <i className={`fas ${item.icon}`}></i>
                    </div>
                    {item.name}
                  </div>

                  {/* Total */}
                  <div className="text-base font-bold text-gray-900">{item.total} stuks</div>

                  {/* Availability */}
                  <div className="flex flex-col gap-1">
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full ${getAvailabilityColor(item.available, item.total)}`}
                        style={{ width: `${availabilityPercentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs font-semibold text-gray-600">
                      {item.available} van {item.total} beschikbaar
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                      <i className={`fas ${statusBadge.icon} text-[10px]`}></i>
                      {statusBadge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insights Panel */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Utilization Chart */}
          <div className="bg-white p-8 border-l-4 border-blue-500 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
                <i className="fas fa-chart-pie"></i>
              </div>
              Bezettingsgraad
            </h3>
            <div className="flex items-center justify-center py-6">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="12"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#007AFF"
                    strokeWidth="12"
                    strokeDasharray={`${68 * 2.51} ${100 * 2.51}`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-blue-500">68%</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mt-4">
              Gemiddelde bezetting van alle materiaal voor de komende 30 dagen. Optimale bezetting ligt tussen 60-80%.
            </p>
          </div>

          {/* Maintenance Schedule */}
          <div className="bg-white p-8 border-l-4 border-yellow-500 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center text-white">
                <i className="fas fa-tools"></i>
              </div>
              Onderhoud Gepland
            </h3>
            <div className="space-y-3">
              {maintenanceTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border-l-3 border-yellow-500"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <i className="fas fa-wrench text-yellow-500"></i>
                    {task.equipmentName}
                  </span>
                  <span className="text-sm font-bold text-yellow-800 bg-white px-3 py-1 rounded">
                    {task.scheduledDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentInventory;

