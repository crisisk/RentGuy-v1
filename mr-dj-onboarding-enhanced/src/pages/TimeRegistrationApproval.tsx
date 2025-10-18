import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import {
  FaClock,
  FaListCheck,
  FaCheck,
  FaXmark,
  FaCheckDouble,
  FaBan,
  FaTriangleExclamation,
  FaChartPie,
  FaRocket,
  FaMagnifyingGlassChart,
  FaLayerGroup,
  FaShieldHalved,
  FaHourglassHalf,
} from 'react-icons/fa6';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// --- Styling Constants (Inferred from HTML/CSS for Tailwind Customization) ---
// In a real project, these would be configured in tailwind.config.js
const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  destructive: '#FF3B30',
  text: '#1C1C1E',
  bg: '#F9FAFB',
  cardBg: '#FFFFFF',
  border: '#E5E7EB',
};

// --- Interfaces ---

type Status = 'In Afwachting' | 'Goedgekeurd' | 'Afgewezen';
type DeviationType = 'Overuren' | 'Onderbezetting' | 'Geen';

interface TimeRegistrationEntry {
  id: number;
  employee: string;
  period: string;
  hours: number;
  deviationType: DeviationType;
  deviationValue: string;
  status: Status;
}

interface ApprovalChartData {
  label: string;
  value: number;
  color: string;
}

// --- Dummy Data ---

const DUMMY_ENTRIES: TimeRegistrationEntry[] = [
  {
    id: 1,
    employee: 'Jan Jansen',
    period: 'Wk 41, 2025',
    hours: 40.0,
    deviationType: 'Overuren',
    deviationValue: '+5u Overuren',
    status: 'In Afwachting',
  },
  {
    id: 2,
    employee: 'Piet Pietersen',
    period: 'Wk 41, 2025',
    hours: 36.0,
    deviationType: 'Geen',
    deviationValue: 'Geen',
    status: 'In Afwachting',
  },
  {
    id: 3,
    employee: 'Kees Klaassen',
    period: 'Wk 41, 2025',
    hours: 32.0,
    deviationType: 'Onderbezetting',
    deviationValue: '-8u Onderbezetting',
    status: 'In Afwachting',
  },
  {
    id: 4,
    employee: 'Lisa Lammers',
    period: 'Wk 41, 2025',
    hours: 40.0,
    deviationType: 'Geen',
    deviationValue: 'Geen',
    status: 'In Afwachting',
  },
];

const DUMMY_CHART_DATA: ApprovalChartData[] = [
  { label: 'Goedgekeurd', value: 75, color: COLORS.success },
  { label: 'In Afwachting', value: 15, color: COLORS.primary },
  { label: 'Afgewezen', value: 5, color: COLORS.destructive },
  { label: 'Met Afwijking', value: 5, color: COLORS.warning },
];

const DUMMY_METRICS = {
  deviations: 4,
  pendingTasks: 12,
};

// --- Utility Components ---

const StatusBadge: React.FC<{ type: DeviationType | Status; text: string }> = ({ type, text }) => {
  let colorClass = '';
  let bgColorClass = '';
  let icon = null;

  switch (type) {
    case 'Overuren':
    case 'Onderbezetting':
    case 'Met Afwijking':
      colorClass = `text-[${COLORS.warning}]`;
      bgColorClass = 'bg-[#FFFBEB] border-[1px] border-solid border-[#FF9500]';
      icon = <FaTriangleExclamation className="mr-1" />;
      break;
    case 'In Afwachting':
      colorClass = `text-[${COLORS.primary}]`;
      bgColorClass = 'bg-[#EFF6FF] border-[1px] border-solid border-[#007AFF]';
      icon = <FaHourglassHalf className="mr-1" />;
      break;
    case 'Goedgekeurd':
      colorClass = `text-[${COLORS.success}]`;
      bgColorClass = 'bg-[#F0FFF4] border-[1px] border-solid border-[#34C759]';
      break;
    case 'Geen':
      colorClass = 'text-gray-600';
      bgColorClass = 'bg-gray-100 border-[1px] border-solid border-gray-300';
      break;
    default:
      colorClass = 'text-gray-600';
      bgColorClass = 'bg-gray-100 border-[1px] border-solid border-gray-300';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg font-semibold text-xs ${colorClass} ${bgColorClass}`}
      style={{
        // Use inline styles for dynamic colors based on constants
        color: type === 'In Afwachting' ? COLORS.primary : type === 'Overuren' || type === 'Onderbezetting' || type === 'Met Afwijking' ? COLORS.warning : type === 'Goedgekeurd' ? COLORS.success : COLORS.text,
        backgroundColor: type === 'In Afwachting' ? '#EFF6FF' : type === 'Overuren' || type === 'Onderbezetting' || type === 'Met Afwijking' ? '#FFFBEB' : type === 'Goedgekeurd' ? '#F0FFF4' : '#E5E7EB',
        borderColor: type === 'In Afwachting' ? COLORS.primary : type === 'Overuren' || type === 'Onderbezetting' || type === 'Met Afwijking' ? COLORS.warning : type === 'Goedgekeurd' ? COLORS.success : COLORS.border,
      }}
    >
      {icon}
      {text}
    </span>
  );
};

const MetricCard: React.FC<{ icon: React.ReactNode; value: number; label: string; valueColor: string }> = ({
  icon,
  value,
  label,
  valueColor,
}) => (
  <div className="flex flex-col items-center text-center">
    <div className="text-3xl mb-2">{icon}</div>
    <div className="text-4xl font-bold mb-1" style={{ color: valueColor }}>
      {value}
    </div>
    <div className="text-base text-gray-500">{label}</div>
  </div>
);

// --- Main Component ---

const TimeRegistrationApproval: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [entries, setEntries] = useState<TimeRegistrationEntry[]>(DUMMY_ENTRIES);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(entries.map((entry) => entry.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleApprove = (id: number | number[]) => {
    const idsToUpdate = Array.isArray(id) ? id : [id];
    setEntries((prev) =>
      prev.map((entry) =>
        idsToUpdate.includes(entry.id) ? { ...entry, status: 'Goedgekeurd' } : entry
      )
    );
    setSelectedIds([]);
  };

  const handleReject = (id: number | number[]) => {
    const idsToUpdate = Array.isArray(id) ? id : [id];
    setEntries((prev) =>
      prev.map((entry) =>
        idsToUpdate.includes(entry.id) ? { ...entry, status: 'Afgewezen' } : entry
      )
    );
    setSelectedIds([]);
  };

  const chartData = useMemo(() => {
    return {
      labels: DUMMY_CHART_DATA.map((d) => d.label),
      datasets: [
        {
          data: DUMMY_CHART_DATA.map((d) => d.value),
          backgroundColor: DUMMY_CHART_DATA.map((d) => d.color),
          hoverOffset: 4,
        },
      ],
    };
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            family: 'Inter',
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed + '%';
            }
            return label;
          },
        },
        bodyFont: {
          family: 'Inter',
        },
      },
    },
  };

  return (
    <div
      className="min-h-screen p-10 flex flex-col gap-8"
      style={{ backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header */}
      <header
        className="pb-5 mb-5 border-b-2"
        style={{ borderColor: COLORS.border }}
      >
        <h1
          className="text-4xl font-bold m-0 flex items-center gap-3"
          style={{ color: COLORS.primary }}
        >
          <FaClock className="text-3xl" />
          Goedkeuringsproces met Afwijkingsdetectie en Bulk Acties
        </h1>
      </header>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
        {/* Main Panel (2/3 width on large screens) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Approval Table Card */}
          <div
            className="bg-white rounded-xl shadow-lg p-6 border"
            style={{ borderColor: COLORS.border }}
          >
            <div
              className="text-2xl font-semibold mb-4 flex items-center gap-2"
              style={{ color: COLORS.secondary }}
            >
              <FaListCheck /> Openstaande Goedkeuringen
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="p-3 text-left uppercase font-semibold bg-gray-50" style={{ backgroundColor: COLORS.bg }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === entries.length && entries.length > 0}
                        onChange={handleSelectAll}
                        className="form-checkbox h-4 w-4 text-blue-600 rounded"
                        style={{ color: COLORS.primary }}
                      />
                    </th>
                    <th className="p-3 text-left uppercase font-semibold" style={{ backgroundColor: COLORS.bg }}>
                      Medewerker
                    </th>
                    <th className="p-3 text-left uppercase font-semibold" style={{ backgroundColor: COLORS.bg }}>
                      Periode
                    </th>
                    <th className="p-3 text-left uppercase font-semibold" style={{ backgroundColor: COLORS.bg }}>
                      Uren (Totaal)
                    </th>
                    <th className="p-3 text-left uppercase font-semibold" style={{ backgroundColor: COLORS.bg }}>
                      Afwijking
                    </th>
                    <th className="p-3 text-left uppercase font-semibold" style={{ backgroundColor: COLORS.bg }}>
                      Status
                    </th>
                    <th className="p-3 text-left uppercase font-semibold" style={{ backgroundColor: COLORS.bg }}>
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b" style={{ borderColor: COLORS.border }}>
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(entry.id)}
                          onChange={() => handleSelectRow(entry.id)}
                          className="form-checkbox h-4 w-4 text-blue-600 rounded"
                          style={{ color: COLORS.primary }}
                        />
                      </td>
                      <td className="p-3">{entry.employee}</td>
                      <td className="p-3">{entry.period}</td>
                      <td className="p-3 font-medium">{entry.hours}u</td>
                      <td className="p-3">
                        <StatusBadge
                          type={entry.deviationType}
                          text={entry.deviationValue}
                        />
                      </td>
                      <td className="p-3">
                        <StatusBadge
                          type={entry.status}
                          text={entry.status}
                        />
                      </td>
                      <td className="p-3 flex gap-1">
                        <button
                          onClick={() => handleApprove(entry.id)}
                          className="px-3 py-2 rounded-lg font-semibold text-white transition duration-200 hover:opacity-90"
                          style={{ backgroundColor: COLORS.success }}
                          title="Goedkeuren"
                        >
                          <FaCheck />
                        </button>
                        <button
                          onClick={() => handleReject(entry.id)}
                          className="px-3 py-2 rounded-lg font-semibold text-white transition duration-200 hover:opacity-90"
                          style={{ backgroundColor: COLORS.destructive }}
                          title="Afwijzen"
                        >
                          <FaXmark />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Bulk Actions */}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => handleApprove(selectedIds)}
                disabled={selectedIds.length === 0}
                className="px-5 py-2 rounded-lg font-semibold text-white transition duration-200 disabled:opacity-50"
                style={{ backgroundColor: COLORS.success }}
              >
                <FaCheckDouble className="inline mr-2" /> Keur Geselecteerde Goed
              </button>
              <button
                onClick={() => handleReject(selectedIds)}
                disabled={selectedIds.length === 0}
                className="px-5 py-2 rounded-lg font-semibold text-white transition duration-200 disabled:opacity-50"
                style={{ backgroundColor: COLORS.destructive }}
              >
                <FaBan className="inline mr-2" /> Wijs Geselecteerde Af
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Panel (1/3 width on large screens) */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          {/* Approval Status Chart Card */}
          <div
            className="bg-white rounded-xl shadow-lg p-6 border"
            style={{ borderColor: COLORS.border }}
          >
            <div
              className="text-xl font-semibold mb-4 flex items-center gap-2"
              style={{ color: COLORS.secondary }}
            >
              <FaChartPie /> Goedkeuringsstatus (Laatste 30 Dagen)
            </div>
            <div className="h-64 w-full">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Key Metrics Card */}
          <div
            className="bg-white rounded-xl shadow-lg p-6 border grid grid-cols-2 gap-5"
            style={{ borderColor: COLORS.border }}
          >
            <MetricCard
              icon={<FaTriangleExclamation style={{ color: COLORS.warning }} />}
              value={DUMMY_METRICS.deviations}
              label="Afwijkingen"
              valueColor={COLORS.warning}
            />
            <MetricCard
              icon={<FaHourglassHalf style={{ color: COLORS.primary }} />}
              value={DUMMY_METRICS.pendingTasks}
              label="Openstaande Taken"
              valueColor={COLORS.primary}
            />
          </div>

          {/* Benefits Card */}
          <div
            className="bg-white rounded-xl shadow-lg p-6 border"
            style={{ borderColor: COLORS.border }}
          >
            <div
              className="text-xl font-semibold mb-4 flex items-center gap-2"
              style={{ color: COLORS.secondary }}
            >
              <FaRocket /> Belangrijkste Voordelen
            </div>
            <ul className="list-none p-0 m-0">
              <li className="flex items-center mb-4 text-lg">
                <FaMagnifyingGlassChart className="mr-4 text-2xl" style={{ color: COLORS.secondary }} />
                Automatische afwijkingsdetectie
              </li>
              <li className="flex items-center mb-4 text-lg">
                <FaLayerGroup className="mr-4 text-2xl" style={{ color: COLORS.secondary }} />
                Efficiënte bulk goedkeuring
              </li>
              <li className="flex items-center text-lg">
                <FaShieldHalved className="mr-4 text-2xl" style={{ color: COLORS.secondary }} />
                Audit-proof goedkeuringslogboek
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeRegistrationApproval;