import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMobileAlt, faCheckCircle, faCloudUploadAlt, faSyncAlt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

// Registreer alle benodigde Chart.js componenten
Chart.register(...registerables);

// 1. TypeScript Interfaces voor Data
interface Feature {
  icon: any; // FontAwesomeIcon definition
  text: string;
}

interface SyncPerformanceData {
  labels: string[];
  latency: number[];
  successRate: number[];
}

type SyncStatusType = 'online' | 'offline' | 'syncing';

interface CrewMobileOfflineProps {
  title: string;
  offlineFeatures: Feature[];
  syncStatus: SyncStatusType;
  syncDetails: string;
  performanceData: SyncPerformanceData;
}

// 2. Dummy Data voor Development
const DUMMY_DATA: CrewMobileOfflineProps = {
  title: "Offline Mode Functionaliteit & Sync Indicator",
  offlineFeatures: [
    { icon: faCheckCircle, text: "Taken en Planning: Bekijk en bewerk toegewezen taken en roosters." },
    { icon: faCheckCircle, text: "Klantinformatie: Toegang tot de meest recente klantgegevens en notities." },
    { icon: faCheckCircle, text: "Urenregistratie: Start, pauzeer en stop werktijden lokaal." },
    { icon: faCheckCircle, text: "Formulierinvoer: Vul inspectie- en serviceformulieren in." },
  ],
  syncStatus: 'syncing',
  syncDetails: "Synchroniseren... (3/12 wijzigingen)",
  performanceData: {
    labels: ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'],
    latency: [150, 120, 180, 90, 110, 250, 130],
    successRate: [98, 99, 97, 100, 99, 95, 98],
  }
};

// 3. Hulpcomponent voor de Sync Indicator
const SyncIndicator: React.FC<{ status: SyncStatusType, details: string }> = ({ status, details }) => {
  let icon;
  let text;
  let classes;

  switch (status) {
    case 'online':
      icon = faCheckCircle;
      text = "Online & Volledig Gesynchroniseerd";
      classes = "bg-green-500 text-white";
      break;
    case 'offline':
      icon = faExclamationTriangle;
      text = "Offline Modus Actief";
      classes = "bg-orange-500 text-white";
      break;
    case 'syncing':
    default:
      icon = faSyncAlt;
      text = details;
      classes = "bg-blue-500 text-white";
      break;
  }

  return (
    <div className={`inline-flex items-center p-2.5 px-5 rounded-full font-semibold mt-5 text-lg ${classes}`}>
      <FontAwesomeIcon 
        icon={icon} 
        className={`mr-2.5 ${status === 'syncing' ? 'animate-spin' : ''}`} 
      />
      {text}
    </div>
  );
};

// 4. Hulpcomponent voor de Chart
const SyncPerformanceChart: React.FC<{ data: SyncPerformanceData }> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      // Vernietig de vorige instantie als deze bestaat
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const chartData = {
        labels: data.labels,
        datasets: [
          {
            label: 'Gemiddelde Sync Latency (ms)',
            data: data.latency,
            backgroundColor: 'rgba(0, 122, 255, 0.5)', // Primary color met alpha
            borderColor: '#007AFF', // Primary color
            borderWidth: 2,
            borderRadius: 5,
            type: 'bar' as const,
            yAxisID: 'y',
          },
          {
            label: 'Succesvolle Syncs (%)',
            data: data.successRate,
            borderColor: '#34C759', // Success color
            backgroundColor: 'rgba(52, 199, 89, 0.1)',
            borderWidth: 3,
            type: 'line' as const,
            fill: false,
            yAxisID: 'y1',
            tension: 0.4
          }
        ]
      };

      const config = {
        type: 'bar' as const, // Standaard type, wordt overschreven door datasets
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top' as const,
            },
            title: {
              display: true,
              text: 'Wekelijkse Sync Prestaties',
              font: {
                size: 16,
                family: 'Inter'
              }
            }
          },
          scales: {
            y: {
              type: 'linear' as const,
              display: true,
              position: 'left' as const,
              title: {
                display: true,
                text: 'Latency (ms)'
              },
              grid: {
                drawOnChartArea: false,
              }
            },
            y1: {
              type: 'linear' as const,
              display: true,
              position: 'right' as const,
              title: {
                display: true,
                text: 'Succes (%)'
              },
              min: 90,
              max: 100,
              grid: {
                drawOnChartArea: true,
              },
              ticks: {
                callback: function(value: string | number) {
                  return value + '%';
                }
              }
            }
          }
        }
      };

      chartInstance.current = new Chart(ctx, config);
    }

    // Cleanup functie
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="h-[300px] mt-5">
      <canvas ref={chartRef} id="syncPerformanceChart"></canvas>
    </div>
  );
};

// 5. Hoofdcomponent
const CrewMobileOffline: React.FC<CrewMobileOfflineProps> = ({
  title,
  offlineFeatures,
  syncStatus,
  syncDetails,
  performanceData
}) => {
  // Gebruik de dummy data als fallback als er geen props worden meegegeven
  const props = {
    title,
    offlineFeatures,
    syncStatus,
    syncDetails,
    performanceData
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-10 flex flex-col items-center justify-center font-inter">
      <div className="w-full max-w-6xl">
        {/* Hoofdtitel */}
        <h1 className="col-span-full text-blue-600 text-4xl mb-8 pb-2 border-b-4 border-blue-600 text-center font-extrabold">
          {props.title}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Linker Kolom: Kernfunctionaliteit */}
          <div className="bg-white rounded-xl p-8 shadow-lg transition-transform duration-300 hover:shadow-xl hover:-translate-y-1">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <FontAwesomeIcon icon={faMobileAlt} className="text-blue-600 mr-3 text-2xl" /> 
              Altijd Productief: Offline Mode
            </h2>
            <p className="text-gray-600 mb-6">
              De Crew Mobile App garandeert ononderbroken workflow, zelfs zonder internetverbinding. Essentiële taken blijven beschikbaar en data wordt lokaal opgeslagen.
            </p>
            
            <ul className="list-none p-0 mt-5">
              {props.offlineFeatures.map((feature, index) => (
                <li key={index} className="flex items-start mb-4 text-lg">
                  <FontAwesomeIcon icon={feature.icon} className="text-green-500 mr-4 text-xl mt-1 flex-shrink-0" />
                  <span className="text-gray-700">{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Rechter Kolom: Sync Indicator en Prestaties */}
          <div className="bg-white rounded-xl p-8 shadow-lg transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold mb-4 flex items-center justify-center">
              <FontAwesomeIcon icon={faCloudUploadAlt} className="text-indigo-500 mr-3 text-2xl" /> 
              Intelligente Sync Indicator
            </h2>
            <p className="text-gray-600 mb-6">
              Een duidelijke visuele indicator informeert de gebruiker real-time over de verbindings- en synchronisatiestatus.
            </p>

            {/* Sync Indicator */}
            <SyncIndicator status={props.syncStatus} details={props.syncDetails} />
            
            {/* Chart */}
            <SyncPerformanceChart data={props.performanceData} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Component met Dummy Data voor directe bruikbaarheid
const CrewMobileOfflineWithDummyData: React.FC = () => {
    return <CrewMobileOffline {...DUMMY_DATA} />;
};

export default CrewMobileOfflineWithDummyData;

// Optioneel: Exporteer de basiscomponent en de dummy data voor flexibiliteit
export { CrewMobileOffline, DUMMY_DATA, SyncStatusType, CrewMobileOfflineProps };