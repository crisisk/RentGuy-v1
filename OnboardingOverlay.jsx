/**
 * @ts-check
 */
import { forwardRef } from 'react'
import OverlayComponent from '@ui/OnboardingOverlay'

export * from '@ui/OnboardingOverlay'

/**
 * @typedef {{
 *   email?: string | null
 *   onClose?: () => void
 *   onSnooze?: () => void
 *   onFinish?: () => void
 * }} OnboardingOverlayProps
 */

const OverlayComponentUnsafe = /** @type {any} */ (OverlayComponent)

/**
 * @param {OnboardingOverlayProps} props
 * @param {import('react').RefObject<HTMLDivElement> | ((node: HTMLDivElement | null) => void) | null} ref
 */
function OnboardingOverlayProxyComponent(props, ref) {
  return <OverlayComponentUnsafe ref={ref} {...props} />
}

const OnboardingOverlayProxy = forwardRef(OnboardingOverlayProxyComponent)

OnboardingOverlayProxy.displayName = OverlayComponentUnsafe.displayName ?? 'OnboardingOverlay'

export default OnboardingOverlayProxy
