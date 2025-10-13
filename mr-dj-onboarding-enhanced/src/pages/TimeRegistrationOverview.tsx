import React, { useMemo } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faHourglassHalf, faBullseye, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// --- 1. Styling Variables (Based on HTML CSS) ---
// In a real application, these would be configured in tailwind.config.js
// For this single component, we'll use a mapping to Tailwind classes or inline styles where necessary.
const RENTGUY_COLORS = {
  primary: 'text-blue-500 border-blue-500', // #007AFF
  secondary: 'text-indigo-600', // #5856D6
  success: 'text-green-500 border-green-500', // #34C759
  warning: 'text-orange-500 border-orange-500', // #FF9500
  destructive: 'text-red-500 border-red-500', // #FF3B30
  cardBg: 'bg-white',
  shadow: 'shadow-lg',
};

// --- 2. TypeScript Interfaces ---

interface KpiData {
  value: string;
  label: string;
  icon: any; // FontAwesomeIcon definition
  colorClass: string; // Tailwind color class for border/text
}

interface ProjectHoursData {
  labels: string[];
  hours: number[];
}

interface ValidationStatusData {
  labels: string[];
  percentages: number[];
}

interface TimeRegistrationOverviewData {
  kpis: KpiData[];
  projectHours: ProjectHoursData;
  validationStatus: ValidationStatusData;
}

// --- 3. Dummy Data ---

const DUMMY_DATA: TimeRegistrationOverviewData = {
  kpis: [
    {
      value: '164.5u',
      label: 'Totaal Gewerkte Uren (Deze Maand)',
      icon: faHourglassHalf,
      colorClass: RENTGUY_COLORS.success,
    },
    {
      value: '98.2%',
      label: 'Start/Stop Nauwkeurigheid',
      icon: faBullseye,
      colorClass: RENTGUY_COLORS.primary,
    },
    {
      value: '3',
      label: 'GPS Validatie Fouten (Laatste Week)',
      icon: faMapMarkerAlt,
      colorClass: RENTGUY_COLORS.destructive,
    },
  ],
  projectHours: {
    labels: ['Project A', 'Project B', 'Project C', 'Project D'],
    hours: [45, 30, 55, 34],
  },
  validationStatus: {
    labels: ['Gevalideerd', 'Handmatige Review', 'Afgekeurd'],
    percentages: [85, 10, 5], // Sums to 100
  },
};

// --- 4. Component Helpers (Chart Data & Options) ---

const getProjectHoursChartData = (data: ProjectHoursData) => {
  // Map RentGuy colors to Tailwind utility classes for Chart.js
  const backgroundColors = [
    '#007AFF', // Primary
    '#5856D6', // Secondary (Indigo)
    '#34C759', // Success
    '#FF9500', // Warning
  ];

  return {
    labels: data.labels,
    datasets: [
      {
        label: 'Uren',
        data: data.hours,
        backgroundColor: backgroundColors,
        borderColor: 'white', // Equivalent to var(--card-bg)
        borderWidth: 1,
      },
    ],
  };
};

const projectHoursOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Uren',
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
  },
};

const getValidationStatusChartData = (data: ValidationStatusData) => {
  const backgroundColors = [
    '#34C759', // Success
    '#FF9500', // Warning
    '#FF3B30', // Destructive
  ];

  return {
    labels: data.labels,
    datasets: [
      {
        data: data.percentages,
        backgroundColor: backgroundColors,
        hoverOffset: 4,
      },
    ],
  };
};

const validationStatusOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
    },
    title: {
      display: false,
    },
  },
};

// --- 5. Sub-Components ---

const KpiCard: React.FC<{ kpi: KpiData }> = ({ kpi }) => {
  const [colorText, colorBorder] = kpi.colorClass.split(' ');

  return (
    <div
      className={`flex flex-col items-center p-5 rounded-lg ${RENTGUY_COLORS.cardBg} ${RENTGUY_COLORS.shadow} border-l-4 ${colorBorder}`}
    >
      <FontAwesomeIcon icon={kpi.icon} className={`text-3xl mb-2 ${colorText}`} />
      <div className="text-4xl font-extrabold my-1 text-gray-800">{kpi.value}</div>
      <div className="text-base text-gray-500 font-medium text-center">{kpi.label}</div>
    </div>
  );
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className={`p-5 rounded-lg ${RENTGUY_COLORS.cardBg} ${RENTGUY_COLORS.shadow}`}>
    <h2 className={`mt-0 text-lg font-semibold ${RENTGUY_COLORS.secondary} border-b border-gray-200 pb-2 mb-4`}>
      {title}
    </h2>
    <div className="h-80"> {/* Fixed height for charts to maintain aspect ratio */}
      {children}
    </div>
  </div>
);

// --- 6. Main Component ---

interface TimeRegistrationOverviewProps {
  data?: TimeRegistrationOverviewData;
}

const TimeRegistrationOverview: React.FC<TimeRegistrationOverviewProps> = ({
  data = DUMMY_DATA,
}) => {
  const projectHoursChartData = useMemo(() => getProjectHoursChartData(data.projectHours), [data.projectHours]);
  const validationStatusChartData = useMemo(() => getValidationStatusChartData(data.validationStatus), [data.validationStatus]);

  return (
    <div className="min-h-screen bg-gray-50 p-5 sm:p-10 flex justify-center items-center font-inter">
      <div className={`w-full max-w-6xl p-8 rounded-xl ${RENTGUY_COLORS.cardBg} ${RENTGUY_COLORS.shadow}`}>
        
        {/* Header */}
        <h1 className={`text-3xl font-bold border-b-2 ${RENTGUY_COLORS.primary} pb-3 mb-6 text-gray-800`}>
          <FontAwesomeIcon icon={faClock} className={`mr-3 ${RENTGUY_COLORS.primary.split(' ')[0]}`} />
          Overzicht Tijdregistratie & Validatie
        </h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {data.kpis.map((kpi, index) => (
            <KpiCard key={index} kpi={kpi} />
          ))}
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Project Hours Chart (2/3 width on large screens) */}
          <div className="lg:col-span-2">
            <ChartCard title="Gewerkte Uren per Project (Laatste 4 Weken)">
              <Bar data={projectHoursChartData} options={projectHoursOptions} />
            </ChartCard>
          </div>

          {/* Validation Status Chart (1/3 width on large screens) */}
          <div className="lg:col-span-1">
            <ChartCard title="GPS Validatie Status">
              <Doughnut data={validationStatusChartData} options={validationStatusOptions} />
            </ChartCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeRegistrationOverview;