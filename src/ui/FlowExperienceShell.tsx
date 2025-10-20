import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import ExperienceLayout, { type ExperienceLayoutProps } from '@ui/ExperienceLayout'
import FlowExperienceNavRail, { type FlowExperienceNavRailProps } from '@ui/FlowExperienceNavRail'
import { brand, withOpacity } from '@ui/branding'

type FlowStageStatus = 'completed' | 'in-progress' | 'upcoming'

type FlowActionVariant = 'primary' | 'secondary' | 'ghost'

export interface FlowExperienceBreadcrumb {
  id: string
  label: string
  href?: string
}

export interface FlowExperienceAction {
  id: string
  label: string
  variant?: FlowActionVariant
  href?: string
  onClick?: () => void
  icon?: ReactNode
  disabled?: boolean
  testId?: string
}

export interface FlowExperiencePersona {
  name: string
  role: string
  initials?: string
  meta?: string
}

export interface FlowExperienceStage {
  label: string
  status: FlowStageStatus
  detail?: string
}

export interface FlowExperienceStatusMessage {
  tone: 'info' | 'success' | 'warning' | 'danger'
  title?: string
  description: ReactNode
}

export interface FlowExperienceShellProps
  extends Omit<ExperienceLayoutProps, 'headerSlot'> {
  breadcrumbs?: FlowExperienceBreadcrumb[]
  persona?: FlowExperiencePersona
  stage?: FlowExperienceStage
  actions?: FlowExperienceAction[]
  statusMessage?: FlowExperienceStatusMessage
  footerAside?: ReactNode
  navigationRail?: FlowExperienceNavRailProps
}

const actionTone: Record<FlowActionVariant, CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.95) 0%, rgba(56, 189, 248, 0.95) 100%)',
    color: '#ffffff',
    border: 'none',
  },
  secondary: {
    background: withOpacity('#FFFFFF', 0.1),
    color: '#ffffff',
    border: `1px solid ${withOpacity('#FFFFFF', 0.4)}`,
  },
  ghost: {
    background: 'transparent',
    color: withOpacity('#FFFFFF', 0.85),
    border: 'none',
  },
}

const tonePalette: Record<FlowExperienceStatusMessage['tone'], { background: string; border: string; accent: string }> = {
  info: {
    background: withOpacity(brand.colors.primary, 0.08),
    border: withOpacity(brand.colors.primary, 0.24),
    accent: brand.colors.primary,
  },
  success: {
    background: withOpacity(brand.colors.success, 0.12),
    border: withOpacity(brand.colors.success, 0.3),
    accent: brand.colors.success,
  },
  warning: {
    background: withOpacity(brand.colors.warning, 0.14),
    border: withOpacity(brand.colors.warning, 0.32),
    accent: brand.colors.warning,
  },
  danger: {
    background: withOpacity(brand.colors.danger, 0.16),
    border: withOpacity(brand.colors.danger, 0.34),
    accent: brand.colors.danger,
  },
}

export default function FlowExperienceShell({
  breadcrumbs,
  persona,
  stage,
  actions,
  statusMessage,
  footerAside,
  navigationRail,
  children,
  ...layoutProps
}: FlowExperienceShellProps) {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)
  const actionMenuRef = useRef<HTMLDivElement | null>(null)
  const actionMenuId = useMemo(() => `flow-experience-action-menu-${Math.random().toString(36).slice(2)}`, [])

  const closeMenu = useCallback(() => {
    setIsActionMenuOpen(false)
  }, [])

  useEffect(() => {
    if (!isActionMenuOpen) {
      return
    }

    const handleClick = (event: MouseEvent) => {
      if (!actionMenuRef.current) {
        return
      }
      const target = event.target as Node | null
      if (target && actionMenuRef.current.contains(target)) {
        return
      }
      closeMenu()
    }

    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
    }
  }, [closeMenu, isActionMenuOpen])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu()
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
    }
  }, [closeMenu])

  useEffect(() => {
    closeMenu()
  }, [actions, closeMenu])

  const headerSlot = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumbs" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1
            return (
              <span key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {crumb.href && !isLast ? (
                  <a
                    href={crumb.href}
                    style={{
                      color: withOpacity('#FFFFFF', 0.9),
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span style={{ color: withOpacity('#FFFFFF', isLast ? 0.95 : 0.65), fontWeight: isLast ? 700 : 500 }}>
                    {crumb.label}
                  </span>
                )}
                {!isLast && <span aria-hidden style={{ color: withOpacity('#FFFFFF', 0.4) }}>›</span>}
              </span>
            )
          })}
        </nav>
      )}
      {persona && (
        <button
          type="button"
          data-testid="user-menu"
          aria-haspopup="menu"
          aria-label={`Gebruikersmenu voor ${persona.name}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 12px',
            borderRadius: 999,
            background: withOpacity('#FFFFFF', 0.12),
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span
            data-testid="user-avatar"
            aria-hidden
            data-testid="user-avatar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 12px',
              borderRadius: 999,
              background: withOpacity('#FFFFFF', 0.12),
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span
              aria-hidden
              data-testid="user-avatar"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: withOpacity('#000000', 0.32),
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              {persona.initials ?? persona.name.slice(0, 2).toUpperCase()}
            </span>
            <div style={{ display: 'grid', gap: 2, textAlign: 'left' }}>
              <span style={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.68rem' }}>
                {persona.role}
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{persona.name}</span>
              {persona.meta && (
                <span style={{ fontSize: '0.7rem', color: withOpacity('#FFFFFF', 0.75) }}>{persona.meta}</span>
              )}
            </div>
          </button>
          {isUserMenuOpen && logoutAction && (
            <div
              role="menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                display: 'grid',
                gap: 6,
                padding: '10px 12px',
                minWidth: 180,
                borderRadius: 14,
                background: withOpacity('#0F172A', 0.92),
                border: `1px solid ${withOpacity('#FFFFFF', 0.18)}`,
                boxShadow: '0 16px 32px rgba(15, 23, 42, 0.35)',
              }}
            >
              <button
                type="button"
                data-testid="logout-button"
                onClick={() => {
                  logoutAction.onClick?.()
                  setIsUserMenuOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Uitloggen
                <span aria-hidden>🚪</span>
              </button>
            </div>
          )}
        </div>
      )}
      {stage && (
        <div
          style={{
            display: 'grid',
            gap: 2,
            padding: '6px 12px',
            borderRadius: 14,
            background: withOpacity('#FFFFFF', 0.08),
            color: '#ffffff',
            minWidth: 160,
          }}
        >
          <span style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
            {stage.status === 'completed'
              ? '✅ Afgerond'
              : stage.status === 'in-progress'
              ? '🔄 Bezig'
              : '⏭️ Volgende'}
          </span>
          <span style={{ fontWeight: 600 }}>{stage.label}</span>
          {stage.detail && (
            <span style={{ fontSize: '0.75rem', color: withOpacity('#FFFFFF', 0.76) }}>{stage.detail}</span>
          )}
        </div>
      )}
      {actions && actions.length > 0 && (
        <div ref={actionMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            data-testid="user-menu"
            onClick={() => setIsActionMenuOpen(open => !open)}
            aria-haspopup="true"
            aria-expanded={isActionMenuOpen}
            aria-controls={actionMenuId}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 999,
              border: `1px solid ${withOpacity('#FFFFFF', 0.35)}`,
              background: withOpacity('#FFFFFF', 0.12),
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            <span aria-hidden>👤</span>
            Acties
          </button>
          {isActionMenuOpen && (
            <div
              id={actionMenuId}
              role="menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                minWidth: 220,
                display: 'grid',
                gap: 8,
                padding: 12,
                borderRadius: 18,
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.94) 100%)',
                border: `1px solid ${withOpacity('#FFFFFF', 0.18)}`,
                boxShadow: '0 24px 48px rgba(15, 23, 42, 0.45)',
                zIndex: 30,
              }}
            >
              {actions.map(action => renderActionMenuItem(action, closeMenu))}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const messageBlock = statusMessage ? renderStatusMessage(statusMessage) : null

  const content = (
    <div style={{ display: 'grid', gap: 24 }}>
      {messageBlock}
      {children}
      {footerAside && (
        <aside
          style={{
            marginTop: 12,
            padding: '20px 24px',
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 64, 175, 0.88) 100%)',
            color: withOpacity('#FFFFFF', 0.9),
            border: `1px solid ${withOpacity('#FFFFFF', 0.16)}`,
          }}
        >
          {footerAside}
        </aside>
      )}
    </div>
  )

  return (
    <ExperienceLayout headerSlot={headerSlot} {...layoutProps}>
      {navigationRail ? (
        <div
          style={{
            display: 'grid',
            gap: 24,
            alignItems: 'start',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          }}
        >
          <FlowExperienceNavRail {...navigationRail} />
          {content}
        </div>
      ) : (
        content
      )}
    </ExperienceLayout>
  )
}

function renderStatusMessage(message: FlowExperienceStatusMessage) {
  const palette = tonePalette[message.tone]
  return (
    <div
      role={message.tone === 'danger' ? 'alert' : 'status'}
      aria-live={message.tone === 'danger' ? 'assertive' : 'polite'}
      style={{
        display: 'grid',
        gap: 6,
        padding: '16px 18px',
        borderRadius: 18,
        background: palette.background,
        border: `1px solid ${palette.border}`,
        color: palette.accent,
        fontWeight: 500,
      }}
    >
      {message.title && <strong style={{ fontSize: '0.95rem' }}>{message.title}</strong>}
      <div style={{ color: withOpacity(palette.accent, 0.82), fontSize: '0.92rem' }}>{message.description}</div>
    </div>
  )
}

function renderActionMenuItem(action: FlowExperienceAction, closeMenu: () => void) {
  const variant = action.variant ?? 'secondary'
  const baseStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 14,
    fontWeight: 600,
    fontSize: '0.85rem',
    textDecoration: 'none',
    cursor: action.disabled ? 'not-allowed' : 'pointer',
    opacity: action.disabled ? 0.65 : 1,
    width: '100%',
    ...actionTone[variant],
  }

  const content = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {action.icon && <span aria-hidden>{action.icon}</span>}
      {action.label}
    </span>
  )

  if (action.href && !action.disabled) {
    return (
      <a
        key={action.id}
        href={action.href}
        style={baseStyle}
        onClick={() => {
          closeMenu()
          action.onClick?.()
        }}
        data-testid={action.testId}
      >
        {content}
      </a>
    )
  }

  if (action.href && action.disabled) {
    return (
      <span
        key={action.id}
        style={{ ...baseStyle, pointerEvents: 'none' }}
        aria-disabled="true"
        data-testid={action.testId}
      >
        {content}
      </span>
    )
  }

  return (
    <button
      key={action.id}
      type="button"
      onClick={() => {
        closeMenu()
        action.onClick?.()
      }}
      disabled={action.disabled}
      style={baseStyle}
      data-testid={action.testId}
    >
      {content}
    </button>
  )
}
