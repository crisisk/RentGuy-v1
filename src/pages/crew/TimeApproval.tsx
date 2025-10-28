import React, { useState, useEffect } from 'react'
import { formatDate } from '../../core/storage'
import crewStore from '../../stores/crewStore'

interface TimeEntry {
  id: string
  date: string
  hours: number
  description: string
  status: 'pending' | 'approved' | 'rejected'
  user: {
    id: string
    name: string
  }
}

const TimeApproval: React.FC = () => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const entries = await crewStore.getTimeEntries()
        setTimeEntries(entries)
      } catch {
        setErrorMessage('Failed to load time entries')
      } finally {
        setIsLoading(false)
      }
    }
    loadEntries()
  }, [])

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setTimeEntries((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, status } : entry)),
      )
      await crewStore.updateTimeEntry(id, status)
    } catch {
      setErrorMessage('Failed to update entry')
      setTimeEntries((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, status: 'pending' } : entry)),
      )
    }
  }

  const formatEntryDate = (dateString: string) =>
    formatDate(dateString, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })

  if (isLoading) {
    return <div className="p-4 text-center text-gray-600">Loading time entries...</div>
  }

  if (errorMessage) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-md">{errorMessage}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Time Approval Requests</h1>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Hours
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {timeEntries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-6 py-4 whitespace-nowrap">{formatEntryDate(entry.date)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{entry.user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{entry.hours}</td>
                <td className="px-6 py-4 whitespace-nowrap max-w-xs truncate">
                  {entry.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs 
                    ${
                      entry.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : entry.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {entry.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  {entry.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(entry.id, 'approved')}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(entry.id, 'rejected')}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {timeEntries.length === 0 && (
          <div className="p-4 text-center text-gray-500">No time entries found</div>
        )}
      </div>
    </div>
  )
}

export default TimeApproval
