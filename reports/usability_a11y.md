# Usability & Accessibility Audit

## Nielsen heuristieken
- **Zichtbaarheid systeemstatus**: Onboarding overlay verbergt fouten achter generieke fallback tekst → gebruikers weten niet dat live data ontbreekt.【F:OnboardingOverlay.jsx†L149-L173】
- **Gebruikerscontrole**: Geen manier om onboarding te resetten of stappen over te slaan behalve snooze; snooze verstopt state in localStorage.【F:App.jsx†L16-L116】
- **Consistentie**: Planner persona-namen (Bart, Anna) wijken af van zakelijke persona’s; verwart gebruikers.【F:Planner.jsx†L5-L101】

## WCAG 2.2 AA risico’s
| Issue | Component | WCAG referentie | Bevinding |
| --- | --- | --- | --- |
| Focus zichtbaarheid | Buttons in overlay hebben geen custom focus styles, relying op browser defaults die slecht zichtbaar zijn op gradient achtergrond.【F:OnboardingOverlay.jsx†L297-L330】 | 2.4.7 | Voeg `:focus-visible` styles toe met hoge contrast rand. |
| Keyboard traps | Overlay fixed op viewport maar sluitknop ontbreekt; alleen snooze of finish, geen `Esc` handler.【F:OnboardingOverlay.jsx†L245-L374】 | 2.1.2 | Voeg keyboard listener + `aria-modal`. |
| Color contrast | Tekst op gradient (login) heeft onvoldoende contrast (wit op lichtblauw) voor kleine tekst.【F:Login.jsx†L41-L207】 | 1.4.3 | Pas kleuren of achtergrond aan. |
| Labels | Inputs hebben labels, maar geen aria-describedby voor foutmeldingen; screenreaders missen context.【F:Login.jsx†L165-L219】 | 3.3.1 | Koppel foutmelding met `aria-live`. |
| Live status | Error/success updates in overlay niet aangekondigd (`setErrorMessage` toont div zonder live region).【F:OnboardingOverlay.jsx†L149-L237】 | 4.1.3 | Voeg `role="alert"`. |

## Usability quick wins
1. **Add exit button** in overlay (close/skip) + keyboard support.
2. **Replace persona names** met zakelijke rollen en toon onboarding progress indicator per rol.【F:Planner.jsx†L5-L101】
3. **Add skeletons/empty states** bij lege data, met CTA’s om data te importeren.【F:Planner.jsx†L162-L200】
4. **Surface API status** met toasts/banners, zodat gebruikers weten wat er gebeurt.【F:OnboardingOverlay.jsx†L201-L237】

## Aanbevolen code snippets
```jsx
<button
  onClick={refreshProgress}
  onKeyDown={event => {
    if (event.key === 'Escape') {
      onSnooze?.();
    }
  }}
  aria-live="polite"
  className="onboarding-refresh"
>
  {refreshingProgress ? 'Verversen…' : 'Voortgang verversen'}
</button>
```

```css
.onboarding-refresh:focus-visible {
  outline: 3px solid #0BC5EA;
  outline-offset: 3px;
}
```

