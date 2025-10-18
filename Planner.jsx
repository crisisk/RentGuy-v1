/**
 * @ts-check
 */
import { forwardRef } from 'react'
import PlannerComponent from '@ui/Planner'

export * from '@ui/Planner'

/**
 * @typedef {{
 *   onLogout?: () => void
 * }} PlannerProps
 */

const PlannerComponentUnsafe = /** @type {any} */ (PlannerComponent)

/**
 * @param {PlannerProps} props
 * @param {import('react').RefObject<HTMLDivElement> | ((node: HTMLDivElement | null) => void) | null} ref
 */
function PlannerProxyComponent(props, ref) {
  return <PlannerComponentUnsafe ref={ref} {...props} />
}

const PlannerProxy = forwardRef(PlannerProxyComponent)

PlannerProxy.displayName = PlannerComponentUnsafe.displayName ?? 'Planner'

export default PlannerProxy
