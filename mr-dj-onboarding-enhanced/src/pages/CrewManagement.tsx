import React from 'react';
import { CrewMember } from '../types';

const CrewManagement: React.FC = () => {
  const crewMembers: CrewMember[] = [
    {
      id: '1',
      name: 'Jan de Vries',
      role: 'Senior Technicus',
      skills: ['Audio', 'Licht', 'LED'],
      availability: 85,
      performance: 9.2,
      upcomingProjects: 3
    },
    {
      id: '2',
      name: 'Lisa Bakker',
      role: 'Licht Specialist',
      skills: ['Licht', 'DMX'],
      availability: 60,
      performance: 8.7,
      upcomingProjects: 5
    },
    {
      id: '3',
      name: 'Mark Jansen',
      role: 'Audio Engineer',
      skills: ['Audio', 'Mixing', 'FOH'],
      availability: 90,
      performance: 9.5,
      upcomingProjects: 2
    },
    {
      id: '4',
      name: 'Sophie de Jong',
      role: 'Allround Technicus',
      skills: ['Audio', 'Video'],
      availability: 35,
      performance: 8.9,
      upcomingProjects: 6
    }
  ];

  const getAvailabilityColor = (availability: number) => {
    if (availability >= 70) return 'bg-green-500';
    if (availability >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 9.0) return 'text-green-600';
    return 'text-blue-600';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Crew Management</h1>
        <div className="flex items-center gap-3 bg-white border-2 border-gray-200 px-5 py-3 rounded-lg w-96">
          <i className="fas fa-search text-gray-400"></i>
          <input
            type="text"
            placeholder="Zoek crew op naam of vaardigheid..."
            className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Crew Table */}
      <div className="bg-white shadow-sm">
        <div className="grid grid-cols-[2.5fr_1.5fr_1fr_1fr_1.5fr] gap-6 px-6 py-4 bg-gray-100 text-sm font-bold text-gray-600 uppercase tracking-wide">
          <div>Crew Lid</div>
          <div>Vaardigheden</div>
          <div>Beschikbaarheid</div>
          <div>Prestatie</div>
          <div>Komende Projecten</div>
        </div>
        {crewMembers.map((member) => (
          <div
            key={member.id}
            className="grid grid-cols-[2.5fr_1.5fr_1fr_1fr_1.5fr] gap-6 px-6 py-6 border-b border-gray-200 hover:bg-gray-50 transition-colors items-center"
          >
            {/* Crew Info */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {getInitials(member.name)}
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-base mb-1">
                  {member.name}
                </div>
                <div className="text-sm text-gray-500">{member.role}</div>
              </div>
            </div>

            {/* Skills */}
            <div className="flex gap-2 flex-wrap">
              {member.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-gray-200 text-gray-900 text-xs font-semibold rounded"
                >
                  {skill}
                </span>
              ))}
            </div>

            {/* Availability */}
            <div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full ${getAvailabilityColor(member.availability)}`}
                  style={{ width: `${member.availability}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600">{member.availability}% beschikbaar</div>
            </div>

            {/* Performance */}
            <div className={`text-2xl font-bold ${getPerformanceColor(member.performance)}`}>
              {member.performance}
            </div>

            {/* Upcoming Projects */}
            <div className="text-sm text-gray-600">{member.upcomingProjects} projecten</div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-5 mt-8">
        <button className="flex items-center gap-3 bg-blue-500 text-white px-8 py-4 text-base font-semibold rounded-lg hover:bg-blue-600 transition-colors">
          <i className="fas fa-user-plus"></i>
          Nieuwe Crew Toevoegen
        </button>
        <button className="flex items-center gap-3 bg-green-500 text-white px-8 py-4 text-base font-semibold rounded-lg hover:bg-green-600 transition-colors">
          <i className="fas fa-calendar-check"></i>
          Bekijk Beschikbaarheidskalender
        </button>
      </div>
    </div>
  );
};

export default CrewManagement;

