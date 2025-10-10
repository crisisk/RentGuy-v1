import React, { useEffect, useMemo, useState } from 'react'
import { api } from './api.js'
import { brand, brandFontStack, withOpacity } from './branding.js'

const personaPresets = {
  all: {
    label: 'Alle rollen',
    description: 'Toont de volledige planning zonder filters, ideaal voor gezamenlijke UAT-sessies.',
    timeFilter: 'all',
  },
  admin: {
    label: 'Admin command suite',
    description: 'Executive overzicht met focus op kritieke risico’s, cashflow en documentatieplicht.',
    statusFilter: 'all',
    riskFilter: 'all',
    sortKey: 'risk',
    sortDir: 'desc',
    timeFilter: 'all',
  },
  finance: {
    label: 'Finance cockpit',
    description: 'Filtert afgeronde en risicovolle projecten om cashflow, facturatie en compliance te versnellen.',
    statusFilter: 'completed',
    riskFilter: 'all',
    sortKey: 'end',
    sortDir: 'desc',
    timeFilter: 'past30',
  },
  planner: {
    label: 'Planning studio',
    description: 'Chronologisch venster met opstarttaken, afhankelijkheden en voorraadafstemming voor planners.',
    statusFilter: 'upcoming',
    riskFilter: 'all',
    sortKey: 'start',
    sortDir: 'asc',
    timeFilter: 'next14',
  },
  crew: {
    label: 'Crew operations',
    description: 'Realtime zicht op vandaag lopende opdrachten, briefingnotities en urgente voorraadalerts.',
    statusFilter: 'active',
    riskFilter: 'ok',
    sortKey: 'start',
    sortDir: 'asc',
    timeFilter: 'today',
  },
  viewer: {
    label: 'Stakeholder viewer',
    description: 'Geconsolideerde highlights voor stakeholders met focus op impact en statusupdates.',
    statusFilter: 'all',
    riskFilter: 'warning',
    sortKey: 'status',
    sortDir: 'asc',
    timeFilter: 'next30',
  },
}

const statusLabels = {
  active: 'Actief',
  upcoming: 'Komend',
  completed: 'Afgerond',
  at_risk: 'Risico',
}

const riskLabels = {
  ok: 'Op schema',
  warning: 'Let op',
  critical: 'Kritiek',
}

const statusPriority = {
  at_risk: 0,
  active: 1,
  upcoming: 2,
  completed: 3,
}

const badgePalette = {
  active: '#2563eb',
  upcoming: '#0ea5e9',
  completed: '#10b981',
  at_risk: '#dc2626',
}

const riskPalette = {
  ok: '#16a34a',
  warning: '#d97706',
  critical: '#b91c1c',
}

const cardPalette = {
  neutral: {
    background: 'linear-gradient(135deg, #f8f9fb 0%, #eef1f8 100%)',
    border: withOpacity('#4b5563', 0.08),
    color: brand.colors.secondary,
  },
  success: {
    background: 'linear-gradient(135deg, #d9f7ee 0%, #bdf0da 100%)',
    border: withOpacity('#0f766e', 0.14),
    color: '#065f46',
  },
  warning: {
    background: 'linear-gradient(135deg, #fff4d6 0%, #ffe6b3 100%)',
    border: withOpacity('#b45309', 0.18),
    color: '#92400e',
  },
  danger: {
    background: 'linear-gradient(135deg, #ffe4e6 0%, #fbc2d5 100%)',
    border: withOpacity('#be123c', 0.18),
    color: '#9f1239',
  },
}

const impactPalette = {
  positive: {
    background: '#dcfce7',
    color: '#166534',
  },
  neutral: {
    background: '#e5e7eb',
    color: '#374151',
  },
  warning: {
    background: '#fef3c7',
    color: '#92400e',
  },
  danger: {
    background: '#fee2e2',
    color: '#991b1b',
  },
}

const timeFilterOptions = {
  all: {
    label: 'Alle periodes',
    description: 'Toont elk project ongeacht datum.',
  },
  today: {
    label: 'Vandaag',
    description: 'Accentueert projecten die vandaag starten of actief zijn.',
  },
  next7: {
    label: 'Volgende 7 dagen',
    description: 'Helpt bij korte termijn planning.',
  },
  next14: {
    label: 'Volgende 14 dagen',
    description: 'Geeft zicht op de komende twee weken.',
  },
  next30: {
    label: 'Volgende 30 dagen',
    description: 'Geschikt voor maandelijkse vooruitblik.',
  },
  past30: {
    label: 'Laatste 30 dagen',
    description: 'Focus op recent afgeronde projecten.',
  },
}

const personaQuickActions = {
  admin: [
    { key: 'showExecutivePulse', label: 'Toon executive pulse' },
    { key: 'focusCritical', label: 'Highlight kritieke risico’s' },
    { key: 'resetPersona', label: 'Herstel admin-voorkeuren' },
  ],
  finance: [
    { key: 'showReadyToBill', label: 'Facturatie klaar' },
    { key: 'focusCashflow', label: 'Cashflowvenster' },
    { key: 'resetPersona', label: 'Herstel finance-voorkeuren' },
  ],
  planner: [
    { key: 'showPlannerHorizon', label: 'Bekijk 14-daagse horizon' },
    { key: 'highlightDependencies', label: 'Toon risicovolle ketens' },
    { key: 'resetPersona', label: 'Herstel planner-voorkeuren' },
  ],
  crew: [
    { key: 'crewToday', label: 'Shift van vandaag' },
    { key: 'crewDocs', label: 'Toon briefings zonder notities' },
    { key: 'resetPersona', label: 'Herstel crew-voorkeuren' },
  ],
  viewer: [
    { key: 'viewerHighlights', label: 'Impact highlights' },
    { key: 'viewerCalm', label: 'Minimaliseer ruis' },
    { key: 'resetPersona', label: 'Herstel viewer-voorkeuren' },
  ],
}

function getDaysFromToday(dateString) {
  if (!dateString) return null
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffMs = date.getTime() - today.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

function matchesTimeFilter(event, filter) {
  if (filter === 'all') return true
  const startDiff = getDaysFromToday(event.start)
  const endDiff = getDaysFromToday(event.end)

  if (filter === 'today') {
    if (startDiff === 0) return true
    if (startDiff !== null && startDiff < 0 && endDiff !== null && endDiff >= 0) return true
    if (event.status === 'active') return true
    return false
  }

  if (filter === 'next7') {
    return startDiff !== null && startDiff >= 0 && startDiff <= 7
  }

  if (filter === 'next14') {
    return startDiff !== null && startDiff >= 0 && startDiff <= 14
  }

  if (filter === 'next30') {
    return startDiff !== null && startDiff >= 0 && startDiff <= 30
  }

  if (filter === 'past30') {
    return endDiff !== null && endDiff <= 0 && endDiff >= -30
  }

  return true
}

function computeFinancialSignals(events) {
  return events.reduce(
    (acc, event) => {
      acc.total += 1
      if (event.status === 'completed') acc.billingReady += 1
      if (event.status === 'at_risk' || event.risk === 'critical') acc.revenueAtRisk += 1
      if (event.alerts?.length) acc.inventoryAlerts += 1
      if ((event.status === 'active' || event.status === 'completed') && !event.notes?.trim()) {
        acc.docsMissing += 1
      }

      const daysUntil = getDaysFromToday(event.start)
      if (typeof daysUntil === 'number' && daysUntil >= 0 && daysUntil <= 14) {
        acc.upcomingWithin14 += 1
      }
      return acc
    },
    { total: 0, billingReady: 0, revenueAtRisk: 0, inventoryAlerts: 0, docsMissing: 0, upcomingWithin14: 0 }
  )
}

function buildFinancialCards(signals) {
  if (!signals.total) return []

  const readyShare = Math.round((signals.billingReady / signals.total) * 100)
  const riskShare = Math.round((signals.revenueAtRisk / signals.total) * 100)
  const documentationShare = Math.round((signals.docsMissing / signals.total) * 100)

  return [
    {
      key: 'billingReady',
      title: 'Facturatie klaar',
      value: signals.billingReady,
      helpText: `${readyShare}% van de portfolio kan direct gefactureerd worden.`,
      tone: signals.billingReady ? 'success' : 'neutral',
    },
    {
      key: 'revenueAtRisk',
      title: 'Omzet onder druk',
      value: signals.revenueAtRisk,
      helpText: `${riskShare}% van de planning kent voorraad- of statusrisico’s. Plan mitigatie.`,
      tone: signals.revenueAtRisk ? 'danger' : 'success',
    },
    {
      key: 'inventoryAlerts',
      title: 'Voorraad alerts',
      value: signals.inventoryAlerts,
      helpText: signals.inventoryAlerts
        ? 'Escalaties aanwezig: stem af met magazijn voor directe aanvulling.'
        : 'Geen voorraadblokkades gemeld in de huidige selectie.',
      tone: signals.inventoryAlerts ? 'warning' : 'neutral',
    },
    {
      key: 'docsMissing',
      title: 'Ontbrekende notities',
      value: signals.docsMissing,
      helpText: `${documentationShare}% van actieve/afgeronde projecten mist context voor finance & crew.`,
      tone: signals.docsMissing ? 'warning' : 'success',
    },
  ]
}

function buildValueOpportunities(events) {
  return events.reduce(
    (acc, event) => {
      if (event.status === 'completed') {
        acc.readyToBill.push({
          key: `bill-${event.id}`,
          text: `Factureer ${event.name} (${event.client}) – afgerond op ${formatDate(event.end)}`,
        })
      }

      if (event.status === 'at_risk' || event.risk === 'critical') {
        acc.riskMitigation.push({
          key: `risk-${event.id}`,
          text: `Plan voorraadcheck voor ${event.name} – ${timelineLabel(event)}`,
        })
      }

      if ((event.status === 'active' || event.status === 'completed') && !event.notes?.trim()) {
        acc.documentation.push({
          key: `docs-${event.id}`,
          text: `Documenteer ${event.name} voor snellere facturatie en overdracht`,
        })
      }

      const daysUntil = getDaysFromToday(event.start)
      if (typeof daysUntil === 'number' && daysUntil >= 0 && daysUntil <= 14) {
        acc.upcomingWindow.push({
          key: `upcoming-${event.id}`,
          text: `Bevestig ${event.name} met ${event.client} – start ${formatDate(event.start)}`,
        })
      }

      if (event.alerts?.length) {
        const primaryAlert = event.alerts[0] || 'Controleer reserveringen en leveringen'
        acc.inventoryAlerts.push({
          key: `inventory-${event.id}`,
          text: `${event.name}: ${primaryAlert}`,
        })
      }

      return acc
    },
    { readyToBill: [], riskMitigation: [], documentation: [], upcomingWindow: [], inventoryAlerts: [] }
  )
}

function buildPersonaPlaybook(personaKey, events, signals) {
  if (!personaKey || personaKey === 'all') return []

  const opportunities = buildValueOpportunities(events)
  const sections = []

  const readyCount = signals?.billingReady ?? opportunities.readyToBill.length
  const riskCount = signals?.revenueAtRisk ?? opportunities.riskMitigation.length
  const docCount = signals?.docsMissing ?? opportunities.documentation.length
  const upcomingCount = signals?.upcomingWithin14 ?? opportunities.upcomingWindow.length
  const inventoryCount = signals?.inventoryAlerts ?? opportunities.inventoryAlerts.length

  const addSection = (title, items, caption) => {
    if (!items.length) return
    sections.push({ title, items: items.slice(0, 3), caption })
  }

  switch (personaKey) {
    case 'admin':
      addSection('Executive escalaties', opportunities.riskMitigation, `${riskCount} projecten met risico`)
      addSection('Documentatieplicht', opportunities.documentation, `${docCount} dossiers aanvullen`)
      addSection('Cashflow versnellen', opportunities.readyToBill, `${readyCount} facturen klaar`)
      break
    case 'finance':
      addSection('Facturatie direct verzenden', opportunities.readyToBill, `${readyCount} facturen klaar`)
      addSection('Cashflow bewaken', opportunities.riskMitigation, `${riskCount} projecten met impact`)
      addSection('Compliance afronden', opportunities.documentation, `${docCount} dossiers missen notities`)
      break
    case 'planner':
      addSection('Planning komende 14 dagen', opportunities.upcomingWindow, `${upcomingCount} projecten binnen 14 dagen`)
      addSection('Afhankelijkheden onder controle', opportunities.riskMitigation, `${riskCount} ketens monitoren`)
      addSection('Voorraadcoördinatie', opportunities.inventoryAlerts, `${inventoryCount} voorraadalerts`)
      break
    case 'crew':
      addSection('Shiftvoorbereiding', opportunities.upcomingWindow, `${upcomingCount} opdrachten starten snel`)
      addSection('Briefings aanvullen', opportunities.documentation, `${docCount} projecten missen notities`)
      addSection('Materiaalalerts', opportunities.inventoryAlerts, `${inventoryCount} urgente meldingen`)
      break
    case 'viewer':
      addSection('Hoogtepunten', opportunities.readyToBill, `${readyCount} successen gereed`)
      addSection('Focus op risico’s', opportunities.riskMitigation, `${riskCount} projecten om te bespreken`)
      addSection('Binnenkort live', opportunities.upcomingWindow, `${upcomingCount} start binnen 30 dagen`)
      break
    default:
      addSection('Planning focus', opportunities.upcomingWindow, `${upcomingCount} projecten binnen 14 dagen`)
      addSection('Cashflow kansen', opportunities.readyToBill, `${readyCount} facturen klaar`)
      break
  }

  return sections
}

function deriveImpact(event) {
  if (event.status === 'completed') {
    return { label: 'Facturatie klaar', tone: 'positive' }
  }
  if (event.status === 'at_risk' || event.risk === 'critical') {
    return { label: 'Financieel risico', tone: 'danger' }
  }
  if (event.risk === 'warning') {
    return { label: 'Voorraad bijsturen', tone: 'warning' }
  }
  if (event.status === 'active') {
    return { label: 'Operationeel', tone: 'neutral' }
  }
  const daysUntil = getDaysFromToday(event.start)
  if (typeof daysUntil === 'number' && daysUntil >= 0 && daysUntil <= 7) {
    return { label: 'Binnen 7 dagen', tone: 'warning' }
  }
  return { label: 'Op schema', tone: 'neutral' }
}

const personaInsightsGenerators = {
  admin(events, summary, financialSignals) {
    const critical = events.filter(event => event.status === 'at_risk' || event.risk === 'critical')
    const docsMissing = financialSignals?.docsMissing ?? 0
    const billingReady = financialSignals?.billingReady ?? events.filter(event => event.status === 'completed').length
    const highlight = critical.length ? critical : events.filter(event => event.status === 'active')
    return {
      headline: critical.length ? 'Directe escalaties' : 'Executive overzicht',
      summary: critical.length
        ? `Er staan ${critical.length} projecten onder druk. Plan een escalatie en herverdeel capaciteit.`
        : 'Geen kritieke incidenten gemeld. Monitor actief de voorraad- en cashflowindicatoren.',
      bullets: highlight.slice(0, 3).map(event => `${event.name} – ${timelineLabel(event)}`),
      emphasis:
        docsMissing > 0
          ? `${docsMissing} projecten missen documentatie. Markeer als prioriteit voor kwaliteitsborging.`
          : billingReady > 0
          ? `${billingReady} projecten zijn factureerbaar en versterken de cashpositie.`
          : null,
    }
  },
  finance(events, summary, financialSignals) {
    const completed = events.filter(event => event.status === 'completed')
    const readyShare = financialSignals?.total
      ? Math.round((financialSignals.billingReady / financialSignals.total) * 100)
      : null
    const revenueAtRisk = financialSignals?.revenueAtRisk ?? summary.atRisk
    const docsMissing = financialSignals?.docsMissing ?? 0
    return {
      headline: completed.length ? 'Facturatie klaarzetten' : 'Nog geen facturen gereed',
      summary: completed.length
        ? `Er zijn ${completed.length} afgeronde projecten. ${
            readyShare !== null
              ? `${readyShare}% van de selectie is factureerbaar.`
              : 'Start met facturatie om cashflow te borgen.'
          }`
        : 'Nog geen afgeronde projecten in dit venster. Controleer of planning tijdig afsluit.',
      bullets: completed.slice(0, 3).map(event => `${event.name} – afgerond op ${formatDate(event.end)}`),
      emphasis:
        revenueAtRisk > 0
          ? `${revenueAtRisk} projecten kennen omzetrisico. Stem af met planning voor versnelling.`
          : docsMissing > 0
          ? `${docsMissing} projecten missen notities voor compliance.`
          : null,
    }
  },
  planner(events) {
    const upcoming = events
      .filter(event => event.status === 'upcoming')
      .sort((a, b) => getDateValue(a.start) - getDateValue(b.start))
    const riskyUpcoming = upcoming.filter(event => event.risk !== 'ok')
    return {
      headline: upcoming.length ? 'Volgende startmomenten' : 'Geen geplande projecten',
      summary: upcoming.length
        ? `Bereid de eerstvolgende ${Math.min(upcoming.length, 3)} projecten voor en bevestig resources.`
        : 'Er zijn geen nieuwe projecten gepland binnen dit venster. Synchroniseer met sales voor instroom.',
      bullets: upcoming.slice(0, 3).map(event => `${event.name} – start ${formatDate(event.start)}`),
      emphasis:
        riskyUpcoming.length > 0
          ? `${riskyUpcoming.length} aankomende projecten hebben voorraad- of risicoalerts.`
          : null,
    }
  },
  crew(events) {
    const active = events.filter(event => event.status === 'active')
    const docsMissing = events.filter(
      event => (event.status === 'active' || event.status === 'completed') && !event.notes?.trim()
    )
    return {
      headline: active.length ? 'Vandaag in uitvoering' : 'Geen actieve opdrachten',
      summary: active.length
        ? `Zorg dat crew en materiaal klaarstaan voor ${active.length === 1 ? 'deze opdracht' : 'deze opdrachten'}.`
        : 'Er zijn momenteel geen actieve opdrachten. Check straks opnieuw voor nieuwe shifts.',
      bullets: active.slice(0, 3).map(event => `${event.name} – eindigt ${formatDate(event.end)}`),
      emphasis:
        docsMissing.length > 0
          ? `${docsMissing.length} opdrachten missen briefingnotities. Vul deze aan voor de start.`
          : null,
    }
  },
  viewer(events, summary, financialSignals) {
    const highlights = events
      .filter(event => event.status === 'completed' || event.status === 'active')
      .slice(0, 3)
    const upcoming = events
      .filter(event => event.status === 'upcoming')
      .sort((a, b) => getDateValue(a.start) - getDateValue(b.start))
    const revenueAtRisk = financialSignals?.revenueAtRisk ?? summary.atRisk
    return {
      headline: 'Portfolio highlights',
      summary:
        highlights.length > 0
          ? 'Belangrijkste resultaten en lopende projecten op een rij voor stakeholders.'
          : 'Geen highlights beschikbaar. Pas filters aan om bredere context te tonen.',
      bullets:
        highlights.length > 0
          ? highlights.map(event => `${event.name} – ${statusLabels[event.status] || event.status}`)
          : upcoming.slice(0, 3).map(event => `${event.name} – start ${formatDate(event.start)}`),
      emphasis:
        revenueAtRisk > 0
          ? `${revenueAtRisk} projecten hebben aandacht nodig om omzetverlies te voorkomen.`
          : upcoming.length > 0
          ? `${upcoming.length} projecten starten binnenkort.`
          : null,
    }
  },
}

function buildPersonaInsights(personaKey, events, summary, financialSignals) {
  const generator = personaInsightsGenerators[personaKey]
  if (!generator) return null
  return generator(events, summary, financialSignals)
}

function PersonaSpotlight({
  personaKey,
  personaLabel,
  description,
  insights,
  quickActions,
  onQuickAction,
  timeFilter,
  playbookSections,
}) {
  if (!personaKey || personaKey === 'all') return null

  return (
    <section
      style={{
        border: `1px solid ${withOpacity(brand.colors.secondary, 0.08)}`,
        borderRadius: '20px',
        padding: '20px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f5f0ff 100%)',
        display: 'grid',
        gap: '16px',
        boxShadow: '0 28px 60px rgba(21, 14, 40, 0.12)',
      }}
      aria-live="polite"
    >
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: brand.colors.secondary }}>{personaLabel}</h3>
          <p style={{ margin: 0, color: brand.colors.mutedText, fontSize: '0.95rem' }}>{description}</p>
        </div>
        <div style={{ fontSize: '0.85rem', color: brand.colors.mutedText, textAlign: 'right' }}>
          {timeFilterOptions[timeFilter]?.label}
        </div>
      </header>
      {insights && (
        <div style={{ display: 'grid', gap: '8px' }}>
          <strong style={{ fontSize: '1rem', color: brand.colors.secondary }}>{insights.headline}</strong>
          <p style={{ margin: 0, color: brand.colors.mutedText }}>{insights.summary}</p>
          {insights.emphasis && (
            <p style={{ margin: 0, color: '#b45309', fontWeight: 600 }}>{insights.emphasis}</p>
          )}
          {insights.bullets?.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: '20px', color: brand.colors.secondary }}>
              {insights.bullets.map((bullet, index) => (
                <li key={index}>{bullet}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {quickActions?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {quickActions.map(action => (
            <button
              key={action.key}
              type="button"
              onClick={() => onQuickAction(action.key)}
              style={{
                borderRadius: '999px',
                padding: '8px 18px',
                border: `1px solid ${withOpacity(brand.colors.primary, 0.4)}`,
                background: withOpacity(brand.colors.primary, 0.08),
                color: brand.colors.primaryDark,
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 12px 24px rgba(255, 45, 146, 0.18)',
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      {playbookSections && (
        <div style={{ display: 'grid', gap: '8px' }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: brand.colors.secondary }}>
            Rolgebaseerde kansen
          </div>
          {playbookSections.length > 0 ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              {playbookSections.map(section => (
                <div
                  key={section.title}
                  style={{
                    border: `1px solid ${withOpacity(brand.colors.secondary, 0.1)}`,
                    borderRadius: '16px',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.82)',
                    display: 'grid',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 600 }}>{section.title}</span>
                    {section.caption && (
                      <span style={{ fontSize: '0.8rem', color: brand.colors.mutedText }}>{section.caption}</span>
                    )}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: brand.colors.secondary, display: 'grid', gap: '6px' }}>
                    {section.items.map(item => (
                      <li key={item.key}>{item.text}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: brand.colors.mutedText }}>
              Geen directe cashflow- of risicosignalen in deze selectie. Houd de filters in de gaten voor nieuwe kansen.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatDate(dateString) {
  if (!dateString) return '—'
  const safeDate = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(safeDate.getTime())) return dateString
  return dateFormatter.format(safeDate)
}

function getDateValue(dateString) {
  if (!dateString) return 0
  const value = new Date(`${dateString}T00:00:00`).getTime()
  return Number.isNaN(value) ? 0 : value
}

function timelineLabel(event) {
  if (event.status === 'completed') {
    return `Afgerond op ${formatDate(event.end)}`
  }
  if (event.status === 'active') {
    return `Nu bezig – eindigt ${formatDate(event.end)}`
  }
  if (event.status === 'at_risk') {
    if (typeof event.daysUntilStart === 'number') {
      if (event.daysUntilStart <= 0) return 'Voorraadcontrole vereist vandaag'
      if (event.daysUntilStart === 1) return 'Controleer voorraad vóór morgen'
      return `Voorraadcontrole binnen ${event.daysUntilStart} dagen`
    }
    return 'Voorraadcontrole vereist'
  }
  if (typeof event.daysUntilStart !== 'number') {
    return `Start op ${formatDate(event.start)}`
  }
  if (event.daysUntilStart === 0) return 'Start vandaag'
  if (event.daysUntilStart === 1) return 'Start morgen'
  return `Start over ${event.daysUntilStart} dagen`
}

function statusMatches(filter, status) {
  if (filter === 'all') return true
  if (filter === 'active') return status === 'active' || status === 'at_risk'
  return status === filter
}

function RiskBadge({ risk }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: `${riskPalette[risk] || '#4b5563'}20`,
        color: riskPalette[risk] || '#4b5563',
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '0.85rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: riskPalette[risk] || '#4b5563' }} />
      {riskLabels[risk] || 'Onbekend'}
    </span>
  )
}

function StatusBadge({ status }) {
  return (
    <span
      style={{
        backgroundColor: `${badgePalette[status] || '#6b7280'}1a`,
        color: badgePalette[status] || '#6b7280',
        padding: '4px 10px',
        borderRadius: '999px',
        fontWeight: 600,
      }}
    >
      {statusLabels[status] || status}
    </span>
  )
}

function ImpactBadge({ impact }) {
  const palette = impactPalette[impact.tone] || impactPalette.neutral
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: palette.background,
        color: palette.color,
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '0.8rem',
        fontWeight: 600,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: palette.color }} />
      {impact.label}
    </span>
  )
}

function SummaryMetric({ label, value, tone = 'neutral', helpText }) {
  const palette = cardPalette[tone] || cardPalette.neutral
  return (
    <div
      style={{
        background: palette.background,
        border: `1px solid ${palette.border}`,
        padding: '12px 16px',
        borderRadius: '12px',
        display: 'grid',
        gap: '4px',
        minWidth: '150px',
        color: palette.color,
        boxShadow: '0 16px 32px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
      {helpText && <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{helpText}</div>}
    </div>
  )
}

function FinancialPulsePanel({ cards, focusCards = [], focusLabel }) {
  if (!cards.length && !focusCards.length) return null

  return (
    <section
      aria-label="Financiële impact samenvatting"
      style={{
        display: 'grid',
        gap: '12px',
        padding: '20px',
        border: `1px solid ${withOpacity(brand.colors.secondary, 0.08)}`,
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f7f5ff 100%)',
        boxShadow: '0 32px 60px rgba(15, 23, 42, 0.08)',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: brand.colors.secondary }}>Financiële puls</h3>
        <span style={{ fontSize: '0.85rem', color: brand.colors.mutedText }}>
          Realtime cashflow-impact per rol
        </span>
      </header>
      {cards.length > 0 && (
        <div style={{ display: 'grid', gap: '8px' }}>
          <div style={{ fontSize: '0.9rem', color: brand.colors.secondary, opacity: 0.78 }}>Portfolio totaal</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {cards.map(card => (
              <SummaryMetric
                key={card.key}
                label={card.title}
                value={card.value}
                tone={card.tone}
                helpText={card.helpText}
              />
            ))}
          </div>
        </div>
      )}
      {focusCards.length > 0 && focusLabel && (
        <div style={{ display: 'grid', gap: '8px' }}>
          <div style={{ fontSize: '0.9rem', color: brand.colors.secondary, opacity: 0.78 }}>
            Focus: {focusLabel}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {focusCards.map(card => (
              <SummaryMetric
                key={`${card.key}-focus`}
                label={card.title}
                value={card.value}
                tone={card.tone}
                helpText={card.helpText}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function LoadingRows() {
  return (
    <tbody>
      {[...Array(3)].map((_, idx) => (
        <tr key={idx}>
          {[...Array(9)].map((__, cellIdx) => (
            <td key={cellIdx} style={{ padding: '12px 8px' }}>
              <div
                style={{
                  height: '12px',
                  borderRadius: '999px',
                  background: '#e5e7eb',
                  width: `${35 + cellIdx * 8}%`,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

const emptyMessageStyles = {
  padding: '32px',
  textAlign: 'center',
  color: '#4b5563',
  fontStyle: 'italic',
}

function shiftDate(dateString, delta) {
  if (!dateString) return dateString
  const base = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(base.getTime())) return dateString
  base.setDate(base.getDate() + delta)
  return base.toISOString().slice(0, 10)
}

export default function Planner({ onLogout }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState(null)
  const [editing, setEditing] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)
  const [personaPreset, setPersonaPreset] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState('start')
  const [sortDir, setSortDir] = useState('asc')
  const [timeFilter, setTimeFilter] = useState('all')
  const [formState, setFormState] = useState({ name: '', client: '', start: '', end: '', notes: '' })

  async function loadProjects() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/v1/projects')
      const mapped = data.map(project => ({
        id: project.id,
        name: project.name,
        client: project.client_name,
        start: project.start_date,
        end: project.end_date,
        status: project.status || 'upcoming',
        risk: project.inventory_risk || 'ok',
        alerts: Array.isArray(project.inventory_alerts) ? project.inventory_alerts : [],
        durationDays: typeof project.duration_days === 'number' ? project.duration_days : null,
        daysUntilStart: typeof project.days_until_start === 'number' ? project.days_until_start : null,
        notes: project.notes || '',
      }))
      setEvents(mapped)
      setFeedback(previous => (previous?.type === 'error' ? null : previous))
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: 'Projecten konden niet worden geladen.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  function openEditor(event) {
    setEditing(event)
    setExpandedRow(null)
    setFormState({
      name: event.name,
      client: event.client,
      start: event.start,
      end: event.end,
      notes: event.notes,
    })
    setFeedback(null)
  }

  function closeEditor() {
    setEditing(null)
    setFormState({ name: '', client: '', start: '', end: '', notes: '' })
  }

  function applyPersonaPreset(value) {
    setPersonaPreset(value)
    const preset = personaPresets[value]
    if (!preset) return
    setStatusFilter(preset.statusFilter || 'all')
    setRiskFilter(preset.riskFilter || 'all')
    setSortKey(preset.sortKey || 'start')
    setSortDir(preset.sortDir || 'asc')
    setTimeFilter(preset.timeFilter || 'all')
    if (preset.searchTerm !== undefined) {
      setSearchTerm(preset.searchTerm)
    }
  }

  async function submitUpdate(e) {
    e.preventDefault()
    if (!editing) return
    try {
      await api.put(`/api/v1/projects/${editing.id}/dates`, {
        name: formState.name,
        client_name: formState.client,
        start_date: formState.start,
        end_date: formState.end,
        notes: formState.notes,
      })
      setEditing(null)
      await loadProjects()
      setFeedback({ type: 'success', message: 'Project bijgewerkt.' })
    } catch (err) {
      console.error(err)
      setFeedback({ type: 'error', message: 'Bijwerken mislukt. Controleer beschikbaarheid en verplichte velden.' })
    }
  }

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filteredEvents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return events
      .filter(event => statusMatches(statusFilter, event.status))
      .filter(event => (riskFilter === 'all' ? true : event.risk === riskFilter))
      .filter(event => matchesTimeFilter(event, timeFilter))
      .filter(event => {
        if (!term) return true
        return (
          event.name.toLowerCase().includes(term) ||
          event.client.toLowerCase().includes(term) ||
          (event.notes && event.notes.toLowerCase().includes(term))
        )
      })
      .sort((a, b) => {
        const direction = sortDir === 'asc' ? 1 : -1
        if (sortKey === 'start') {
          return (getDateValue(a.start) - getDateValue(b.start)) * direction
        }
        if (sortKey === 'end') {
          return (getDateValue(a.end) - getDateValue(b.end)) * direction
        }
        if (sortKey === 'client') {
          return a.client.localeCompare(b.client, 'nl') * direction
        }
        if (sortKey === 'status') {
          const left = statusPriority[a.status] ?? 99
          const right = statusPriority[b.status] ?? 99
          if (left === right) {
            return a.name.localeCompare(b.name, 'nl') * direction
          }
          return (left - right) * direction
        }
        if (sortKey === 'risk') {
          const order = { ok: 0, warning: 1, critical: 2 }
          const left = order[a.risk] ?? 0
          const right = order[b.risk] ?? 0
          if (left === right) {
            return a.name.localeCompare(b.name, 'nl') * direction
          }
          return (left - right) * direction
        }
        return 0
      })
  }, [events, statusFilter, riskFilter, searchTerm, sortKey, sortDir, timeFilter])

  const summary = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        acc.total += 1
        if (event.status === 'at_risk') acc.atRisk += 1
        if (event.status === 'active' || event.status === 'at_risk') acc.active += 1
        if (event.status === 'upcoming') acc.upcoming += 1
        if (event.status === 'completed') acc.completed += 1
        if (event.risk === 'warning') acc.warning += 1
        if (event.risk === 'critical') acc.critical += 1
        return acc
      },
      { total: 0, active: 0, upcoming: 0, completed: 0, atRisk: 0, warning: 0, critical: 0 }
    )
  }, [events])

  const financialSignals = useMemo(() => computeFinancialSignals(events), [events])
  const financialCards = useMemo(() => buildFinancialCards(financialSignals), [financialSignals])
  const filteredFinancialSignals = useMemo(() => computeFinancialSignals(filteredEvents), [filteredEvents])
  const focusFinancialCards = useMemo(() => buildFinancialCards(filteredFinancialSignals), [filteredFinancialSignals])

  const personaHint = personaPresets[personaPreset]?.description

  const personaInsights = useMemo(
    () => buildPersonaInsights(personaPreset, events, summary, financialSignals),
    [personaPreset, events, summary, financialSignals]
  )

  const personaPlaybook = useMemo(
    () => buildPersonaPlaybook(personaPreset, filteredEvents, filteredFinancialSignals),
    [personaPreset, filteredEvents, filteredFinancialSignals]
  )

  function handlePersonaQuickAction(actionKey) {
    switch (actionKey) {
      case 'showExecutivePulse':
        setStatusFilter('all')
        setRiskFilter('all')
        setSortKey('risk')
        setSortDir('desc')
        setTimeFilter('all')
        setSearchTerm('')
        break
      case 'focusCritical':
        setStatusFilter('all')
        setRiskFilter('critical')
        setSortKey('risk')
        setSortDir('desc')
        setTimeFilter('today')
        break
      case 'showReadyToBill':
        setStatusFilter('completed')
        setRiskFilter('all')
        setSortKey('end')
        setSortDir('desc')
        setTimeFilter('past30')
        setSearchTerm('')
        break
      case 'focusCashflow':
        setStatusFilter('completed')
        setRiskFilter('all')
        setSortKey('end')
        setSortDir('desc')
        setTimeFilter('past30')
        setSearchTerm('')
        break
      case 'showPlannerHorizon':
        setStatusFilter('upcoming')
        setRiskFilter('all')
        setSortKey('start')
        setSortDir('asc')
        setTimeFilter('next14')
        setSearchTerm('')
        break
      case 'highlightDependencies':
        setStatusFilter('at_risk')
        setRiskFilter('all')
        setSortKey('start')
        setSortDir('asc')
        setTimeFilter('next7')
        break
      case 'crewToday':
        setStatusFilter('active')
        setRiskFilter('all')
        setTimeFilter('today')
        setSortKey('start')
        setSortDir('asc')
        break
      case 'crewDocs':
        setStatusFilter('active')
        setRiskFilter('all')
        setSortKey('status')
        setSortDir('asc')
        setTimeFilter('next7')
        break
      case 'viewerHighlights':
        setStatusFilter('all')
        setRiskFilter('warning')
        setSortKey('status')
        setSortDir('asc')
        setTimeFilter('next30')
        setSearchTerm('')
        break
      case 'viewerCalm':
        setStatusFilter('active')
        setRiskFilter('all')
        setSortKey('start')
        setSortDir('asc')
        setTimeFilter('next14')
        setSearchTerm('')
        break
      case 'resetPersona':
        applyPersonaPreset(personaPreset)
        break
      default:
        setStatusFilter('all')
        setRiskFilter('all')
        setSortKey('start')
        setSortDir('asc')
        setTimeFilter('all')
        break
    }
  }

  function shiftRange(delta) {
    setFormState(prev => ({
      ...prev,
      start: shiftDate(prev.start, delta),
      end: shiftDate(prev.end, delta),
    }))
  }

  return (
    <div
      style={{
        fontFamily: brandFontStack,
        padding: '24px 24px 80px',
        maxWidth: '1240px',
        margin: '0 auto',
        color: brand.colors.secondary,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '0.85rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: brand.colors.mutedText }}>
            RentGuy Enterprise
          </span>
          <h2 style={{ margin: 0, fontSize: '2rem' }}>Rolgestuurde projectplanner</h2>
          <p style={{ margin: 0, color: brand.colors.mutedText, maxWidth: 560 }}>
            Combineer executive inzicht, financiële signalen en dagoperatie in één luxueuze cockpit per rol.
          </p>
        </div>
        <button
          onClick={onLogout}
          style={{
            borderRadius: 999,
            padding: '10px 20px',
            border: `1px solid ${withOpacity(brand.colors.secondary, 0.16)}`,
            background: withOpacity('#ffffff', 0.85),
            color: brand.colors.secondary,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 12px 30px rgba(31, 29, 43, 0.12)',
          }}
        >
          Uitloggen
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
        aria-live="polite"
      >
        <SummaryMetric label="Actief" value={summary.active} tone="success" helpText="Inclusief risicoprojecten" />
        <SummaryMetric label="Komende start" value={summary.upcoming} helpText="Binnen gekozen tijdvenster" />
        <SummaryMetric label="Afgerond" value={summary.completed} helpText="Gereed voor overdracht" />
        <SummaryMetric
          label="Voorraadrisico"
          value={`${summary.critical} kritisch / ${summary.warning} waarschuwing`}
          tone={summary.critical ? 'danger' : summary.warning ? 'warning' : 'neutral'}
        />
      </div>

      <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
        <FinancialPulsePanel
          cards={financialCards}
          focusCards={focusFinancialCards}
          focusLabel={personaPreset !== 'all' ? personaPresets[personaPreset]?.label : undefined}
        />
        {personaPreset !== 'all' && (
          <PersonaSpotlight
            personaKey={personaPreset}
            personaLabel={personaPresets[personaPreset]?.label}
            description={personaHint}
            insights={personaInsights}
            quickActions={personaQuickActions[personaPreset]}
            onQuickAction={handlePersonaQuickAction}
            timeFilter={timeFilter}
            playbookSections={personaPlaybook}
          />
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.9rem', color: brand.colors.mutedText }}>
            Rolselectie
            <select
              value={personaPreset}
              onChange={event => applyPersonaPreset(event.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: `1px solid ${withOpacity(brand.colors.secondary, 0.16)}`,
                background: withOpacity('#ffffff', 0.9),
                fontSize: '0.95rem',
              }}
            >
              {Object.entries(personaPresets).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.9rem', color: brand.colors.mutedText }}>
            Statusfilter
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: `1px solid ${withOpacity(brand.colors.secondary, 0.16)}`,
                background: withOpacity('#ffffff', 0.9),
                fontSize: '0.95rem',
              }}
            >
              <option value="all">Alle</option>
              <option value="active">Actief</option>
              <option value="upcoming">Komend</option>
              <option value="completed">Afgerond</option>
              <option value="at_risk">Risico</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.9rem', color: brand.colors.mutedText }}>
            Voorraadrisico
            <select
              value={riskFilter}
              onChange={event => setRiskFilter(event.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: `1px solid ${withOpacity(brand.colors.secondary, 0.16)}`,
                background: withOpacity('#ffffff', 0.9),
                fontSize: '0.95rem',
              }}
            >
              <option value="all">Alle</option>
              <option value="ok">Op schema</option>
              <option value="warning">Let op</option>
              <option value="critical">Kritiek</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.9rem', color: brand.colors.mutedText }}>
            Tijdvenster
            <select
              value={timeFilter}
              onChange={event => setTimeFilter(event.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: `1px solid ${withOpacity(brand.colors.secondary, 0.16)}`,
                background: withOpacity('#ffffff', 0.9),
                fontSize: '0.95rem',
              }}
            >
              {Object.entries(timeFilterOptions).map(([value, option]) => (
                <option key={value} value={value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: '0.9rem',
              color: brand.colors.mutedText,
              flex: '1 1 220px',
            }}
          >
            Zoeken
            <input
              type="search"
              placeholder="Zoek op project, klant of notitie"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: `1px solid ${withOpacity(brand.colors.secondary, 0.16)}`,
                background: withOpacity('#ffffff', 0.9),
                fontSize: '0.95rem',
              }}
            />
          </label>

          <button
            type="button"
            onClick={() => {
              setPersonaPreset('all')
              setStatusFilter('all')
              setRiskFilter('all')
              setSortKey('start')
              setSortDir('asc')
              setSearchTerm('')
              setTimeFilter('all')
            }}
            style={{
              alignSelf: 'flex-end',
              padding: '10px 18px',
              borderRadius: 999,
              border: `1px solid ${withOpacity(brand.colors.secondary, 0.16)}`,
              background: withOpacity(brand.colors.accent, 0.16),
              color: brand.colors.secondary,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reset filters
          </button>
        </div>
        {personaHint && <div style={{ fontSize: '0.9rem', color: brand.colors.mutedText }}>{personaHint}</div>}
      </div>

      {feedback && (
        <div
          role="alert"
          style={{
            padding: '12px 18px',
            borderRadius: '14px',
            marginBottom: '20px',
            backgroundColor:
              feedback.type === 'success'
                ? withOpacity('#22c55e', 0.12)
                : withOpacity('#ef4444', 0.12),
            color: feedback.type === 'success' ? '#0f5132' : '#9f1239',
            border:
              feedback.type === 'success'
                ? `1px solid ${withOpacity('#22c55e', 0.28)}`
                : `1px solid ${withOpacity('#ef4444', 0.28)}`,
          }}
        >
          {feedback.message}
        </div>
      )}

      <div
        style={{
          overflowX: 'auto',
          borderRadius: '18px',
          border: `1px solid ${withOpacity(brand.colors.secondary, 0.1)}`,
          background: 'rgba(255, 255, 255, 0.92)',
          boxShadow: '0 28px 60px rgba(15, 23, 42, 0.08)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '18px', overflow: 'hidden' }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.1)}`,
                  padding: '14px 16px',
                  fontSize: '0.85rem',
                  color: brand.colors.mutedText,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Project
              </th>
              <th
                style={{
                  textAlign: 'left',
                  borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.1)}`,
                  padding: '14px 16px',
                  fontSize: '0.85rem',
                  color: brand.colors.mutedText,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Klant
              </th>
              <th
                style={{
                  textAlign: 'left',
                  borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.1)}`,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: brand.colors.mutedText,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
                onClick={() => toggleSort('status')}
              >
                Status
              </th>
              <th
                style={{
                  textAlign: 'left',
                  borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.1)}`,
                  padding: '14px 16px',
                  fontSize: '0.85rem',
                  color: brand.colors.mutedText,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Planning
              </th>
              <th
                style={{
                  textAlign: 'left',
                  borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.1)}`,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: brand.colors.mutedText,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
                onClick={() => toggleSort('risk')}
              >
                Voorraad
              </th>
              <th
                style={{
                  textAlign: 'left',
                  borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.1)}`,
                  padding: '14px 16px',
                  fontSize: '0.85rem',
                  color: brand.colors.mutedText,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Impact
              </th>
              <th
                style={{
                  textAlign: 'left',
                  borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.1)}`,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: brand.colors.mutedText,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
                onClick={() => toggleSort('start')}
              >
                Start
              </th>
              <th
                style={{
                  textAlign: 'left',
                  borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.1)}`,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: brand.colors.mutedText,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
                onClick={() => toggleSort('end')}
              >
                Einde
              </th>
              <th
                style={{
                  textAlign: 'left',
                  borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.1)}`,
                  padding: '14px 16px',
                  fontSize: '0.85rem',
                  color: brand.colors.mutedText,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Acties
              </th>
            </tr>
          </thead>
          {loading ? (
            <LoadingRows />
          ) : filteredEvents.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={9} style={emptyMessageStyles}>
                  Geen projecten gevonden voor deze filters. Pas de filters aan of reset ze om alles te tonen.
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {filteredEvents.map(event => {
                const isExpanded = expandedRow === event.id
                const impact = deriveImpact(event)
                return (
                  <React.Fragment key={event.id}>
                    <tr
                      style={{
                        backgroundColor: isExpanded ? withOpacity(brand.colors.accent, 0.12) : 'transparent',
                        transition: 'background-color 0.2s ease',
                      }}
                      onDoubleClick={() => openEditor(event)}
                    >
                      <td
                        style={{
                          padding: '14px 16px',
                          fontWeight: 600,
                          borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.06)}`,
                        }}
                      >
                        {event.name}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.06)}`,
                          color: brand.colors.mutedText,
                        }}
                      >
                        {event.client}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.06)}`,
                        }}
                      >
                        <StatusBadge status={event.status} />
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.06)}`,
                          color: brand.colors.mutedText,
                        }}
                      >
                        {timelineLabel(event)}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.06)}`,
                        }}
                      >
                        <RiskBadge risk={event.risk} />
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.06)}`,
                        }}
                      >
                        <ImpactBadge impact={impact} />
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.06)}`,
                          color: brand.colors.mutedText,
                        }}
                      >
                        {formatDate(event.start)}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.06)}`,
                          color: brand.colors.mutedText,
                        }}
                      >
                        {formatDate(event.end)}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.06)}`,
                          display: 'flex',
                          gap: '10px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedRow(isExpanded ? null : event.id)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 999,
                            border: `1px solid ${withOpacity(brand.colors.secondary, 0.16)}`,
                            background: withOpacity('#ffffff', 0.9),
                            color: brand.colors.secondary,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {isExpanded ? 'Sluit details' : 'Details'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditor(event)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 999,
                            border: 'none',
                            background: brand.colors.primary,
                            color: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 12px 24px rgba(255, 45, 146, 0.25)',
                          }}
                        >
                          Herplan
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td
                          colSpan={9}
                          style={{
                            padding: '20px 28px',
                            backgroundColor: withOpacity('#f5f0ff', 0.8),
                            borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.06)}`,
                          }}
                        >
                          <div style={{ display: 'grid', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: brand.colors.mutedText }}>
                              <span><strong>Doorlooptijd:</strong> {event.durationDays ? `${event.durationDays} dagen` : 'Onbekend'}</span>
                              <span><strong>Eindigt op:</strong> {formatDate(event.end)}</span>
                            </div>
                            <div style={{ color: brand.colors.secondary, fontWeight: 600 }}>Projectnotities</div>
                            <div style={{ color: brand.colors.mutedText, whiteSpace: 'pre-wrap' }}>
                              {event.notes ? event.notes : 'Geen notities toegevoegd.'}
                            </div>
                            {event.alerts.length > 0 ? (
                              <div>
                                <div style={{ color: brand.colors.secondary, fontWeight: 600, marginBottom: '6px' }}>
                                  Voorraaddetails
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#b91c1c' }}>
                                  {event.alerts.map((alert, index) => (
                                    <li key={index}>{alert}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <div style={{ color: '#059669' }}>Geen voorraadissues voor dit project.</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          )}
        </table>
      </div>

      {editing && (
        <form
          onSubmit={submitUpdate}
          style={{
            marginTop: '32px',
            display: 'grid',
            gap: '12px',
            maxWidth: '520px',
            padding: '20px',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Project herplannen</h3>
            <button type="button" onClick={closeEditor}>
              Sluiten
            </button>
          </div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
            Pas data en notities aan. Quick actions helpen om datumreeksen met één klik te verschuiven.
          </p>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            Projectnaam
            <input
              type="text"
              value={formState.name}
              onChange={event => setFormState(current => ({ ...current, name: event.target.value }))}
              required
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            Klant
            <input
              type="text"
              value={formState.client}
              onChange={event => setFormState(current => ({ ...current, client: event.target.value }))}
              required
            />
          </label>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
              Startdatum
              <input
                type="date"
                value={formState.start}
                onChange={event => setFormState(current => ({ ...current, start: event.target.value }))}
                required
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
              Einddatum
              <input
                type="date"
                value={formState.end}
                onChange={event => setFormState(current => ({ ...current, end: event.target.value }))}
                required
              />
            </label>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button type="button" onClick={() => shiftRange(-1)}>
              Vervroeg beide data 1 dag
            </button>
            <button type="button" onClick={() => shiftRange(1)}>
              Verleng beide data 1 dag
            </button>
            <button type="button" onClick={() => setFormState({
              name: editing.name,
              client: editing.client,
              start: editing.start,
              end: editing.end,
              notes: editing.notes,
            })}>
              Herstel oorspronkelijke waarden
            </button>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            Notities voor crew & finance
            <textarea
              value={formState.notes}
              onChange={event => setFormState(current => ({ ...current, notes: event.target.value }))}
              rows={3}
            />
          </label>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="submit">Opslaan</button>
            <button type="button" onClick={closeEditor}>
              Annuleren
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
