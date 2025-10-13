import React, { useMemo, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faCheckCircle, faClock, faUsers, faChartBar, faLightbulb, faArrowUp, faArrowDown, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

// Registreer alle benodigde Chart.js componenten
Chart.register(...registerables);

// --- 1. Styling Guide (Tailwind Utility Classes) ---
// De kleuren zijn gebaseerd op de CSS variabelen uit de bron-HTML.
// In een echte Tailwind-setup zouden deze in tailwind.config.js staan.
const COLORS = {
  primary: 'text-[#007AFF]', // Blue
  secondary: 'text-[#5856D6]', // Indigo
  success: 'text-[#34C759]', // Green
  warning: 'text-[#FF9500]', // Orange
  destructive: 'text-[#FF3B30]', // Red
  text: 'text-[#333]',
  cardBg: 'bg-white',
  borderColor: 'border-[#E5E7EB]',
  bg: 'bg-[#F9FAFB]',
};

const CHART_COLORS = {
  success: '#34C759',
  warning: '#FF9500',
  destructive: '#FF3B30',
};

// --- 2. TypeScript Interfaces ---

interface KeyMetric {
  title: string;
  value: string | number;
  icon: any; // FontAwesomeIcon definition
  colorClass: string; // Tailwind color class for border/text
}

interface ChartDataPoint {
  label: string;
  available: number;
  planned: number;
  absent: number;
}

interface KeyInsight {
  text: string;
  icon: any;
  colorClass: string;
}

interface AvailabilityData {
  metrics: KeyMetric[];
  chartData: ChartDataPoint[];
  insights: KeyInsight[];
}

// --- 3. Dummy Data ---

const DUMMY_DATA: AvailabilityData = {
  metrics: [
    {
      title: 'Totaal Beschikbare Dagen (4 Weken)',
      value: 124,
      icon: faCheckCircle,
      colorClass: 'border-l-[#34C759] text-[#34C759]', // success
    },
    {
      title: 'Totaal Ingeplande Dagen (4 Weken)',
      value: 88,
      icon: faClock,
      colorClass: 'border-l-[#FF9500] text-[#FF9500]', // warning
    },
    {
      title: 'Gemiddelde Bezetting',
      value: '61%',
      icon: faUsers,
      colorClass: 'border-l-[#FF3B30] text-[#FF3B30]', // destructive
    },
  ],
  chartData: [
    { label: 'Week 1', available: 55, planned: 45, absent: 10 },
    { label: 'Week 2', available: 40, planned: 60, absent: 10 },
    { label: 'Week 3', available: 30, planned: 70, absent: 15 },
    { label: 'Week 4', available: 45, planned: 55, absent: 5 },
  ],
  insights: [
    {
      text: 'Week 3: Hoogste bezetting (75%). Extra planning is vereist om overbelasting te voorkomen.',
      icon: faArrowUp,
      colorClass: COLORS.primary,
    },
    {
      text: 'Week 1: Laagste bezetting (45%). Mogelijkheid om extra taken of trainingen in te plannen.',
      icon: faArrowDown,
      colorClass: COLORS.primary,
    },
    {
      text: 'Afwezigheid: 15% van de totale dagen is gemarkeerd als vakantie of afwezig.',
      icon: faExclamationTriangle,
      colorClass: COLORS.destructive,
    },
  ],
};

// --- 4. Subcomponenten ---

const MetricCard: React.FC<{ metric: KeyMetric }> = ({ metric }) => (
  <div className={`\${COLORS.cardBg} rounded-xl shadow-lg p-5 flex flex-col items-start border-l-4 \${metric.colorClass.split(' ')[0]}`}>
    <div className="text-sm font-semibold text-gray-500 mb-1">{metric.title}</div>
    <div className={`text-4xl font-bold flex items-center \${metric.colorClass.split(' ')[1]}`}>
      <FontAwesomeIcon icon={metric.icon} className="mr-3 text-3xl" />
      {metric.value}
    </div>
  </div>
);

const ChartLegend: React.FC = () => (
  <div className="mt-5 text-center">
    <div className="inline-flex items-center mr-5 text-sm text-gray-600">
      <span className="w-3 h-3 rounded mr-1.5" style={{ backgroundColor: CHART_COLORS.success }}></span>
      Beschikbaar
    </div>
    <div className="inline-flex items-center mr-5 text-sm text-gray-600">
      <span className="w-3 h-3 rounded mr-1.5" style={{ backgroundColor: CHART_COLORS.warning }}></span>
      Ingepland
    </div>
    <div className="inline-flex items-center text-sm text-gray-600">
      <span className="w-3 h-3 rounded mr-1.5" style={{ backgroundColor: CHART_COLORS.destructive }}></span>
      Vakantie/Afwezig
    </div>
  </div>
);

// --- 5. Chart Component (React Hook for Chart.js) ---

const AvailabilityChart: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const chartConfig = useMemo(() => {
    const labels = data.map(d => d.label);
    const availableData = data.map(d => d.available);
    const plannedData = data.map(d => d.planned);
    const absentData = data.map(d => d.absent);

    return {
      type: 'bar' as const,
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Beschikbaar',
            data: availableData,
            backgroundColor: CHART_COLORS.success,
            stack: 'Stack 0',
          },
          {
            label: 'Ingepland',
            data: plannedData,
            backgroundColor: CHART_COLORS.warning,
            stack: 'Stack 0',
          },
          {
            label: 'Vakantie/Afwezig',
            data: absentData,
            backgroundColor: CHART_COLORS.destructive,
            stack: 'Stack 0',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false, // Gebruik custom legend
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: {
              display: false,
            },
          },
          y: {
            stacked: true,
            title: {
              display: true,
              text: 'Aantal Dagen',
            },
            beginAtZero: true,
          },
        },
      },
    };
  }, [data]);

  useEffect(() => {
    if (chartRef.current) {
      // Vernietig de oude instantie als deze bestaat
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Creëer een nieuwe Chart.js instantie
      chartInstance.current = new Chart(chartRef.current, chartConfig);
    }

    // Cleanup functie om de chart te vernietigen bij unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartConfig]);

  return (
    <div className="h-[350px]">
      <canvas ref={chartRef} id="availabilityChart"></canvas>
    </div>
  );
};

// --- 6. Hoofdcomponent ---

const AvailabilityCalendarOverview: React.FC<{ data?: AvailabilityData }> = ({ data = DUMMY_DATA }) => {
  return (
    <div className={`\${COLORS.bg} min-h-screen p-4 sm:p-8 md:p-10 \${COLORS.text} font-sans`}>
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <h1 className={`text-3xl sm:text-4xl font-extrabold mb-2 pb-2 border-b-4 \${COLORS.primary} border-current`}>
          <FontAwesomeIcon icon={faCalendarAlt} className="mr-3" />
          Overzicht Beschikbaarheidskalender Crew
        </h1>
        <p className="text-lg text-gray-600 mb-8 md:mb-10">
          Data-gedreven inzicht in de bezetting en beschikbaarheid van de crew voor de komende 4 weken.
        </p>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 md:mb-10">
          {data.metrics.map((metric, index) => (
            <MetricCard key={index} metric={metric} />
          ))}
        </div>

        {/* Chart Section */}
        <div className={`\${COLORS.cardBg} rounded-xl shadow-xl p-6 md:p-8`}>
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 \${COLORS.secondary}`}>
            <FontAwesomeIcon icon={faChartBar} className="mr-3" />
            Wekelijkse Beschikbaarheidstrends
          </h2>
          <AvailabilityChart data={data.chartData} />
          <ChartLegend />
        </div>

        {/* Key Takeaways */}
        <div className="mt-10">
          <h2 className={`text-xl sm:text-2xl font-bold mb-4 \${COLORS.primary}`}>
            <FontAwesomeIcon icon={faLightbulb} className="mr-3" />
            Belangrijkste Inzichten
          </h2>
          <ul className="list-none p-0">
            {data.insights.map((insight, index) => (
              <li key={index} className="mb-3 text-lg">
                <FontAwesomeIcon icon={insight.icon} className={`mr-3 \${insight.colorClass}`} />
                <strong className="font-semibold">{insight.text.split(':')[0]}:</strong>
                {insight.text.split(':')[1]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendarOverview;