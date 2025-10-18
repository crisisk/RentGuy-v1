import React, { useState, useEffect, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faPlay,
  faPause,
  faStop,
  faHistory,
  faCheckCircle,
  faChartBar,
} from '@fortawesome/free-solid-svg-icons';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// --- 1. TypeScript Interfaces ---

interface TimeLog {
  id: number;
  description: string;
  timeRange: string; // e.g., "09:00 - 10:30"
  duration: string; // e.g., "1u 30m"
}

interface ProjectData {
  project: string;
  task: string;
}

interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

// --- 2. Dummy Data ---

const DUMMY_PROJECT_DATA: ProjectData = {
  project: 'Mollie & Crew Modules',
  task: 'Implementatie API-koppeling',
};

const DUMMY_LOGS: TimeLog[] = [
  {
    id: 1,
    description: 'API-koppeling',
    timeRange: '09:00 - 10:30',
    duration: '1u 30m',
  },
  {
    id: 2,
    description: 'Database Migratie',
    timeRange: '10:45 - 12:00',
    duration: '1u 15m',
  },
  {
    id: 3,
    description: 'Overleg Crew',
    timeRange: '13:00 - 13:45',
    duration: '0u 45m',
  },
];

const DUMMY_CHART_DATA: ChartData = {
  labels: ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'],
  datasets: [
    {
      label: 'Mollie Module',
      data: [4, 6, 5, 7, 5, 0, 0],
      backgroundColor: 'rgba(0, 122, 255, 0.7)', // Primary Color
      borderColor: 'rgba(0, 122, 255, 1)',
      borderWidth: 1,
      borderRadius: 4,
    },
    {
      label: 'Crew Module',
      data: [3, 2, 4, 1, 3, 0, 0],
      backgroundColor: 'rgba(88, 86, 214, 0.7)', // Secondary Color
      borderColor: 'rgba(88, 86, 214, 1)',
      borderWidth: 1,
      borderRadius: 4,
    },
  ],
};

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        font: {
          family: 'Inter',
          size: 14,
        },
      },
    },
    title: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Uren',
        font: {
          family: 'Inter',
          size: 14,
          weight: '600',
        },
      },
      grid: {
        color: '#E5E7EB',
      },
    },
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          family: 'Inter',
          size: 14,
        },
      },
    },
  },
};

// --- 3. Utility Functions ---

const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((v) => v.toString().padStart(2, '0'))
    .join(':');
};

// --- 4. Component Implementation ---

const TimeRegistrationInterface: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(5025); // Initial time: 01:23:45 (5025 seconds)
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    // In a real app, you would save the time log here
    console.log(`Time logged: ${formatTime(time)}`);
    setTime(0); // Reset timer
  };

  // Tailwind classes based on the original CSS
  const primaryColor = 'text-blue-500 bg-blue-500 hover:bg-blue-600';
  const warningColor = 'text-orange-500 bg-orange-500 hover:bg-orange-600';
  const destructiveColor = 'text-red-500 bg-red-500 hover:bg-red-600';
  const cardStyle =
    'bg-white rounded-xl shadow-md p-6 border border-gray-200';
  const cardTitleStyle =
    'text-xl font-bold mb-5 pb-2 border-b-2 border-gray-200';

  return (
    <div className="min-h-screen bg-gray-50 p-10 flex justify-center items-center">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Time Registration UI */}
        <div className="lg:col-span-1">
          <div className={`${cardStyle} flex flex-col items-center text-center`}>
            <div className={`${cardTitleStyle} w-full`}>
              <FontAwesomeIcon icon={faClock} className="mr-2" /> Huidige
              Tijdregistratie
            </div>

            <div className="text-lg mb-6 text-gray-500">
              Project: <strong className="text-gray-800">{DUMMY_PROJECT_DATA.project}</strong>
              <br />
              Taak: <strong className="text-gray-800">{DUMMY_PROJECT_DATA.task}</strong>
            </div>

            <div className={`text-6xl font-light my-5 ${primaryColor.split(' ')[0]}`}>
              {formatTime(time)}
            </div>

            <div className="flex gap-4 mb-6">
              <button
                className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-white transition-colors ${
                  isRunning
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
                onClick={handleStart}
                disabled={isRunning}
              >
                <FontAwesomeIcon icon={faPlay} /> Start
              </button>
              <button
                className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-white transition-colors ${
                  !isRunning
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
                onClick={handlePause}
                disabled={!isRunning}
              >
                <FontAwesomeIcon icon={faPause} /> Pauze
              </button>
              <button
                className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-white transition-colors ${
                  time === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
                onClick={handleStop}
                disabled={time === 0}
              >
                <FontAwesomeIcon icon={faStop} /> Stop & Opslaan
              </button>
            </div>

            <div className={`${cardTitleStyle} w-full mt-5`}>
              <FontAwesomeIcon icon={faHistory} className="mr-2" /> Recente Sessies
            </div>

            <div className="w-full">
              {DUMMY_LOGS.map((log, index) => (
                <div
                  key={log.id}
                  className={`flex justify-between items-center text-sm py-4 border-t border-gray-200 ${
                    index === DUMMY_LOGS.length - 1 ? 'border-b' : ''
                  }`}
                >
                  <span className="text-left">
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      className="text-green-500 mr-2"
                    />{' '}
                    {log.description} - {log.timeRange}
                  </span>
                  <span className="font-semibold text-indigo-500">
                    {log.duration}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Data Visualization */}
        <div className="lg:col-span-2">
          <div className={`${cardStyle} flex flex-col h-full`}>
            <div className={cardTitleStyle}>
              <FontAwesomeIcon icon={faChartBar} className="mr-2" /> Uren per
              Module (Laatste 7 Dagen)
            </div>
            <div className="flex-grow min-h-[350px]">
              <Bar data={DUMMY_CHART_DATA} options={CHART_OPTIONS} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeRegistrationInterface;