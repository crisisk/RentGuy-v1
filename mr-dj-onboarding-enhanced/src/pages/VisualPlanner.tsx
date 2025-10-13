import React, { useState } from 'react';

interface CrewResource {
  id: string;
  name: string;
  role: string;
  availability: 'available' | 'limited' | 'unavailable';
}

interface EquipmentResource {
  id: string;
  name: string;
  category: string;
  available: number;
  total: number;
}

interface Booking {
  id: string;
  resourceId: string;
  resourceType: 'crew' | 'equipment';
  projectName: string;
  startDate: string;
  endDate: string;
  status: 'confirmed' | 'tentative' | 'conflict';
}

interface Conflict {
  id: string;
  type: 'double_booking' | 'equipment_shortage' | 'overtime';
  severity: 'critical' | 'warning';
  description: string;
  affectedResources: string[];
}

const VisualPlanner: React.FC = () => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showConflicts, setShowConflicts] = useState(true);

  const crewResources: CrewResource[] = [
    { id: 'c1', name: 'Jan de Vries', role: 'Senior Technicus', availability: 'limited' },
    { id: 'c2', name: 'Lisa Bakker', role: 'Licht Specialist', availability: 'available' },
    { id: 'c3', name: 'Mark Jansen', role: 'Audio Engineer', availability: 'available' },
    { id: 'c4', name: 'Sophie de Jong', role: 'Allround Technicus', availability: 'limited' }
  ];

  const equipmentResources: EquipmentResource[] = [
    { id: 'e1', name: 'LED Schermen 3x2m', category: 'Video', available: 3, total: 8 },
    { id: 'e2', name: 'Line Array Speakers', category: 'Audio', available: 10, total: 12 },
    { id: 'e3', name: 'Moving Heads', category: 'Licht', available: 18, total: 24 }
  ];

  const bookings: Booking[] = [
    {
      id: 'b1',
      resourceId: 'c1',
      resourceType: 'crew',
      projectName: 'Bruiloft Van der Berg',
      startDate: '2025-01-15',
      endDate: '2025-01-15',
      status: 'confirmed'
    },
    {
      id: 'b2',
      resourceId: 'c1',
      resourceType: 'crew',
      projectName: 'Corporate Event TechCorp',
      startDate: '2025-01-15',
      endDate: '2025-01-15',
      status: 'conflict'
    },
    {
      id: 'b3',
      resourceId: 'e1',
      resourceType: 'equipment',
      projectName: 'Festival Zomerfeest',
      startDate: '2025-01-22',
      endDate: '2025-01-23',
      status: 'confirmed'
    }
  ];

  const conflicts: Conflict[] = [
    {
      id: 'cf1',
      type: 'double_booking',
      severity: 'critical',
      description: 'Jan de Vries is dubbel geboekt op 15 januari',
      affectedResources: ['c1']
    },
    {
      id: 'cf2',
      type: 'equipment_shortage',
      severity: 'critical',
      description: 'LED Schermen: 5 projecten gepland, slechts 3 beschikbaar',
      affectedResources: ['e1']
    }
  ];

  const getAvailabilityColor = (availability: string) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      limited: 'bg-yellow-100 text-yellow-800',
      unavailable: 'bg-red-100 text-red-800'
    };
    return colors[availability as keyof typeof colors];
  };

  const getBookingColor = (status: string) => {
    const colors = {
      confirmed: 'bg-blue-500 border-blue-600',
      tentative: 'bg-yellow-500 border-yellow-600',
      conflict: 'bg-red-500 border-red-600'
    };
    return colors[status as keyof typeof colors];
  };

  const weekDays = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - date.getDay() + i + 1);
    return date;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Visuele Planner</h1>
          <p className="text-gray-600">Drag & drop crew en materiaal naar projecten</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            <i className="fas fa-calendar-alt mr-2"></i>
            Vandaag
          </button>
          <div className="flex bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('week')}
              className={`px-5 py-2.5 font-semibold transition-colors ${
                viewMode === 'week' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-5 py-2.5 font-semibold transition-colors ${
                viewMode === 'month' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Maand
            </button>
          </div>
          <button className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
            <i className="fas fa-magic mr-2"></i>
            AI Optimalisatie
          </button>
        </div>
      </div>

      {/* Conflicts Alert */}
      {showConflicts && conflicts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
                <i className="fas fa-exclamation-triangle"></i>
                {conflicts.length} Kritieke Conflicten Gedetecteerd
              </h3>
              <div className="space-y-2">
                {conflicts.map(conflict => (
                  <div key={conflict.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-red-800">{conflict.description}</span>
                    <button className="text-sm font-semibold text-red-600 hover:text-red-700 underline">
                      Los Op
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowConflicts(false)}
              className="text-red-400 hover:text-red-600"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[280px_1fr] gap-6">
        {/* Left Sidebar - Resources */}
        <div className="space-y-6">
          {/* Crew Resources */}
          <div className="bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-users text-blue-500"></i>
              Crew ({crewResources.length})
            </h3>
            <div className="space-y-3">
              {crewResources.map(crew => (
                <div
                  key={crew.id}
                  className="p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-move transition-all"
                  draggable
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 text-sm">{crew.name}</span>
                    <i className="fas fa-grip-vertical text-gray-400"></i>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">{crew.role}</div>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getAvailabilityColor(crew.availability)}`}>
                    {crew.availability === 'available' ? 'Beschikbaar' :
                     crew.availability === 'limited' ? 'Beperkt' :
                     'Niet beschikbaar'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Equipment Resources */}
          <div className="bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-box-open text-blue-500"></i>
              Materiaal ({equipmentResources.length})
            </h3>
            <div className="space-y-3">
              {equipmentResources.map(equipment => (
                <div
                  key={equipment.id}
                  className="p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-move transition-all"
                  draggable
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 text-sm">{equipment.name}</span>
                    <i className="fas fa-grip-vertical text-gray-400"></i>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">{equipment.category}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          equipment.available / equipment.total >= 0.7 ? 'bg-green-500' :
                          equipment.available / equipment.total >= 0.4 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(equipment.available / equipment.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-gray-600">
                      {equipment.available}/{equipment.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="bg-white shadow-sm overflow-x-auto">
          {/* Timeline Header */}
          <div className="grid grid-cols-[200px_repeat(7,1fr)] gap-px bg-gray-200 sticky top-0 z-10">
            <div className="bg-gray-100 p-4 font-bold text-gray-700">Resource</div>
            {dates.map((date, index) => (
              <div key={index} className="bg-gray-100 p-4 text-center">
                <div className="text-xs font-semibold text-gray-600">{weekDays[index]}</div>
                <div className="text-lg font-bold text-gray-900">{date.getDate()}</div>
                <div className="text-xs text-gray-500">
                  {date.toLocaleDateString('nl-NL', { month: 'short' })}
                </div>
              </div>
            ))}
          </div>

          {/* Crew Timeline Rows */}
          {crewResources.map(crew => (
            <div key={crew.id} className="grid grid-cols-[200px_repeat(7,1fr)] gap-px bg-gray-200 border-b border-gray-200">
              <div className="bg-white p-4">
                <div className="font-semibold text-gray-900">{crew.name}</div>
                <div className="text-xs text-gray-500">{crew.role}</div>
              </div>
              {dates.map((date, index) => {
                const dateStr = date.toISOString().split('T')[0];
                const booking = bookings.find(
                  b => b.resourceId === crew.id && b.startDate === dateStr
                );
                
                return (
                  <div
                    key={index}
                    className="bg-white p-2 min-h-[80px] hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-300"
                  >
                    {booking && (
                      <div className={`p-2 rounded text-white text-xs font-semibold shadow-sm ${getBookingColor(booking.status)}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span>{booking.projectName}</span>
                          {booking.status === 'conflict' && (
                            <i className="fas fa-exclamation-triangle"></i>
                          )}
                        </div>
                        <div className="text-[10px] opacity-90">8:00 - 17:00</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Equipment Timeline Rows */}
          {equipmentResources.map(equipment => (
            <div key={equipment.id} className="grid grid-cols-[200px_repeat(7,1fr)] gap-px bg-gray-200 border-b border-gray-200">
              <div className="bg-white p-4">
                <div className="font-semibold text-gray-900">{equipment.name}</div>
                <div className="text-xs text-gray-500">{equipment.available}/{equipment.total} beschikbaar</div>
              </div>
              {dates.map((date, index) => {
                const dateStr = date.toISOString().split('T')[0];
                const booking = bookings.find(
                  b => b.resourceId === equipment.id && b.startDate === dateStr
                );
                
                return (
                  <div
                    key={index}
                    className="bg-white p-2 min-h-[80px] hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-300"
                  >
                    {booking && (
                      <div className={`p-2 rounded text-white text-xs font-semibold shadow-sm ${getBookingColor(booking.status)}`}>
                        {booking.projectName}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Legenda</h3>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Bevestigd</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-600">Voorlopig</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">Conflict</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualPlanner;

