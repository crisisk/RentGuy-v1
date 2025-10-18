import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faCheckCircle, faChartPie, faChartLine, faBullseye, faArrowRight, faFileContract } from '@fortawesome/free-solid-svg-icons';

// Registreer alle Chart.js componenten
Chart.register(...registerables);

// --- 1. TypeScript Interfaces voor Data ---

interface KpiData {
  value: string;
  label: string;
  icon: any; // FontAwesomeIcon definition
  colorClass: string; // Tailwind class for color
}

interface DocumentStatusData {
  complianceRate: string;
  expiringDocuments: number;
}

interface ChartData {
  labels: string[];
  data: number[];
  backgroundColor: string[];
}

interface ComplianceTrendData {
  labels: string[];
  percentages: number[];
}

interface ActionPoint {
  text: string;
  highlight: string;
}

interface DocumentManagementOverviewData {
  activeCrewMembers: number;
  documentStatus: DocumentStatusData;
  documentTypeDistribution: ChartData;
  complianceTrend: ComplianceTrendData;
  actionPoints: ActionPoint[];
}

// --- 2. Dummy Data ---

const DUMMY_DATA: DocumentManagementOverviewData = {
  activeCrewMembers: 285,
  documentStatus: {
    complianceRate: '98.5%',
    expiringDocuments: 4,
  },
  documentTypeDistribution: {
    labels: ['Identificatie', 'Certificaten', 'Contracten', 'Medisch'],
    data: [450, 320, 180, 50],
    backgroundColor: ['#007AFF', '#5856D6', '#34C759', '#FF9500'], // Primary, Secondary, Success, Warning
  },
  complianceTrend: {
    labels: ['Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt'],
    percentages: [95.2, 96.8, 97.5, 98.0, 98.3, 98.5],
  },
  actionPoints: [
    { highlight: 'Automatisering:', text: '85% van de documenten is automatisch gevalideerd. Doel: 95%.' },
    { highlight: 'Verlooptraject:', text: 'Monitor de 4 kritieke documenten die binnenkort verlopen.' },
    { highlight: 'Audit Trail:', text: 'Alle documentwijzigingen zijn volledig traceerbaar (100% logging).' },
  ],
};

// --- 3. Componenten ---

// Hulpcomponent voor KPI-kaarten
const KpiCard: React.FC<{ data: KpiData }> = ({ data }) => (
  <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-md border border-gray-200 h-full">
    <div className={`text-4xl mb-2 ${data.colorClass}`}>
      <FontAwesomeIcon icon={data.icon} />
    </div>
    <div className="text-5xl font-extrabold leading-none text-gray-800">
      {data.value}
    </div>
    <div className="text-base text-gray-500 mt-1 text-center">
      {data.label}
    </div>
  </div>
);

// Component voor de Document Type Distributie Chart (Doughnut)
const DocumentTypeChart: React.FC<{ data: ChartData }> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: data.labels,
            datasets: [{
              data: data.data,
              backgroundColor: data.backgroundColor,
              hoverOffset: 4,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  font: { family: 'Inter' },
                },
              },
              title: { display: false },
            },
          },
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="h-full w-full">
      <canvas ref={chartRef} id="documentTypeChart" />
    </div>
  );
};

// Component voor de Compliance Trend Chart (Line)
const ComplianceTrendChart: React.FC<{ data: ComplianceTrendData }> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const primaryColor = '#007AFF';

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.labels,
            datasets: [{
              label: 'Compliance Percentage',
              data: data.percentages,
              borderColor: primaryColor,
              backgroundColor: primaryColor + '33', // Lichte achtergrondkleur
              tension: 0.4,
              fill: true,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { display: false },
            },
            scales: {
              y: {
                min: 90,
                max: 100,
                ticks: {
                  callback: (value) => value + '%',
                  font: { family: 'Inter' },
                },
              },
              x: {
                ticks: { font: { family: 'Inter' } },
              },
            },
          },
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="h-full w-full">
      <canvas ref={chartRef} id="complianceTrendChart" />
    </div>
  );
};

// --- 4. Hoofdcomponent ---

const DocumentManagementOverview: React.FC = () => {
  const { activeCrewMembers, documentStatus, documentTypeDistribution, complianceTrend, actionPoints } = DUMMY_DATA;

  // Kleuren gebaseerd op de HTML/RentGuy styling
  const primaryColor = 'text-[#007AFF]';
  const successColor = 'text-[#34C759]';
  const warningColor = 'text-[#FF9500]';

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <h1 className={`text-3xl md:text-4xl font-bold ${primaryColor} pb-3 mb-6 border-b-2 border-gray-200 flex items-center`}>
        <FontAwesomeIcon icon={faFileContract} className="mr-3" />
        Overzicht Document Management voor Crew Documenten
      </h1>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6 h-full">

        {/* Kolom 1: Actieve Crew Leden KPI (1/5 breedte) */}
        <div className="lg:col-span-1 xl:col-span-1">
          <KpiCard
            data={{
              value: activeCrewMembers.toString(),
              label: 'Actieve Crew Leden',
              icon: faUsers,
              colorClass: primaryColor,
            }}
          />
        </div>

        {/* Kolom 2: Document Status KPI's (1/5 breedte) */}
        <div className="lg:col-span-1 xl:col-span-1 p-6 bg-white rounded-xl shadow-md border border-gray-200 flex flex-col">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FontAwesomeIcon icon={faCheckCircle} className={`mr-2 ${successColor}`} />
            Document Status
          </h2>
          <div className="flex flex-col space-y-4">
            {/* Compliance Rate */}
            <div className="text-center">
              <div className={`text-4xl font-extrabold leading-none ${successColor}`}>
                {documentStatus.complianceRate}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Document Compliance Rate
              </div>
            </div>
            {/* Expiring Documents */}
            <div className="text-center pt-4 border-t border-gray-100">
              <div className={`text-4xl font-extrabold leading-none ${warningColor}`}>
                {documentStatus.expiringDocuments}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Documenten Verlopen Binnen 30 Dagen
              </div>
            </div>
          </div>
        </div>

        {/* Kolom 3: Document Type Distributie Chart (1.5/5 breedte) */}
        <div className="lg:col-span-2 xl:col-span-1 p-6 bg-white rounded-xl shadow-md border border-gray-200 flex flex-col">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FontAwesomeIcon icon={faChartPie} className={`mr-2 ${primaryColor}`} />
            Distributie Document Types
          </h2>
          <div className="flex-grow h-64">
            <DocumentTypeChart data={documentTypeDistribution} />
          </div>
        </div>

        {/* Kolom 4: Compliance Trend Chart (2/5 breedte) */}
        <div className="lg:col-span-2 xl:col-span-2 p-6 bg-white rounded-xl shadow-md border border-gray-200 flex flex-col">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FontAwesomeIcon icon={faChartLine} className={`mr-2 ${primaryColor}`} />
            Compliance Percentage (Laatste 6 Maanden)
          </h2>
          <div className="flex-grow h-64">
            <ComplianceTrendChart data={complianceTrend} />
          </div>
        </div>

        {/* Kolom 5: Focus & Actiepunten (1/5 breedte) */}
        <div className="lg:col-span-2 xl:col-span-1 p-6 bg-white rounded-xl shadow-md border border-gray-200 flex flex-col">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FontAwesomeIcon icon={faBullseye} className={`mr-2 ${primaryColor}`} />
            Focus & Actiepunten
          </h2>
          <ul className="list-none p-0 text-gray-700 text-base space-y-4">
            {actionPoints.map((point, index) => (
              <li key={index} className="flex items-start">
                <FontAwesomeIcon icon={faArrowRight} className={`mt-1 mr-3 ${primaryColor} flex-shrink-0`} />
                <span>
                  <strong className="font-bold">{point.highlight}</strong> {point.text.replace(point.highlight, '').trim()}
                </span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
};

export default DocumentManagementOverview;