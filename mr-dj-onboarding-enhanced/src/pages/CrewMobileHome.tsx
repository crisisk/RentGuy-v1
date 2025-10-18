import React, { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faExclamationTriangle,
  faCalendarAlt,
  faMapMarkerAlt,
  faChartBar,
  faBolt,
  faExchangeAlt,
  faPlusCircle,
  faUserTimes,
  faHome,
  faCalendarCheck,
  faUsers,
  faUserCircle,
} from '@fortawesome/free-solid-svg-icons';

// Registreer alle Chart.js componenten
Chart.register(...registerables);

// --- TypeScript Interfaces ---

/** Status van een shift */
type ShiftStatus = 'Vandaag' | 'Aankomend';

/** Interface voor een enkele shift */
interface Shift {
  id: number;
  time: string;
  location: string;
  status: ShiftStatus;
  isChanged?: boolean;
}

/** Interface voor de data van de gewerkte uren grafiek */
interface HoursChartData {
  labels: string[];
  data: number[];
  totalHours: number;
  goalHours: number;
}

/** Interface voor de component props */
interface CrewMobileHomeProps {
  userName: string;
  notificationCount: number;
  importantMessage: string;
  shifts: Shift[];
  hoursChartData: HoursChartData;
}

// --- Tailwind CSS Utility Classes (gebaseerd op de originele CSS) ---

// De originele CSS gebruikte CSS-variabelen voor kleuren.
// We mappen deze naar Tailwind's standaardkleuren of custom kleuren indien nodig.
// RentGuy Styling Guide (aanname gebaseerd op de CSS):
// --primary-color: #007AFF (Blue) -> blue-500
// --secondary-color: #5856D6 (Indigo/Violet) -> indigo-500
// --success-color: #34C759 (Green) -> green-500
// --warning-color: #FF9500 (Orange) -> orange-500
// --destructive-color: #FF3B30 (Red) -> red-500
// --text-color: #1F2937 (Dark Gray) -> gray-800
// --subtle-text-color: #6B7280 (Medium Gray) -> gray-500
// --bg-color: #F9FAFB (Light Gray) -> gray-50
// --card-bg: #FFFFFF (White) -> white
// --border-color: #E5E7EB (Very Light Gray) -> gray-200

const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  destructive: '#FF3B30',
  text: '#1F2937',
  subtleText: '#6B7280',
  cardBg: '#FFFFFF',
  borderColor: '#E5E7EB',
};

// --- Dummy Data ---

const DUMMY_DATA: CrewMobileHomeProps = {
  userName: 'Anna',
  notificationCount: 3,
  importantMessage:
    "Je shift van morgen (14 okt) op locatie 'Hoofdstraat 12' is met 30 minuten vervroegd. Nieuwe starttijd: 08:30.",
  shifts: [
    {
      id: 1,
      time: 'Vandaag, 13:00 - 17:00',
      location: 'Winkelcentrum Zuid',
      status: 'Vandaag',
    },
    {
      id: 2,
      time: 'Ma 14 Okt, 08:30 - 16:00',
      location: 'Hoofdstraat 12 (Gewijzigd)',
      status: 'Aankomend',
      isChanged: true,
    },
    {
      id: 3,
      time: 'Wo 16 Okt, 10:00 - 18:00',
      location: 'Distributiecentrum Oost',
      status: 'Aankomend',
    },
  ],
  hoursChartData: {
    labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
    data: [16, 16, 16.5, 0],
    totalHours: 48.5,
    goalHours: 160,
  },
};

// --- Sub-Components ---

/**
 * Card component voor secties
 */
const Card: React.FC<{ title: string; icon: any; className?: string; titleColor?: string; children: React.ReactNode }> = ({
  title,
  icon,
  className = '',
  titleColor = colors.text,
  children,
}) => (
  <div
    className={`bg-white rounded-xl p-4 mb-5 shadow-md border border-gray-200 ${className}`}
    style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
  >
    <div className="flex items-center mb-3" style={{ color: titleColor }}>
      <FontAwesomeIcon icon={icon} className="mr-2 text-lg" style={{ color: colors.primary }} />
      <h2 className="text-base font-semibold" style={{ color: titleColor }}>
        {title}
      </h2>
    </div>
    {children}
  </div>
);

/**
 * Component voor een enkele shift in de lijst
 */
const ShiftItem: React.FC<{ shift: Shift }> = ({ shift }) => {
  const statusClasses =
    shift.status === 'Vandaag'
      ? `bg-green-100 text-green-500`
      : `bg-blue-100 text-blue-500`;

  const statusStyle =
    shift.status === 'Vandaag'
      ? { backgroundColor: 'rgba(52, 199, 89, 0.1)', color: colors.success }
      : { backgroundColor: 'rgba(0, 122, 255, 0.1)', color: colors.primary };

  return (
    <div
      className="flex justify-between items-center py-3 border-b"
      style={{ borderColor: colors.borderColor }}
    >
      <div className="flex flex-col">
        <div className="font-bold text-sm" style={{ color: colors.text }}>
          {shift.time}
        </div>
        <div className="text-xs" style={{ color: colors.subtleText }}>
          <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" /> {shift.location}
        </div>
      </div>
      <span
        className={`text-xs font-semibold px-2 py-1 rounded-md`}
        style={statusStyle}
      >
        {shift.status}
      </span>
    </div>
  );
};

/**
 * Component voor de gewerkte uren grafiek
 */
const HoursChart: React.FC<{ data: HoursChartData }> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Vernietig de vorige instantie als deze bestaat
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data.labels,
            datasets: [
              {
                label: 'Gewerkt (uur)',
                data: data.data,
                backgroundColor: data.data.map((val, index) =>
                  val > 0 ? colors.primary : colors.borderColor
                ),
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                mode: 'index',
                intersect: false,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 20,
                grid: {
                  display: false,
                },
                ticks: {
                  color: colors.subtleText,
                },
              },
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  color: colors.subtleText,
                },
              },
            },
          },
        });
      }
    }

    // Cleanup functie om de chart te vernietigen bij unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="h-[150px] w-full mt-2">
      <canvas ref={chartRef} id="hoursChart"></canvas>
    </div>
  );
};

/**
 * Component voor de navigatiebalk onderaan
 */
const NavBar: React.FC = () => {
  const navItems = [
    { icon: faHome, label: 'Home', active: true },
    { icon: faCalendarCheck, label: 'Rooster', active: false },
    { icon: faUsers, label: 'Team', active: false },
    { icon: faUserCircle, label: 'Profiel', active: false },
  ];

  return (
    <div
      className="flex justify-around p-3 border-t bg-white sticky bottom-0"
      style={{ borderColor: colors.borderColor, backgroundColor: colors.cardBg }}
    >
      {navItems.map((item) => (
        <a
          key={item.label}
          href="#"
          className={`flex flex-col items-center text-xs p-1 ${
            item.active ? 'font-bold' : ''
          }`}
          style={{ color: item.active ? colors.primary : colors.subtleText }}
        >
          <FontAwesomeIcon icon={item.icon} className="text-xl mb-1" />
          <span>{item.label}</span>
        </a>
      ))}
    </div>
  );
};

// --- Hoofd Component ---

const CrewMobileHome: React.FC<CrewMobileHomeProps> = ({
  userName,
  notificationCount,
  importantMessage,
  shifts,
  hoursChartData,
}) => {
  // Gebruik de dummy data als er geen props worden meegegeven (voor standalone gebruik)
  const props = {
    userName,
    notificationCount,
    importantMessage,
    shifts,
    hoursChartData,
  };

  return (
    // De buitenste div simuleert de mobiele frame voor de mockup,
    // maar in een echte app zou dit de root van de component zijn.
    // We houden de styling zo dat het eruitziet als de mockup, maar
    // zonder de vaste afmetingen van de 'mobile-frame' voor betere responsiviteit.
    <div
      className="min-h-screen w-full max-w-md mx-auto flex flex-col"
      style={{ backgroundColor: colors.cardBg, fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header */}
      <header
        className="flex justify-between items-center p-4 border-b sticky top-0 z-10 bg-white"
        style={{ borderColor: colors.borderColor, backgroundColor: colors.cardBg }}
      >
        <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
          Hallo, {props.userName}!
        </h1>
        <div className="relative cursor-pointer" style={{ color: colors.subtleText }}>
          <FontAwesomeIcon icon={faBell} className="text-xl" />
          {props.notificationCount > 0 && (
            <span
              className="absolute -top-1 -right-1 text-white text-xs font-semibold rounded-full px-1"
              style={{ backgroundColor: colors.destructive, lineHeight: 1 }}
            >
              {props.notificationCount}
            </span>
          )}
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-grow p-4 overflow-y-auto pb-20" style={{ backgroundColor: colors.cardBg }}>
        {/* Notificaties / Belangrijke Meldingen */}
        <div
          className="bg-white rounded-xl p-4 mb-5 shadow-md border-l-4"
          style={{
            borderColor: colors.warning,
            backgroundColor: colors.cardBg,
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
            borderLeftWidth: '5px',
          }}
        >
          <div className="flex items-center mb-2" style={{ color: colors.warning }}>
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-lg" />
            <h2 className="text-base font-semibold">Belangrijke Melding</h2>
          </div>
          <p className="text-sm" style={{ color: colors.text }}>
            {props.importantMessage}
          </p>
        </div>

        {/* Aankomende Shifts */}
        <Card title="Aankomende Shifts" icon={faCalendarAlt} titleColor={colors.text}>
          <div className="divide-y" style={{ borderColor: colors.borderColor }}>
            {props.shifts.map((shift, index) => (
              <ShiftItem key={shift.id} shift={shift} />
            ))}
          </div>
        </Card>

        {/* Data-gedreven inzicht: Uren deze maand */}
        <Card title="Gewerkt deze maand" icon={faChartBar} titleColor={colors.text}>
          <HoursChart data={props.hoursChartData} />
          <p className="text-center text-sm mt-3" style={{ color: colors.subtleText }}>
            Totaal:
            <span
              className="font-bold ml-1"
              style={{ color: colors.primary }}
            >
              {props.hoursChartData.totalHours} uur
            </span>
            van {props.hoursChartData.goalHours} uur doel.
          </p>
        </Card>

        {/* Snelkoppelingen */}
        <Card title="Snelkoppelingen" icon={faBolt} titleColor={colors.text}>
          <div className="flex justify-around text-center">
            <a
              href="#"
              className="flex flex-col items-center text-xs p-1"
              style={{ color: colors.secondary }}
            >
              <FontAwesomeIcon icon={faExchangeAlt} className="text-2xl mb-1" />
              <span>Ruilen</span>
            </a>
            <a
              href="#"
              className="flex flex-col items-center text-xs p-1"
              style={{ color: colors.success }}
            >
              <FontAwesomeIcon icon={faPlusCircle} className="text-2xl mb-1" />
              <span>Beschikbaarheid</span>
            </a>
            <a
              href="#"
              className="flex flex-col items-center text-xs p-1"
              style={{ color: colors.destructive }}
            >
              <FontAwesomeIcon icon={faUserTimes} className="text-2xl mb-1" />
              <span>Ziek melden</span>
            </a>
          </div>
        </Card>
      </main>

      {/* Navigatiebalk */}
      <NavBar />
    </div>
  );
};

// Exporteer de component met de dummy data als default props
// Dit maakt de component direct bruikbaar en testbaar.
export default CrewMobileHome;

// Optioneel: Een wrapper component om de dummy data te gebruiken
export const CrewMobileHomeWithDummyData: React.FC = () => (
  <CrewMobileHome {...DUMMY_DATA} />
);