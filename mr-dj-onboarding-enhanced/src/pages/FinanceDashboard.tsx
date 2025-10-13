import React from 'react';

interface FinancialKPI {
  label: string;
  value: string;
  change: number;
  icon: string;
  color: 'primary' | 'success' | 'warning';
}

interface CashflowData {
  month: string;
  income: number;
  expenses: number;
}

const FinanceDashboard: React.FC = () => {
  const kpis: FinancialKPI[] = [
    {
      label: 'Winstmarge',
      value: '28%',
      change: 5.2,
      icon: 'fa-percentage',
      color: 'success'
    },
    {
      label: 'Openstaande Facturen',
      value: '€45.200',
      change: -12.3,
      icon: 'fa-file-invoice-dollar',
      color: 'warning'
    },
    {
      label: 'Cashflow (30d)',
      value: '€82.500',
      change: 8.7,
      icon: 'fa-chart-line',
      color: 'primary'
    },
    {
      label: 'Gemiddelde Betaaltermijn',
      value: '18 dagen',
      change: -3.5,
      icon: 'fa-calendar-check',
      color: 'success'
    }
  ];

  const cashflowData: CashflowData[] = [
    { month: 'Sep', income: 125000, expenses: 78000 },
    { month: 'Okt', income: 138000, expenses: 82000 },
    { month: 'Nov', income: 145000, expenses: 85000 },
    { month: 'Dec', income: 168000, expenses: 92000 },
    { month: 'Jan', income: 152000, expenses: 88000 }
  ];

  const getKPIColor = (color: string) => {
    const colors = {
      primary: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-500'
      },
      success: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        border: 'border-green-500'
      },
      warning: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-600',
        border: 'border-yellow-500'
      }
    };
    return colors[color as keyof typeof colors];
  };

  const maxValue = Math.max(...cashflowData.map(d => Math.max(d.income, d.expenses)));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">Financieel Dashboard</h1>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            <i className="fas fa-download mr-2"></i>
            Exporteer naar Excel
          </button>
          <button className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
            <i className="fas fa-file-invoice mr-2"></i>
            Nieuwe Factuur
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        {kpis.map((kpi, index) => {
          const colors = getKPIColor(kpi.color);
          const isPositive = kpi.change > 0;
          
          return (
            <div
              key={index}
              className={`bg-white p-6 border-l-4 ${colors.border} shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                  <i className={`fas ${kpi.icon} ${colors.text} text-lg`}></i>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{kpi.value}</div>
              <div className={`flex items-center gap-1 text-sm font-semibold ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <i className={`fas fa-arrow-${isPositive ? 'up' : 'down'} text-xs`}></i>
                <span>{Math.abs(kpi.change)}%</span>
                <span className="text-gray-500 font-normal ml-1">vs vorige maand</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Cashflow Chart */}
        <div className="bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <i className="fas fa-chart-bar text-blue-500"></i>
            Cashflow Overzicht (5 maanden)
          </h2>
          <div className="space-y-4">
            {cashflowData.map((data, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">{data.month}</span>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600 font-semibold">
                      €{(data.income / 1000).toFixed(0)}K
                    </span>
                    <span className="text-red-600 font-semibold">
                      €{(data.expenses / 1000).toFixed(0)}K
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 h-8">
                  <div className="flex-1 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600"
                      style={{ width: `${(data.income / maxValue) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-red-600"
                      style={{ width: `${(data.expenses / maxValue) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded"></div>
              <span className="text-sm font-semibold text-gray-700">Inkomsten</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded"></div>
              <span className="text-sm font-semibold text-gray-700">Uitgaven</span>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <i className="fas fa-exchange-alt text-blue-500"></i>
            Recente Transacties
          </h2>
          <div className="space-y-4">
            {[
              { type: 'income', client: 'TechCorp BV', amount: 15600, date: '12 Jan', status: 'paid' },
              { type: 'expense', client: 'Supplier Audio Pro', amount: -3200, date: '11 Jan', status: 'paid' },
              { type: 'income', client: 'Van der Berg Familie', amount: 8500, date: '10 Jan', status: 'pending' },
              { type: 'expense', client: 'Lease Materiaal', amount: -2100, date: '8 Jan', status: 'paid' },
              { type: 'income', client: 'ACME Inc', amount: 12300, date: '5 Jan', status: 'overdue' }
            ].map((transaction, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    <i className={`fas fa-arrow-${transaction.type === 'income' ? 'down' : 'up'}`}></i>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{transaction.client}</div>
                    <div className="text-sm text-gray-500">{transaction.date}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    €{Math.abs(transaction.amount).toLocaleString()}
                  </div>
                  <div className={`text-xs font-semibold ${
                    transaction.status === 'paid' ? 'text-green-600' :
                    transaction.status === 'pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {transaction.status === 'paid' ? 'Betaald' :
                     transaction.status === 'pending' ? 'In behandeling' :
                     'Achterstallig'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;

