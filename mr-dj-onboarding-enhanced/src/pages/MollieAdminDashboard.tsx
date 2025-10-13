import React, { useMemo, useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faEuroSign,
  faCheckCircle,
  faUndo,
  faTimesCircle,
  faCalendarAlt,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';

// Registreer Chart.js componenten
Chart.register(...registerables);

// --- 1. TypeScript Interfaces ---

interface StatCardData {
  title: string;
  value: string;
  icon: any; // FontAwesomeIcon type
  colorClass: 'primary' | 'success' | 'warning' | 'destructive';
}

type TransactionStatus = 'paid' | 'refunded' | 'failed' | 'pending';

interface Transaction {
  id: string;
  amount: number;
  status: TransactionStatus;
  method: string;
  date: string;
  action: string;
}

// --- 2. Dummy Data ---

const DUMMY_STATS: StatCardData[] = [
  {
    title: 'Totale Omzet',
    value: '€ 145.890,50',
    icon: faEuroSign,
    colorClass: 'primary',
  },
  {
    title: 'Succesvolle Transacties',
    value: '1.245',
    icon: faCheckCircle,
    colorClass: 'success',
  },
  {
    title: 'Openstaande Refunds',
    value: '12',
    icon: faUndo,
    colorClass: 'warning',
  },
  {
    title: 'Mislukte Betalingen',
    value: '34',
    icon: faTimesCircle,
    colorClass: 'destructive',
  },
];

const DUMMY_TRANSACTIONS: Transaction[] = [
  { id: 'tr_1A2B3C', amount: 125.5, status: 'paid', method: 'iDEAL', date: '2025-10-12', action: 'Refund' },
  { id: 'tr_4D5E6F', amount: 49.99, status: 'paid', method: 'Credit Card', date: '2025-10-11', action: 'Refund' },
  { id: 'tr_7G8H9I', amount: 25.0, status: 'refunded', method: 'Bancontact', date: '2025-10-11', action: 'View' },
  { id: 'tr_J1K2L3', amount: 350.0, status: 'paid', method: 'SEPA', date: '2025-10-10', action: 'Refund' },
  { id: 'tr_M4N5O6', amount: 15.95, status: 'failed', method: 'PayPal', date: '2025-10-10', action: 'Retry' },
  { id: 'tr_P7Q8R9', amount: 5.0, status: 'pending', method: 'Gift Card', date: '2025-10-09', action: 'View' },
];

const REVENUE_CHART_DATA = {
  labels: ['Dag -6', 'Dag -5', 'Dag -4', 'Dag -3', 'Dag -2', 'Dag -1', 'Vandaag'],
  datasets: [{
    label: 'Dagelijkse Omzet (€)',
    data: [15000, 18500, 16000, 22000, 19500, 25000, 29890],
    borderColor: 'rgb(0, 122, 255)', // primary-color
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    tension: 0.4,
    fill: true,
  }],
};

const METHOD_CHART_DATA = {
  labels: ['iDEAL', 'Credit Card', 'Bancontact', 'PayPal', 'SEPA'],
  datasets: [{
    label: 'Betaalmethoden',
    data: [45, 25, 15, 10, 5], // Percentages
    backgroundColor: [
      'rgb(0, 122, 255)', // primary
      'rgb(88, 86, 214)', // secondary
      'rgb(52, 199, 89)', // success
      'rgb(255, 149, 0)', // warning
      'rgb(255, 59, 48)', // destructive
    ],
    hoverOffset: 4,
  }],
};

// --- 3. Tailwind Utility Classes (Based on RentGuy Styling Guide) ---

const COLORS = {
  primary: 'text-[#007AFF] border-[#007AFF]',
  secondary: 'text-[#5856D6] border-[#5856D6]',
  success: 'text-[#34C759] border-[#34C759]',
  warning: 'text-[#FF9500] border-[#FF9500]',
  destructive: 'text-[#FF3B30] border-[#FF3B30]',
};

const BG_COLORS = {
  primary: 'bg-[#007AFF]',
  secondary: 'bg-[#5856D6]',
  success: 'bg-[#34C759]',
  warning: 'bg-[#FF9500]',
  destructive: 'bg-[#FF3B30]',
};

const STATUS_BADGE_CLASSES: Record<TransactionStatus, string> = {
  paid: 'bg-green-100 text-[#34C759]', // success
  refunded: 'bg-blue-100 text-[#007AFF]', // primary
  failed: 'bg-red-100 text-[#FF3B30]', // destructive
  pending: 'bg-yellow-100 text-[#FF9500]', // warning
};

// --- 4. Sub-Components ---

const StatCard: React.FC<StatCardData> = ({ title, value, icon, colorClass }) => {
  const borderClass = `border-l-4 ${COLORS[colorClass].replace('text-', 'border-')}`;
  const iconClass = COLORS[colorClass];

  return (
    <div className={`bg-white p-5 rounded-xl shadow-md flex flex-col justify-between ${borderClass}`}>
      <FontAwesomeIcon icon={icon} className={`text-2xl mb-2 ${iconClass}`} />
      <h3 className="text-sm text-gray-500 font-medium uppercase">{title}</h3>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
};

const TransactionRow: React.FC<{ transaction: Transaction }> = ({ transaction: tx }) => {
  const statusClass = STATUS_BADGE_CLASSES[tx.status];
  const statusText = useMemo(() => {
    switch (tx.status) {
      case 'paid': return 'Betaald';
      case 'refunded': return 'Terugbetaald';
      case 'failed': return 'Mislukt';
      case 'pending': return 'In Afwachting';
      default: return 'Onbekend';
    }
  }, [tx.status]);

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <td className="p-3 text-sm text-gray-700 font-mono">{tx.id}</td>
      <td className="p-3 text-sm text-gray-700 font-semibold">€ {tx.amount.toFixed(2)}</td>
      <td className="p-3">
        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${statusClass}`}>
          {statusText}
        </span>
      </td>
      <td className="p-3 text-sm text-gray-700">{tx.method}</td>
      <td className="p-3 text-sm text-gray-500">{tx.date}</td>
      <td className="p-3">
        <button className={`
          ${BG_COLORS.secondary} text-white px-3 py-1 rounded-lg text-xs font-semibold
          hover:opacity-90 transition-opacity flex items-center space-x-1
        `}>
          <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
          <span>{tx.action}</span>
        </button>
      </td>
    </tr>
  );
};

const ChartCard: React.FC<{ title: string; chartId: string; chartConfig: any; type: 'line' | 'doughnut' }> = ({
  title,
  chartId,
  chartConfig,
  type,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        chartRef.current = new Chart(ctx, {
          type: type,
          data: chartConfig,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: type === 'doughnut',
                position: 'right',
              },
              title: { display: false },
            },
            scales: type === 'line' ? {
              y: {
                beginAtZero: false,
                title: { display: true, text: 'Omzet (€)', color: '#4B5563' },
                grid: { color: '#E5E7EB' },
                ticks: { color: '#4B5563' }
              },
              x: {
                grid: { display: false },
                ticks: { color: '#4B5563' }
              }
            } : {},
          },
        });
      }
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [chartConfig, type]);

  return (
    <div className="bg-white p-5 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
      <div className="relative" style={{ height: '300px' }}>
        <canvas id={chartId} ref={canvasRef}></canvas>
      </div>
    </div>
  );
};

// --- 5. Main Component ---

const MollieAdminDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-5 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#007AFF] flex items-center space-x-3 mb-4 sm:mb-0">
            <FontAwesomeIcon icon={faChartLine} />
            <span>Mollie Admin Dashboard</span>
          </h1>
          <button className="bg-[#007AFF] text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-blue-600 transition-colors flex items-center space-x-2">
            <FontAwesomeIcon icon={faCalendarAlt} />
            <span>Laatste 30 Dagen</span>
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DUMMY_STATS.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartCard
              title="Omzetontwikkeling (Laatste 7 Dagen)"
              chartId="revenueChart"
              chartConfig={REVENUE_CHART_DATA}
              type="line"
            />
          </div>
          <div className="lg:col-span-1">
            <ChartCard
              title="Betaalmethoden Distributie"
              chartId="methodChart"
              chartConfig={METHOD_CHART_DATA}
              type="doughnut"
            />
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white p-5 rounded-xl shadow-md overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Recente Transacties & Refunds</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bedrag</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Methode</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {DUMMY_TRANSACTIONS.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MollieAdminDashboard;