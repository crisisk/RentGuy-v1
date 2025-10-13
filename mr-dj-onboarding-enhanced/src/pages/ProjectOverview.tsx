import React, { useState } from 'react';
import { Project } from '../types';

const ProjectOverview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'planned' | 'completed'>('active');

  const projects: Project[] = [
    {
      id: '1',
      name: 'Bruiloft Van der Berg',
      client: 'Van der Berg Familie',
      date: '15 Jan 2025',
      value: 8500,
      margin: 32,
      status: 'active',
      crewAssigned: 4,
      crewRequired: 4
    },
    {
      id: '2',
      name: 'Corporate Event TechCorp',
      client: 'TechCorp BV',
      date: '18 Jan 2025',
      value: 15600,
      margin: 28,
      status: 'active',
      crewAssigned: 6,
      crewRequired: 6
    },
    {
      id: '3',
      name: 'Festival Zomerfeest',
      client: 'Gemeente Utrecht',
      date: '22 Jan 2025',
      value: 42000,
      margin: 18,
      status: 'warning',
      crewAssigned: 12,
      crewRequired: 15
    },
    {
      id: '4',
      name: 'Bedrijfsfeest ACME Inc',
      client: 'ACME Inc',
      date: '25 Jan 2025',
      value: 12300,
      margin: 35,
      status: 'planned',
      crewAssigned: 5,
      crewRequired: 5
    },
    {
      id: '5',
      name: 'Conferentie InnovateTech',
      client: 'InnovateTech',
      date: '28 Jan 2025',
      value: 28900,
      margin: 26,
      status: 'active',
      crewAssigned: 8,
      crewRequired: 8
    }
  ];

  const getStatusBadge = (status: Project['status']) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Actief' },
      planned: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Gepland' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Afgerond' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Crew Tekort' }
    };
    return badges[status];
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 30) return 'text-green-600';
    if (margin >= 20) return 'text-blue-600';
    return 'text-yellow-600';
  };

  const getStatusDot = (status: Project['status']) => {
    const colors = {
      active: 'bg-green-500',
      planned: 'bg-blue-500',
      completed: 'bg-gray-500',
      warning: 'bg-yellow-500'
    };
    return colors[status];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Project Overzicht</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-5 py-2.5 text-sm font-semibold rounded-md transition-colors ${
              activeTab === 'active'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Actief (12)
          </button>
          <button
            onClick={() => setActiveTab('planned')}
            className={`px-5 py-2.5 text-sm font-semibold rounded-md transition-colors ${
              activeTab === 'planned'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Gepland (8)
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-5 py-2.5 text-sm font-semibold rounded-md transition-colors ${
              activeTab === 'completed'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Afgerond (45)
          </button>
        </div>
      </div>

      {/* Project Table */}
      <div className="bg-white shadow-sm">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.2fr] gap-6 px-6 py-4 bg-gray-100 text-sm font-bold text-gray-600 uppercase tracking-wide">
          <div>Projectnaam</div>
          <div>Datum</div>
          <div>Waarde</div>
          <div>Marge</div>
          <div>Crew</div>
          <div>Status</div>
        </div>
        {projects.map((project) => (
          <div
            key={project.id}
            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.2fr] gap-6 px-6 py-5 border-b border-gray-200 hover:bg-gray-50 transition-colors items-center"
          >
            <div className="flex items-center gap-3 font-semibold text-gray-900">
              <span className={`w-2 h-2 rounded-full ${getStatusDot(project.status)}`}></span>
              {project.name}
            </div>
            <div className="text-sm text-gray-600">{project.date}</div>
            <div className="font-bold text-gray-900">€{project.value.toLocaleString()}</div>
            <div className={`font-bold ${getMarginColor(project.margin)}`}>{project.margin}%</div>
            <div className="text-gray-900">{project.crewAssigned}/{project.crewRequired}</div>
            <div>
              <span className={`inline-block px-3 py-1.5 rounded text-xs font-semibold ${getStatusBadge(project.status).bg} ${getStatusBadge(project.status).text}`}>
                {getStatusBadge(project.status).label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-5 mt-8">
        <button className="flex items-center gap-3 bg-blue-500 text-white px-8 py-4 text-base font-semibold rounded-lg hover:bg-blue-600 transition-colors">
          <i className="fas fa-plus-circle"></i>
          Nieuw Project Aanmaken
        </button>
        <button className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 text-base font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
          <i className="fas fa-chart-bar"></i>
          Bekijk Winstgevendheid Analyse
        </button>
      </div>
    </div>
  );
};

export default ProjectOverview;

