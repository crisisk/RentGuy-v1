export interface CrewMemberInput {
  readonly name: string
  readonly role?: string
  readonly phone?: string | null
  readonly email?: string | null
  readonly active?: boolean
}

export interface CrewMember {
  readonly id: number
  readonly name: string
  readonly role: string
  readonly phone?: string | null
  readonly email?: string | null
  readonly active: boolean
}

export interface CrewBookingInput {
  readonly projectId: number
  readonly crewId: number
  readonly start: string
  readonly end: string
  readonly role?: string
}

export interface CrewBooking {
  readonly id: number
  readonly projectId: number
  readonly crewId: number
  readonly start: string
  readonly end: string
  readonly role: string
  readonly status: string
}

export interface CrewLocationUpdate {
  readonly userId: number
  readonly latitude: number
  readonly longitude: number
  readonly projectId?: number | null
  readonly accuracy?: number | null
  readonly speed?: number | null
  readonly heading?: number | null
}

export interface CrewLocationBroadcast {
  readonly userId: number
  readonly latitude: number
  readonly longitude: number
  readonly timestamp: string
  readonly projectId?: number | null
  readonly accuracy?: number | null
  readonly speed?: number | null
  readonly heading?: number | null
}
