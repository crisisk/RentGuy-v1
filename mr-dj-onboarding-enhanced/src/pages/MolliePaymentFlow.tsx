import React from 'react';
import { FaFileInvoiceDollar, FaLink, FaCreditCard, FaCheckCircle, FaServer, FaBell } from 'react-icons/fa';

// 1. TypeScript Interfaces
interface FlowStep {
  id: number;
  title: string;
  description: string;
  type: 'system' | 'mollie';
  icon: React.ElementType;
  gridColumn: string;
}

interface WebhookStep {
  title: string;
  description: string;
  icon: React.ElementType;
}

// 2. Dummy Data
const FLOW_STEPS: FlowStep[] = [
  {
    id: 1,
    title: '1. Offerte Acceptatie',
    description: 'Klant accepteert offerte in RentGuy portaal.',
    type: 'system',
    icon: FaFileInvoiceDollar,
    gridColumn: 'col-span-1',
  },
  {
    id: 2,
    title: '2. Mollie Betalingslink',
    description: 'RentGuy creëert transactie via Mollie API.',
    type: 'system',
    icon: FaLink,
    gridColumn: 'col-span-1',
  },
  {
    id: 3,
    title: '3. Betaling Uitvoering',
    description: "Klant betaalt via Mollie's checkout.",
    type: 'mollie',
    icon: FaCreditCard,
    gridColumn: 'col-span-1',
  },
  {
    id: 4,
    title: '4. Status Verwerking',
    description: 'RentGuy verwerkt de definitieve betalingsstatus.',
    type: 'system',
    icon: FaCheckCircle,
    gridColumn: 'col-span-1',
  },
];

const WEBHOOK_ENDPOINT: WebhookStep = {
  title: 'Webhook Endpoint',
  description: 'RentGuy ontvangt en valideert de statusupdate.',
  icon: FaServer,
};

// 3. Componenten
const FlowCard: React.FC<{ step: FlowStep }> = ({ step }) => {
  const isSystem = step.type === 'system';
  const IconComponent = step.icon;

  const borderColor = isSystem ? 'border-indigo-500' : 'border-green-500';
  const iconColor = isSystem ? 'text-indigo-500' : 'text-green-500';

  return (
    <div className={`flow-step flex flex-col items-center text-center relative z-10 ${step.gridColumn}`}>
      <div
        className={`flow-card bg-white rounded-xl shadow-xl p-6 w-full min-h-[150px] flex flex-col justify-center items-center border-b-4 ${borderColor} transition-all duration-300 hover:translate-y-[-5px] hover:shadow-2xl`}
      >
        <IconComponent className={`text-5xl mb-4 ${iconColor}`} />
        <div className="flow-title font-bold text-xl mb-1 text-gray-800">{step.title}</div>
        <div className="flow-description text-sm text-gray-500">{step.description}</div>
      </div>
    </div>
  );
};

const MainFlowPath: React.FC = () => {
  // De lijnen en pijlen tussen de 4 stappen
  // De grid heeft 4 kolommen. Er zijn 3 pijlen tussen de stappen.
  // We gebruiken absolute positionering binnen de flow-diagram container.
  return (
    <div className="absolute top-[100px] left-0 w-full h-1 bg-transparent z-5">
      {/* Arrow 1: Step 1 -> Step 2 */}
      <div className="absolute left-[12.5%] w-[25%] h-1 bg-blue-500">
        <div className="absolute w-0 h-0 border-t-[8px] border-b-[8px] border-l-[12px] border-t-transparent border-b-transparent border-l-blue-500 right-[-12px] top-[-7.5px]"></div>
      </div>
      {/* Arrow 2: Step 2 -> Step 3 */}
      <div className="absolute left-[37.5%] w-[25%] h-1 bg-blue-500">
        <div className="absolute w-0 h-0 border-t-[8px] border-b-[8px] border-l-[12px] border-t-transparent border-b-transparent border-l-blue-500 right-[-12px] top-[-7.5px]"></div>
      </div>
      {/* Arrow 3: Step 3 -> Step 4 */}
      <div className="absolute left-[62.5%] w-[25%] h-1 bg-blue-500">
        <div className="absolute w-0 h-0 border-t-[8px] border-b-[8px] border-l-[12px] border-t-transparent border-b-transparent border-l-blue-500 right-[-12px] top-[-7.5px]"></div>
      </div>
    </div>
  );
};

const WebhookFlow: React.FC = () => {
  // De webhook flow is complex en vereist absolute positionering.
  // De flow start bij Step 3 (Mollie) en eindigt bij Step 4 (Verwerking).
  // Step 3 is gecentreerd op 62.5% (50% + 1/8 van de breedte)
  // Step 4 is gecentreerd op 87.5% (75% + 1/8 van de breedte)
  // De webhook endpoint kaart is gecentreerd op 37.5% (25% + 1/8 van de breedte)

  const lineStyle = 'border-indigo-500 border-dashed';
  const arrowColor = 'border-indigo-500';

  return (
    <div className="absolute top-[250px] left-0 w-full h-[200px] z-5">
      {/* Webhook Label */}
      <div className="absolute top-[-20px] left-1/2 transform -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white rounded-md text-sm font-semibold whitespace-nowrap z-15 shadow-lg">
        <FaBell className="inline mr-2" /> Mollie Webhook Notificatie
      </div>

      {/* 1. Line from Mollie (Step 3) down */}
      <div className={`absolute left-[62.5%] top-0 w-0 h-[50px] border-l-2 ${lineStyle}`}>
        <div className={`absolute w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent ${arrowColor} bottom-[-8px] left-[-6px]`}></div>
      </div>

      {/* 2. Horizontal line from down to endpoint area */}
      <div className={`absolute left-[37.5%] top-[50px] w-[25%] h-0 border-t-2 ${lineStyle}`}></div>

      {/* 3. Webhook Endpoint Card */}
      <div className="absolute top-[100px] left-[37.5%] transform -translate-x-1/2 w-[200px] z-10">
        <div className="bg-white rounded-lg p-4 shadow-xl border-2 border-indigo-500 text-sm font-semibold text-indigo-500 flex flex-col items-center min-h-[80px]">
          <FaServer className="text-3xl mb-1" />
          <div className="font-bold">{WEBHOOK_ENDPOINT.title}</div>
          <div className="text-xs text-gray-500 text-center">{WEBHOOK_ENDPOINT.description}</div>
        </div>
      </div>

      {/* 4. Arrow from Webhook Endpoint to Step 4 */}
      {/* Line from 37.5% to 87.5% */}
      <div className={`absolute top-[140px] left-[37.5%] w-[50%] h-0 border-t-2 ${lineStyle}`}>
        {/* Arrow head pointing right at the end of the line (87.5%) */}
        <div className={`absolute w-0 h-0 border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent ${arrowColor} right-[-8px] top-[-6px]`}></div>
      </div>
    </div>
  );
};

// 4. Hoofdcomponent
const MolliePaymentFlow: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen p-10 md:p-20">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-600 mb-12 text-center">
          Mollie Integratie: De Betalingsstroom
        </h1>

        <div className="flow-diagram grid grid-cols-4 gap-8 md:gap-10 relative pt-20 pb-40">
          {/* Main Flow Steps */}
          {FLOW_STEPS.map((step) => (
            <FlowCard key={step.id} step={step} />
          ))}

          {/* Main Flow Arrows */}
          <MainFlowPath />

          {/* Webhook Flow (positioned absolutely relative to flow-diagram) */}
          <WebhookFlow />
        </div>
      </div>
    </div>
  );
};

export default MolliePaymentFlow;