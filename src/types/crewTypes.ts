export type CrewRole = 'dj' | 'technician' | 'driver' | 'roadie' | 'support' | string

export interface CrewMember {
  id: string
  name: string
  role: CrewRole
  email?: string
  phone?: string
  skills: string[]
  status: 'available' | 'assigned' | 'unavailable'
  hoursThisMonth: number
  shiftCount: number
  preferredRegions: string[]
}

export interface ShiftAssignment {
  id: string
  projectId: string
  crewId: string
  start: string
  end: string
  location: string
  status: 'scheduled' | 'in_progress' | 'complete' | 'cancelled'
  notes?: string
}

export interface CrewCalendarDay {
  date: string
  assignments: ShiftAssignment[]
  coverageScore: number
  issues: string[]
}

export interface CrewAlert {
  id: string
  type: 'conflict' | 'overtime' | 'unassigned' | 'timeoff'
  message: string
  severity: 'info' | 'warning' | 'critical'
  createdAt: string
}
