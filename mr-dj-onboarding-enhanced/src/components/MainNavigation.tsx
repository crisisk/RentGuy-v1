import React from 'react'
import { NavigationModule } from '../types'

interface MainNavigationProps {
  currentModule?: string
  onModuleChange?: (moduleId: string) => void
}

const MainNavigation: React.FC<MainNavigationProps> = ({
  currentModule = 'dashboard',
  onModuleChange,
}) => {
  const modules: NavigationModule[] = [
    {
      id: 'dashboard',
      name: 'Executive Dashboard',
      icon: 'fa-crown',
      path: '/dashboard',
      description: "Totaal overzicht & KPI's",
    },
    {
      id: 'planner',
      name: 'Visuele Planner',
      icon: 'fa-calendar-alt',
      path: '/planner',
      description: 'Planning & Scheduling',
      badge: 3,
    },
    {
      id: 'projects',
      name: 'Projecten',
      icon: 'fa-project-diagram',
      path: '/projects',
      description: 'Project Management',
    },
    {
      id: 'crew',
      name: 'Crew Management',
      icon: 'fa-users',
      path: '/crew',
      description: 'Personeelsbeheer',
    },
    {
      id: 'equipment',
      name: 'Materiaal & Inventaris',
      icon: 'fa-box-open',
      path: '/equipment',
      description: 'Equipment Beheer',
    },
    {
      id: 'finance',
      name: 'Financieel',
      icon: 'fa-chart-line',
      path: '/finance',
      description: 'Facturatie & Cashflow',
    },
    {
      id: 'quotes',
      name: 'Offertes',
      icon: 'fa-file-invoice-dollar',
      path: '/quotes',
      description: 'Quote-to-Cash',
      badge: 5,
    },
    {
      id: 'time',
      name: 'Urenregistratie',
      icon: 'fa-clock',
      path: '/time',
      description: 'Tijdregistratie & Goedkeuring',
    },
    {
      id: 'crm',
      name: 'Klanten (CRM)',
      icon: 'fa-address-book',
      path: '/crm',
      description: 'Contactbeheer',
    },
    {
      id: 'reports',
      name: 'Rapportages',
      icon: 'fa-chart-bar',
      path: '/reports',
      description: 'Business Intelligence',
    },
    {
      id: 'settings',
      name: 'Instellingen',
      icon: 'fa-cog',
      path: '/settings',
      description: 'Systeemconfiguratie',
    },
  ]

  return (
    <div className="w-full bg-white border-b border-gray-200" data-testid="main-navigation">
      {/* Top Bar */}
      <div
        className="flex items-center justify-between px-8 py-4 border-b border-gray-100"
        data-testid="main-navigation-top-bar"
      >
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-gray-900">
            Rent<span className="text-blue-500">Guy</span>
          </div>
          <div className="text-sm text-gray-500 border-l border-gray-300 pl-4">
            AV & Events Software
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <i className="fas fa-bell text-gray-400 text-lg cursor-pointer hover:text-blue-500"></i>
            <div className="flex items-center gap-3 border-l border-gray-300 pl-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                B
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Bart van de Weijer</div>
                <div className="text-xs text-gray-500">Admin</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Modules */}
      <div className="px-8 py-2">
        <div className="flex gap-1 overflow-x-auto" data-testid="main-navigation-modules">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => onModuleChange?.(module.id)}
              className={`
                relative flex items-center gap-2 px-4 py-3 rounded-t-lg font-semibold text-sm
                transition-all duration-200 whitespace-nowrap
                ${
                  currentModule === module.id
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
              data-testid={`main-navigation-item-${module.id}`}
            >
              <i className={`fas ${module.icon} text-base`}></i>
              <span>{module.name}</span>
              {module.badge && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {module.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MainNavigation
