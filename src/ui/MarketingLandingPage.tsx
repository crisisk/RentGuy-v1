import { brand, brandFontStack, headingFontStack } from './branding'
import type { MarketingExperienceConfig } from './experienceConfig'

const layout = {
  page: {
    fontFamily: brandFontStack,
    backgroundColor: '#0F172A',
    color: '#E2E8F0',
    margin: 0,
  } as const,
  main: {
    maxWidth: '1180px',
    margin: '0 auto',
    padding: '80px 24px 96px',
    display: 'flex',
    flexDirection: 'column',
    gap: '96px',
  } as const,
  section: {
    display: 'grid',
    gap: '32px',
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
          fontSize: '2.5rem',
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

interface MarketingLandingPageProps {
  readonly config: MarketingExperienceConfig
}

const heroHighlights = [
  { label: 'Live asset sync', value: 'Real-time beschikbaarheid voor verhuurteams' },
  { label: 'Self-service onboarding', value: 'Binnen 20 minuten operationeel' },
  { label: 'SLA 99.95%', value: 'Enterprise support via Sevensa' },
]

const pains = [
  {
    pain: 'Handmatige planning kost te veel tijd',
    solution: 'AI-planners vullen gaten automatisch en signaleren conflicten voordat ze ontstaan.',
  },
  {
    pain: 'Gebrekkig inzicht in beschikbaarheid',
    solution: 'Realtime dashboards combineren verhuurkalenders, voorraad en crewplanning in één scherm.',
  },
  {
    pain: 'Inconsistent klantcontact',
    solution: 'Geautomatiseerde flows sturen reminders, checklists en aftercare direct vanuit RentGuy.',
  },
]

const offerings = [
  {
    title: 'Planner cockpit',
    description:
      'Optimaliseer verhuuraanvragen met AI-voorstellen, conflictpreventie en connecties naar je CRM en boekhouding.',
  },
  {
    title: 'Crew & logistiek',
    description:
      'Stuur crewroosters, transport en materiaalsets vanuit één timeline met mobiele toegang voor uitvoerende teams.',
  },
  {
    title: 'Billing & compliance',
    description:
      'Automatiseer facturatie, borgstellingen en compliance-kaders met ingebouwde audit trails.',
  },
]

const pricingTiers = [
  {
    name: 'Launch',
    price: '€349',
    cadence: 'per maand',
    description: 'Voor scale-ups die binnen één regio actief zijn.',
    bullets: ['20 actieve projecten', 'Standaard AI-planner', 'E-mail/SMS notificaties', 'Support binnen 1 werkdag'],
  },
  {
    name: 'Professional',
    price: '€649',
    cadence: 'per maand',
    description: 'Voor multi-locatie verhuurorganisaties met eigen crew.',
    bullets: [
      'Onbeperkte projecten & resources',
      'Realtime voorraad & crew sync',
      'Custom branding voor portalen',
      'Dedicated customer success',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Op maat',
    cadence: 'met SLA en governance afspraken',
    description: 'Voor internationale verhuurketens met maatwerk integraties.',
    bullets: ['Multi-tenant setup', 'Advanced security controls', 'Premium support 24/7', 'Integraties op aanvraag'],
  },
]

const explainerSteps = [
  {
    title: '1. Configureer je tenant',
    body: 'Wij zetten een branded subdomein op (bijv. mr-dj.rentguy.nl) en importeren je bestaande datasets.',
  },
  {
    title: '2. Upload credentials eenmalig',
    body: 'Koppel boekhouding, CRM en documenten veilig via het secrets dashboard met rotatie-alerts.',
  },
  {
    title: '3. Activeer AI-playbooks',
    body: 'Kies de juiste operationele scenario’s en volg real-time journey maps voor elke persona.',
  },
]

const contactChannels = [
  { label: 'Bel ons', value: '+31 20 123 45 67', href: 'tel:+31201234567' },
  { label: 'Plan een demo', value: 'Calendly.com/rentguy/demo', href: 'https://calendly.com/rentguy/demo' },
  { label: 'Mail', value: 'hello@rentguy.nl', href: 'mailto:hello@rentguy.nl' },
]

export function MarketingLandingPage({ config }: MarketingLandingPageProps): JSX.Element {
  return (
    <div style={layout.page}>
      <nav
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '32px 24px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        aria-label="Hoofdnavigatie"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            aria-hidden="true"
            style={{
              width: 48,
              height: 48,
              borderRadius: '18px',
              background: brand.colors.gradient,
              boxShadow: '0 18px 36px rgba(59, 130, 246, 0.35)',
            }}
          />
          <div style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontFamily: headingFontStack, fontWeight: 700, fontSize: '1.35rem', color: '#F8FAFC' }}>
              {brand.shortName}
            </span>
            <span style={{ color: '#94A3B8', fontSize: '0.95rem' }}>{brand.partnerTagline}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a
            href={config.primaryCtaHref}
            style={{
              padding: '12px 20px',
              borderRadius: '999px',
              background: brand.colors.gradient,
              color: '#0B1026',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Bekijk demo
          </a>
          <a
            href={config.secondaryCtaHref}
            style={{
              padding: '12px 20px',
              borderRadius: '999px',
              border: '1px solid rgba(148, 163, 184, 0.45)',
              color: '#E2E8F0',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Contact
          </a>
        </div>
      </nav>
      <main style={layout.main}>
        <section style={{ ...layout.section, marginTop: '32px' }}>
          <div
            style={{
              display: 'grid',
              gap: '32px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'grid', gap: '24px' }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <span style={{ color: '#A5B4FC', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Verhuur zonder frictie
                </span>
                <h1
                  style={{
                    fontFamily: headingFontStack,
                    fontSize: '3.2rem',
                    lineHeight: 1.05,
                    margin: 0,
                    color: '#F8FAFC',
                  }}
                >
                  Alles-in-één verhuurplatform voor crews, planners en finance
                </h1>
                <p style={{ fontSize: '1.12rem', lineHeight: 1.7, margin: 0, color: '#CBD5F5' }}>
                  RentGuy verenigt planning, voorraad, crew en facturatie in één AI-gestuurde omgeving. We laten je team sneller
                  schakelen met realtime inzicht en actiegerichte journeys per persona.
                </p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <a
                  href={config.primaryCtaHref}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '999px',
                    background: brand.colors.gradient,
                    color: '#0B1026',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 18px 36px rgba(79, 70, 229, 0.35)',
                  }}
                >
                  Start interactieve demo
                </a>
                <a
                  href="https://mr-dj.rentguy.nl/dashboard"
                  style={{
                    padding: '14px 28px',
                    borderRadius: '999px',
                    border: '1px solid rgba(148, 163, 184, 0.45)',
                    color: '#E2E8F0',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  Bekijk onboarding checklist
                </a>
              </div>
            </div>
            <div
              style={{
                position: 'relative',
                borderRadius: '32px',
                padding: '32px',
                background: 'linear-gradient(145deg, rgba(148,163,255,0.16) 0%, rgba(15,23,42,0.86) 55%)',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                boxShadow: brand.colors.shadow,
              }}
            >
              <div style={{ display: 'grid', gap: '16px' }}>
                {heroHighlights.map(highlight => (
                  <div key={highlight.label} style={{ display: 'grid', gap: 6 }}>
                    <span style={{ color: '#A5B4FC', fontSize: '0.85rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {highlight.label}
                    </span>
                    <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 500 }}>{highlight.value}</p>
                  </div>
                ))}
              </div>
              {config.demoVideoUrl && (
                <video
                  controls
                  preload="metadata"
                  style={{
                    marginTop: '28px',
                    width: '100%',
                    borderRadius: '20px',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    boxShadow: '0 20px 60px rgba(15, 23, 42, 0.55)',
                    backgroundColor: '#0F172A',
                  }}
                >
                  <source src={config.demoVideoUrl} type="video/mp4" />
                  Je browser ondersteunt de demo-video niet. Download hem via{' '}
                  <a href={config.demoVideoUrl} style={{ color: brand.colors.accent }}>
                    deze link
                  </a>
                  .
                </video>
              )}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: '-32px -48px auto auto',
                  width: '220px',
                  height: '220px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, rgba(15,23,42,0) 65%)',
                  opacity: 0.8,
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
        </section>

        <section style={layout.section}>
          <SectionHeader
            eyebrow="Waarom teams overstappen"
            title="Van chaos naar controle met journeys per persona"
            description="RentGuy combineert inzichten uit planners, finance en operations. Elke gebruiker krijgt de juiste context, tooling en actieknoppen voor zijn rol."
          />
          <div
            style={{
              display: 'grid',
              gap: '24px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}
          >
            {offerings.map(offer => (
              <article
                key={offer.title}
                style={{
                  padding: '28px',
                  borderRadius: '24px',
                  background: 'linear-gradient(160deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.65) 100%)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  display: 'grid',
                  gap: '12px',
                }}
              >
                <h3 style={{ margin: 0, fontFamily: headingFontStack, fontSize: '1.45rem', color: '#F8FAFC' }}>{offer.title}</h3>
                <p style={{ margin: 0, color: '#CBD5F5', lineHeight: 1.6 }}>{offer.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={layout.section}>
          <SectionHeader
            eyebrow="Klantpijn opgelost"
            title="We pakken de grootste knelpunten van verhuurorganisaties aan"
            description="Best practices uit honderden implementaties vormen de basis van ons platform. De pijnpunten uit intakeworkshops vertalen we naar directe workflows en alerts."
          />
          <div
            style={{
              display: 'grid',
              gap: '20px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            }}
          >
            {pains.map(item => (
              <article
                key={item.pain}
                style={{
                  padding: '28px',
                  borderRadius: '24px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  display: 'grid',
                  gap: '12px',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#F8FAFC' }}>{item.pain}</h3>
                <p style={{ margin: 0, color: '#CBD5F5', lineHeight: 1.6 }}>{item.solution}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={layout.section}>
          <SectionHeader
            eyebrow="Prijzen"
            title="Kies een pakket dat met je organisatie meegroeit"
            description="Transparante pakketten met toegang tot onze AI-planner, crew workflows en compliance tooling."
          />
          <div
            style={{
              display: 'grid',
              gap: '24px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}
          >
            {pricingTiers.map(tier => (
              <article
                key={tier.name}
                style={{
                  padding: '32px',
                  borderRadius: '28px',
                  background: tier.highlighted
                    ? 'linear-gradient(145deg, rgba(79,70,229,0.22) 0%, rgba(15,23,42,0.92) 100%)'
                    : 'rgba(15, 23, 42, 0.78)',
                  border: tier.highlighted
                    ? '1px solid rgba(129, 140, 248, 0.65)'
                    : '1px solid rgba(148, 163, 184, 0.25)',
                  display: 'grid',
                  gap: '18px',
                  boxShadow: tier.highlighted ? '0 28px 80px rgba(79, 70, 229, 0.35)' : undefined,
                }}
              >
                <div style={{ display: 'grid', gap: '8px' }}>
                  <span style={{ fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8' }}>
                    {tier.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '2.4rem', fontWeight: 700, color: '#F8FAFC' }}>{tier.price}</span>
                    <span style={{ color: '#CBD5F5' }}>{tier.cadence}</span>
                  </div>
                  <p style={{ margin: 0, color: '#CBD5F5', lineHeight: 1.6 }}>{tier.description}</p>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '12px' }}>
                  {tier.bullets.map(bullet => (
                    <li key={bullet} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span aria-hidden="true" style={{ color: brand.colors.accent }}>✓</span>
                      <span style={{ color: '#E2E8F0' }}>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={config.primaryCtaHref}
                  style={{
                    marginTop: '8px',
                    padding: '14px 24px',
                    borderRadius: '999px',
                    textAlign: 'center',
                    textDecoration: 'none',
                    fontWeight: 600,
                    background: tier.highlighted ? brand.colors.gradient : 'rgba(148, 163, 184, 0.25)',
                    color: tier.highlighted ? '#0B1026' : '#F8FAFC',
                  }}
                >
                  Plan onboarding call
                </a>
              </article>
            ))}
          </div>
        </section>

        <section style={layout.section}>
          <SectionHeader
            eyebrow="Hoe we implementeren"
            title="Binnen drie stappen live op je eigen subdomein"
            description="Een bewezen onboardingmodel zorgt ervoor dat nieuwe klanten binnen één sprint operationeel zijn."
          />
          <div style={{ display: 'grid', gap: '18px' }}>
            {explainerSteps.map(step => (
              <article
                key={step.title}
                style={{
                  padding: '24px 28px',
                  borderRadius: '20px',
                  background: 'rgba(15, 23, 42, 0.82)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  display: 'grid',
                  gap: '12px',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#F8FAFC' }}>{step.title}</h3>
                <p style={{ margin: 0, color: '#CBD5F5', lineHeight: 1.6 }}>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={layout.section} id="contact">
          <SectionHeader
            eyebrow="Contact"
            title="Plan direct een gesprek met het RentGuy team"
            description="Ons customer success team helpt je met datastructuren, integraties en branding zodat je binnen weken live bent."
          />
          <div
            style={{
              display: 'grid',
              gap: '18px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            {contactChannels.map(channel => (
              <a
                key={channel.label}
                href={channel.href}
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#F8FAFC',
                  textDecoration: 'none',
                  display: 'grid',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '0.9rem', color: '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {channel.label}
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{channel.value}</span>
              </a>
            ))}
          </div>
        </section>
      </main>
      <footer
        style={{
          borderTop: '1px solid rgba(148, 163, 184, 0.15)',
          padding: '32px 24px 48px',
          maxWidth: '1180px',
          margin: '0 auto',
          color: '#94A3B8',
          fontSize: '0.9rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between' }}>
          <span>© {new Date().getFullYear()} {brand.shortName}. Alle rechten voorbehouden.</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="https://sevensa.ai/privacy" style={{ color: '#CBD5F5', textDecoration: 'none' }}>
              Privacy
            </a>
            <a href="https://sevensa.ai/security" style={{ color: '#CBD5F5', textDecoration: 'none' }}>
              Security
            </a>
            <a href={config.primaryCtaHref} style={{ color: brand.colors.accent, textDecoration: 'none' }}>
              Start demo
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MarketingLandingPage
