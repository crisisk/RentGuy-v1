# Usability & Accessibility Audit (WCAG 2.2 AA)

## Summary
| Issue | WCAG Ref | Evidence | Impact | Recommended Fix |
| --- | --- | --- | --- | --- |
| Lack of role-targeted guidance in onboarding checklist | 3.3.5 Help | `fallbackSteps` are generic and do not mention persona-specific tasks (`OnboardingOverlay.jsx` lines 6-45). | Users do not receive contextual help; increases abandonment. | Replace static copy with persona-aware content fetched from API; include direct CTAs per persona.
| Dialog missing accessible semantics (addressed in patch) | 1.3.1 Info and Relationships | Overlay previously rendered as plain `div` without `role`/`aria` (now fixed lines 271-280). | Screen-reader users could not identify modal context or dismiss with keyboard. | Keep new dialog semantics and add focus trap fallback for browsers without `preventScroll` support.
| Default credentials exposed in UI | 2.2.6 Timeout, 2.3.1 Three Flashes (security/perception) | Login pre-populates `bart`/`mr-dj` and surfaces demo credentials (`Login.jsx` lines 7-138). | Encourages shared accounts, bypassing MFA and auditing; also confuses new users. | Detect environment (demo vs. production) and remove hard-coded credentials in production builds.
| No skip navigation or heading structure on Planner | 2.4.1 Bypass Blocks | Planner renders complex tables without skip links or headings (`Planner.jsx` lines 294-350). | Keyboard users must tab through large datasets. | Add skip link and semantic headings per section, ensure table headers use `<th scope="col">`.
| Poor error feedback for login failures | 3.3.3 Error Suggestion | Error message lacks actionable guidance (`Login.jsx` lines 34-35). | Users can't resolve login issues quickly. | Include retry steps, password reset CTA, and highlight required password policy.
| Missing keyboard shortcut to close onboarding overlay | 2.1.1 Keyboard | Prior to fix there was no ESC handler; now added at lines 206-213. | Users relying on keyboard could not dismiss overlay. | Keep ESC support and add focus return logic (implemented lines 195-203).
| High contrast gradients without text contrast checks | 1.4.3 Contrast (Minimum) | Buttons use gradient backgrounds without verifying text contrast (`OnboardingOverlay.jsx` lines 344-363). | Possible failure on low-vision conditions. | Add design tokens with pre-calculated contrast ratios or fallback to solid backgrounds.

## Additional Observations
- Ensure all inline buttons receive visible focus states; current styles rely on default outlines which are removed on some elements (`Login.jsx` input style lines 166-187).
- Provide responsive layout testing for zoom (200%); inline styles may cause overflow in Planner timeline cards.
