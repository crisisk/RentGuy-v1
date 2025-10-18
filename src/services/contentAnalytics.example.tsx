/**
 * Content Analytics Integration Examples
 *
 * This file demonstrates how to integrate the content analytics system
 * into your React components and workflows.
 */

import { useEffect } from 'react'
import { useContentAnalytics, useContentVariantTracking, useFormTracking } from '@hooks'
import { getCurrentTenant } from '@/config/tenants'

/**
 * Example 1: Basic Integration with Login Component
 *
 * Shows how to add basic view and click tracking to the Login component
 */
export function LoginWithAnalytics({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const tenant = getCurrentTenant()
  const { trackView, trackClick, trackInteraction } = useContentAnalytics(
    'login.hero',
    tenant?.id || 'default'
  )

  // Track view automatically on mount
  useEffect(() => {
    trackView({ variant: 'default', source: 'direct' })
  }, [trackView])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    trackInteraction('form_submit', { timestamp: Date.now() })
    // ... rest of login logic
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>
      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Password" />
      <button
        type="submit"
        onClick={() => trackClick('login-button', { action: 'primary_cta' })}
      >
        Sign In
      </button>
      <button
        type="button"
        onClick={() => {
          trackClick('forgot-password', { action: 'secondary_link' })
          // Navigate to forgot password page
        }}
      >
        Forgot Password?
      </button>
    </form>
  )
}

/**
 * Example 2: A/B Testing Content Variants
 *
 * Track which variant users see and how they interact with each
 */
export function HeroSectionWithABTest() {
  const tenant = getCurrentTenant()

  // Randomly assign variant (in production, use a proper A/B testing framework)
  const variant = Math.random() > 0.5 ? 'A' : 'B'

  const { trackClick } = useContentVariantTracking(
    'hero.main',
    tenant?.id || 'default',
    variant
  )

  return (
    <div>
      {variant === 'A' ? (
        <div>
          <h1>Welcome to RentGuy (Variant A)</h1>
          <button onClick={() => trackClick('cta-variant-a')}>
            Get Started Now
          </button>
        </div>
      ) : (
        <div>
          <h1>Streamline Your Equipment Rental (Variant B)</h1>
          <button onClick={() => trackClick('cta-variant-b')}>
            Start Free Trial
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Example 3: Form Tracking
 *
 * Track detailed form interactions for conversion optimization
 */
export function RegistrationFormWithTracking() {
  const tenant = getCurrentTenant()

  const {
    trackFieldFocus,
    trackFieldBlur,
    trackFieldChange,
    trackValidationError,
    trackSubmit,
  } = useFormTracking('registration.form', tenant?.id || 'default')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      // Attempt registration
      // await registerUser(...)
      trackSubmit(true)
    } catch (error) {
      trackSubmit(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        name="email"
        placeholder="Email"
        onFocus={() => trackFieldFocus('email')}
        onBlur={(e) => trackFieldBlur('email', e.target.value)}
        onChange={() => trackFieldChange('email')}
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        onFocus={() => trackFieldFocus('password')}
        onBlur={(e) => trackFieldBlur('password', e.target.value)}
      />

      <input
        type="text"
        name="company"
        placeholder="Company Name"
        onFocus={() => trackFieldFocus('company')}
        onBlur={(e) => {
          trackFieldBlur('company', e.target.value)
          if (!e.target.value) {
            trackValidationError('company', 'required')
          }
        }}
      />

      <button type="submit">Register</button>
    </form>
  )
}

/**
 * Example 4: Dashboard with Engagement Tracking
 *
 * Track time spent and interactions within a dashboard component
 */
export function DashboardWithEngagement() {
  const tenant = getCurrentTenant()

  const { trackInteraction, getTimeSpent, trackEngagement } = useContentAnalytics(
    'dashboard.main',
    tenant?.id || 'default',
    {
      trackEngagement: true, // Enable automatic engagement tracking
      metadata: { userRole: 'admin' }
    }
  )

  const handleTabChange = (tabId: string) => {
    const timeSpent = getTimeSpent()
    trackInteraction('tab_change', {
      tabId,
      timeSpentBeforeChange: timeSpent,
    })
  }

  const handleWidgetInteraction = (widgetId: string, action: string) => {
    trackInteraction('widget_interaction', {
      widgetId,
      action,
      timestamp: Date.now(),
    })
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <div>
        <button onClick={() => handleTabChange('overview')}>Overview</button>
        <button onClick={() => handleTabChange('analytics')}>Analytics</button>
        <button onClick={() => handleTabChange('settings')}>Settings</button>
      </div>

      <div>
        <Widget
          id="revenue-chart"
          onInteraction={(action) => handleWidgetInteraction('revenue-chart', action)}
        />
        <Widget
          id="task-list"
          onInteraction={(action) => handleWidgetInteraction('task-list', action)}
        />
      </div>
    </div>
  )
}

/**
 * Example 5: Custom Analytics Service Configuration
 *
 * Create a custom analytics service with specific settings
 */
export function CustomAnalyticsExample() {
  // In your app initialization or provider setup:
  const customAnalyticsService = new (await import('@/services/contentAnalytics')).ContentAnalyticsService({
    batchSize: 20,
    flushInterval: 10000, // 10 seconds
    maxEvents: 50000,
    enableRateLimiting: true,
    rateLimitWindow: 2000,
    rateLimitMax: 100,
  })

  // Initialize the service
  customAnalyticsService.initialize()

  // Use in components
  const tenant = getCurrentTenant()
  const { trackView } = useContentAnalytics(
    'custom.template',
    tenant?.id || 'default',
    {
      analyticsService: customAnalyticsService,
    }
  )

  return <div>Custom Analytics Example</div>
}

/**
 * Example 6: Programmatic Analytics Without Hooks
 *
 * Use analytics service directly without React hooks
 */
export async function programmaticAnalyticsExample() {
  const {
    trackContentView,
    trackContentClick,
    trackContentInteraction,
    getContentAnalytics,
    exportContentAnalytics,
  } = await import('@/services/contentAnalytics')

  // Track events
  trackContentView('page.landing', 'tenant-123', {
    source: 'email',
    campaign: 'summer-2024',
  })

  trackContentClick('page.landing', 'cta-button', 'tenant-123', {
    position: 'hero',
  })

  trackContentInteraction('page.landing', 'tenant-123', 'scroll', {
    depth: 75,
  })

  // Get analytics report
  const report = await getContentAnalytics('tenant-123')
  console.log('Total views:', report.totalViews)
  console.log('Total clicks:', report.totalClicks)

  // Export analytics
  const exportedData = await exportContentAnalytics()
  console.log('Exported data:', exportedData)
}

/**
 * Example 7: Conditional Tracking
 *
 * Enable/disable tracking based on user preferences or conditions
 */
export function ConditionalTrackingExample() {
  const tenant = getCurrentTenant()
  const userConsent = getUserAnalyticsConsent() // Your consent management function

  const { trackClick } = useContentAnalytics(
    'feature.settings',
    tenant?.id || 'default',
    {
      enabled: userConsent, // Only track if user has given consent
      autoTrackView: userConsent,
    }
  )

  return (
    <div>
      <button onClick={() => trackClick('save-settings')}>
        Save Settings
      </button>
    </div>
  )
}

/**
 * Example 8: Viewing Analytics Dashboard
 *
 * Display the analytics dashboard in your admin panel
 */
export function AdminAnalyticsPage() {
  const tenant = getCurrentTenant()
  const { AnalyticsDashboard } = await import('@ui/analytics/AnalyticsDashboard')

  return (
    <div>
      <h1>Content Analytics</h1>
      <AnalyticsDashboard
        tenantId={tenant?.id} // Filter by current tenant
        autoRefresh={true}
        refreshInterval={30000} // Refresh every 30 seconds
        onExport={(data) => {
          console.log('Analytics exported:', data)
          // Custom export handling
        }}
        onClear={() => {
          console.log('Analytics cleared')
          // Custom clear handling
        }}
      />
    </div>
  )
}

// Helper function (you would implement this based on your consent management)
function getUserAnalyticsConsent(): boolean {
  // Check if user has given consent for analytics
  return localStorage.getItem('analytics_consent') === 'true'
}

// Placeholder Widget component for example
function Widget({ id, onInteraction }: { id: string; onInteraction: (action: string) => void }) {
  return (
    <div>
      <h3>Widget: {id}</h3>
      <button onClick={() => onInteraction('click')}>Interact</button>
    </div>
  )
}
