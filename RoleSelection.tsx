import { useState } from 'react'
import { brand, brandFontStack, headingFontStack, withOpacity } from './branding'

export interface RoleSelectionProps {
  email: string
  onConfirm: (role: string) => Promise<void> | void
  onLogout: () => void
  isSubmitting: boolean
  errorMessage?: string
}

interface RoleOption {
  value: string
  title: string
  description: string
  focus: string
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'planner',
    title: 'Operations planner',
    description:
      'Beheer de volledige productieplanning, van crew tot materiaal, met realtime conflict-detectie.',
    focus: 'Planning & Crew',
  },
  {
    value: 'crew',
    title: 'Crew lead',
    description:
      'Ontvang shifts, briefings en checklists. Meld beschikbaarheid en onderteken digitale draaiboeken.',
    focus: 'Werkvloer & Briefings',
  },
  {
    value: 'warehouse',
    title: 'Warehouse coördinator',
    description:
      'Stuur in- en uitgifte, scan gear en bewaak voorraadniveaus voordat shows beginnen.',
    focus: 'Magazijn & Scanning',
  },
  {
    value: 'finance',
    title: 'Finance specialist',
    description:
      'Volg offerte- en facturatiestatus, beheer voorschotten en sync met Exact of Mollie.',
    focus: 'Quote-to-Cash',
  },
  {
    value: 'viewer',
    title: 'Project stakeholder',
    description:
      'Krijg read-only inzicht in planning en dashboards. Ideaal voor klanten of leveranciers.',
    focus: 'Rapportage & Samenwerking',
  },
  {
    value: 'admin',
    title: 'Administrator',
    description:
      'Configureer tenants, beheer rollen en bewaak integraties. Gebruik alleen indien noodzakelijk.',
    focus: 'Governance',
  },
]

export function RoleSelection({ email, onConfirm, onLogout, isSubmitting, errorMessage }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState('')

  const handleConfirm = () => {
    if (!selectedRole || isSubmitting) {
      return
    }
    void onConfirm(selectedRole)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-selection-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        background: brand.colors.overlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        fontFamily: brandFontStack,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 940,
          background: '#0F172A',
          color: '#ffffff',
          borderRadius: 28,
          padding: '40px 46px',
          boxShadow: '0 36px 72px rgba(15, 23, 42, 0.48)',
          border: `1px solid ${withOpacity('#FFFFFF', 0.18)}`,
          display: 'grid',
          gap: 32,
        }}
      >
        <header style={{ display: 'grid', gap: 12 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 14px',
              background: withOpacity('#FFFFFF', 0.12),
              borderRadius: 999,
              fontSize: '0.75rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: withOpacity('#FFFFFF', 0.75),
            }}
          >
            {brand.shortName} Onboarding · {email}
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <h2
              id="role-selection-title"
              style={{
                margin: 0,
                fontSize: '2.2rem',
                lineHeight: 1.15,
                fontFamily: headingFontStack,
                letterSpacing: '-0.02em',
              }}
            >
              Kies je rol om een gepersonaliseerde workspace te krijgen
            </h2>
            <p style={{ margin: 0, color: withOpacity('#FFFFFF', 0.78), maxWidth: 640, fontSize: '1.05rem' }}>
              We stemmen dashboards, notificaties en voorbeelddata af op jouw verantwoordelijkheden. Je kunt dit later via het
              admin team laten aanpassen.
            </p>
          </div>
        </header>

        <div
          role="radiogroup"
          aria-label="Beschikbare rollen"
          style={{
            display: 'grid',
            gap: 18,
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          }}
        >
          {ROLE_OPTIONS.map(option => {
            const isSelected = option.value === selectedRole
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedRole(option.value)}
                style={{
                  display: 'grid',
                  gap: 10,
                  padding: '20px 22px',
                  textAlign: 'left',
                  borderRadius: 20,
                  border: `2px solid ${isSelected ? brand.colors.accent : withOpacity('#FFFFFF', 0.16)}`,
                  background: isSelected ? withOpacity('#FBBF24', 0.18) : withOpacity('#0F172A', 0.68),
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: isSelected ? brand.colors.accent : withOpacity('#FFFFFF', 0.6),
                    fontWeight: 600,
                  }}
                >
                  {option.focus}
                </span>
                <strong style={{ fontSize: '1.2rem', fontFamily: headingFontStack }}>{option.title}</strong>
                <span style={{ fontSize: '0.95rem', color: withOpacity('#FFFFFF', 0.8) }}>{option.description}</span>
              </button>
            )
          })}
        </div>

        <footer
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ color: brand.colors.warning, fontSize: '0.95rem', minHeight: 24 }}>
            {errorMessage ? `⚠️ ${errorMessage}` : 'Je rol bepaalt welke onboarding flow en permissies je ontvangt.'}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={onLogout}
              style={{
                padding: '12px 20px',
                borderRadius: 999,
                border: `1px solid ${withOpacity('#FFFFFF', 0.26)}`,
                background: 'transparent',
                color: withOpacity('#FFFFFF', 0.85),
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              Afmelden
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedRole || isSubmitting}
              style={{
                padding: '12px 24px',
                borderRadius: 999,
                border: 'none',
                backgroundImage: brand.colors.gradient,
                color: '#0F172A',
                fontWeight: 700,
                cursor: !selectedRole || isSubmitting ? 'wait' : 'pointer',
                opacity: !selectedRole || isSubmitting ? 0.7 : 1,
                boxShadow: !selectedRole || isSubmitting ? 'none' : '0 24px 48px rgba(79, 70, 229, 0.32)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {isSubmitting ? 'Opslaan…' : 'Bevestig rol'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default RoleSelection
