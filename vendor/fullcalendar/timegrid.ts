export interface FullCalendarPlugin {
  name: string
  displayName: string
}

export default function timeGridPlugin(): FullCalendarPlugin {
  return { name: 'timeGrid', displayName: 'Tijd raster' }
}
