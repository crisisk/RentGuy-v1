# Content Analytics and Tracking System

A comprehensive content analytics and tracking system for the RentGuy multi-tenant platform.

## Overview

This system provides privacy-compliant analytics tracking for content templates, enabling:

- Track which content templates are viewed
- Monitor user engagement with different content variants
- Analyze tenant-specific content performance
- Support A/B testing for content variations
- Export and analyze analytics data

## Features

### Core Features

- **Event Tracking**: Track views, clicks, interactions, and engagement
- **Multi-tenant Support**: Track analytics per tenant with isolation
- **Privacy-First**: No PII tracking, GDPR-compliant by design
- **Local Storage**: IndexedDB with localStorage fallback
- **Batching**: Efficient event batching to reduce overhead
- **Rate Limiting**: Prevent spam and protect performance
- **A/B Testing**: Built-in support for content variant tracking
- **Export**: Export analytics data as JSON
- **React Integration**: Easy-to-use React hooks

### Technical Features

- **TypeScript Strict Mode**: Full type safety
- **Performance Optimized**: Batching, caching, and rate limiting
- **Offline Support**: Works offline with local storage
- **Zero Dependencies**: No external analytics libraries required
- **Extensible**: Easy to customize and extend

## Installation

The system is already integrated into the RentGuy codebase. No additional installation required.

## Quick Start

### Basic Usage

```tsx
import { useContentAnalytics } from '@hooks'
import { getCurrentTenant } from '@/config/tenants'

function MyComponent() {
  const tenant = getCurrentTenant()
  const { trackView, trackClick } = useContentAnalytics(
    'my.template.id',
    tenant?.id || 'default'
  )

  useEffect(() => {
    trackView()
  }, [trackView])

  return (
    <button onClick={() => trackClick('cta-button')}>
      Click me
    </button>
  )
}
```

### Integration with Login.tsx

```tsx
import { useContentAnalytics } from '@hooks'
import { getCurrentTenant } from '@/config/tenants'

export function Login({ onLogin }: LoginProps) {
  const tenant = getCurrentTenant()
  const { trackView, trackClick } = useContentAnalytics(
    'login.hero',
    tenant?.id || 'default'
  )

  useEffect(() => {
    trackView()
  }, [trackView])

  return (
    <form>
      {/* ... form fields ... */}
      <button
        type="submit"
        onClick={() => trackClick('login-button')}
      >
        Login
      </button>
    </form>
  )
}
```

## API Reference

### ContentAnalyticsService

Main service class for analytics tracking.

#### Methods

##### `trackView(templateId: string, tenantId: string, metadata?: Record<string, unknown>)`
Track a content view event.

##### `trackClick(templateId: string, elementId: string, tenantId: string, metadata?: Record<string, unknown>)`
Track a click event on specific element.

##### `trackInteraction(templateId: string, tenantId: string, interactionType: string, metadata?: Record<string, unknown>)`
Track a general interaction event.

##### `trackEngagement(templateId: string, tenantId: string, engagementMetrics: Record<string, unknown>)`
Track engagement metrics (time spent, scroll depth, etc.).

##### `async getAnalytics(tenantId?: string): Promise<AnalyticsReport>`
Get analytics report, optionally filtered by tenant.

##### `async exportAnalytics(): Promise<string>`
Export analytics data as JSON string.

##### `async clearAnalytics(): Promise<void>`
Clear all analytics data.

### React Hooks

#### useContentAnalytics

Main hook for content analytics tracking.

```tsx
const {
  trackView,
  trackClick,
  trackInteraction,
  trackEngagement,
  getTimeSpent,
  isActive
} = useContentAnalytics(
  templateId,
  tenantId,
  options?
)
```

**Options:**
- `autoTrackView` (boolean): Auto-track view on mount (default: true)
- `trackEngagement` (boolean): Track engagement automatically (default: true)
- `analyticsService` (ContentAnalyticsService): Custom service instance
- `metadata` (Record<string, unknown>): Default metadata for all events
- `enabled` (boolean): Enable/disable tracking (default: true)

#### useContentVariantTracking

Hook for A/B testing with automatic variant tracking.

```tsx
const variant = 'A' // or 'B'
const { trackClick } = useContentVariantTracking(
  templateId,
  tenantId,
  variant,
  options?
)
```

#### useFormTracking

Specialized hook for form interactions.

```tsx
const {
  trackFieldFocus,
  trackFieldBlur,
  trackFieldChange,
  trackValidationError,
  trackSubmit
} = useFormTracking(templateId, tenantId, options?)
```

### Analytics Dashboard

Display analytics in a visual dashboard.

```tsx
import { AnalyticsDashboard } from '@ui/analytics/AnalyticsDashboard'

function AdminPage() {
  return (
    <AnalyticsDashboard
      tenantId="tenant-123" // Optional: filter by tenant
      autoRefresh={true}
      refreshInterval={30000}
      onExport={(data) => console.log(data)}
      onClear={() => console.log('cleared')}
    />
  )
}
```

## Privacy and Compliance

### GDPR Compliance

The system is designed to be GDPR-compliant:

1. **No PII Tracking**: No personally identifiable information is automatically tracked
2. **Local Storage Only**: All data stored locally in user's browser
3. **User Control**: Users can clear analytics data at any time
4. **Consent Management**: Easily integrate with consent management systems

### Best Practices

1. **Don't track PII**: Never pass email, names, or other PII in metadata
2. **Get consent**: Integrate with your consent management system
3. **Clear data**: Provide users with clear analytics data controls
4. **Minimize data**: Only track what's necessary for your analytics needs

### Example: Conditional Tracking Based on Consent

```tsx
function MyComponent() {
  const userConsent = getUserAnalyticsConsent()

  const { trackView } = useContentAnalytics(
    'my.template',
    'tenant-123',
    { enabled: userConsent }
  )

  // Will only track if consent is given
}
```

## Performance

### Batching

Events are batched to reduce overhead:

- Default batch size: 10 events
- Default flush interval: 5 seconds
- Manual flush available via `flush()` method

### Rate Limiting

Rate limiting prevents spam:

- Default: 50 events per second per template
- Configurable per service instance
- Automatic cleanup of old events

### Storage Limits

- Default max events: 10,000
- Automatic cleanup when limit reached
- Keeps most recent events

### Configuration Example

```tsx
const service = new ContentAnalyticsService({
  batchSize: 20,
  flushInterval: 10000, // 10 seconds
  maxEvents: 50000,
  enableRateLimiting: true,
  rateLimitWindow: 2000,
  rateLimitMax: 100
})
```

## A/B Testing

### Setup

```tsx
function HeroSection() {
  const variant = Math.random() > 0.5 ? 'A' : 'B'

  const { trackClick } = useContentVariantTracking(
    'hero.main',
    'tenant-123',
    variant
  )

  return variant === 'A' ? (
    <div>
      <h1>Variant A</h1>
      <button onClick={() => trackClick('cta-a')}>
        Get Started
      </button>
    </div>
  ) : (
    <div>
      <h1>Variant B</h1>
      <button onClick={() => trackClick('cta-b')}>
        Start Trial
      </button>
    </div>
  )
}
```

### Analyzing Results

```tsx
const report = await getContentAnalytics('tenant-123')

// Find variant performance
const variantA = Array.from(report.templates.values())
  .filter(t => t.metadata?.variant === 'A')

const variantB = Array.from(report.templates.values())
  .filter(t => t.metadata?.variant === 'B')

console.log('Variant A clicks:', variantA[0]?.clickCount)
console.log('Variant B clicks:', variantB[0]?.clickCount)
```

## Exporting Data

### Manual Export

```tsx
const exportedData = await exportContentAnalytics()
console.log(exportedData) // JSON string
```

### Automatic Download

```tsx
const data = await exportContentAnalytics()
const blob = new Blob([data], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = `analytics-${new Date().toISOString()}.json`
a.click()
```

### Export Format

```json
{
  "totalEvents": 100,
  "totalViews": 50,
  "totalClicks": 30,
  "totalInteractions": 20,
  "templates": [
    {
      "templateId": "login.hero",
      "viewCount": 50,
      "clickCount": 30,
      "interactionCount": 20,
      "engagementCount": 10,
      "firstSeen": 1234567890000,
      "lastSeen": 1234567990000,
      "avgTimeSpent": 5000,
      "tenants": ["tenant-1", "tenant-2"]
    }
  ],
  "tenantStats": [
    {
      "tenantId": "tenant-1",
      "viewCount": 25,
      "clickCount": 15,
      "interactionCount": 10,
      "uniqueTemplates": ["login.hero", "dashboard.main"]
    }
  ],
  "dateRange": {
    "start": 1234567890000,
    "end": 1234567990000
  },
  "sessionCount": 5
}
```

## Testing

### Running Tests

```bash
npm test src/services/__tests__/contentAnalytics.test.ts
```

### Test Coverage

The test suite covers:
- Event tracking (views, clicks, interactions)
- Data persistence (IndexedDB and localStorage)
- Analytics report generation
- Privacy compliance
- Export functionality
- Rate limiting
- Batching
- Error handling

## File Structure

```
src/
├── services/
│   ├── contentAnalytics.ts                    # Main analytics service
│   ├── contentAnalytics.example.tsx           # Integration examples
│   └── __tests__/
│       └── contentAnalytics.test.ts           # Test suite
├── hooks/
│   ├── useContentAnalytics.ts                 # React hooks
│   └── index.ts                               # Hook exports
└── ui/
    └── analytics/
        └── AnalyticsDashboard.tsx             # Dashboard UI component
```

## Examples

See `/srv/apps/RentGuy-v1/src/services/contentAnalytics.example.tsx` for comprehensive examples including:

1. Basic integration with Login component
2. A/B testing content variants
3. Form tracking
4. Dashboard with engagement tracking
5. Custom analytics service configuration
6. Programmatic analytics without hooks
7. Conditional tracking based on consent
8. Viewing analytics dashboard

## Troubleshooting

### IndexedDB Not Available

The system automatically falls back to localStorage if IndexedDB is not available.

### Events Not Being Tracked

Check:
1. Analytics service is initialized: `await service.initialize()`
2. Tracking is enabled: `{ enabled: true }`
3. User has given consent (if implemented)
4. Rate limiting not triggered

### Performance Issues

If experiencing performance issues:
1. Increase batch size
2. Increase flush interval
3. Enable rate limiting
4. Reduce max events limit

## Support

For issues or questions:
- Check the examples in `contentAnalytics.example.tsx`
- Review the test suite for usage patterns
- Contact the RentGuy development team

## License

Internal use only - RentGuy Platform
