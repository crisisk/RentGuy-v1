export interface EventInput {
  id: string
  title: string
  start: string | Date
  end?: string | Date | null
  allDay?: boolean
  extendedProps?: Record<string, unknown>
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  [key: string]: unknown
}
