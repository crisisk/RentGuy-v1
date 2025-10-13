import React, { useMemo, useState, useCallback, useEffect } from 'react';
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
import {
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheck,
} from 'react-icons/fa';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// --- 1. Interfaces ---

interface KeyMetric {
  value: string;
  label: string;
  colorClass: string; // Tailwind class for text color, e.g., 'text-blue-500'
  icon?: React.ReactNode;
}

interface AvailabilityData {
  labels: string[];
  data: number[];
  backgroundColors: string[];
  borderColors: string[];
}

interface TimeSlot {
  hour: number;
  day: number;
  isAvailable: boolean;
}

// --- 2. Dummy Data ---

const DUMMY_METRICS: KeyMetric[] = [
  {
    value: '24 / 35',
    label: 'Beschikbare Crewleden',
    colorClass: 'text-blue-500',
  },
  {
    value: 'Wk 42: 13 Okt - 19 Okt',
    label: 'Huidige Weergave',
    colorClass: 'text-indigo-600',
  },
  {
    value: '3 Conflicten',
    label: 'Actie Vereist',
    colorClass: 'text-yellow-500',
    icon: <FaExclamationTriangle className="inline mr-1" />,
  },
];

const DUMMY_CHART_DATA: AvailabilityData = {
  labels: ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'],
  data: [85, 92, 78, 88, 95, 60, 55],
  backgroundColors: [
    'rgba(0, 122, 255, 0.8)', // Ma - Primary
    'rgba(0, 122, 255, 0.8)', // Di - Primary
    'rgba(255, 149, 0, 0.8)', // Wo - Warning
    'rgba(0, 122, 255, 0.8)', // Do - Primary
    'rgba(52, 199, 89, 0.8)', // Vr - Success
    'rgba(255, 59, 48, 0.8)', // Za - Destructive
    'rgba(255, 59, 48, 0.8)', // Zo - Destructive
  ],
  borderColors: [
    '#007AFF',
    '#007AFF',
    '#FF9500',
    '#007AFF',
    '#34C759',
    '#FF3B30',
    '#FF3B30',
  ],
};

const START_HOUR = 8;
const END_HOUR = 18;
const DAYS_OF_WEEK = 7;

// Mock availability blocks for visual representation
const MOCK_AVAILABILITY: TimeSlot[] = [
  // Maandag: Beschikbaar van 9:00 tot 17:00
  ...Array.from({ length: 17 - 9 }, (_, i) => ({
    hour: 9 + i,
    day: 0,
    isAvailable: true,
  })),
  // Woensdag: Niet beschikbaar van 10:00 tot 12:00 (Conflict)
  ...Array.from({ length: 12 - 10 }, (_, i) => ({
    hour: 10 + i,
    day: 2,
    isAvailable: false,
  })),
  // Vrijdag: Beschikbaar van 8:00 tot 18:00
  ...Array.from({ length: 18 - 8 }, (_, i) => ({
    hour: 8 + i,
    day: 4,
    isAvailable: true,
  })),
  // Zondag: Niet beschikbaar van 8:00 tot 10:00
  ...Array.from({ length: 10 - 8 }, (_, i) => ({
    hour: 8 + i,
    day: 6,
    isAvailable: false,
  })),
];

// --- 3. Chart Component Options ---

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: 'Wekelijkse Beschikbaarheidsanalyse',
      font: {
        family: 'Inter',
        size: 14,
      },
      color: '#1F2937', // var(--text-color)
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      title: {
        display: true,
        text: 'Beschikbaarheid (%)',
        font: { family: 'Inter' },
      },
      ticks: {
        callback: (value: number) => value + '%',
        font: { family: 'Inter' },
      },
    },
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: { family: 'Inter' },
      },
    },
  },
};

// --- 4. Helper Components ---

const DayHeader: React.FC<{ day: string }> = ({ day }) => (
  <div className="flex items-center justify-center p-2 text-sm font-semibold text-white bg-blue-500">
    {day}
  </div>
);

const TimeSlotHeader: React.FC<{ time: string }> = ({ time }) => (
  <div className="flex items-center justify-center p-2 text-sm font-bold text-indigo-600 bg-gray-100">
    {time}
  </div>
);

const CalendarCell: React.FC<{
  hour: number;
  day: number;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  availability: TimeSlot | undefined;
}> = ({ hour, day, selected, onMouseDown, onMouseEnter, availability }) => {
  const isAvailable = availability?.isAvailable;
  const bgColor = isAvailable === true ? 'bg-green-100' : isAvailable === false ? 'bg-red-100' : 'bg-white';
  const ringColor = isAvailable === true ? 'ring-green-500' : isAvailable === false ? 'ring-red-500' : '';

  return (
    <div
      className={`h-10 relative cursor-pointer transition-colors duration-100 border border-gray-200 -m-px ${bgColor} ${
        selected ? 'bg-blue-300/50 ring-2 ring-blue-500 z-10' : 'hover:bg-gray-100'
      }`}
      data-hour={hour}
      data-day={day}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
    >
      {isAvailable === true && (
        <div className="absolute inset-0 flex items-center justify-center text-green-500">
          <FaCheck />
        </div>
      )}
      {isAvailable === false && (
        <div className="absolute inset-0 flex items-center justify-center text-red-500">
          <FaExclamationTriangle />
        </div>
      )}
    </div>
  );
};

// --- 5. Main Component ---

const AvailabilityCalendar: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [startCell, setStartCell] = useState<{ hour: number; day: number } | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  const days = ['Ma 13/10', 'Di 14/10', 'Wo 15/10', 'Do 16/10', 'Vr 17/10', 'Za 18/10', 'Zo 19/10'];
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  const availabilityMap = useMemo(() => {
    const map = new Map<string, TimeSlot>();
    MOCK_AVAILABILITY.forEach(slot => {
      map.set(`${slot.hour}-${slot.day}`, slot);
    });
    return map;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const hour = parseInt(target.dataset.hour || '0');
    const day = parseInt(target.dataset.day || '0');

    setIsDragging(true);
    setStartCell({ hour, day });
    setSelectedCells(new Set([`${hour}-${day}`]));
  }, []);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !startCell) return;

      const target = e.currentTarget;
      const currentHour = parseInt(target.dataset.hour || '0');
      const currentDay = parseInt(target.dataset.day || '0');

      const minHour = Math.min(startCell.hour, currentHour);
      const maxHour = Math.max(startCell.hour, currentHour);
      const minDay = Math.min(startCell.day, currentDay);
      const maxDay = Math.max(startCell.day, currentDay);

      const newSelection = new Set<string>();
      for (let h = minHour; h <= maxHour; h++) {
        for (let d = minDay; d <= maxDay; d++) {
          newSelection.add(`${h}-${d}`);
        }
      }
      setSelectedCells(newSelection);
    },
    [isDragging, startCell]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setStartCell(null);
      // console.log('Drag selection finished. Selected cells:', Array.from(selectedCells));
      // In a real app, you would process the selected time slots here
    }
  }, [isDragging, selectedCells]);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);

  const chartData = useMemo(() => ({
    labels: DUMMY_CHART_DATA.labels,
    datasets: [
      {
        label: 'Gemiddelde Beschikbaarheid (%)',
        data: DUMMY_CHART_DATA.data,
        backgroundColor: DUMMY_CHART_DATA.backgroundColors,
        borderColor: DUMMY_CHART_DATA.borderColors,
        borderWidth: 1,
      },
    ],
  }), []);

  return (
    <div className="p-4 sm:p-8 md:p-10 min-h-screen bg-gray-50 font-inter">
      <div className="flex flex-col h-full p-6 bg-white rounded-xl shadow-xl">
        {/* Header */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-500 border-b-4 border-blue-500 pb-2 mb-4">
          <FaCalendarAlt className="inline mr-3" /> Beschikbaarheidskalender Interface
        </h1>
        <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-6">
          Kalender UI met Drag-Select Functionaliteit voor Crew Planning
        </h2>

        {/* Key Metrics */}
        <div className="flex flex-wrap justify-between gap-4 mb-8">
          {DUMMY_METRICS.map((metric, index) => (
            <div
              key={index}
              className="flex-1 min-w-[200px] text-center p-4 rounded-lg bg-gray-50 border border-gray-200 font-semibold text-lg"
            >
              <span className={`block text-2xl ${metric.colorClass}`}>
                {metric.icon}
                {metric.value}
              </span>
              <span className="block text-xs text-gray-500 mt-1">
                {metric.label}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-grow overflow-auto">
          <div
            className="grid gap-px bg-gray-200 border border-gray-200"
            style={{
              gridTemplateColumns: `50px repeat(${DAYS_OF_WEEK}, 1fr)`,
            }}
          >
            {/* Headers */}
            <TimeSlotHeader time="Tijd" />
            {days.map((day, index) => (
              <DayHeader key={index} day={day} />
            ))}

            {/* Time Slots */}
            {hours.map(hour => (
              <React.Fragment key={hour}>
                {/* Time Column */}
                <TimeSlotHeader time={`${hour}:00`} />

                {/* Day Cells */}
                {Array.from({ length: DAYS_OF_WEEK }, (_, dayIndex) => {
                  const cellKey = `${hour}-${dayIndex}`;
                  const isSelected = selectedCells.has(cellKey);
                  const availability = availabilityMap.get(cellKey);

                  return (
                    <CalendarCell
                      key={cellKey}
                      hour={hour}
                      day={dayIndex}
                      selected={isSelected}
                      onMouseDown={handleMouseDown}
                      onMouseEnter={handleMouseEnter}
                      availability={availability}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Chart.js Visualization */}
        <div className="w-full mt-6 pt-4 border-t border-gray-200">
          <div className="h-48 sm:h-64">
            <Bar data={chartData} options={chartOptions as any} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;