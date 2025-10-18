import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartData } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileUpload, faCheckCircle, faExclamationTriangle, faTimesCircle, faCloudUploadAlt, faBell, faSearch, faLock, faHistory, faTag } from '@fortawesome/free-solid-svg-icons';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// --- 1. TypeScript Interfaces ---

/**
 * Defines the structure for a single feature item.
 */
interface Feature {
  icon: any; // FontAwesomeIcon definition
  description: string;
}

/**
 * Defines the structure for the document status data.
 */
interface DocumentStatus {
  valid: number;
  expiringSoon: number;
  expired: number;
  toUpload: number;
}

/**
 * Defines the props for the DocumentManagementInterface component.
 * In a real application, this would allow passing in dynamic data.
 */
interface DocumentManagementInterfaceProps {
  statusData: DocumentStatus;
  features: Feature[];
}

// --- 2. Dummy Data (following the original HTML data) ---

const DUMMY_STATUS_DATA: DocumentStatus = {
  valid: 125,
  expiringSoon: 15,
  expired: 5,
  toUpload: 20,
};

const DUMMY_FEATURES: Feature[] = [
  { icon: faCloudUploadAlt, description: 'Drag-and-Drop Upload' },
  { icon: faBell, description: 'Automatische Expiry Notificaties' },
  { icon: faSearch, description: 'Geavanceerde Document Zoekfunctie' },
  { icon: faLock, description: 'Toegangscontrole (Rollen)' },
  { icon: faHistory, description: 'Versiebeheer & Audit Trail' },
  { icon: faTag, description: 'Aanpasbare Document Types' },
];

// --- 3. Sub-Components ---

/**
 * StatusBox component for displaying a single document status metric.
 */
const StatusBox: React.FC<{ icon: any; count: string; color: 'success' | 'warning' | 'destructive' }> = ({ icon, count, color }) => {
  let bgColor = '';
  switch (color) {
    case 'success':
      bgColor = 'bg-green-500'; // Corresponds to --success-color: #34C759
      break;
    case 'warning':
      bgColor = 'bg-orange-500'; // Corresponds to --warning-color: #FF9500
      break;
    case 'destructive':
      bgColor = 'bg-red-500'; // Corresponds to --destructive-color: #FF3B30
      break;
  }

  return (
    <div className={`\${bgColor} text-white p-4 rounded-lg font-semibold text-lg min-w-[120px] text-center shadow-md flex flex-col items-center justify-center space-y-1`}>
      <FontAwesomeIcon icon={icon} className="text-xl" />
      <span>{count}</span>
    </div>
  );
};

/**
 * ChartCard component for displaying the document status doughnut chart.
 */
const ChartCard: React.FC<{ statusData: DocumentStatus }> = ({ statusData }) => {
  const chartData: ChartData<'doughnut'> = useMemo(() => ({
    labels: ['Geldig', 'Verloopt Binnen 30 Dagen', 'Verlopen', 'Nog Te Uploaden'],
    datasets: [
      {
        label: 'Aantal Documenten',
        data: [statusData.valid, statusData.expiringSoon, statusData.expired, statusData.toUpload],
        backgroundColor: [
          '#34C759', // Success (Green)
          '#FF9500', // Warning (Orange)
          '#FF3B30', // Destructive (Red)
          '#5856D6', // Secondary (Purple/Indigo)
        ],
        borderColor: '#FFFFFF', // Card background
        borderWidth: 2,
      },
    ],
  }), [statusData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            family: 'Inter, sans-serif',
            size: 14,
          },
          color: '#1C1C1E', // Text color
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += new Intl.NumberFormat('nl-NL').format(context.parsed);
            }
            return label;
          }
        }
      },
      title: {
        display: false,
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 flex flex-col flex-grow min-h-[300px]">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Document Status Overzicht</h3>
      <div className="flex-grow relative">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

/**
 * FeatureList component for displaying the list of core functionalities.
 */
const FeatureList: React.FC<{ features: Feature[] }> = ({ features }) => (
  <div className="flex flex-col space-y-4">
    {features.map((feature, index) => (
      <div key={index} className="flex items-center space-x-4 text-lg font-medium text-gray-700">
        <FontAwesomeIcon icon={feature.icon} className="text-2xl text-indigo-600 w-8 text-center" />
        <span>{feature.description}</span>
      </div>
    ))}
  </div>
);

// --- 4. Main Component ---

/**
 * Main component for the Document Management Interface.
 * @param props - Component props, including statusData and features.
 */
const DocumentManagementInterface: React.FC<DocumentManagementInterfaceProps> = ({ statusData, features }) => {
  // Tailwind classes are used to mimic the original CSS variables and structure
  // Primary: #007AFF (blue-500), Secondary: #5856D6 (indigo-600), BG: #F9FAFB (gray-50)

  return (
    <div className="p-10 bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <h1 className="text-4xl font-bold text-blue-500 pb-3 mb-5 border-b-4 border-blue-500 flex items-center space-x-3">
        <FontAwesomeIcon icon={faFileUpload} />
        <span>Document Management Interface</span>
      </h1>
      <h2 className="text-2xl font-medium text-gray-700 mb-8">Document Upload en Expiry Tracking</h2>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Panel (2/3 width on large screens) */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          {/* Chart Card */}
          <ChartCard statusData={statusData} />

          {/* Status Indicators */}
          <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 flex justify-around space-x-4">
            <StatusBox
              icon={faCheckCircle}
              count={`\${statusData.valid} Geldig`}
              color="success"
            />
            <StatusBox
              icon={faExclamationTriangle}
              count={`\${statusData.expiringSoon} Verlopen Binnen 30 Dagen`}
              color="warning"
            />
            <StatusBox
              icon={faTimesCircle}
              count={`\${statusData.expired} Verlopen`}
              color="destructive"
            />
          </div>
        </div>

        {/* Sidebar Panel (1/3 width on large screens) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Kernfunctionaliteiten</h3>
            <FeatureList features={features} />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 5. Export and Usage Example ---

/**
 * Component that uses the dummy data for demonstration.
 * This is the default export for easy use in a Next.js/React app.
 */
const DocumentManagementInterfaceWithData: React.FC = () => (
  <DocumentManagementInterface
    statusData={DUMMY_STATUS_DATA}
    features={DUMMY_FEATURES}
  />
);

export default DocumentManagementInterfaceWithData;

// Export the main component and interfaces for flexibility
export { DocumentManagementInterface, DUMMY_STATUS_DATA, DUMMY_FEATURES, DocumentStatus, Feature };