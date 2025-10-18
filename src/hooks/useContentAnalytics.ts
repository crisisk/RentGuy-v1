/**
 * React Hook for Content Analytics
 *
 * Provides easy integration of content analytics tracking into React components
 *
 * Features:
 * - Automatic view tracking on component mount
 * - Click tracking helpers
 * - Interaction tracking
 * - Engagement tracking with time-spent calculation
 * - Automatic cleanup on unmount
 * - TypeScript strict mode compatible
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { trackView, trackClick } = useContentAnalytics('login.hero', 'tenant-123')
 *
 *   useEffect(() => {
 *     trackView()
 *   }, [trackView])
 *
 *   return (
 *     <button onClick={() => trackClick('cta-button')}>
 *       Click me
 *     </button>
 *   )
 * }
 * ```
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultAnalyticsService } from '@/services/contentAnalytics'
import type { ContentAnalyticsService } from '@/services/contentAnalytics'

/**
 * Options for the content analytics hook
 */
export interface UseContentAnalyticsOptions {
  /**
   * Whether to automatically track view on mount
   * @default true
   */
  readonly autoTrackView?: boolean

  /**
   * Whether to track engagement (time spent on component)
   * @default true
   */
  readonly trackEngagement?: boolean

  /**
   * Custom analytics service instance
   * @default defaultAnalyticsService
   */
  readonly analyticsService?: ContentAnalyticsService

  /**
   * Additional metadata to include with all events
   */
  readonly metadata?: Record<string, unknown>

  /**
   * Whether the component is enabled/visible
   * If false, tracking is disabled
   * @default true
   */
  readonly enabled?: boolean
}

/**
 * Return type for useContentAnalytics hook
 */
export interface UseContentAnalyticsReturn {
  /**
   * Track a view event
   */
  readonly trackView: (metadata?: Record<string, unknown>) => void

  /**
   * Track a click event
   */
  readonly trackClick: (elementId: string, metadata?: Record<string, unknown>) => void

  /**
   * Track a generic interaction event
   */
  readonly trackInteraction: (
    interactionType: string,
    metadata?: Record<string, unknown>
  ) => void

  /**
   * Track an engagement event
   */
  readonly trackEngagement: (metrics: Record<string, unknown>) => void

  /**
   * Get current time spent on component (in milliseconds)
   */
  readonly getTimeSpent: () => number

  /**
   * Whether analytics are currently active
   */
  readonly isActive: boolean
}

/**
 * Custom hook for content analytics tracking
 *
 * @param templateId - ID of the content template being tracked
 * @param tenantId - ID of the tenant viewing the content
 * @param options - Optional configuration
 * @returns Analytics tracking functions
 *
 * @example
 * ```tsx
 * // Basic usage with auto-tracking
 * function HeroSection() {
 *   const { trackClick } = useContentAnalytics('hero.main', 'tenant-123')
 *
 *   return (
 *     <button onClick={() => trackClick('cta-button')}>
 *       Get Started
 *     </button>
 *   )
 * }
 *
 * // Advanced usage with custom options
 * function Dashboard() {
 *   const { trackView, trackInteraction, getTimeSpent } = useContentAnalytics(
 *     'dashboard.main',
 *     'tenant-123',
 *     {
 *       autoTrackView: false,
 *       trackEngagement: true,
 *       metadata: { variant: 'A' }
 *     }
 *   )
 *
 *   useEffect(() => {
 *     trackView({ initialLoad: true })
 *   }, [trackView])
 *
 *   const handleTabChange = (tabId: string) => {
 *     trackInteraction('tab_change', { tabId, timeSpent: getTimeSpent() })
 *   }
 *
 *   return <div>...</div>
 * }
 * ```
 */
export function useContentAnalytics(
  templateId: string,
  tenantId: string,
  options: UseContentAnalyticsOptions = {}
): UseContentAnalyticsReturn {
  const {
    autoTrackView = true,
    trackEngagement: shouldTrackEngagement = true,
    analyticsService = defaultAnalyticsService,
    metadata: baseMetadata = {},
    enabled = true,
  } = options

  // Track mount time for engagement calculation
  const mountTimeRef = useRef<number>(Date.now())
  const lastEngagementRef = useRef<number>(Date.now())
  const hasTrackedViewRef = useRef<boolean>(false)
  const engagementIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Track active state
  const [isActive, setIsActive] = useState(enabled)

  // Update active state when enabled changes
  useEffect(() => {
    setIsActive(enabled)
  }, [enabled])

  /**
   * Track a view event
   */
  const trackView = useCallback(
    (metadata?: Record<string, unknown>) => {
      if (!isActive) {
        return
      }

      analyticsService.trackView(templateId, tenantId, {
        ...baseMetadata,
        ...metadata,
      })
      hasTrackedViewRef.current = true
    },
    [templateId, tenantId, baseMetadata, isActive, analyticsService]
  )

  /**
   * Track a click event
   */
  const trackClick = useCallback(
    (elementId: string, metadata?: Record<string, unknown>) => {
      if (!isActive) {
        return
      }

      analyticsService.trackClick(templateId, elementId, tenantId, {
        ...baseMetadata,
        ...metadata,
      })
    },
    [templateId, tenantId, baseMetadata, isActive, analyticsService]
  )

  /**
   * Track an interaction event
   */
  const trackInteraction = useCallback(
    (interactionType: string, metadata?: Record<string, unknown>) => {
      if (!isActive) {
        return
      }

      analyticsService.trackInteraction(templateId, tenantId, interactionType, {
        ...baseMetadata,
        ...metadata,
      })
    },
    [templateId, tenantId, baseMetadata, isActive, analyticsService]
  )

  /**
   * Track an engagement event
   */
  const trackEngagementEvent = useCallback(
    (metrics: Record<string, unknown>) => {
      if (!isActive) {
        return
      }

      analyticsService.trackEngagement(templateId, tenantId, {
        ...baseMetadata,
        ...metrics,
      })
      lastEngagementRef.current = Date.now()
    },
    [templateId, tenantId, baseMetadata, isActive, analyticsService]
  )

  /**
   * Get current time spent on component
   */
  const getTimeSpent = useCallback(() => {
    return Date.now() - mountTimeRef.current
  }, [])

  // Auto-track view on mount
  useEffect(() => {
    if (autoTrackView && isActive && !hasTrackedViewRef.current) {
      trackView({ autoTracked: true })
    }
  }, [autoTrackView, isActive, trackView])

  // Setup engagement tracking
  useEffect(() => {
    if (!shouldTrackEngagement || !isActive) {
      return
    }

    // Track engagement every 30 seconds
    const interval = setInterval(() => {
      const timeSpent = getTimeSpent()
      const timeSinceLastEngagement = Date.now() - lastEngagementRef.current

      trackEngagementEvent({
        timeSpent,
        timeSinceLastEngagement,
        timestamp: Date.now(),
      })
    }, 30000) // 30 seconds

    engagementIntervalRef.current = interval

    return () => {
      if (engagementIntervalRef.current) {
        clearInterval(engagementIntervalRef.current)
        engagementIntervalRef.current = null
      }
    }
  }, [shouldTrackEngagement, isActive, getTimeSpent, trackEngagementEvent])

  // Track final engagement on unmount
  useEffect(() => {
    return () => {
      if (shouldTrackEngagement && hasTrackedViewRef.current) {
        const timeSpent = Date.now() - mountTimeRef.current
        analyticsService.trackEngagement(templateId, tenantId, {
          ...baseMetadata,
          timeSpent,
          unmount: true,
          timestamp: Date.now(),
        })
      }
    }
  }, [shouldTrackEngagement, templateId, tenantId, baseMetadata, analyticsService])

  return {
    trackView,
    trackClick,
    trackInteraction,
    trackEngagement: trackEngagementEvent,
    getTimeSpent,
    isActive,
  }
}

/**
 * Hook for A/B testing content variants
 *
 * Automatically tracks which variant is shown and its performance
 *
 * @example
 * ```tsx
 * function HeroWithABTest() {
 *   const variant = Math.random() > 0.5 ? 'A' : 'B'
 *   const { trackClick } = useContentVariantTracking(
 *     'hero.main',
 *     'tenant-123',
 *     variant
 *   )
 *
 *   return (
 *     <div>
 *       {variant === 'A' ? <HeroVariantA /> : <HeroVariantB />}
 *       <button onClick={() => trackClick('cta')}>
 *         Click me
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useContentVariantTracking(
  templateId: string,
  tenantId: string,
  variant: string,
  options: UseContentAnalyticsOptions = {}
): UseContentAnalyticsReturn {
  const variantMetadata = {
    ...options.metadata,
    variant,
    variantId: `${templateId}_${variant}`,
  }

  return useContentAnalytics(templateId, tenantId, {
    ...options,
    metadata: variantMetadata,
  })
}

/**
 * Hook for tracking form interactions
 *
 * Provides specialized tracking for form events
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const { trackFieldFocus, trackFieldBlur, trackSubmit } = useFormTracking(
 *     'login.form',
 *     'tenant-123'
 *   )
 *
 *   return (
 *     <form onSubmit={trackSubmit}>
 *       <input
 *         onFocus={() => trackFieldFocus('email')}
 *         onBlur={() => trackFieldBlur('email')}
 *       />
 *     </form>
 *   )
 * }
 * ```
 */
export function useFormTracking(
  templateId: string,
  tenantId: string,
  options: UseContentAnalyticsOptions = {}
) {
  const { trackInteraction, ...rest } = useContentAnalytics(templateId, tenantId, options)

  const trackFieldFocus = useCallback(
    (fieldName: string) => {
      trackInteraction('field_focus', { fieldName })
    },
    [trackInteraction]
  )

  const trackFieldBlur = useCallback(
    (fieldName: string, value?: string) => {
      trackInteraction('field_blur', {
        fieldName,
        hasValue: Boolean(value),
        valueLength: value?.length ?? 0,
      })
    },
    [trackInteraction]
  )

  const trackFieldChange = useCallback(
    (fieldName: string) => {
      trackInteraction('field_change', { fieldName })
    },
    [trackInteraction]
  )

  const trackValidationError = useCallback(
    (fieldName: string, errorType: string) => {
      trackInteraction('validation_error', { fieldName, errorType })
    },
    [trackInteraction]
  )

  const trackSubmit = useCallback(
    (success: boolean = true) => {
      trackInteraction('form_submit', { success })
    },
    [trackInteraction]
  )

  return {
    trackFieldFocus,
    trackFieldBlur,
    trackFieldChange,
    trackValidationError,
    trackSubmit,
    trackInteraction,
    ...rest,
  }
}
