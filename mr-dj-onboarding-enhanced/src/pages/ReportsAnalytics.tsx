import React, { useState } from 'react';

interface ReportMetric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down';
}

interface ChartData {
  label: string;
  value: number;
  color: string;
}

const ReportsAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedReport, setSelectedReport] = useState<'overview' | 'revenue' | 'crew' | 'equipment'>('overview');

  const metrics: ReportMetric[] = [
    { label: 'Totale Omzet', value: '€342.500', change: 12.5, trend: 'up' },
    { label: 'Gemiddelde Projectwaarde', value: '€14.270', change: 8.3, trend: 'up' },
    { label: 'Winstmarge', value: '28%', change: -2.1, trend: 'down' },
    { label: 'Crew Bezetting', value: '87%', change: 5.7, trend: 'up' },
    { label: 'Materiaal Bezetting', value: '68%', change: 3.2, trend: 'up' },
    { label: 'Klanttevredenheid', value: '9.2', change: 0.4, trend: 'up' }
  ];

  const revenueByCategory: ChartData[] = [
    { label: 'Corporate Events', value: 145000, color: '#007AFF' },
    { label: 'Bruiloften', value: 98000, color: '#5856D6' },
    { label: 'Festivals', value: 72000, color: '#34C759' },
    { label: 'Overig', value: 27500, color: '#FF9500' }
  ];

  const crewPerformance = [
    { name: 'Jan de Vries', projects: 12, hours: 156, rating: 9.5, revenue: 42000 },
    { name: 'Lisa Bakker', projects: 15, hours: 180, rating: 9.2, revenue: 38500 },
    { name: 'Mark Jansen', projects: 10, hours: 142, rating: 9.7, revenue: 45200 },
    { name: 'Sophie de Jong', projects: 18, hours: 198, rating: 8.9, revenue: 36800 }
  ];

  const equipmentUtilization = [
    { name: 'LED Schermen', utilization: 85, revenue: 52000, bookings: 24 },
    { name: 'Line Array Speakers', utilization: 72, revenue: 38000, bookings: 18 },
    { name: 'Moving Heads', utilization: 68, revenue: 28500, bookings: 15 },
    { name: 'Draadloze Microfoons', utilization: 91, revenue: 15200, bookings: 32 }
  ];

  const totalRevenue = revenueByCategory.reduce((sum, cat) => sum + cat.value, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Rapportages & Analytics</h1>
          <p className="text-gray-600">Business intelligence en prestatie-analyse</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="week">Deze Week</option>
            <option value="month">Deze Maand</option>
            <option value="quarter">Dit Kwartaal</option>
            <option value="year">Dit Jaar</option>
          </select>
          <button className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
            <i className="fas fa-download mr-2"></i>
            Exporteer Rapport
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm font-bold text-gray-500 uppercase">{metric.label}</span>
              <div className={`flex items-center gap-1 text-sm font-semibold ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <i className={`fas fa-arrow-${metric.trend === 'up' ? 'up' : 'down'} text-xs`}></i>
                <span>{Math.abs(metric.change)}%</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{metric.value}</div>
          </div>
        ))}
      </div>

      {/* Report Tabs */}
      <div className="bg-white shadow-sm mb-8">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overzicht', icon: 'fa-chart-pie' },
            { id: 'revenue', label: 'Omzet Analyse', icon: 'fa-euro-sign' },
            { id: 'crew', label: 'Crew Prestaties', icon: 'fa-users' },
            { id: 'equipment', label: 'Materiaal Bezetting', icon: 'fa-box-open' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id as typeof selectedReport)}
              className={`flex items-center gap-2 px-8 py-4 font-semibold transition-colors ${
                selectedReport === tab.id
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

      {/* Report Content */}
      <div className="grid grid-cols-2 gap-8">
        {selectedReport === 'overview' && (
          <>
            {/* Revenue by Category */}
            <div className="bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Omzet per Categorie</h2>
              <div className="flex items-center justify-center mb-8">
                <div className="relative w-64 h-64">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {revenueByCategory.map((cat, index) => {
                      const total = revenueByCategory.reduce((sum, c) => sum + c.value, 0);
                      const percentage = (cat.value / total) * 100;
                      const prevPercentages = revenueByCategory
                        .slice(0, index)
                        .reduce((sum, c) => sum + (c.value / total) * 100, 0);
                      const circumference = 2 * Math.PI * 40;
                      const offset = circumference - (percentage / 100) * circumference;
                      const rotation = (prevPercentages / 100) * 360 - 90;
                      
                      return (
                        <circle
                          key={index}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={cat.color}
                          strokeWidth="12"
                          strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
                          strokeDashoffset="0"
                          transform={`rotate(${rotation} 50 50)`}
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">€{(totalRevenue / 1000).toFixed(0)}K</span>
                    <span className="text-sm text-gray-500">Totaal</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {revenueByCategory.map((cat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }}></div>
                      <span className="text-sm font-semibold text-gray-700">{cat.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">€{(cat.value / 1000).toFixed(0)}K</div>
                      <div className="text-xs text-gray-500">
                        {((cat.value / totalRevenue) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Omzet Trend (6 maanden)</h2>
              <div className="space-y-4">
                {[
                  { month: 'Aug', revenue: 52000, projects: 18 },
                  { month: 'Sep', revenue: 58000, projects: 20 },
                  { month: 'Okt', revenue: 61000, projects: 22 },
                  { month: 'Nov', revenue: 68000, projects: 24 },
                  { month: 'Dec', revenue: 72000, projects: 26 },
                  { month: 'Jan', revenue: 78000, projects: 28 }
                ].map((data, index) => {
                  const maxRevenue = 80000;
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700 w-12">{data.month}</span>
                        <div className="flex-1 mx-4">
                          <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-end pr-3"
                              style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                            >
                              <span className="text-xs font-bold text-white">
                                €{(data.revenue / 1000).toFixed(0)}K
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 w-20 text-right">
                          {data.projects} projecten
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {selectedReport === 'crew' && (
          <div className="col-span-2">
            <div className="bg-white shadow-sm">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] gap-4 px-6 py-4 bg-gray-100 text-sm font-bold text-gray-600 uppercase tracking-wide">
                <div>Crew Lid</div>
                <div>Projecten</div>
                <div>Uren</div>
                <div>Beoordeling</div>
                <div>Omzet Gegenereerd</div>
              </div>
              {crewPerformance.map((crew, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] gap-4 px-6 py-5 border-b border-gray-200 hover:bg-gray-50 transition-colors items-center"
                >
                  <div className="font-semibold text-gray-900">{crew.name}</div>
                  <div className="text-gray-900">{crew.projects}</div>
                  <div className="text-gray-900">{crew.hours}u</div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold text-green-600">{crew.rating}</div>
                    <i className="fas fa-star text-yellow-500 text-sm"></i>
                  </div>
                  <div className="text-lg font-bold text-gray-900">€{crew.revenue.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedReport === 'equipment' && (
          <div className="col-span-2">
            <div className="bg-white shadow-sm">
              <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] gap-4 px-6 py-4 bg-gray-100 text-sm font-bold text-gray-600 uppercase tracking-wide">
                <div>Materiaal</div>
                <div>Bezetting</div>
                <div>Omzet</div>
                <div>Boekingen</div>
              </div>
              {equipmentUtilization.map((equipment, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] gap-4 px-6 py-5 border-b border-gray-200 hover:bg-gray-50 transition-colors items-center"
                >
                  <div className="font-semibold text-gray-900">{equipment.name}</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          equipment.utilization >= 80 ? 'bg-green-500' :
                          equipment.utilization >= 60 ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${equipment.utilization}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-12">{equipment.utilization}%</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">€{equipment.revenue.toLocaleString()}</div>
                  <div className="text-gray-900">{equipment.bookings}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsAnalytics;

