export interface FullCalendarPlugin {
  name: string
  displayName: string
}

export default function dayGridPlugin(): FullCalendarPlugin {
  return { name: 'dayGrid', displayName: 'Dag raster' }
}
