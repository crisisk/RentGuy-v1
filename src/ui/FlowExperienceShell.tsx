import { useMemo, type CSSProperties, type ReactNode } from 'react'
import ExperienceLayout, { type ExperienceLayoutProps } from '@ui/ExperienceLayout'
import FlowExperienceNavRail, { type FlowExperienceNavRailProps } from '@ui/FlowExperienceNavRail'
import { brand, headingFontStack, withOpacity } from '@ui/branding'

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

export interface FlowExperienceShellProps extends Omit<ExperienceLayoutProps, 'headerSlot'> {
  breadcrumbs?: FlowExperienceBreadcrumb[]
  persona?: FlowExperiencePersona
  stage?: FlowExperienceStage
  actions?: FlowExperienceAction[]
  statusMessage?: FlowExperienceStatusMessage
  footerAside?: ReactNode
  navigationRail?: FlowExperienceNavRailProps
  children?: ReactNode
}

const actionVariantStyles: Record<FlowActionVariant, CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.95) 0%, rgba(14, 165, 233, 0.95) 100%)',
    color: '#ffffff',
    border: 'none',
  },
  secondary: {
    background: withOpacity('#FFFFFF', 0.12),
    color: '#ffffff',
    border: `1px solid ${withOpacity('#FFFFFF', 0.28)}`,
  },
  ghost: {
    background: 'transparent',
    color: withOpacity('#FFFFFF', 0.85),
    border: `1px solid ${withOpacity('#FFFFFF', 0.18)}`,
  },
}

const statusTonePalette: Record<FlowExperienceStatusMessage['tone'], { background: string; border: string; text: string }> = {
  info: {
    background: withOpacity(brand.colors.primary, 0.12),
    border: withOpacity(brand.colors.primary, 0.24),
    text: brand.colors.primary,
  },
  success: {
    background: withOpacity(brand.colors.success, 0.12),
    border: withOpacity(brand.colors.success, 0.26),
    text: brand.colors.success,
  },
  warning: {
    background: withOpacity(brand.colors.warning, 0.14),
    border: withOpacity(brand.colors.warning, 0.28),
    text: brand.colors.warning,
  },
  danger: {
    background: withOpacity(brand.colors.danger, 0.16),
    border: withOpacity(brand.colors.danger, 0.3),
    text: brand.colors.danger,
  },
}

function renderBreadcrumbs(breadcrumbs: FlowExperienceBreadcrumb[] | undefined): ReactNode {
  if (!breadcrumbs?.length) {
    return null
  }

  return (
    <nav
      aria-label="Breadcrumbs"
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginRight: 'auto',
      }}
    >
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1
        return (
          <span key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {crumb.href && !isLast ? (
              <a
                href={crumb.href}
                style={{ color: withOpacity('#FFFFFF', 0.85), fontWeight: 600, textDecoration: 'none' }}
              >
                {crumb.label}
              </a>
            ) : (
              <span
                style={{
                  color: withOpacity('#FFFFFF', isLast ? 0.95 : 0.6),
                  fontWeight: isLast ? 700 : 500,
                }}
              >
                {crumb.label}
              </span>
            )}
            {!isLast && <span aria-hidden style={{ color: withOpacity('#FFFFFF', 0.35) }}>›</span>}
          </span>
        )
      })}
    </nav>
  )
}

function renderPersona(persona: FlowExperiencePersona | undefined): ReactNode {
  if (!persona) {
    return null
  }

  const initials = persona.initials ?? persona.name.split(' ').map(part => part.charAt(0)).join('').slice(0, 2).toUpperCase()

  return (
    <div
      data-testid="flow-persona"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 12px',
        borderRadius: 999,
        background: withOpacity('#FFFFFF', 0.14),
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: withOpacity('#000000', 0.35),
          fontWeight: 700,
        }}
      >
        {initials}
      </span>
      <span style={{ display: 'grid', gap: 2 }}>
        <span style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: withOpacity('#FFFFFF', 0.75) }}>
          {persona.role}
        </span>
        <span style={{ fontWeight: 600, color: '#ffffff' }}>{persona.name}</span>
        {persona.meta && <span style={{ fontSize: '0.78rem', color: withOpacity('#FFFFFF', 0.7) }}>{persona.meta}</span>}
      </span>
    </div>
  )
}

function renderStage(stage: FlowExperienceStage | undefined): ReactNode {
  if (!stage) {
    return null
  }

  const statusLabel = stage.status === 'completed' ? 'Afgerond' : stage.status === 'in-progress' ? 'Actief' : 'Volgende stap'

  return (
    <div
      style={{
        display: 'grid',
        gap: 4,
        padding: '6px 12px',
        borderRadius: 14,
        background: withOpacity('#FFFFFF', 0.1),
        color: '#ffffff',
        minWidth: 160,
      }}
    >
      <span style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>{statusLabel}</span>
      <span style={{ fontWeight: 600 }}>{stage.label}</span>
      {stage.detail && <span style={{ fontSize: '0.78rem', color: withOpacity('#FFFFFF', 0.75) }}>{stage.detail}</span>}
    </div>
  )
}

function renderAction(action: FlowExperienceAction): ReactNode {
  const variant = action.variant ?? 'secondary'
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '8px 16px',
    borderRadius: 999,
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: action.disabled ? 'not-allowed' : 'pointer',
    opacity: action.disabled ? 0.6 : 1,
    textDecoration: 'none',
  }

  const style = { ...baseStyle, ...actionVariantStyles[variant] }

  if (action.href) {
    return (
      <a
        key={action.id}
        href={action.href}
        onClick={action.disabled ? undefined : action.onClick}
        style={style}
        aria-disabled={action.disabled || undefined}
        data-testid={action.testId}
      >
        {action.icon && <span aria-hidden>{action.icon}</span>}
        {action.label}
      </a>
    )
  }

  return (
    <button
      key={action.id}
      type="button"
      onClick={action.disabled ? undefined : action.onClick}
      style={style}
      disabled={action.disabled}
      data-testid={action.testId}
    >
      {action.icon && <span aria-hidden>{action.icon}</span>}
      {action.label}
    </button>
  )
}

function StatusMessageBlock({ message }: { message: FlowExperienceStatusMessage }): JSX.Element {
  const palette = statusTonePalette[message.tone]

  return (
    <div
      role="status"
      style={{
        display: 'grid',
        gap: 8,
        padding: '16px 18px',
        borderRadius: 18,
        background: palette.background,
        border: `1px solid ${palette.border}`,
        color: palette.text,
      }}
    >
      {message.title && (
        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{message.title}</span>
      )}
      <div style={{ color: withOpacity(palette.text, 0.85), fontSize: '0.9rem' }}>{message.description}</div>
    </div>
  )
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
}: FlowExperienceShellProps): JSX.Element {
  const headerSlot = useMemo(() => {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 12,
          flexWrap: 'wrap',
          width: '100%',
        }}
      >
        {renderBreadcrumbs(breadcrumbs)}
        {renderStage(stage)}
        {renderPersona(persona)}
        {actions?.length ? (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {actions.map(action => renderAction(action))}
          </div>
        ) : null}
      </div>
    )
  }, [breadcrumbs, stage, persona, actions])

  const content = (
    <div style={{ display: 'grid', gap: 24 }}>
      {statusMessage && <StatusMessageBlock message={statusMessage} />}
      <div
        style={
          navigationRail
            ? {
                display: 'grid',
                gap: 24,
                alignItems: 'start',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(clamp(260px, 28vw, 340px), 1fr)',
              }
            : { display: 'grid', gap: 24 }
        }
      >
        <div style={{ display: 'grid', gap: 24 }}>{children}</div>
        {navigationRail && <FlowExperienceNavRail {...navigationRail} />}
      </div>
      {footerAside && (
        <aside
          style={{
            padding: '18px 22px',
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.85) 100%)',
            border: `1px solid ${withOpacity('#FFFFFF', 0.16)}`,
            color: '#ffffff',
            fontFamily: headingFontStack,
          }}
        >
          {footerAside}
        </aside>
      )}
    </div>
  )

  return <ExperienceLayout {...layoutProps} headerSlot={headerSlot}>{content}</ExperienceLayout>
}
