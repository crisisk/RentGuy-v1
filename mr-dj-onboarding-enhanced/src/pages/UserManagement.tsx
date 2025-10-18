import React, { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'crew' | 'finance';
  status: 'active' | 'inactive';
  lastLogin: string;
  avatar?: string;
}

interface Permission {
  id: string;
  module: string;
  view: boolean;
  edit: boolean;
  delete: boolean;
}

const UserManagement: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const users: User[] = [
    {
      id: '1',
      name: 'Bart van de Weijer',
      email: 'bart@mrdj.nl',
      role: 'admin',
      status: 'active',
      lastLogin: '2 minuten geleden'
    },
    {
      id: '2',
      name: 'Emma Jansen',
      email: 'emma@mrdj.nl',
      role: 'finance',
      status: 'active',
      lastLogin: '1 uur geleden'
    },
    {
      id: '3',
      name: 'Jan de Vries',
      email: 'jan@mrdj.nl',
      role: 'crew',
      status: 'active',
      lastLogin: '3 uur geleden'
    },
    {
      id: '4',
      name: 'Lisa Bakker',
      email: 'lisa@mrdj.nl',
      role: 'crew',
      status: 'active',
      lastLogin: '5 uur geleden'
    },
    {
      id: '5',
      name: 'Mark Jansen',
      email: 'mark@mrdj.nl',
      role: 'manager',
      status: 'inactive',
      lastLogin: '2 weken geleden'
    }
  ];

  const rolePermissions: Record<User['role'], Permission[]> = {
    admin: [
      { id: '1', module: 'Dashboard', view: true, edit: true, delete: true },
      { id: '2', module: 'Projecten', view: true, edit: true, delete: true },
      { id: '3', module: 'Crew Management', view: true, edit: true, delete: true },
      { id: '4', module: 'Materiaal', view: true, edit: true, delete: true },
      { id: '5', module: 'Financieel', view: true, edit: true, delete: true },
      { id: '6', module: 'Instellingen', view: true, edit: true, delete: true }
    ],
    manager: [
      { id: '1', module: 'Dashboard', view: true, edit: false, delete: false },
      { id: '2', module: 'Projecten', view: true, edit: true, delete: false },
      { id: '3', module: 'Crew Management', view: true, edit: true, delete: false },
      { id: '4', module: 'Materiaal', view: true, edit: true, delete: false },
      { id: '5', module: 'Financieel', view: true, edit: false, delete: false },
      { id: '6', module: 'Instellingen', view: false, edit: false, delete: false }
    ],
    finance: [
      { id: '1', module: 'Dashboard', view: true, edit: false, delete: false },
      { id: '2', module: 'Projecten', view: true, edit: false, delete: false },
      { id: '3', module: 'Crew Management', view: false, edit: false, delete: false },
      { id: '4', module: 'Materiaal', view: false, edit: false, delete: false },
      { id: '5', module: 'Financieel', view: true, edit: true, delete: false },
      { id: '6', module: 'Instellingen', view: false, edit: false, delete: false }
    ],
    crew: [
      { id: '1', module: 'Dashboard', view: true, edit: false, delete: false },
      { id: '2', module: 'Projecten', view: true, edit: false, delete: false },
      { id: '3', module: 'Crew Management', view: false, edit: false, delete: false },
      { id: '4', module: 'Materiaal', view: false, edit: false, delete: false },
      { id: '5', module: 'Financieel', view: false, edit: false, delete: false },
      { id: '6', module: 'Instellingen', view: false, edit: false, delete: false }
    ]
  };

  const getRoleBadge = (role: User['role']) => {
    const badges = {
      admin: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Admin', icon: 'fa-crown' },
      manager: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Manager', icon: 'fa-user-tie' },
      finance: { bg: 'bg-green-100', text: 'text-green-800', label: 'Finance', icon: 'fa-euro-sign' },
      crew: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Crew', icon: 'fa-users' }
    };
    return badges[role];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Gebruikersbeheer</h1>
          <p className="text-gray-600">Beheer gebruikers en toegangsrechten</p>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
        >
          <i className="fas fa-user-plus mr-2"></i>
          Nieuwe Gebruiker
        </button>
      </div>

      <div className="grid grid-cols-[1fr_400px] gap-8">
        {/* User List */}
        <div className="bg-white shadow-sm">
          <div className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr] gap-4 px-6 py-4 bg-gray-100 text-sm font-bold text-gray-600 uppercase tracking-wide">
            <div>Gebruiker</div>
            <div>Email</div>
            <div>Rol</div>
            <div>Laatste Login</div>
            <div>Status</div>
          </div>
          {users.map(user => {
            const roleBadge = getRoleBadge(user.role);
            
            return (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr] gap-4 px-6 py-5 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer items-center ${
                  selectedUser?.id === user.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <span className="font-semibold text-gray-900">{user.name}</span>
                </div>
                <div className="text-sm text-gray-600">{user.email}</div>
                <div>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold ${roleBadge.bg} ${roleBadge.text}`}>
                    <i className={`fas ${roleBadge.icon}`}></i>
                    {roleBadge.label}
                  </span>
                </div>
                <div className="text-sm text-gray-600">{user.lastLogin}</div>
                <div>
                  <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                    user.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status === 'active' ? 'Actief' : 'Inactief'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* User Details / Permissions */}
        <div className="bg-white p-6 shadow-sm h-fit sticky top-8">
          {selectedUser ? (
            <>
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {selectedUser.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-lg mb-1">{selectedUser.name}</div>
                  <div className="text-sm text-gray-600">{selectedUser.email}</div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-4">Toegangsrechten</h3>
              <div className="space-y-3">
                {rolePermissions[selectedUser.role].map(permission => (
                  <div key={permission.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900 mb-3">{permission.module}</div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${
                          permission.view ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          {permission.view && <i className="fas fa-check text-white text-xs"></i>}
                        </div>
                        <span className="text-sm text-gray-600">Bekijken</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${
                          permission.edit ? 'bg-blue-500' : 'bg-gray-300'
                        }`}>
                          {permission.edit && <i className="fas fa-check text-white text-xs"></i>}
                        </div>
                        <span className="text-sm text-gray-600">Bewerken</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${
                          permission.delete ? 'bg-red-500' : 'bg-gray-300'
                        }`}>
                          {permission.delete && <i className="fas fa-check text-white text-xs"></i>}
                        </div>
                        <span className="text-sm text-gray-600">Verwijderen</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <button className="w-full px-4 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
                  <i className="fas fa-edit mr-2"></i>
                  Bewerk Gebruiker
                </button>
                <button className="w-full px-4 py-2.5 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors">
                  <i className="fas fa-key mr-2"></i>
                  Reset Wachtwoord
                </button>
                {selectedUser.status === 'active' ? (
                  <button className="w-full px-4 py-2.5 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors">
                    <i className="fas fa-ban mr-2"></i>
                    Deactiveer Gebruiker
                  </button>
                ) : (
                  <button className="w-full px-4 py-2.5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors">
                    <i className="fas fa-check-circle mr-2"></i>
                    Activeer Gebruiker
                  </button>
                )}
                <button className="w-full px-4 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors">
                  <i className="fas fa-trash mr-2"></i>
                  Verwijder Gebruiker
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-user-circle text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">Selecteer een gebruiker om details te bekijken</p>
            </div>
          )}
        </div>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-4 gap-6 mt-8">
        {[
          { role: 'admin', count: users.filter(u => u.role === 'admin').length, color: 'purple' },
          { role: 'manager', count: users.filter(u => u.role === 'manager').length, color: 'blue' },
          { role: 'finance', count: users.filter(u => u.role === 'finance').length, color: 'green' },
          { role: 'crew', count: users.filter(u => u.role === 'crew').length, color: 'gray' }
        ].map(({ role, count, color }) => {
          const badge = getRoleBadge(role as User['role']);
          
          return (
            <div key={role} className={`bg-white p-6 shadow-sm border-l-4 border-${color}-500`}>
              <div className="flex items-center gap-3 mb-3">
                <i className={`fas ${badge.icon} text-${color}-500 text-xl`}></i>
                <span className="font-bold text-gray-700 uppercase text-sm">{badge.label}</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600 mt-1">
                {count === 1 ? 'gebruiker' : 'gebruikers'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserManagement;

