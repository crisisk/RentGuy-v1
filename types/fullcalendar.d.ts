declare module '@fullcalendar/react' {
  const FullCalendar: any
  export default FullCalendar
}

declare module '@fullcalendar/daygrid' {
  const plugin: any
  export default plugin
}

declare module '@fullcalendar/timegrid' {
  const plugin: any
  export default plugin
}

declare module '@fullcalendar/interaction' {
  export interface EventDropArg {
    event: {
      id: string
      title: string
      startStr: string
      endStr: string
      start: Date
      end: Date | null
    }
    revert(): void
  }
  const plugin: any
  export default plugin
}

declare module '@fullcalendar/core' {
  export interface EventInput {
    id?: string
    title?: string
    start?: string | Date
    end?: string | Date | null
    allDay?: boolean
    extendedProps?: Record<string, unknown>
  }
}
