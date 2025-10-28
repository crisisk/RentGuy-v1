import React, { useState, useEffect, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import projectStore, { type Project, type ProjectStatus } from '../../stores/projectStore'

const ProjectOverview: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all')

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

  const filterProjects = (projectsToFilter: Project[]): Project[] =>
    projectsToFilter.filter(
      (project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (statusFilter === 'all' || project.status === statusFilter),
    )

  const resolveStatusStyles = (status: ProjectStatus): string => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800'
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const resolveStatusLabel = (status: ProjectStatus): string => {
    switch (status) {
      case 'COMPLETED':
        return 'Completed'
      case 'IN_PROGRESS':
        return 'In progress'
      case 'ON_HOLD':
        return 'On hold'
      default:
        return 'Planning'
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

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
          onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
          data-testid="project-overview-search"
        />
        <select
          className="w-full md:w-1/4 px-3 py-2 border rounded-md"
          value={statusFilter}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setStatusFilter(event.target.value as ProjectStatus | 'all')
          }
          data-testid="project-overview-status-filter"
        >
          <option value="all">All Statuses</option>
          <option value="PLANNING">Planning</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="ON_HOLD">On hold</option>
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
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${resolveStatusStyles(project.status)}`}
                    data-testid={`project-overview-status-badge-${project.id}`}
                  >
                    {resolveStatusLabel(project.status)}
                  </span>
                </td>
                <td
                  className="px-4 py-3 hidden md:table-cell"
                  data-testid={`project-overview-created-${project.id}`}
                >
                  {formatDate(project.startDate)}
                </td>
                <td className="px-4 py-3" data-testid={`project-overview-team-${project.id}`}>
                  —
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
