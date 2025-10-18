import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faLink, faUsers } from '@fortawesome/free-solid-svg-icons';

// 1. TypeScript Interfaces
interface IconData {
  icon: any; // Using 'any' for FontAwesomeIcon definition, or import specific IconDefinition type
  title: string;
}

interface IntroSlideData {
  mainTitle: string;
  subTitle: string;
  icons: IconData[];
  footerText: string;
}

// 2. Dummy Data for Development
const dummyData: IntroSlideData = {
  mainTitle: "RentGuy: Mollie & Crew Modules",
  subTitle: "Payment Integratie & Crew Management",
  icons: [
    { icon: faCreditCard, title: "Payment Integratie" },
    { icon: faLink, title: "Integratie" },
    { icon: faUsers, title: "Crew Management" },
  ],
  footerText: "Een presentatie door Manus AI, in opdracht van RentGuy.",
};

// 3. Tailwind CSS Styling (based on RentGuy Styling Guide)
// The original CSS variables are mapped to Tailwind classes for a professional, responsive design.
// Primary: #007AFF (blue) -> blue-500/600
// Secondary: #5856D6 (indigo) -> indigo-500/600
// Background: #F9FAFB -> gray-50

const IntroSlide: React.FC<{ data?: IntroSlideData }> = ({ data = dummyData }) => {
  const { mainTitle, subTitle, icons, footerText } = data;

  return (
    // Full screen container, centered content, light background
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900 font-inter p-4 sm:p-8 relative">
      
      {/* Slide Container */}
      <div className="max-w-6xl w-full text-center p-4 sm:p-10">
        
        {/* Main Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-black mb-4 leading-tight">
          {mainTitle}
        </h1>
        
        {/* Subtitle */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-blue-600 mb-10 sm:mb-16">
          {subTitle}
        </h2>

        {/* Icon Bar - Visuele elementen */}
        <div className="flex justify-center gap-8 sm:gap-12 md:gap-16 mt-10 sm:mt-16 text-indigo-600">
          {icons.map((item, index) => (
            <div key={index} className="flex flex-col items-center" title={item.title}>
              <FontAwesomeIcon 
                icon={item.icon} 
                className="text-4xl sm:text-5xl md:text-6xl transition-transform duration-300 hover:scale-110"
              />
              {/* Optional: Add text label below icon for clarity on smaller screens */}
              {/* <span className="mt-2 text-sm font-medium hidden sm:block">{item.title}</span> */}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Text - Fixed at the bottom */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-sm text-gray-500">
        {footerText}
      </div>
    </div>
  );
};

export default IntroSlide;