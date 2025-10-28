import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatDate } from '../../core/storage'
import projectStore from '../../stores/projectStore'

interface Project {
  id: string
  name: string
  status: string
  createdAt: string
  teamSize: number
}

const ProjectOverview: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const fetchedProjects = await projectStore.getProjects()
        setProjects(fetchedProjects)
      } catch {
        setError('Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const filterProjects = (projects: Project[]): Project[] => {
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (statusFilter === 'all' || project.status === statusFilter),
    )
  }

  const formatDateLabel = (dateString: string): string =>
    formatDate(dateString, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    })

  if (loading) {
    return (
      <div
        className="flex justify-center items-center h-screen"
        data-testid="project-overview-loading"
      >
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
        data-testid="project-overview-error"
      >
        {error}
      </div>
    )
  }

  const filteredProjects = filterProjects(projects)

  return (
    <div className="container mx-auto px-4 py-8" data-testid="project-overview-root">
      <div
        className="flex flex-col md:flex-row justify-between mb-6"
        data-testid="project-overview-filters"
      >
        <input
          type="text"
          placeholder="Search projects..."
          className="w-full md:w-1/3 px-3 py-2 border rounded-md mb-2 md:mb-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="project-overview-search"
        />
        <select
          className="w-full md:w-1/4 px-3 py-2 border rounded-md"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          data-testid="project-overview-status-filter"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="overflow-x-auto" data-testid="project-overview-table-wrapper">
        <table
          className="w-full bg-white shadow-md rounded-lg overflow-hidden"
          data-testid="project-overview-table"
        >
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Project Name</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Status</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Created</th>
              <th className="px-4 py-3 text-left">Team Size</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody data-testid="project-overview-body">
            {filteredProjects.map((project) => (
              <tr
                key={project.id}
                className="border-b hover:bg-gray-50"
                data-testid={`project-overview-row-${project.id}`}
              >
                <td className="px-4 py-3" data-testid={`project-overview-name-${project.id}`}>
                  {project.name}
                </td>
                <td
                  className="px-4 py-3 hidden md:table-cell"
                  data-testid={`project-overview-status-${project.id}`}
                >
                  <span
                    className={`
                    px-2 py-1 rounded-full text-xs font-semibold
                    ${
                      project.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }
                  `}
                    data-testid={`project-overview-status-badge-${project.id}`}
                  >
                    {project.status}
                  </span>
                </td>
                <td
                  className="px-4 py-3 hidden md:table-cell"
                  data-testid={`project-overview-created-${project.id}`}
                >
                  {formatDateLabel(project.createdAt)}
                </td>
                <td className="px-4 py-3" data-testid={`project-overview-team-${project.id}`}>
                  {project.teamSize}
                </td>
                <td
                  className="px-4 py-3 text-right"
                  data-testid={`project-overview-actions-${project.id}`}
                >
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-blue-600 hover:text-blue-800"
                    data-testid={`project-overview-view-${project.id}`}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProjects.length === 0 && (
          <div className="text-center py-6 text-gray-500" data-testid="project-overview-empty">
            No projects found
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectOverview
