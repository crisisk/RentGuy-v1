import React from 'react';
import { FaCheckCircle, FaChartLine, FaShieldAlt, FaClock } from 'react-icons/fa';

// 1. TypeScript Interfaces
interface SummaryCardData {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
}

interface RoadmapItemData {
  phase: number;
  status: 'complete' | 'next' | 'future';
  title: string;
  description: string;
  duration?: string;
}

interface ConclusionRoadmapProps {
  summaryCards: SummaryCardData[];
  roadmap: RoadmapItemData[];
  footerText: string;
  footerSpan: string;
}

// 2. Dummy Data
const DUMMY_SUMMARY_CARDS: SummaryCardData[] = [
  {
    icon: FaCheckCircle,
    iconColor: 'text-blue-500', // primary-color
    title: 'Robuuste Integratie',
    description:
      'De Mollie & Crew Modules bieden een naadloze, veilige en schaalbare integratie met de bestaande systemen, wat de operationele efficiëntie verhoogt.',
  },
  {
    icon: FaChartLine,
    iconColor: 'text-green-500', // success-color
    title: 'Meetbare Impact',
    description:
      'Verwachte reductie van handmatige fouten met 35% en een versnelling van de financiële afstemming met 50%.',
  },
  {
    icon: FaShieldAlt,
    iconColor: 'text-indigo-500', // secondary-color
    title: 'Toekomstbestendig',
    description:
      'De modulaire architectuur maakt eenvoudige uitbreiding en aanpassing aan toekomstige betaalmethoden en regelgeving mogelijk.',
  },
];

const DUMMY_ROADMAP: RoadmapItemData[] = [
  {
    phase: 1,
    status: 'complete',
    title: 'Fase 1: Proof of Concept (PoC)',
    description:
      'Voltooid. Succesvolle validatie van de kernfunctionaliteit en data-uitwisseling tussen Mollie en Crew.',
  },
  {
    phase: 2,
    status: 'next',
    title: 'Fase 2: Beta-Implementatie',
    description:
      'Uitrol naar een geselecteerde groep gebruikers (Beta-groep). Focus op het verzamelen van feedback en het oplossen van bugs.',
    duration: 'Geschatte duur: 4 weken',
  },
  {
    phase: 3,
    status: 'future',
    title: 'Fase 3: Volledige Productie',
    description:
      'Algemene beschikbaarheid (GA) van de modules voor alle gebruikers. Monitoring van prestaties en stabiliteit.',
  },
  {
    phase: 4,
    status: 'future',
    title: 'Fase 4: Optimalisatie & Uitbreiding',
    description:
      'Integratie van geavanceerde functies (bijv. geautomatiseerde reconciliatie) en ondersteuning voor nieuwe Mollie-diensten.',
  },
];

const DUMMY_PROPS: ConclusionRoadmapProps = {
  summaryCards: DUMMY_SUMMARY_CARDS,
  roadmap: DUMMY_ROADMAP,
  footerText: 'Presentatie: Mollie & Crew Modules |',
  footerSpan: 'RentGuy Project',
};

// 3. Component Implementation
const SummaryCard: React.FC<SummaryCardData> = ({ icon: Icon, iconColor, title, description }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg transition duration-200 hover:shadow-xl border-l-4 border-blue-500">
      <Icon className={`text-4xl mb-4 ${iconColor}`} />
      <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
};

const RoadmapItem: React.FC<RoadmapItemData> = ({ phase, status, title, description, duration }) => {
  const statusClasses = {
    complete: {
      dot: 'bg-green-500',
      title: 'text-green-500',
      line: 'border-green-500',
    },
    next: {
      dot: 'bg-yellow-500',
      title: 'text-yellow-500',
      line: 'border-yellow-500',
    },
    future: {
      dot: 'bg-gray-400',
      title: 'text-gray-400',
      line: 'border-gray-400',
    },
  };

  const { dot, title: titleColor } = statusClasses[status];

  return (
    <div className="relative pl-12">
      {/* Phase Dot */}
      <div
        className={`absolute left-[-20px] top-0 w-10 h-10 ${dot} text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md ring-4 ring-gray-50`}
      >
        {phase}
      </div>

      <h3 className={`text-xl font-semibold mb-1 ${titleColor}`}>{title}</h3>
      <p className="text-gray-700 mb-1">{description}</p>
      {duration && (
        <p className="mt-1 text-sm text-yellow-500 flex items-center">
          <FaClock className="mr-2" /> {duration}
        </p>
      )}
    </div>
  );
};

const ConclusionRoadmap: React.FC<ConclusionRoadmapProps> = ({
  summaryCards,
  roadmap,
  footerText,
  footerSpan,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 md:p-10 lg:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-600 mb-6 pb-3 border-b-4 border-indigo-500">
          Conclusie & Implementatie Roadmap
        </h1>

        {/* Summary Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mt-8 mb-6">
            Samenvatting van de Oplossing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {summaryCards.map((card, index) => (
              <SummaryCard key={index} {...card} />
            ))}
          </div>
        </section>

        {/* Roadmap Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mt-8 mb-6">
            Implementatie Roadmap
          </h2>
          <div className="flex flex-col gap-8 pl-6 border-l-4 border-gray-300">
            {roadmap.map((item) => (
              <RoadmapItem key={item.phase} {...item} />
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-6 border-t border-gray-200 text-center text-sm text-gray-500 max-w-6xl mx-auto">
        {footerText} <span className="font-semibold text-blue-600">{footerSpan}</span>
      </footer>
    </div>
  );
};

// Export the component with dummy data for easy preview
const ConclusionRoadmapWithDummyData: React.FC = () => (
  <ConclusionRoadmap {...DUMMY_PROPS} />
);

export default ConclusionRoadmapWithDummyData;
// The component name is ConclusionRoadmap, but we export the wrapper for dummy data
// If you need the raw component, export ConclusionRoadmap instead.
// For the purpose of this task, we provide the full, runnable component.
// The actual component name is ConclusionRoadmap.
// Renaming the default export to the requested component name for clarity.
export { ConclusionRoadmap };
// Default export is the one with dummy data for immediate use.
// The component name for the output schema is ConclusionRoadmap.
