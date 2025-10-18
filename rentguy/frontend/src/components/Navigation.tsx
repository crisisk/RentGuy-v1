import { FC } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { create } from 'zustand';
import { HomeIcon, UserIcon, Cog6ToothIcon, BellIcon, DocumentTextIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, UserIcon as UserIconSolid, Cog6ToothIcon as Cog6ToothIconSolid, BellIcon as BellIconSolid, DocumentTextIcon as DocumentTextIconSolid } from '@heroicons/react/24/solid';

/**
 * Zustand store voor het beheren van de sidebar state
 */
interface SidebarStore {
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isSidebarOpen: false,
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
}));

/**
 * Type definitie voor navigatie items
 */
type NavigationItem = {
  name: string;
  path: string;
  icon: FC<{ className: string }>;
  activeIcon: FC<{ className: string }>;
};

/**
 * Navigatie items array met Nederlandse labels
 */
const navigationItems: NavigationItem[] = [
  {
    name: 'Start',
    path: '/',
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
  },
  {
    name: 'Mijn Profiel',
    path: '/profile',
    icon: UserIcon,
    activeIcon: UserIconSolid,
  },
  {
    name: 'Contracten',
    path: '/contracts',
    icon: DocumentTextIcon,
    activeIcon: DocumentTextIconSolid,
  },
  {
    name: 'Notificaties',
    path: '/notifications',
    icon: BellIcon,
    activeIcon: BellIconSolid,
  },
  {
    name: 'Instellingen',
    path: '/settings',
    icon: Cog6ToothIcon,
    activeIcon: Cog6ToothIconSolid,
  },
];

/**
 * Hoofd navigatie component voor desktop en mobile header
 */
export const Navigation = () => {
  const location = useLocation();
  const { openSidebar, isSidebarOpen } = useSidebarStore();

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:block bg-white shadow-sm fixed top-0 left-0 right-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex-shrink-0 font-bold text-2xl text-rentguy-blue">
              RentGuy
            </div>

            {/* Navigatie links */}
            <div className="flex space-x-8">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = isActive ? item.activeIcon : item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1 text-sm ${
                      isActive
                        ? 'text-rentguy-blue font-semibold'
                        : 'text-gray-600 hover:text-rentguy-blue'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Uitlogknop */}
            <button
              className="flex items-center space-x-1 text-gray-600 hover:text-rentguy-blue"
              aria-label="Uitloggen"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span className="text-sm">Uitloggen</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Button */}
      <button
        onClick={openSidebar}
        className="lg:hidden fixed top-4 right-4 p-2 z-50 bg-white rounded-lg shadow-md"
        aria-label="Open menu"
        aria-controls="mobile-sidebar"
        aria-expanded={isSidebarOpen}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
};