/**
 * @ts-check
 */
import { forwardRef, lazy, Suspense, useMemo } from 'react'

export * from '@ui/Planner'

const PlannerComponentLazy = lazy(async () => {
  const module = await import('@ui/Planner')
  return { default: module.default ?? module }
})

const shimmerAnimation = `@keyframes plannerSkeletonShimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}`

/** @typedef {import('react').CSSProperties} CSSProperties */

/**
 * @typedef {Object} PlannerSkeletonCardProps
 * @property {CSSProperties=} style
 * @property {number=} height
 */

/**
 * @param {PlannerSkeletonCardProps} props
 * @returns {import('react').ReactElement}
 */
function PlannerSkeletonCard(props) {
  const { style, height = 120 } = props

  return (
    <div
      style={{
        borderRadius: '16px',
        background:
          'linear-gradient(90deg, rgba(226,232,240,0.55) 0%, rgba(203,213,225,0.6) 50%, rgba(226,232,240,0.55) 100%)',
        backgroundSize: '200% 100%',
        animation: 'plannerSkeletonShimmer 1.4s ease-in-out infinite',
        minHeight: height,
        ...style,
      }}
    />
  )
}

/**
 * @returns {import('react').ReactElement}
 */
function PlannerSkeleton() {
  const gridTemplate = useMemo(
    () => ({
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px',
    }),
    [],
  )

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      data-testid="planner-skeleton"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '32px',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
      }}
    >
      <style>{shimmerAnimation}</style>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}
      >
        <PlannerSkeletonCard style={{ flex: '1 1 280px', height: 64 }} />
        <PlannerSkeletonCard style={{ flex: '0 0 160px', height: 48 }} />
      </div>
      <div style={gridTemplate}>
        <PlannerSkeletonCard height={140} />
        <PlannerSkeletonCard height={140} />
        <PlannerSkeletonCard height={140} />
      </div>
      <div
        style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'minmax(300px, 380px) 1fr' }}
      >
        <PlannerSkeletonCard height={360} />
        <PlannerSkeletonCard height={360} />
      </div>
      <PlannerSkeletonCard height={400} />
    </div>
  )
}

/**
 * @typedef {{
 *   onLogout?: () => void
 * }} PlannerProps
 */

/**
 * @param {PlannerProps} props
 * @param {import('react').RefObject<HTMLDivElement> | ((node: HTMLDivElement | null) => void) | null} ref
 */
function PlannerProxyComponent(props, ref) {
  return (
    <Suspense fallback={<PlannerSkeleton />}>
      <PlannerComponentLazy ref={ref} {...props} />
    </Suspense>
  )
}

const PlannerProxy = forwardRef(PlannerProxyComponent)

PlannerProxy.displayName = 'Planner'

export default PlannerProxy
