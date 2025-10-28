import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { formatDate } from '../../core/storage'
import projectStore, { type ProjectDetails as StoreProjectDetails } from '../../stores/projectStore'

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const formatDateLabel = (dateString?: string) =>
    dateString
      ? formatDate(dateString, {
          year: 'numeric',
          month: 'long',
          day: '2-digit',
        })
      : '—'

  useEffect(() => {
    const loadProject = async () => {
      try {
        if (!id) return
        const data = await projectStore.getProjectById(id)
        if (data) {
          setProject(data)
        } else {
          setError('Project not found')
        }
      } catch {
        setError('Failed to load project')
        navigate('/projects')
      } finally {
        setIsLoading(false)
      }
    }

    loadProject()
  }, [id, navigate])

  if (isLoading) {
    return <div className="p-4 text-center">Loading project details...</div>
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>
  }

  if (!project) {
    return <div className="p-4 text-center">Project not found</div>
  }

  return (
    <div className="p-4 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">{project.name}</h1>
        <p className="text-gray-600 mb-4">{project.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-gray-500">Start Date:</label>
            <p className="font-medium">{formatDateLabel(project.startDate)}</p>
          </div>
          <div>
            <label className="text-gray-500">End Date:</label>
            <p className="font-medium">
              {project.endDate ? formatDateLabel(project.endDate) : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Crew Members</h2>
        {project.crewMembers.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Role</th>
                <th className="text-left p-2">Email</th>
              </tr>
            </thead>
            <tbody>
              {project.crewMembers.map((member) => (
                <tr key={member.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{member.name}</td>
                  <td className="p-2">{member.role}</td>
                  <td className="p-2">{member.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No crew members assigned</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Equipment</h2>
        {project.equipment.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {project.equipment.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{item.name}</td>
                  <td className="p-2">{item.type}</td>
                  <td className="p-2">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No equipment assigned</p>
        )}
      </div>
    </div>
  )
}

export default ProjectDetails
