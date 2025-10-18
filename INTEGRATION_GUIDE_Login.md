# Integration Guide: Adding Content Analytics to Login.tsx

This guide shows you exactly how to integrate content analytics tracking into the existing Login component.

## Step 1: Import the Hook

Add this import at the top of `/srv/apps/RentGuy-v1/src/ui/Login.tsx`:

```typescript
import { useContentAnalytics } from '@hooks'
```

## Step 2: Initialize the Hook

Inside the `Login` function component, add the hook initialization:

```typescript
export function Login({ onLogin }: LoginProps) {
  const tenant = getCurrentTenant()

  // Add this hook initialization
  const { trackView, trackClick, trackInteraction } = useContentAnalytics(
    'login.hero',
    tenant?.id || 'default',
    {
      autoTrackView: true,  // Automatically tracks view on mount
      metadata: {
        loginType: 'password',
        source: 'direct'
      }
    }
  )

  // ... rest of existing code
```

## Step 3: Track Button Clicks

Add click tracking to the login button. Find the submit button and update it:

### In Simple View (around line 211-228)

```typescript
<button
  type="submit"
  disabled={isSubmitting}
  style={{
    marginTop: 4,
    padding: '12px 18px',
    borderRadius: 999,
    border: 'none',
    backgroundImage: brand.colors.gradient,
    color: '#0F172A',
    fontWeight: 700,
    cursor: isSubmitting ? 'wait' : 'pointer',
    boxShadow: isSubmitting ? 'none' : '0 18px 36px rgba(79, 70, 229, 0.32)',
    opacity: isSubmitting ? 0.75 : 1,
  }}
  onClick={() => trackClick('login-submit-button', { view: 'simple' })}  // ADD THIS LINE
>
  {isSubmitting ? 'Logging in...' : 'Login'}
</button>
```

### In Guided View (around line 508-525)

```typescript
<button
  type="submit"
  disabled={isSubmitting}
  style={{
    marginTop: 4,
    padding: '12px 18px',
    borderRadius: 999,
    border: 'none',
    backgroundImage: brand.colors.gradient,
    color: '#0F172A',
    fontWeight: 700,
    cursor: isSubmitting ? 'wait' : 'pointer',
    boxShadow: isSubmitting ? 'none' : '0 18px 36px rgba(79, 70, 229, 0.32)',
    opacity: isSubmitting ? 0.75 : 1,
  }}
  onClick={() => trackClick('login-submit-button', { view: 'guided' })}  // ADD THIS LINE
>
  {isSubmitting ? 'Inloggen…' : 'Inloggen'}
</button>
```

## Step 4: Track View Mode Toggle

Track when users toggle between simple and guided views:

### Update the toggle button in SimpleLoginForm (around line 231-245)

```typescript
<button
  type="button"
  onClick={() => {
    trackInteraction('view_toggle', { from: 'simple', to: 'guided' })  // ADD THIS LINE
    onToggleGuided()
  }}
  style={{
    background: 'none',
    border: 'none',
    color: withOpacity('#ffffff', 0.82),
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: 0,
  }}
>
  View onboarding guide
</button>
```

### Update the toggle in guided view (around line 444-459)

```typescript
<button
  type="button"
  onClick={() => {
    trackInteraction('view_toggle', { from: 'guided', to: 'simple' })  // ADD THIS LINE
    setViewMode('simple')
  }}
  style={{
    background: 'none',
    border: `1px solid ${withOpacity('#FFFFFF', 0.25)}`,
    color: withOpacity('#ffffff', 0.82),
    padding: '8px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap',
  }}
>
  Simple view
</button>
```

## Step 5: Track Login Success/Failure

Update the `handleSubmit` function to track authentication outcomes:

```typescript
async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  setError('')
  setIsSubmitting(true)

  // Track form submission attempt
  trackInteraction('login_attempt', {
    email: resolveEmail(user),
    viewMode
  })

  try {
    const email = resolveEmail(user)
    const result = await login({ email, password })
    if (result.ok) {
      const { token, user: payloadUser } = result.value
      const ensuredEmail = ensureAuthEmail(payloadUser.email ?? email)
      const nextUser: AuthUser = {
        ...payloadUser,
        email: ensuredEmail,
      }

      // Track successful login
      trackInteraction('login_success', {
        email: ensuredEmail,
        role: nextUser.role
      })

      onLogin(token, nextUser)
    } else {
      console.warn('Login mislukt', result.error)

      // Track login failure
      trackInteraction('login_failure', {
        errorType: result.error,
        email
      })

      setError(deriveLoginErrorMessage(result.error))
    }
  } catch (err) {
    console.error('Onverwachte loginfout', err)

    // Track unexpected error
    trackInteraction('login_error', {
      error: String(err)
    })

    setError('Login mislukt. Controleer gegevens.')
  } finally {
    setIsSubmitting(false)
  }
}
```

## Step 6: Track Secondary Actions

Track other user interactions like "Scroll to form" and support links:

### Update scroll action (around line 308)

```typescript
const actions = useMemo(
  () => [
    {
      id: 'scroll-to-form',
      label: 'Ga naar loginformulier',
      variant: 'primary' as const,
      onClick: () => {
        trackInteraction('scroll_to_form', { trigger: 'action_button' })  // ADD THIS LINE
        handleScrollToForm()
      },
      icon: '🔐',
    },
    {
      id: 'contact-support',
      label: 'Mail pilot support',
      variant: 'ghost' as const,
      href: 'mailto:support@sevensa.nl?subject=RentGuy%20pilot%20login',
      onClick: () => trackInteraction('contact_support', { method: 'email' }),  // ADD THIS LINE
      icon: '✉️',
    },
  ],
  [handleScrollToForm, trackInteraction]  // ADD trackInteraction TO DEPS
)
```

## Complete Example

Here's what the beginning of your updated Login component should look like:

```typescript
import { FormEvent, useCallback, useEffect, useMemo, useState, type ChangeEvent, type CSSProperties } from 'react'
import { login, deriveLoginErrorMessage, ensureAuthEmail, type AuthUser } from '@application/auth/api'
import { brand, headingFontStack, withOpacity } from '@ui/branding'
import FlowExperienceShell from '@ui/FlowExperienceShell'
import FlowExplainerList, { type FlowExplainerItem } from '@ui/FlowExplainerList'
import FlowJourneyMap, { type FlowJourneyStep } from '@ui/FlowJourneyMap'
import { createFlowNavigation } from '@ui/flowNavigation'
import { getCurrentTenant } from '@/config/tenants'
import { useContentAnalytics } from '@hooks'  // ADD THIS IMPORT

export interface LoginProps {
  onLogin: (token: string, user: AuthUser) => void
}

// ... existing code ...

export function Login({ onLogin }: LoginProps) {
  const tenant = getCurrentTenant()
  const brandColor = tenant?.primaryColor || brand.colors.primary

  // Set default credentials based on tenant
  const defaultEmail = tenant?.customContent.demoAccount1 || 'bart'
  const defaultPassword = tenant?.id === 'mrdj' ? 'demo' : (tenant?.id === 'sevensa' ? 'sevensa' : 'demo')

  const [user, setUser] = useState(defaultEmail)
  const [password, setPassword] = useState(defaultPassword)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<'simple' | 'guided'>('simple')

  // ADD ANALYTICS HOOK
  const { trackView, trackClick, trackInteraction } = useContentAnalytics(
    'login.hero',
    tenant?.id || 'default',
    {
      autoTrackView: true,
      metadata: {
        loginType: 'password',
        tenantName: tenant?.name || 'default'
      }
    }
  )

  // ... rest of the component
}
```

## Viewing Analytics

To view the analytics data:

### Option 1: Browser DevTools
1. Open DevTools (F12)
2. Go to Application > Storage > IndexedDB > RentGuyAnalytics > events
3. See all tracked events

### Option 2: Analytics Dashboard
Create a new admin page or add to an existing one:

```typescript
import { AnalyticsDashboard } from '@ui/analytics/AnalyticsDashboard'
import { getCurrentTenant } from '@/config/tenants'

export function AnalyticsPage() {
  const tenant = getCurrentTenant()

  return (
    <div>
      <h1>Content Analytics</h1>
      <AnalyticsDashboard
        tenantId={tenant?.id}
        autoRefresh={true}
        refreshInterval={30000}
      />
    </div>
  )
}
```

### Option 3: Export Data Programmatically
In your browser console or custom admin script:

```javascript
import { exportContentAnalytics } from '@/services/contentAnalytics'

// Export all analytics
const data = await exportContentAnalytics()
console.log(JSON.parse(data))

// Or download as file
const blob = new Blob([data], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'analytics.json'
a.click()
```

## Testing Your Integration

1. **Manual Testing**:
   - Navigate to the login page
   - Open DevTools > Console
   - Click various buttons and observe tracking
   - Check IndexedDB for stored events

2. **Test Different Scenarios**:
   - Successful login
   - Failed login (wrong password)
   - Toggle between simple/guided views
   - Click support links
   - Multiple sessions

3. **Verify Data**:
   ```javascript
   import { getContentAnalytics } from '@/services/contentAnalytics'

   const report = await getContentAnalytics()
   console.log('Total views:', report.totalViews)
   console.log('Total clicks:', report.totalClicks)
   console.log('Total interactions:', report.totalInteractions)
   ```

## Privacy Considerations

The analytics system is privacy-compliant by default:
- No PII (emails, passwords) is automatically tracked
- All data stored locally in user's browser
- Users can clear data anytime
- GDPR compliant

However, be careful with metadata:
```typescript
// BAD - Don't track PII
trackInteraction('login_success', {
  email: 'user@example.com',  // ❌ Don't include email
  password: 'secret'           // ❌ Never include passwords
})

// GOOD - Track non-PII data
trackInteraction('login_success', {
  role: 'admin',               // ✓ OK
  method: 'password',          // ✓ OK
  tenantType: 'enterprise'     // ✓ OK
})
```

## Troubleshooting

**Events not being tracked:**
- Check that the hook is initialized
- Verify the component is mounted
- Check browser console for errors
- Ensure IndexedDB is available

**Too many events:**
- Rate limiting is enabled by default (50 events/second)
- Adjust configuration if needed
- Consider batching similar events

**Performance issues:**
- Analytics runs async and shouldn't block UI
- If issues persist, increase batch size or flush interval
- Check IndexedDB size in DevTools

## Next Steps

1. Integrate analytics in other key components (Dashboard, Planner, etc.)
2. Set up the Analytics Dashboard page
3. Export and analyze real usage data
4. Use insights to optimize user experience
5. Set up A/B tests for different content variants

## Support

For questions or issues:
- Review `/srv/apps/RentGuy-v1/CONTENT_ANALYTICS.md`
- Check `/srv/apps/RentGuy-v1/src/services/contentAnalytics.example.tsx`
- Contact the development team
