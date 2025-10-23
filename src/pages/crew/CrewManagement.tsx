import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import crewStore from '../../stores/crewStore'

interface CrewMember {
  id: string
  name: string
  availability: string
  skills: string[]
  rate: number
}

const CrewManagement: React.FC = () => {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')

  useEffect(() => {
    const loadCrew = async () => {
      try {
        await crewStore.fetchCrew()
        const members = crewStore.getCrew()
        setCrewMembers(members)
      } catch {
        setError('Failed to load crew members')
      } finally {
        setLoading(false)
      }
    }
    loadCrew()
  }, [])

  const filterMembers = (member: CrewMember) => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSkill = !selectedSkill || member.skills.includes(selectedSkill)
    return matchesSearch && matchesSkill
  }

  const checkAvailability = (dateString: string) => {
    const today = new Date()
    const availableDate = new Date(dateString)
    return availableDate >= today ? 'Available' : 'Unavailable'
  }

  const skills = Array.from(new Set(crewMembers.flatMap((m) => m.skills)))

  if (loading) return <div className="p-4 text-center">Loading...</div>
  if (error) return <div className="p-4 text-red-500">{error}</div>

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Search crew..."
          className="p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="p-2 border rounded"
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
        >
          <option value="">All Skills</option>
          {skills.map((skill) => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Availability</th>
              <th className="px-4 py-2 text-left">Skills</th>
              <th className="px-4 py-2 text-left">Daily Rate</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {crewMembers.filter(filterMembers).map((member) => (
              <tr key={member.id} className="border-b">
                <td className="px-4 py-2">{member.name}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded ${checkAvailability(member.availability) === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {checkAvailability(member.availability)}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {member.skills.map((skill) => (
                      <span key={skill} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2">${member.rate.toLocaleString()}</td>
                <td className="px-4 py-2">
                  <Link to={`/crew/${member.id}`} className="text-blue-500 hover:text-blue-700">
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {crewMembers.filter(filterMembers).length === 0 && (
          <div className="p-4 text-center text-gray-500">No crew members found</div>
        )}
      </div>
    </div>
  )
}

export default CrewManagement
