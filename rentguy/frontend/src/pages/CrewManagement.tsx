import React, { useState, useEffect } from 'react';
import { crewAPI } from '../api/crew';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCalendarDays, faCertificate, faMagnifyingGlass, faFilter } from '@fortawesome/free-solid-svg-icons';

interface Certificate {
  id: string;
  name: string;
  expiration: Date;
}

interface CrewMember {
  id: string;
  name: string;
  email: string;
  certificates: Certificate[];
  availability: Date[];
  skills: string[];
  status: 'beschikbaar' | 'niet-beschikbaar' | 'onderhoud';
}

export const CrewManagement: React.FC = () => {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('alle');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<CrewMember | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await crewAPI.getAll();
      setCrew(result);
    } catch (err) {
      setError('Fout bij laden crewgegevens');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMember = async (member: CrewMember) => {
    try {
      if (member.id) {
        await crewAPI.update(member.id, member);
      } else {
        await crewAPI.create(member);
      }
      loadData();
      setShowModal(false);
    } catch (err) {
      setError('Opslaan mislukt');
    }
  };

  const filteredCrew = crew.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'alle' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="mr-dj-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="heading-rentguy mb-8">
          <h1 className="text-3xl font-bold">Crewbeheer</h1>
        </div>

        {error && (
          <div className="bg-rentguy-destructive text-white p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="card-rentguy p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Zoek crewlid..."
                className="input-mr-dj pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFilter} className="text-gray-600" />
              <select 
                className="input-mr-dj"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="alle">Alle statussen</option>
                <option value="beschikbaar">Beschikbaar</option>
                <option value="niet-beschikbaar">Niet beschikbaar</option>
                <option value="onderhoud">Onderhoud</option>
              </select>
            </div>
            <button 
              className="btn-rentguy bg-rentguy-primary hover:bg-rentguy-secondary"
              onClick={() => setShowModal(true)}
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Nieuwe Crewlid
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCrew.map(member => (
              <div key={member.id} className="card-rentguy p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    member.status === 'beschikbaar' ? 'bg-rentguy-success' :
                    member.status === 'niet-beschikbaar' ? 'bg-rentguy-destructive' :
                    'bg-rentguy-warning'
                  }`}>
                    {member.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{member.email}</p>
                
                <div className="mb-3">
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    <FontAwesomeIcon icon={faCertificate} className="text-rentguy-secondary" />
                    Certificaten
                  </h4>
                  {member.certificates.map(cert => (
                    <div key={cert.id} className="text-sm flex justify-between items-center">
                      <span>{cert.name}</span>
                      <span className={`${
                        new Date(cert.expiration) < new Date() ? 'text-rentguy-destructive' :
                        new Date(cert.expiration) < new Date(Date.now() + 12096e5) ? 'text-rentguy-warning' :
                        'text-rentguy-success'
                      }`}>
                        {new Date(cert.expiration).toLocaleDateString('nl-NL')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mb-3">
                  <h4 className="font-medium mb-1">Vaardigheden</h4>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map(skill => (
                      <span key={skill} className="px-2 py-1 bg-rentguy-secondary text-white rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    <FontAwesomeIcon icon={faCalendarDays} className="text-rentguy-primary" />
                    Beschikbaarheid
                  </h4>
                  <div className="text-sm">
                    {member.availability.slice(0, 3).map(date => (
                      <div key={date.toString()}>
                        {new Date(date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                    ))}
                    {member.availability.length > 3 && (
                      <div className="text-rentguy-primary">+ {member.availability.length - 3} meer</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showModal && (
          <CrewModal 
            member={editingMember}
            onClose={() => {
              setShowModal(false);
              setEditingMember(null);
            }}
            onSave={handleSaveMember}
          />
        )}
      </div>
    </div>
  );
};

const CrewModal: React.FC<{
  member?: CrewMember | null;
  onClose: () => void;
  onSave: (member: CrewMember) => void;
}> = ({ member, onClose, onSave }) => {
  const [formState, setFormState] = useState<CrewMember>(member || {
    id: '',
    name: '',
    email: '',
    certificates: [],
    availability: [],
    skills: [],
    status: 'beschikbaar'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formState);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="card-rentguy p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">
          {member ? 'Bewerk Crewlid' : 'Nieuw Crewlid'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 mb-6">
            <div>
              <label className="block mb-2">Naam</label>
              <input
                type="text"
                className="input-mr-dj w-full"
                value={formState.name}
                onChange={e => setFormState({...formState, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block mb-2">Email</label>
              <input
                type="email"
                className="input-mr-dj w-full"
                value={formState.email}
                onChange={e => setFormState({...formState, email: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block mb-2">Status</label>
              <select
                className="input-mr-dj w-full"
                value={formState.status}
                onChange={e => setFormState({...formState, status: e.target.value as any})}
              >
                <option value="beschikbaar">Beschikbaar</option>
                <option value="niet-beschikbaar">Niet beschikbaar</option>
                <option value="onderhoud">Onderhoud</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Vaardigheden (komma gescheiden)</label>
              <input
                type="text"
                className="input-mr-dj w-full"
                value={formState.skills.join(', ')}
                onChange={e => setFormState({...formState, skills: e.target.value.split(',').map(s => s.trim())})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              className="btn-rentguy bg-rentguy-destructive"
              onClick={onClose}
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="btn-rentguy bg-rentguy-success"
            >
              Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};