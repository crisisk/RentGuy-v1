# Onboarding Development Plan

## Objectives
- Reduce friction in the MR-DJ onboarding flow while keeping contextual coaching available.
- Keep seed data between frontend fallbacks and backend defaults in sync.
- Provide operators with more control over how and when the overlay resurfaces for partially onboarded accounts.

## Planned Enhancements
1. **Snoozeable Overlay Experience**
   - Allow "Later doorgaan" to snooze the overlay instead of permanently dismissing it.
   - Remember the snooze window in local storage so the overlay automatically returns after a short period.
   - Surface a dedicated "Checklist afgerond" action once all steps are complete so power users can permanently hide the overlay.

2. **Shared Tip Defaults**
   - Reuse the `onboarding_tips.json` data set when seeding backend tips to avoid drift between backend and frontend fallbacks.
   - Guarantee a deterministic ordering of tips so that UAT scripts keep receiving the same payload.

3. **Progress Intelligence**
   - Highlight the next actionable step in the overlay header and expose a one-click refresh of progress after completing a step.
   - Guard asynchronous calls with cancellation so dismissing the overlay does not trigger React warnings during rapid navigation.

## Acceptance Criteria
- Closing the overlay via "Later doorgaan" stores a temporary snooze marker and the overlay reappears after the snooze expires or on explicit re-open.
- Completing all steps reveals a "Checklist afgerond" button that hides the overlay permanently for the current user account.
- Backend and frontend tip defaults stay identical and load in a consistent order; seeding succeeds even if JSON contains new entries.
- React dev tools show no state update warnings when switching views during onboarding.
