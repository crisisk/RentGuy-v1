import React, { useState, useEffect } from 'react'
import crewStore from '../../stores/crewStore'

interface Shift {
  id: string
  employeeName: string
  date: string
  startTime: string
  endTime: string
}

const ShiftSchedule: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ] as const

  const getCurrentWeekDates = (): [string, string, string, string, string, string, string] => {
    const today = new Date()
    const currentDay = today.getDay()
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1)
    const baseDate = new Date(today)

    return Array.from({ length: daysOfWeek.length }, (_, index) => {
      const date = new Date(baseDate)
      date.setDate(diff + index)
      return date.toISOString().split('T')[0]
    }) as [string, string, string, string, string, string, string]
  }

  const weekDates = getCurrentWeekDates()

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const fetchedShifts = await crewStore.getWeeklyShifts(weekDates[0]!, weekDates[6]!)
        setShifts(fetchedShifts)
      } catch {
        setError('Failed to load shifts')
      } finally {
        setLoading(false)
      }
    }

    fetchShifts()
  }, [])

  const getShiftsForDay = (date: string) => {
    return shifts.filter((shift) => shift.date === date)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner-border" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        {error}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Weekly Shift Schedule</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              {daysOfWeek.map((day, index) => (
                <th key={day} className="border border-gray-300 p-2 text-center">
                  {day}
                  <br />
                  <small className="text-gray-500">{weekDates[index]}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {daysOfWeek.map((_, index) => (
                <td key={index} className="border border-gray-300 p-2 align-top">
                  {getShiftsForDay(weekDates[index]!).map((shift) => (
                    <div key={shift.id} className="bg-blue-100 rounded p-2 mb-2">
                      <div className="font-semibold">{shift.employeeName}</div>
                      <div className="text-sm text-gray-600">
                        {shift.startTime} - {shift.endTime}
                      </div>
                    </div>
                  ))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ShiftSchedule
