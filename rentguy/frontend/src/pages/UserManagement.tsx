import React, { useState, useEffect } from 'react';
import { usersAPI } from '../api/users';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faKey, faEye, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

interface Session {
  id: string;
  ipAddress: string;
  device: string;
  lastActivity: Date;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
  sessions: Session[];
  isActive: boolean;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        const [usersRes, rolesRes, permissionsRes] = await Promise.all([
          usersAPI.getAll(),
          usersAPI.getRoles(),
          usersAPI.getPermissions()
        ]);
        setUsers(usersRes);
        setRoles(rolesRes);
        setPermissions(permissionsRes);
      } catch (err) {
        setError('Kon gegevens niet laden');
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, []);

  const handleSaveUser = async (userData: User) => {
    try {
      if (userData.id) {
        await usersAPI.update(userData.id, userData);
      } else {
        await usersAPI.create(userData);
      }
      setShowEditModal(false);
      loadData();
    } catch (err) {
      setError('Opslaan mislukt');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Weet u zeker dat u deze gebruiker wilt verwijderen?')) {
      try {
        await usersAPI.delete(userId);
        loadData();
      } catch (err) {
        setError('Verwijderen mislukt');
      }
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        usersAPI.getAll(),
        usersAPI.getRoles()
      ]);
      setUsers(usersRes);
      setRoles(rolesRes);
    } catch (err) {
      setError('Kon gegevens niet vernieuwen');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="mr-dj-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-background">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="heading-rentguy text-3xl mb-8">Gebruikersbeheer</h1>

        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => { setSelectedUser(null); setShowEditModal(true); }}
            className="btn-rentguy bg-rentguy-success"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Nieuwe Gebruiker
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
            <div key={user.id} className="card-rentguy p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-foreground font-bold text-lg">{user.name}</h3>
                  <p className="text-gray-600">{user.email}</p>
                </div>
                <span className={`badge ${user.isActive ? 'bg-rentguy-success' : 'bg-rentguy-destructive'}`}>
                  {user.isActive ? 'Actief' : 'Inactief'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                  className="btn-rentguy bg-rentguy-secondary"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="btn-rentguy bg-rentguy-destructive"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
                <button
                  onClick={() => { setSelectedUser(user); setShowPermissionsModal(true); }}
                  className="btn-rentguy bg-rentguy-primary"
                >
                  <FontAwesomeIcon icon={faKey} />
                </button>
                <button className="btn-rentguy bg-rentguy-warning">
                  <FontAwesomeIcon icon={faEye} />
                </button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold mb-2">Actieve Sessies ({user.sessions.length})</h4>
                {user.sessions.map(session => (
                  <div key={session.id} className="text-sm text-gray-600">
                    {session.device} - {session.ipAddress}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="card-rentguy p-6 w-full max-w-md">
              <h2 className="heading-rentguy text-xl mb-4">
                {selectedUser ? 'Gebruiker Bewerken' : 'Nieuwe Gebruiker'}
              </h2>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(selectedUser!); }}>
                <div className="space-y-4">
                  <input
                    className="input-mr-dj w-full"
                    placeholder="Naam"
                    value={selectedUser?.name || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser!, name: e.target.value })}
                  />
                  <input
                    className="input-mr-dj w-full"
                    placeholder="Email"
                    type="email"
                    value={selectedUser?.email || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser!, email: e.target.value })}
                  />
                  <select
                    className="input-mr-dj w-full"
                    value={selectedUser?.role?.id || ''}
                    onChange={(e) => setSelectedUser({ 
                      ...selectedUser!, 
                      role: roles.find(r => r.id === e.target.value)! 
                    })}
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn-rentguy bg-rentguy-destructive"
                  >
                    <FontAwesomeIcon icon={faTimes} className="mr-2" />
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="btn-rentguy bg-rentguy-success"
                  >
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                    Opslaan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};