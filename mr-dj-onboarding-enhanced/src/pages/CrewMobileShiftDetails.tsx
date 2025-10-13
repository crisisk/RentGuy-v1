import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faBuilding, faLocationDot, faExclamationTriangle, faUserHeadset, faBoxOpen, faCheckCircle, faTimesCircle, faPhone, faMapMarkerAlt, faUserCircle, IconDefinition } from '@fortawesome/free-solid-svg-icons';

// --- 1. TypeScript Interfaces ---

interface DetailItem {
  icon: IconDefinition;
  title: string;
  value: string;
  isWarning?: boolean;
}

interface ContactPerson {
  name: string;
  role: string;
  phoneNumber: string;
}

interface ChecklistItem {
  text: string;
  isCompleted: boolean;
}

interface ShiftData {
  title: string;
  details: DetailItem[];
  contact: ContactPerson;
  checklist: ChecklistItem[];
}

// --- 2. Dummy Data (Mock Data) ---

const DUMMY_SHIFT_DATA: ShiftData = {
  title: "Crew Mobile: Shift Details",
  details: [
    {
      icon: faCalendarAlt,
      title: "Datum & Tijd",
      value: "Vrijdag 18 Oktober 2025, 08:00 - 17:00",
    },
    {
      icon: faBuilding,
      title: "Klant & Project",
      value: "Mollie B.V. - Kantoorverhuizing Amsterdam",
    },
    {
      icon: faLocationDot,
      title: "Adres",
      value: "Keizersgracht 313, 1016 EE Amsterdam",
    },
    {
      icon: faExclamationTriangle,
      title: "Opmerkingen",
      value: "Toegang via de achterzijde. Meld je bij de portier.",
      isWarning: true,
    },
  ],
  contact: {
    name: "Jasper van der Velde",
    role: "Projectleider Mollie",
    phoneNumber: "+31612345678",
  },
  checklist: [
    { text: "Veiligheidsschoenen (verplicht)", isCompleted: true },
    { text: "RentGuy Bedrijfskleding", isCompleted: true },
    { text: "ID-kaart / Paspoort", isCompleted: true },
    { text: "Handschoenen", isCompleted: true },
    { text: "Lunchpakket & Waterfles", isCompleted: true },
    { text: "Mobiele Telefoon (opgeladen)", isCompleted: true },
    { text: "Geen zware tassen meenemen", isCompleted: false },
  ],
};

// --- 3. Component Helpers ---

const DetailCardItem: React.FC<{ item: DetailItem }> = ({ item }) => {
  const borderColor = item.isWarning ? 'border-l-amber-500' : 'border-l-blue-500';
  const iconColor = item.isWarning ? 'text-amber-500' : 'text-blue-500';

  return (
    <div className={`flex items-center mb-5 p-4 rounded-lg bg-gray-50 border-l-4 ${borderColor}`}>
      <FontAwesomeIcon icon={item.icon} className={`text-xl mr-4 w-7 text-center ${iconColor}`} />
      <div className="detail-content">
        <strong className="block text-lg font-semibold text-gray-800">{item.title}</strong>
        <span className="block text-sm text-gray-600">{item.value}</span>
      </div>
    </div>
  );
};

const ContactCard: React.FC<{ contact: ContactPerson }> = ({ contact }) => {
  return (
    <div className="text-center p-8 rounded-xl mt-5 bg-indigo-600 text-white shadow-lg">
      <FontAwesomeIcon icon={faUserCircle} className="text-6xl mb-4 text-white" />
      <h3 className="m-0 text-2xl font-bold">{contact.name}</h3>
      <p className="mb-5 text-lg opacity-90">{contact.role}</p>
      <a
        href={`tel:${contact.phoneNumber}`}
        className="inline-flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg text-base font-semibold transition duration-300"
      >
        <FontAwesomeIcon icon={faPhone} className="mr-2" /> Bel {contact.name.split(' ')[0]}
      </a>
    </div>
  );
};

const Checklist: React.FC<{ items: ChecklistItem[] }> = ({ items }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
      <ul className="list-none p-0 m-0">
        {items.map((item, index) => (
          <li
            key={index}
            className={`flex items-center py-3 text-base ${index < items.length - 1 ? 'border-b border-gray-200' : ''} ${!item.isCompleted ? 'text-red-600' : 'text-gray-800'}`}
          >
            <FontAwesomeIcon
              icon={item.isCompleted ? faCheckCircle : faTimesCircle}
              className={`mr-4 text-xl ${item.isCompleted ? 'text-green-500' : 'text-red-500'}`}
            />
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

// --- 4. Main Component ---

const CrewMobileShiftDetails: React.FC<{ data?: ShiftData }> = ({ data = DUMMY_SHIFT_DATA }) => {
  // Tailwind CSS Custom Colors (based on HTML style block)
  const primaryColor = 'text-blue-500'; // var(--primary-color: #007AFF)
  const textColor = 'text-gray-900'; // var(--text-color: #1C1C1E)

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 lg:p-10 flex justify-center items-start">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 box-border">
        
        {/* Header */}
        <h1 className={`text-3xl sm:text-4xl font-extrabold ${primaryColor} mb-4 pb-3 border-b-4 border-blue-500`}>
          {data.title}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          
          {/* Left Column: Main Details */}
          <div className="lg:col-span-2">
            
            {/* Location & Time Section */}
            <h2 className={`text-2xl font-bold ${textColor} mb-5 flex items-center`}>
              <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-3 text-xl" /> Locatie & Tijd
            </h2>
            <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
              {data.details.map((item, index) => (
                <DetailCardItem key={index} item={item} />
              ))}
            </div>

            {/* Contact Person Section */}
            <h2 className={`text-2xl font-bold ${textColor} mb-5 mt-8 flex items-center`}>
              <FontAwesomeIcon icon={faUserHeadset} className="mr-3 text-xl" /> Contactpersoon ter Plaatse
            </h2>
            <ContactCard contact={data.contact} />
          </div>

          {/* Right Column: Checklist & Mock Chart */}
          <div className="lg:col-span-1">
            
            {/* Checklist Section */}
            <h2 className={`text-2xl font-bold ${textColor} mb-5 flex items-center`}>
              <FontAwesomeIcon icon={faBoxOpen} className="mr-3 text-xl" /> Paklijst & Benodigdheden
            </h2>
            <Checklist items={data.checklist} />

            {/* Mock Chart Section */}
            <h2 className={`text-2xl font-bold ${textColor} mb-5 mt-8 flex items-center`}>
              <FontAwesomeIcon icon={faChartBar} className="mr-3 text-xl" /> Taakvoortgang (Mock)
            </h2>
            <div className="h-48 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex justify-center items-center text-gray-500 italic p-4">
              <p className="text-center">
                Geen Chart.js visualisatie vereist voor deze slide, focus ligt op details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrewMobileShiftDetails;