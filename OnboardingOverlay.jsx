import { forwardRef } from 'react'
import OverlayComponent from './src/ui/OnboardingOverlay.jsx'

export * from './src/ui/OnboardingOverlay.jsx'

const OnboardingOverlayProxy = forwardRef(function OnboardingOverlayProxy(props, ref) {
  return <OverlayComponent ref={ref} {...props} />
})

OnboardingOverlayProxy.displayName = OverlayComponent.displayName ?? 'OnboardingOverlay'

export default OnboardingOverlayProxy
