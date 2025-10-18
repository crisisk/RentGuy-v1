import { useMemo, type MouseEvent } from 'react'
import { brand, brandFontStack, headingFontStack } from './branding'
import { buildHelpCenterUrl, type MarketingExperienceConfig } from './experienceConfig'

const layout = {
  page: {
    fontFamily: brandFontStack,
    backgroundColor: '#0B1224',
    color: '#E2E8F0',
    margin: 0,
  } as const,
  main: {
    maxWidth: '1180px',
    margin: '0 auto',
    padding: '72px 24px 96px',
    display: 'flex',
    flexDirection: 'column',
    gap: '72px',
  } as const,
  section: {
    display: 'grid',
    gap: '28px',
  } as const,
}

interface SectionHeaderProps {
  readonly eyebrow: string
  readonly title: string
  readonly description: string
}

function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <header style={{ display: 'grid', gap: '12px', maxWidth: '720px' }}>
      <span style={{ color: brand.colors.accent, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {eyebrow}
      </span>
      <h2
        style={{
          fontFamily: headingFontStack,
          fontSize: '2.35rem',
          lineHeight: 1.1,
          margin: 0,
          color: '#F8FAFC',
        }}
      >
        {title}
      </h2>
      <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: 1.6, color: '#CBD5F5' }}>{description}</p>
    </header>
  )
}

interface MarketingDemoPageProps {
  readonly config: MarketingExperienceConfig
  readonly onNavigate?: (path: string, options?: { replace?: boolean }) => void
  readonly currentPath?: string
}

const personaTrackBlueprint = [
  {
    id: 'operations',
    title: 'Operations cockpit',
    description:
      'Controleer real-time beschikbaarheid, AI-planning en crew hand-offs. Ideaal voor operations leads die schaalbaarheid toetsen.',
    persona: 'Bart · Operations',
    resourceSlug: 'operations-playbook',
  },
  {
    id: 'finance',
    title: 'Finance & billing',
    description:
      'Valideer forecasting, cashflow en automatische facturatie. Inclusief koppelingen met ERP en betalingsproviders.',
    persona: 'Anna · Finance',
    resourceSlug: 'finance-automation',
  },
  {
    id: 'customer-success',
    title: 'Customer success & journeys',
    description:
      'Bekijk klantcommunicatie, aftercare en SLA-journeys. Perfect voor customer success om retentie te maximaliseren.',
    persona: 'Sven · Customer Success',
    resourceSlug: 'journey-library',
  },
] as const

const experienceStages = [
  {
    id: 'kickoff',
    title: 'Kick-off call',
    description: 'We plannen een 30 minuten sessie om doelstellingen, datastructuren en branding vast te leggen.',
    duration: 'Dag 0',
  },
  {
    id: 'sandbox',
    title: 'Demo sandbox activeren',
    description: 'Jouw team krijgt persona-toegang, monitoring en journey explainers met tenant branding.',
    duration: 'Dag 1',
  },
  {
    id: 'validation',
    title: 'Scenario validatie',
    description: 'Doorloop operations, finance en success scenario’s met audit-trails en status monitoring.',
    duration: 'Dag 2-4',
  },
  {
    id: 'launch',
    title: 'Launch readiness review',
    description: 'We sluiten af met go-live checklist, governance afspraken en supportkaders.',
    duration: 'Dag 5-10',
  },
] as const

const onboardingChecklistBlueprint = [
  {
    id: 'provision',
    title: 'Provisioning & branding',
    description: 'Subdomein, branding tokens en security policies staan binnen één sprint klaar.',
    resourceSlug: 'kickoff-kit',
  },
  {
    id: 'integrations',
    title: 'Integraties & data',
    description: 'Koppel CRM, finance en voorraad. We leveren validatiescripts en datakwaliteit-rapportages.',
    resourceSlug: 'integration-readiness',
  },
  {
    id: 'go-live',
    title: 'Go-live governance',
    description: 'Controlelijsten voor audits, escalaties en monitoring zijn gekoppeld aan statuspagina en helpcenter.',
    resourceSlug: 'go-live-checklist',
  },
] as const

interface ProofLinkResources {
  readonly helpCenter: string
  readonly status: string
  readonly runbook: string
}

const proofLinksBlueprint = [
  {
    id: 'status',
    label: 'Platformstatus',
    description: 'Realtime uptime, incidentmeldingen en onderhoudsplanning per tenant.',
    resolveHref: (resources: ProofLinkResources) => resources.status,
  },
  {
    id: 'helpcenter',
    label: 'Helpcenter bibliotheek',
    description: 'Templates, runbooks en journey explainers afgestemd op jouw tenant.',
    resolveHref: (resources: ProofLinkResources) => resources.helpCenter,
  },
  {
    id: 'runbook',
    label: 'Technisch runbook',
    description: 'Gedetailleerde stappen voor provisioning, monitoring en rollback scenario’s.',
    resolveHref: (resources: ProofLinkResources) => resources.runbook,
  },
] as const

export default function MarketingDemoPage({ config, onNavigate }: MarketingDemoPageProps): JSX.Element {
  const support = config.support
  const helpCenterUrl = support.helpCenterBaseUrl
  const journeyLibraryUrl = buildHelpCenterUrl(support, 'customer-journeys')
  const runbookUrl = buildHelpCenterUrl(support, 'runbook')
  const complianceUrl = buildHelpCenterUrl(support, 'compliance')
  const onboardingChecklistUrl = buildHelpCenterUrl(support, 'onboarding-checklist')
  const statusUrl = support.statusPageUrl

  const personaTracks = useMemo(
    () =>
      personaTrackBlueprint.map(track => ({
        ...track,
        resourceHref: track.resourceSlug === 'journey-library'
          ? journeyLibraryUrl
          : buildHelpCenterUrl(support, track.resourceSlug),
      })),
    [journeyLibraryUrl, support],
  )

  const onboardingChecklist = useMemo(
    () =>
      onboardingChecklistBlueprint.map(item => ({
        ...item,
        resourceHref: buildHelpCenterUrl(support, item.resourceSlug),
      })),
    [support],
  )

  const proofLinks = useMemo(
    () =>
      proofLinksBlueprint.map(({ resolveHref, ...link }) => ({
        ...link,
        href: resolveHref({
          helpCenter: helpCenterUrl,
          status: statusUrl,
          runbook: runbookUrl,
        }),
      })),
    [helpCenterUrl, runbookUrl, statusUrl],
  )

  const isInternalLink = (href: string) => href.startsWith('/') && !href.startsWith('//')

  const handleInternalNavigation = (event: MouseEvent<HTMLAnchorElement>, href: string, options?: { replace?: boolean }) => {
    if (!onNavigate || !isInternalLink(href)) {
      return
    }
    event.preventDefault()
    onNavigate(href, options)
  }

  return (
    <div style={layout.page}>
      <nav
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '28px 24px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        aria-label="Demo navigatie"
      >
        <button
          type="button"
          onClick={() => onNavigate?.('/')}
          style={{
            padding: '10px 18px',
            borderRadius: '999px',
            border: '1px solid rgba(148, 163, 184, 0.4)',
            background: 'transparent',
            color: '#E2E8F0',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ← Terug naar overzicht
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a
            href={statusUrl}
            style={{
              padding: '10px 18px',
              borderRadius: '999px',
              background: 'rgba(56, 189, 248, 0.18)',
              color: '#F8FAFC',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Status
          </a>
          <a
            href={helpCenterUrl}
            style={{
              padding: '10px 18px',
              borderRadius: '999px',
              border: '1px solid rgba(148, 163, 184, 0.45)',
              color: '#E2E8F0',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Helpcenter
          </a>
        </div>
      </nav>
      <main style={layout.main}>
        <section style={layout.section}>
          <div
            style={{
              display: 'grid',
              gap: '24px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'grid', gap: '18px' }}>
              <span style={{ color: '#A5B4FC', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Interactieve demo
              </span>
              <h1
                style={{
                  fontFamily: headingFontStack,
                  fontSize: '3rem',
                  lineHeight: 1.05,
                  margin: 0,
                  color: '#F8FAFC',
                }}
              >
                Ontdek de journeys per persona
              </h1>
              <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: 1.7, color: '#CBD5F5' }}>
                Doorloop de drie kernpersona’s en activeer monitoring, explainers en governance zoals prospects het ervaren.
                De demo is gekoppeld aan statuspagina en helpcenter zodat je direct kunt opschalen.
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <a
                  href="/"
                  onClick={event => handleInternalNavigation(event, '/')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '999px',
                    background: brand.colors.gradient,
                    color: '#0B1026',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 18px 36px rgba(79, 70, 229, 0.35)',
                  }}
                >
                  Bekijk overview
                </a>
                <a
                  href="/#contact"
                  onClick={event => handleInternalNavigation(event, '/#contact')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '999px',
                    border: '1px solid rgba(148, 163, 184, 0.45)',
                    color: '#E2E8F0',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  Plan onboarding call
                </a>
              </div>
            </div>
            <div
              style={{
                borderRadius: '28px',
                padding: '28px',
                background: 'linear-gradient(150deg, rgba(148, 163, 255, 0.18) 0%, rgba(15, 23, 42, 0.82) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                boxShadow: '0 24px 60px rgba(15, 23, 42, 0.45)',
                display: 'grid',
                gap: '12px',
              }}
            >
              {experienceStages.map(stage => (
                <div key={stage.id} style={{ display: 'grid', gap: 4 }}>
                  <span style={{ color: '#A5B4FC', fontSize: '0.85rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {stage.duration}
                  </span>
                  <strong style={{ color: '#F8FAFC', fontFamily: headingFontStack }}>{stage.title}</strong>
                  <p style={{ margin: 0, color: '#CBD5F5', lineHeight: 1.5 }}>{stage.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={layout.section}>
          <SectionHeader
            eyebrow="Persona journeys"
            title="Kies een scenario en activeer de juiste explainers"
            description="Elke journey koppelt dashboards, monitoring en helpcenter artikelen zodat prospects exact zien wat ze krijgen."
          />
          <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {personaTracks.map(track => (
              <article
                key={track.id}
                style={{
                  padding: '24px',
                  borderRadius: '22px',
                  background: 'rgba(15, 23, 42, 0.82)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  display: 'grid',
                  gap: '10px',
                }}
              >
                <span style={{ color: '#A5B4FC', fontSize: '0.85rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {track.persona}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#F8FAFC', fontFamily: headingFontStack }}>{track.title}</h3>
                <p style={{ margin: 0, color: '#CBD5F5', lineHeight: 1.6 }}>{track.description}</p>
                <a
                  href={track.resourceHref}
                  style={{ color: brand.colors.accent, fontWeight: 600, textDecoration: 'none' }}
                >
                  Bekijk scenario →
                </a>
              </article>
            ))}
          </div>
        </section>

        <section style={{ ...layout.section, scrollMarginTop: 120 }} id="onboarding">
          <SectionHeader
            eyebrow="Onboarding"
            title="Van demo naar productie in drie werven"
            description="Customer success volgt deze checklist voor maximale adoptie en converteert demo’s naar live tenants."
          />
          <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {onboardingChecklist.map(item => (
              <article
                key={item.id}
                style={{
                  padding: '24px',
                  borderRadius: '22px',
                  background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.18) 0%, rgba(15, 23, 42, 0.85) 100%)',
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  display: 'grid',
                  gap: '10px',
                }}
              >
                <h3 style={{ margin: 0, color: '#F8FAFC', fontSize: '1.2rem', fontFamily: headingFontStack }}>{item.title}</h3>
                <p style={{ margin: 0, color: '#CBD5F5', lineHeight: 1.6 }}>{item.description}</p>
                <a
                  href={item.resourceHref}
                  style={{ color: brand.colors.accent, fontWeight: 600, textDecoration: 'none' }}
                >
                  Resource →
                </a>
              </article>
            ))}
          </div>
          <div
            style={{
              padding: '24px 28px',
              borderRadius: '18px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              display: 'grid',
              gap: '12px',
            }}
          >
            <strong style={{ color: '#F8FAFC', fontFamily: headingFontStack }}>Checklist downloaden?</strong>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a
                href={onboardingChecklistUrl}
                style={{
                  padding: '10px 18px',
                  borderRadius: '999px',
                  background: brand.colors.gradient,
                  color: '#0B1026',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Download checklist
              </a>
              <a
                href={complianceUrl}
                style={{
                  padding: '10px 18px',
                  borderRadius: '999px',
                  border: '1px solid rgba(148, 163, 184, 0.45)',
                  color: '#E2E8F0',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Compliance & status
              </a>
            </div>
          </div>
        </section>

        <section style={layout.section}>
          <SectionHeader
            eyebrow="Bewijs & resources"
            title="Alle bewijslast binnen handbereik"
            description="Gebruik deze bronnen tijdens demo’s, interne alignment en besluitvorming."
          />
          <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {proofLinks.map(link => (
              <article
                key={link.id}
                style={{
                  padding: '24px',
                  borderRadius: '22px',
                  background: 'rgba(15, 23, 42, 0.82)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  display: 'grid',
                  gap: '10px',
                }}
              >
                <h3 style={{ margin: 0, color: '#F8FAFC', fontSize: '1.1rem' }}>{link.label}</h3>
                <p style={{ margin: 0, color: '#CBD5F5', lineHeight: 1.6 }}>{link.description}</p>
                <a href={link.href} style={{ color: brand.colors.accent, fontWeight: 600, textDecoration: 'none' }}>
                  Open resource →
                </a>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer
        style={{
          borderTop: '1px solid rgba(148, 163, 184, 0.18)',
          padding: '28px 24px 48px',
          maxWidth: '1180px',
          margin: '0 auto',
          color: '#94A3B8',
          fontSize: '0.9rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between' }}>
          <span>© {new Date().getFullYear()} {brand.shortName}. Demo-ervaring.</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href={statusUrl} style={{ color: '#CBD5F5', textDecoration: 'none' }}>
              Status
            </a>
            <a href={helpCenterUrl} style={{ color: '#CBD5F5', textDecoration: 'none' }}>
              Helpcenter
            </a>
            <a href="/" onClick={event => handleInternalNavigation(event, '/')} style={{ color: brand.colors.accent, textDecoration: 'none' }}>
              Terug naar overzicht
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
