import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import projectStore, { type ProjectStatus } from '../../stores/projectStore'

interface ProjectFormProps {}

type ProjectFormData = {
  id?: string
  name: string
  description: string
  startDate: string
  endDate?: string
  status: ProjectStatus
  client?: string
}

const todayIsoDate = () => new Date().toISOString().slice(0, 10)

const ProjectForm: React.FC<ProjectFormProps> = () => {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    startDate: todayIsoDate(),
    status: 'PLANNING',
  })

  const [loading, setLoading] = useState<boolean>(!!id)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      const fetchProject = async () => {
        try {
          const project = await projectStore.getProjectById(id)
          if (project) {
            setFormData({
              id: project.id,
              name: project.name,
              description: project.description,
              startDate: project.startDate,
              status: project.status,
              ...(project.endDate ? { endDate: project.endDate } : {}),
              ...(project.client ? { client: project.client } : {}),
            })
          }
          setLoading(false)
        } catch {
          setError('Failed to load project')
          setLoading(false)
        }
      }
      fetchProject()
    } else {
      setLoading(false)
    }
  }, [id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'status' ? (value as ProjectStatus) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (id) {
        const { id: _unusedId, ...updatePayload } = formData
        await projectStore.updateProject({ id, ...updatePayload })
      } else {
        const { id: _unused, ...createPayload } = formData
        await projectStore.createProject(createPayload)
      }
      navigate('/projects')
    } catch {
      setError('Failed to save project')
      setLoading(false)
    }
  }

  const validateForm = () => {
    return formData.name.trim().length > 0 && formData.description.trim().length > 0
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">{id ? 'Edit Project' : 'Create New Project'}</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Project Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate ?? ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Project Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
          >
            {(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'] as ProjectStatus[]).map(
              (status) => (
                <option key={status} value={status}>
                  {status
                    .replace('_', ' ')
                    .toLowerCase()
                    .replace(/(^|\s)\w/g, (char) => char.toUpperCase())}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!validateForm()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {id ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProjectForm
