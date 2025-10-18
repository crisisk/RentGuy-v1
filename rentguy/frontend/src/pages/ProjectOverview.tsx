import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../api/projects';
import { config } from '../config/env';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faEdit, faTrash, faFilter } from '@fortawesome/free-solid-svg-icons';

interface Project {
  id: string;
  name: string;
  customer: string;
  startDate: string;
  endDate: string;
  status: 'concept' | 'actief' | 'voltooid' | 'geannuleerd';
  description: string;
}

interface ProjectFormData {
  name: string;
  customer: string;
  startDate: string;
  endDate: string;
  status: string;
  description: string;
}

export const ProjectOverview: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    customer: '',
    startDate: '',
    endDate: '',
    status: 'concept',
    description: ''
  });

  useEffect(() => {
    loadData();
    const ws = new WebSocket(config.getWsUrl('/ws/projects'));
    ws.onmessage = (event) => {
      setProjects(JSON.parse(event.data));
    };
    return () => ws.close();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await projectsAPI.getAll();
      setProjects(result);
    } catch (error) {
      console.error('Fout bij laden projecten:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await projectsAPI.delete(id);
      loadData();
    } catch (error) {
      console.error('Fout bij verwijderen project:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedProject) {
        await projectsAPI.update(selectedProject.id, formData);
      } else {
        await projectsAPI.create(formData);
      }
      loadData();
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Fout bij opslaan project:', error);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesDate = dateFilter ? project.startDate === dateFilter : true;
    const matchesCustomer = customerFilter ? project.customer === customerFilter : true;
    
    return matchesSearch && matchesStatus && matchesDate && matchesCustomer;
  });

  const statusColors = {
    concept: 'bg-rentguy-warning',
    actief: 'bg-rentguy-success',
    voltooid: 'bg-rentguy-secondary',
    geannuleerd: 'bg-rentguy-destructive'
  };

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
        <div className="flex items-center justify-between mb-8">
          <h1 className="heading-rentguy text-3xl">Projectoverzicht</h1>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-rentguy bg-rentguy-primary text-white hover:bg-blue-600"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Nieuw Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Zoek project..."
              className="input-mr-dj w-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400" />
          </div>
          <select 
            className="input-mr-dj"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Alle Statussen</option>
            <option value="concept">Concept</option>
            <option value="actief">Actief</option>
            <option value="voltooid">Voltooid</option>
            <option value="geannuleerd">Geannuleerd</option>
          </select>
          <input
            type="date"
            className="input-mr-dj"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="card-rentguy p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                  <p className="text-sm text-gray-500">{project.customer}</p>
                </div>
                <span className={`${statusColors[project.status]} text-white px-2 py-1 rounded-full text-sm`}>
                  {project.status}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm"><span className="font-medium">Start:</span> {new Date(project.startDate).toLocaleDateString()}</p>
                <p className="text-sm"><span className="font-medium">Eind:</span> {new Date(project.endDate).toLocaleDateString()}</p>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setSelectedProject(project);
                    setFormData(project);
                    setIsEditModalOpen(true);
                  }}
                  className="btn-rentguy bg-rentguy-secondary text-white"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="btn-rentguy bg-rentguy-destructive text-white"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {(isCreateModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="card-rentguy p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{selectedProject ? 'Bewerk Project' : 'Nieuw Project'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Projectnaam"
                    className="input-mr-dj w-full"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Klant"
                    className="input-mr-dj w-full"
                    value={formData.customer}
                    onChange={(e) => setFormData({...formData, customer: e.target.value})}
                    required
                  />
                  <textarea
                    placeholder="Omschrijving"
                    className="input-mr-dj w-full"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                  <select
                    className="input-mr-dj w-full"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="concept">Concept</option>
                    <option value="actief">Actief</option>
                    <option value="voltooid">Voltooid</option>
                    <option value="geannuleerd">Geannuleerd</option>
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="date"
                      className="input-mr-dj"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      required
                    />
                    <input
                      type="date"
                      className="input-mr-dj"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setIsEditModalOpen(false);
                    }}
                    className="btn-rentguy bg-gray-500 text-white"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="btn-rentguy bg-rentguy-primary text-white"
                  >
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