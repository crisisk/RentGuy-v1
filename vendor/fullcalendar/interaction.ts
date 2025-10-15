export interface EventDropArg {
  event: {
    id: string
    title: string
    startStr: string
    endStr: string | null
    start: Date
    end: Date | null
  }
  revert(): void
}

export interface FullCalendarPlugin {
  name: string
  displayName: string
}

export default function interactionPlugin(): FullCalendarPlugin {
  return { name: 'interaction', displayName: 'Interacties' }
}
