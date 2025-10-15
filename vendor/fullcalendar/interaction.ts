export interface EventDropArg {
  event: {
    id: string
    title: string
    startStr: string
    endStr: string
  }
  revert(): void
}

export default function interactionPlugin() {
  return { name: 'interactionStub' }
}
