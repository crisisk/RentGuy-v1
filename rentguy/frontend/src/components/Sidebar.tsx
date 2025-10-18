import { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebarStore } from './Navigation';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

/**
 * Mobile sidebar component
 */
export const Sidebar = () => {
  const { isSidebarOpen, closeSidebar } = useSidebarStore();
  const location = useLocation();

  if (!isSidebarOpen) return null;

  return (
    <div
      className="lg:hidden fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30"
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar content */}
      <div className="relative bg-white w-64 min-h-full p-6 transform transition-transform duration-300 ease-in-out translate-x-0">
        {/* Sluitknop */}
        <button
          onClick={closeSidebar}
          className="absolute top-4 right-4 p-1 text-gray-500 hover:text-rentguy-blue"
          aria-label="Sluit menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Navigatie links */}
        <nav className="mt-12 space-y-4">
          {useSidebarStore.getState().navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = isActive ? item.activeIcon : item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`flex items-center space-x-3 p-2 rounded-lg ${
                  isActive
                    ? 'bg-rentguy-blue/10 text-rentguy-blue'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}

          {/* Uitloggen */}
          <button
            className="w-full flex items-center space-x-3 p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
            aria-label="Uitloggen"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
            <span className="text-sm font-medium">Uitloggen</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

/**
 * TEST SCENARIOS:
 * 
 * 1. Desktop Navigation:
 * - Controleer of alle navigatielinks zichtbaar zijn op desktop
 * - Verifieer actieve states bij routewijziging
 * - Test hover states en kleurveranderingen
 * - Controleer of uitlogknop werkt
 * 
 * 2. Mobile Navigation:
 * - Open sidebar via hamburger menu
 * - Verifieer overlay en sliding animation
 * - Klik op navigatielink en controleer of sidebar sluit
 * - Test sluiten via close button en overlay
 * - Controleer of actieve states correct zijn
 * 
 * 3. Accessibility:
 * - Screenreader test voor ARIA labels
 * - Keyboard navigatie door menu items
 * - Juiste aria-expanded state
 * 
 * 4. Responsive Design:
 * - Schakel tussen desktop/mobile viewports
 * - Test verschillende schermgroottes
 * - Landscape orientatie op mobiel
 * 
 * 5. Edge Cases:
 * - Zeer lange navigatieteksten
 * - Gelijktijdige routewijzigingen
 * - Offline scenario test
 */