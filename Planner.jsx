import { forwardRef } from 'react'
import PlannerComponent from './src/ui/Planner.jsx'

export * from './src/ui/Planner.jsx'

const PlannerProxy = forwardRef(function PlannerProxy(props, ref) {
  return <PlannerComponent ref={ref} {...props} />
})

PlannerProxy.displayName = PlannerComponent.displayName ?? 'Planner'

export default PlannerProxy
