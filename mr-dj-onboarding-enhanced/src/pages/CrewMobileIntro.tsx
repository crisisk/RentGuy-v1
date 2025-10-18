import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWifi, faBolt, faRocket, faCloudArrowDown, faBell, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

// 1. Interfaces
interface IFeatureCard {
  icon: IconDefinition;
  title: string;
  description: string;
  footerIcon: IconDefinition;
  footerText: string;
  colorClass: string; // Tailwind class for text/background color, e.g., 'text-indigo-600'
}

interface CrewMobileIntroProps {
  title: string;
  subtitle: string;
  features: IFeatureCard[];
}

// 2. Dummy Data
const DUMMY_FEATURES: IFeatureCard[] = [
  {
    icon: faWifi,
    title: "Offline Modus",
    description: "Blijf werken, zelfs zonder internetverbinding. Alle essentiële data en taken worden lokaal gesynchroniseerd en zijn altijd beschikbaar.",
    footerIcon: faCloudArrowDown,
    footerText: "Automatische synchronisatie",
    colorClass: 'text-indigo-600 bg-indigo-500', // Secondary color from HTML: #5856D6
  },
  {
    icon: faBolt,
    title: "Real-time Updates",
    description: "Ontvang onmiddellijk de meest recente planningen, taakwijzigingen en communicatie zodra de verbinding hersteld is.",
    footerIcon: faBell,
    footerText: "Directe notificaties",
    colorClass: 'text-green-600 bg-green-500', // Success color from HTML: #34C759
  },
  {
    icon: faRocket,
    title: "Verbeterde Efficiëntie",
    description: "Stroomlijn dagelijkse taken, verminder administratie en focus op wat echt belangrijk is: het leveren van uitstekende service.",
    footerIcon: faChartLine,
    footerText: "Meetbare productiviteitswinst",
    colorClass: 'text-yellow-600 bg-yellow-500', // Warning color from HTML: #FF9500
  },
];

const DUMMY_DATA: CrewMobileIntroProps = {
  title: "De Crew Mobile App",
  subtitle: "Uw team, altijd verbonden en productief, waar ze ook zijn.",
  features: DUMMY_FEATURES,
};

// 3. Subcomponent for Feature Card
const FeatureCard: React.FC<IFeatureCard> = ({
  icon,
  title,
  description,
  footerIcon,
  footerText,
  colorClass,
}) => {
  // Extract color for icon wrapper background and footer text color
  const iconBgClass = colorClass.split(' ')[1]; // e.g., 'bg-indigo-500'
  const footerTextColorClass = colorClass.split(' ')[0]; // e.g., 'text-indigo-600'

  return (
    <div className="flex-1 max-w-sm bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Icon Wrapper */}
      <div className={`w-16 h-16 rounded-full ${iconBgClass} text-white flex items-center justify-center text-2xl mb-5`}>
        <FontAwesomeIcon icon={icon} />
      </div>

      {/* Title and Description */}
      <h2 className="text-2xl font-bold text-gray-800 mb-3">{title}</h2>
      <p className="text-lg leading-relaxed text-gray-500 mb-5">{description}</p>

      {/* Footer */}
      <p className={`mt-5 text-sm font-semibold ${footerTextColorClass}`}>
        <FontAwesomeIcon icon={footerIcon} className="mr-2" /> {footerText}
      </p>
    </div>
  );
};

// 4. Main Component
const CrewMobileIntro: React.FC<Partial<CrewMobileIntroProps>> = ({
  title = DUMMY_DATA.title,
  subtitle = DUMMY_DATA.subtitle,
  features = DUMMY_DATA.features,
}) => {
  // Primary color from HTML: #007AFF -> text-blue-600
  // Background color from HTML: #F9FAFB -> bg-gray-50
  // Text color from HTML: #1F2937 -> text-gray-800
  // Light text color from HTML: #6B7280 -> text-gray-500

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-8">
      <div className="w-full max-w-6xl text-center">
        {/* Header */}
        <h1 className="text-5xl sm:text-6xl font-extrabold mb-3 text-blue-600">
          {title}
        </h1>
        <p className="text-xl sm:text-2xl font-medium text-gray-500 mb-16">
          {subtitle}
        </p>

        {/* Features Grid */}
        <div className="flex flex-col lg:flex-row justify-center items-stretch gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CrewMobileIntro;

// Opmerking: Voor een Next.js/React project moet Font Awesome geïnstalleerd zijn:
// npm install @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome
// Tailwind CSS configuratie is ook vereist.
// De component gebruikt DUMMY_DATA als standaardwaarden, maar kan overschreven worden via props.