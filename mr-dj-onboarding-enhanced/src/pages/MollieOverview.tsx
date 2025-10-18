import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCreditCard,
  faCheckCircle,
  faKey,
  faShieldAlt,
  faGlobe,
  faChartLine,
  faHeadset,
  faChartPie,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

// Registreer alle Chart.js componenten
Chart.register(...registerables);

// --- 1. TypeScript Interfaces ---

interface PaymentMethod {
  name: string;
  icon: IconDefinition;
}

interface Feature {
  icon: IconDefinition;
  title: string;
  description: string;
}

interface ChartDataPoint {
  label: string;
  percentage: number;
  color: string;
}

interface MollieOverviewData {
  paymentMethods: PaymentMethod[];
  keyFeatures: Feature[];
  chartData: ChartDataPoint[];
}

// --- 2. Dummy Data (Volgens RentGuy Styling Guide) ---

// Kleuren volgens de RentGuy styling (overgenomen uit de HTML)
const RENTGUY_COLORS = {
  primary: '#007AFF', // Blauw
  secondary: '#5856D6', // Paars
  success: '#34C759', // Groen
  warning: '#FF9500', // Oranje
  destructive: '#FF3B30', // Rood
};

const DUMMY_DATA: MollieOverviewData = {
  paymentMethods: [
    { name: 'iDEAL', icon: faCheckCircle },
    { name: 'Creditcard (Visa, MC, Amex)', icon: faCheckCircle },
    { name: 'Bancontact', icon: faCheckCircle },
    { name: 'PayPal', icon: faCheckCircle },
    { name: 'SEPA Overboeking', icon: faCheckCircle },
    { name: 'Klarna (Achteraf Betalen)', icon: faCheckCircle },
    { name: 'Apple Pay', icon: faCheckCircle },
    { name: 'SOFORT Banking', icon: faCheckCircle },
  ],
  keyFeatures: [
    {
      icon: faShieldAlt,
      title: 'Eenvoudige Integratie',
      description:
        "Snelle en duidelijke API's en plug-ins voor alle grote e-commerce platforms.",
    },
    {
      icon: faGlobe,
      title: 'Internationale Dekking',
      description:
        'Ondersteuning voor lokale en internationale betaalmethoden in heel Europa.',
    },
    {
      icon: faChartLine,
      title: 'Transparante Tarieven',
      description:
        'Pay-per-transaction model zonder verborgen kosten of opstartkosten.',
    },
    {
      icon: faHeadset,
      title: 'Uitstekende Support',
      description:
        'Toegewijde, meertalige ondersteuning voor zowel ontwikkelaars als merchants.',
    },
  ],
  chartData: [
    { label: 'iDEAL', percentage: 45, color: RENTGUY_COLORS.primary },
    { label: 'Creditcard', percentage: 25, color: RENTGUY_COLORS.secondary },
    { label: 'Bancontact', percentage: 15, color: RENTGUY_COLORS.success },
    { label: 'PayPal', percentage: 10, color: RENTGUY_COLORS.warning },
    { label: 'Klarna', percentage: 5, color: RENTGUY_COLORS.destructive },
  ],
};

// --- 3. Subcomponenten ---

const CardTitle: React.FC<{ icon: IconDefinition; title: string }> = ({
  icon,
  title,
}) => (
  <div className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
    <FontAwesomeIcon icon={icon} className="mr-3 text-blue-600" />
    {title}
  </div>
);

const PaymentMethodsCard: React.FC<{ methods: PaymentMethod[] }> = ({
  methods,
}) => (
  <div className="bg-white rounded-xl p-6 shadow-lg transition duration-200 hover:shadow-xl">
    <CardTitle icon={faCreditCard} title="Ondersteunde Betaalmethoden" />
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0">
      {methods.map((method) => (
        <li
          key={method.name}
          className="flex items-center text-gray-600 font-medium text-base"
        >
          <FontAwesomeIcon
            icon={method.icon}
            className="mr-2 text-green-500 flex-shrink-0"
          />
          {method.name}
        </li>
      ))}
    </ul>
  </div>
);

const KeyFeaturesCard: React.FC<{ features: Feature[] }> = ({ features }) => (
  <div className="bg-white rounded-xl p-6 shadow-lg transition duration-200 hover:shadow-xl">
    <CardTitle icon={faKey} title="Key Features" />
    <ul className="list-none p-0">
      {features.map((feature) => (
        <li key={feature.title} className="flex items-start mb-4">
          <FontAwesomeIcon
            icon={feature.icon}
            className="text-purple-600 text-lg mr-3 mt-1 flex-shrink-0"
          />
          <div className="text-gray-700">
            <strong className="text-blue-600">{feature.title}:</strong>{' '}
            {feature.description}
          </div>
        </li>
      ))}
    </ul>
  </div>
);

const PaymentChartCard: React.FC<{ chartData: ChartDataPoint[] }> = ({
  chartData,
}) => {
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
          type: 'doughnut',
          data: {
            labels: chartData.map((d) => d.label),
            datasets: [
              {
                label: 'Transactievolume (%)',
                data: chartData.map((d) => d.percentage),
                backgroundColor: chartData.map((d) => d.color),
                hoverOffset: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
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
  }, [chartData]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg transition duration-200 hover:shadow-xl flex flex-col h-full">
      <CardTitle icon={faChartPie} title="Betaalmethode Populariteit (Dummy Data)" />
      <div className="flex-grow flex items-center justify-center min-h-[300px] md:min-h-0">
        <canvas ref={chartRef} id="paymentChart"></canvas>
      </div>
    </div>
  );
};

// --- 4. Hoofdcomponent ---

const MollieOverview: React.FC = () => {
  const { paymentMethods, keyFeatures, chartData } = DUMMY_DATA;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 md:p-10 font-sans">
      {/* Slide Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-blue-600 mb-6 md:mb-8 border-b-4 border-purple-600 pb-2">
        Mollie Payment Gateway: Overzicht & Kernfunctionaliteiten
      </h1>

      {/* Content Grid - Responsive Design */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 h-full">
        {/* Linker Kolom */}
        <div className="space-y-6 md:space-y-8">
          <PaymentMethodsCard methods={paymentMethods} />
          <KeyFeaturesCard features={keyFeatures} />
        </div>

        {/* Rechter Kolom - Chart */}
        <div className="h-full min-h-[400px] lg:min-h-full">
          <PaymentChartCard chartData={chartData} />
        </div>
      </div>
    </div>
  );
};

export default MollieOverview;