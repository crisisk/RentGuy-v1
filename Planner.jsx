import React, { useEffect, useMemo, useState } from 'react'
import { api } from './api.js'

const personaPresets = {
  all: {
    label: 'Alle rollen',
    description: 'Toont de volledige planning zonder filters, ideaal voor gezamenlijke UAT-sessies.',
    timeFilter: 'all',
  },
  bart: {
    label: 'Bart de Manager',
    statusFilter: 'active',
    riskFilter: 'warning',
    sortKey: 'start',
    sortDir: 'asc',
    description: 'Focus op lopende projecten en voorraadwaarschuwingen zodat hij direct kan bijsturen.',
    timeFilter: 'today',
  },
  anna: {
    label: 'Anna de Planner',
    statusFilter: 'upcoming',
    sortKey: 'start',
    sortDir: 'asc',
    description: 'Legt de nadruk op komende projecten in chronologische volgorde voor detailplanning.',
    timeFilter: 'next14',
  },
  tom: {
    label: 'Tom de Technicus',
    statusFilter: 'active',
    riskFilter: 'ok',
    sortKey: 'start',
    sortDir: 'asc',
    description: 'Toont enkel actuele opdrachten zodat hij weet waar hij vandaag moet zijn.',
    timeFilter: 'today',
  },
  carla: {
    label: 'Carla de Klant',
    statusFilter: 'upcoming',
    sortKey: 'client',
    sortDir: 'asc',
    description: 'Sorteert op klantnaam zodat front-office teams snel klantvragen kunnen beantwoorden.',
    timeFilter: 'next30',
  },
  frank: {
    label: 'Frank de Financieel Medewerker',
    statusFilter: 'completed',
    sortKey: 'end',
    sortDir: 'desc',
    description: 'Laat afgeronde projecten zien, handig voor facturatie en BTW-controle.',
    timeFilter: 'past30',
  },
  sven: {
    label: 'Sven de Systeembeheerder',
    riskFilter: 'critical',
    sortKey: 'risk',
    sortDir: 'desc',
    description: 'Filtert op kritieke voorraadrisico’s om escalaties te voorkomen.',
    timeFilter: 'today',
  },
  isabelle: {
    label: 'Isabelle de International',
    statusFilter: 'upcoming',
    sortKey: 'start',
    sortDir: 'asc',
    description: 'Toont internationale events ruim op tijd zodat vertalingen en valuta geregeld zijn.',
    timeFilter: 'next30',
  },
  peter: {
    label: 'Peter de Power-User',
    riskFilter: 'warning',
    sortKey: 'status',
    sortDir: 'asc',
    description: 'Highlight projecten met voorraadspanning voor API-automatiseringen.',
    timeFilter: 'next7',
  },
  nadia: {
    label: 'Nadia de Nieuweling',
    statusFilter: 'upcoming',
    sortKey: 'start',
    sortDir: 'asc',
    description: 'Behoudt enkel eenvoudige komende taken voor een zachte onboarding.',
    timeFilter: 'next14',
  },
  david: {
    label: 'David de Developer',
    sortKey: 'status',
    sortDir: 'asc',
    description: 'Combineert alle statussen zodat API-extensies getest kunnen worden.',
    timeFilter: 'all',
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
  neutral: '#f3f4f6',
  success: '#dcfce7',
  warning: '#fef3c7',
  danger: '#fee2e2',
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
  bart: [
    { key: 'focusRisk', label: 'Focus op risicoprojecten' },
    { key: 'resetPersona', label: 'Herstel Bart-voorkeuren' },
  ],
  anna: [
    { key: 'showNextWeek', label: 'Plan komende week' },
    { key: 'resetPersona', label: 'Herstel Anna-voorkeuren' },
  ],
  tom: [
    { key: 'focusTodayCrew', label: 'Toon opdrachten van vandaag' },
    { key: 'resetPersona', label: 'Herstel Tom-voorkeuren' },
  ],
  carla: [
    { key: 'sortByClient', label: 'Sorteer op klantnaam' },
    { key: 'resetPersona', label: 'Herstel Carla-voorkeuren' },
  ],
  frank: [
    { key: 'showCompletedMonth', label: 'Afgerond deze maand' },
    { key: 'focusCashflow', label: 'Toon facturatiepipeline' },
    { key: 'resetPersona', label: 'Herstel Frank-voorkeuren' },
  ],
  sven: [
    { key: 'showCriticalRisk', label: 'Alle kritieke risico’s' },
    { key: 'resetPersona', label: 'Herstel Sven-voorkeuren' },
  ],
  isabelle: [
    { key: 'showNextMonth', label: 'Bekijk internationale maand' },
    { key: 'resetPersona', label: 'Herstel Isabelle-voorkeuren' },
  ],
  peter: [
    { key: 'focusAutomation', label: 'API-test weergave' },
    { key: 'resetPersona', label: 'Herstel Peter-voorkeuren' },
  ],
  nadia: [
    { key: 'showGuidedView', label: 'Toon eenvoudige planning' },
    { key: 'resetPersona', label: 'Herstel Nadia-voorkeuren' },
  ],
  david: [
    { key: 'devOverview', label: 'API status overzicht' },
    { key: 'resetPersona', label: 'Herstel David-voorkeuren' },
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
    case 'bart':
      addSection('Omzet beschermen', opportunities.riskMitigation, `${riskCount} projecten onder druk`)
      addSection('Voorraadactiepunten', opportunities.inventoryAlerts, `${inventoryCount} voorraadalerts`)
      addSection('Cashflow versnellen', opportunities.readyToBill, `${readyCount} facturen klaar`)
      break
    case 'anna':
      addSection('Planning komende 14 dagen', opportunities.upcomingWindow, `${upcomingCount} projecten binnen 14 dagen`)
      addSection('Context aanvullen', opportunities.documentation, `${docCount} projecten missen notities`)
      addSection('Voorraadcoördinatie', opportunities.inventoryAlerts, `${inventoryCount} voorraadalerts`)
      break
    case 'tom':
      addSection('Vandaag en komende dagen', opportunities.upcomingWindow, `${upcomingCount} opdrachten snel opstarten`)
      addSection('Risico op locatie', opportunities.riskMitigation, `${riskCount} projecten vereisen check`)
      break
    case 'carla':
      addSection('Voorbereiden klantupdates', opportunities.upcomingWindow, `${upcomingCount} klanten wachten op bevestiging`)
      addSection('Voorraadstatus delen', opportunities.inventoryAlerts, `${inventoryCount} alerts relevant voor klant`) 
      break
    case 'frank':
      addSection('Facturatie direct verzenden', opportunities.readyToBill, `${readyCount} facturen klaar`)
      addSection('Omzetrisico mitigeren', opportunities.riskMitigation, `${riskCount} projecten met impact`)
      addSection('Documentatie compleet maken', opportunities.documentation, `${docCount} projecten missen notities`)
      break
    case 'sven':
      addSection('Kritieke voorraadissues', opportunities.inventoryAlerts, `${inventoryCount} alerts prioriteit`)
      addSection('Operationele risico’s', opportunities.riskMitigation, `${riskCount} projecten onder druk`)
      break
    case 'isabelle':
      addSection('Internationale coördinatie', opportunities.upcomingWindow, `${upcomingCount} internationale voorbereidingen`)
      addSection('Documentatie en compliance', opportunities.documentation, `${docCount} dossiers aanvullen`)
      break
    case 'peter':
      addSection('Automatiseringskansen', opportunities.inventoryAlerts, `${inventoryCount} triggers voor API-workflows`)
      addSection('Data aanvullen', opportunities.documentation, `${docCount} projecten missen context`)
      break
    case 'nadia':
      addSection('Eerste prioriteiten', opportunities.upcomingWindow, `${upcomingCount} eenvoudige taken klaar`)
      addSection('Leer met praktijkvoorbeelden', opportunities.readyToBill, `${readyCount} afgeronde projecten ter referentie`)
      break
    case 'david':
      addSection('API-validatie', opportunities.riskMitigation, `${riskCount} statusovergangen controleren`)
      addSection('Documentatie synchroniseren', opportunities.documentation, `${docCount} projecten missen notities`)
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
  bart(events, summary, financialSignals) {
    const atRiskProjects = events.filter(event => event.status === 'at_risk' || event.risk === 'critical')
    const revenueAtRisk = financialSignals?.revenueAtRisk ?? atRiskProjects.length
    return {
      headline: atRiskProjects.length ? 'Actie vereist' : 'Alles onder controle',
      summary: atRiskProjects.length
        ? `Er staan ${atRiskProjects.length} projecten onder druk. Prioriteer voorraadcontrole om vertragingen te voorkomen. (${revenueAtRisk} mogelijke omzetimpact.)`
        : 'Er zijn momenteel geen kritieke voorraadissues. Blijf de planning monitoren voor nieuwe waarschuwingen.',
      bullets: atRiskProjects.slice(0, 3).map(event => `${event.name} – ${timelineLabel(event)}`),
    }
  },
  anna(events) {
    const upcoming = events
      .filter(event => event.status === 'upcoming')
      .sort((a, b) => getDateValue(a.start) - getDateValue(b.start))
    return {
      headline: upcoming.length ? 'Komende projecten' : 'Geen nieuwe projecten',
      summary: upcoming.length
        ? `Plan nu de logistiek voor de eerstvolgende ${Math.min(upcoming.length, 3)} projecten.`
        : 'Er staan geen nieuwe projecten ingepland. Controleer of offertes moeten worden omgezet naar opdrachten.',
      bullets: upcoming.slice(0, 3).map(event => `${event.name} – start ${formatDate(event.start)}`),
    }
  },
  tom(events) {
    const active = events.filter(event => event.status === 'active')
    return {
      headline: active.length ? 'Vandaag in het veld' : 'Geen actieve opdrachten',
      summary: active.length
        ? `Zorg dat je crew up-to-date pakbonnen heeft voor ${active.length === 1 ? 'deze opdracht' : 'deze opdrachten'}.`
        : 'Er zijn momenteel geen actieve opdrachten. Controleer later of er nieuwe taken zijn.',
      bullets: active.slice(0, 3).map(event => `${event.name} – eindigt ${formatDate(event.end)}`),
    }
  },
  carla(events) {
    const upcomingClients = events
      .filter(event => event.status === 'upcoming')
      .sort((a, b) => a.client.localeCompare(b.client, 'nl'))
    return {
      headline: 'Klantcommunicatie',
      summary: upcomingClients.length
        ? 'Bel of mail de volgende klanten om bevestigingen en betalingen te finaliseren.'
        : 'Geen openstaande klantvragen voor komende events.',
      bullets: upcomingClients.slice(0, 3).map(event => `${event.client} – ${event.name}`),
    }
  },
  frank(events, summary, financialSignals) {
    const completed = events.filter(event => event.status === 'completed')
    const readyShare = financialSignals?.total
      ? Math.round((financialSignals.billingReady / financialSignals.total) * 100)
      : null
    const docsMissing = financialSignals?.docsMissing ?? 0
    return {
      headline: 'Facturatie klaarzetten',
      summary: completed.length
        ? `Er zijn ${completed.length} afgeronde projecten. ${
            readyShare !== null
              ? `${readyShare}% van de portfolio is factureerbaar.`
              : 'Start met facturatie voor een gezonde cashflow.'
          }`
        : 'Nog geen projecten afgerond in de geselecteerde periode. Controleer of alles tijdig wordt afgesloten.',
      bullets: completed.slice(0, 3).map(event => `${event.name} – afgerond op ${formatDate(event.end)}`),
      emphasis:
        docsMissing > 0
          ? `${docsMissing} afgeronde/actieve projecten missen notities. Vul context aan om vertraging in facturatie te voorkomen.`
          : summary.warning
          ? 'Let op: er zijn nog openstaande voorraadwaarschuwingen die facturen kunnen vertragen.'
          : null,
    }
  },
  sven(events) {
    const critical = events.filter(event => event.risk === 'critical')
    return {
      headline: critical.length ? 'Escalaties voorkomen' : 'Geen kritieke waarschuwingen',
      summary: critical.length
        ? `Plan direct een check-in met het magazijn voor ${critical.length} kritieke projecten.`
        : 'Alle systemen draaien zonder kritieke meldingen. Monitor logging voor nieuwe signalen.',
      bullets: critical.slice(0, 3).map(event => `${event.name} – ${timelineLabel(event)}`),
    }
  },
  isabelle(events) {
    const international = events.filter(event => /intl|international|global/i.test(`${event.name} ${event.notes}`))
    return {
      headline: international.length ? 'Internationale voorbereiding' : 'Geen internationale events gevonden',
      summary: international.length
        ? 'Controleer vertalingen, valuta en transportdocumenten voor onderstaande events.'
        : 'Geen projecten met internationale kenmerken in deze selectie.',
      bullets: international.slice(0, 3).map(event => `${event.name} – ${formatDate(event.start)}`),
    }
  },
  peter(events) {
    const risky = events.filter(event => event.risk === 'warning')
    return {
      headline: 'Automatisering kansen',
      summary: risky.length
        ? 'Koppel API-triggers aan voorraadwaarschuwingen om het magazijn proactief te sturen.'
        : 'Geen nieuwe waarschuwingen voor automatisering. Controleer API logs voor consistentie.',
      bullets: risky.slice(0, 3).map(event => `${event.name} – ${riskLabels[event.risk] || 'Onbekend'}`),
    }
  },
  nadia(events) {
    const simpleTasks = events
      .filter(event => event.status === 'upcoming')
      .slice(0, 3)
    return {
      headline: 'Stap-voor-stap starten',
      summary: simpleTasks.length
        ? 'Volg de checklist: klant controleren, datum bevestigen, materiaal reserveren.'
        : 'Geen eenvoudige taken gevonden. Vraag een collega om een geschikte opdracht toe te wijzen.',
      bullets: simpleTasks.map(event => `${event.name} – ${timelineLabel(event)}`),
    }
  },
  david(events) {
    const allStatuses = Array.from(new Set(events.map(event => statusLabels[event.status] || event.status)))
    return {
      headline: 'API validatie',
      summary: 'Controleer of alle statusovergangen correct worden teruggegeven door de API responses.',
      bullets: allStatuses.slice(0, 3).map(status => `Status beschikbaar: ${status}`),
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
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        padding: '16px',
        background: '#ffffff',
        display: 'grid',
        gap: '12px',
      }}
      aria-live="polite"
    >
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px' }}>
        <div>
          <h3 style={{ margin: 0 }}>{personaLabel}</h3>
          <p style={{ margin: 0, color: '#4b5563', fontSize: '0.9rem' }}>{description}</p>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#6b7280', textAlign: 'right' }}>
          {timeFilterOptions[timeFilter]?.label}
        </div>
      </header>
      {insights && (
        <div style={{ display: 'grid', gap: '8px' }}>
          <strong>{insights.headline}</strong>
          <p style={{ margin: 0, color: '#374151' }}>{insights.summary}</p>
          {insights.emphasis && <p style={{ margin: 0, color: '#b45309' }}>{insights.emphasis}</p>}
          {insights.bullets?.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#4b5563' }}>
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
                padding: '6px 14px',
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                cursor: 'pointer',
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      {playbookSections && (
        <div style={{ display: 'grid', gap: '8px' }}>
          <div style={{ fontWeight: 600 }}>Waardeplaybook</div>
          {playbookSections.length > 0 ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              {playbookSections.map(section => (
                <div
                  key={section.title}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '12px',
                    background: '#f9fafb',
                    display: 'grid',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 600 }}>{section.title}</span>
                    {section.caption && <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{section.caption}</span>}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#374151', display: 'grid', gap: '4px' }}>
                    {section.items.map(item => (
                      <li key={item.key}>{item.text}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: '#6b7280' }}>
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
  return (
    <div
      style={{
        background: cardPalette[tone] || cardPalette.neutral,
        padding: '12px 16px',
        borderRadius: '12px',
        display: 'grid',
        gap: '4px',
        minWidth: '150px',
      }}
    >
      <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
      {helpText && <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{helpText}</div>}
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
        gap: '8px',
        padding: '16px',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        backgroundColor: '#ffffff',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Financiële puls</h3>
        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Realtime cashflow-impact per persona</span>
      </header>
      {cards.length > 0 && (
        <div style={{ display: 'grid', gap: '8px' }}>
          <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>Portfolio totaal</div>
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
          <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>Focus: {focusLabel}</div>
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
      case 'focusRisk':
        setStatusFilter('active')
        setRiskFilter('warning')
        setSortKey('risk')
        setSortDir('desc')
        setTimeFilter('today')
        break
      case 'showNextWeek':
        setStatusFilter('upcoming')
        setRiskFilter('all')
        setSortKey('start')
        setSortDir('asc')
        setTimeFilter('next7')
        break
      case 'focusTodayCrew':
        setStatusFilter('active')
        setRiskFilter('all')
        setTimeFilter('today')
        setSortKey('start')
        setSortDir('asc')
        break
      case 'sortByClient':
        setStatusFilter('upcoming')
        setRiskFilter('all')
        setSortKey('client')
        setSortDir('asc')
        setTimeFilter('next30')
        break
      case 'showCompletedMonth':
        setStatusFilter('completed')
        setRiskFilter('all')
        setSortKey('end')
        setSortDir('desc')
        setTimeFilter('past30')
        break
      case 'focusCashflow':
        setStatusFilter('completed')
        setRiskFilter('all')
        setSortKey('end')
        setSortDir('desc')
        setTimeFilter('past30')
        setSearchTerm('')
        break
      case 'showCriticalRisk':
        setStatusFilter('all')
        setRiskFilter('critical')
        setSortKey('risk')
        setSortDir('desc')
        setTimeFilter('today')
        break
      case 'showNextMonth':
        setStatusFilter('upcoming')
        setRiskFilter('all')
        setSortKey('start')
        setSortDir('asc')
        setTimeFilter('next30')
        break
      case 'focusAutomation':
        setRiskFilter('warning')
        setStatusFilter('all')
        setSortKey('status')
        setSortDir('asc')
        setTimeFilter('next7')
        break
      case 'showGuidedView':
        setStatusFilter('upcoming')
        setRiskFilter('all')
        setSortKey('start')
        setSortDir('asc')
        setTimeFilter('next14')
        setSearchTerm('')
        break
      case 'devOverview':
        setStatusFilter('all')
        setRiskFilter('all')
        setSortKey('status')
        setSortDir('asc')
        setTimeFilter('all')
        break
      case 'resetPersona':
        applyPersonaPreset(personaPreset)
        break
      default:
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
    <div style={{ fontFamily: 'system-ui', padding: '12px', maxWidth: '1120px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Projectplanner</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
            Verbeterde UAT cockpit met persona-presets, voorraadbewaking en inline herplanning.
          </p>
        </div>
        <button onClick={onLogout}>Uitloggen</button>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
        aria-live="polite"
      >
        <SummaryMetric label="Actief" value={summary.active} tone="success" helpText="Inclusief risicoprojecten" />
        <SummaryMetric label="Komend" value={summary.upcoming} />
        <SummaryMetric label="Afgerond" value={summary.completed} />
        <SummaryMetric
          label="Voorraadrisico"
          value={`${summary.critical} kritisch / ${summary.warning} waarschuwing`}
          tone={summary.critical ? 'danger' : summary.warning ? 'warning' : 'neutral'}
        />
      </div>

      <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
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

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', color: '#4b5563' }}>
            Persona preset
            <select
              value={personaPreset}
              onChange={event => applyPersonaPreset(event.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              {Object.entries(personaPresets).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', color: '#4b5563' }}>
            Statusfilter
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="all">Alle</option>
              <option value="active">Actief</option>
              <option value="upcoming">Komend</option>
              <option value="completed">Afgerond</option>
              <option value="at_risk">Risico</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', color: '#4b5563' }}>
            Voorraadrisico
            <select
              value={riskFilter}
              onChange={event => setRiskFilter(event.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="all">Alle</option>
              <option value="ok">Op schema</option>
              <option value="warning">Let op</option>
              <option value="critical">Kritiek</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', color: '#4b5563' }}>
            Tijdvenster
            <select
              value={timeFilter}
              onChange={event => setTimeFilter(event.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              {Object.entries(timeFilterOptions).map(([value, option]) => (
                <option key={value} value={value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', color: '#4b5563', flex: '1 1 200px' }}>
            Zoeken
            <input
              type="search"
              placeholder="Zoek op project, klant of notitie"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
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
            style={{ alignSelf: 'flex-end', padding: '8px 12px' }}
          >
            Reset filters
          </button>
        </div>
        {personaHint && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{personaHint}</div>}
      </div>

      {feedback && (
        <div
          role="alert"
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            backgroundColor: feedback.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: feedback.type === 'success' ? '#065f46' : '#991b1b',
          }}
        >
          {feedback.message}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '12px 8px' }}>Project</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '12px 8px' }}>Klant</th>
              <th
                style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '12px 8px', cursor: 'pointer' }}
                onClick={() => toggleSort('status')}
              >
                Status
              </th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '12px 8px' }}>Planning</th>
              <th
                style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '12px 8px', cursor: 'pointer' }}
                onClick={() => toggleSort('risk')}
              >
                Voorraad
              </th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '12px 8px' }}>Impact</th>
              <th
                style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '12px 8px', cursor: 'pointer' }}
                onClick={() => toggleSort('start')}
              >
                Start
              </th>
              <th
                style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '12px 8px', cursor: 'pointer' }}
                onClick={() => toggleSort('end')}
              >
                Einde
              </th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '12px 8px' }}>Acties</th>
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
                      style={{ backgroundColor: isExpanded ? '#f9fafb' : 'transparent' }}
                      onDoubleClick={() => openEditor(event)}
                    >
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>{event.name}</td>
                      <td style={{ padding: '12px 8px' }}>{event.client}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <StatusBadge status={event.status} />
                      </td>
                      <td style={{ padding: '12px 8px', color: '#4b5563' }}>{timelineLabel(event)}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <RiskBadge risk={event.risk} />
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <ImpactBadge impact={impact} />
                      </td>
                      <td style={{ padding: '12px 8px', color: '#4b5563' }}>{formatDate(event.start)}</td>
                      <td style={{ padding: '12px 8px', color: '#4b5563' }}>{formatDate(event.end)}</td>
                      <td style={{ padding: '12px 8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => setExpandedRow(isExpanded ? null : event.id)}>
                          {isExpanded ? 'Sluit details' : 'Details'}
                        </button>
                        <button type="button" onClick={() => openEditor(event)}>
                          Herplan
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} style={{ padding: '16px 24px', backgroundColor: '#f9fafb' }}>
                          <div style={{ display: 'grid', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: '#4b5563' }}>
                              <span><strong>Doorlooptijd:</strong> {event.durationDays ? `${event.durationDays} dagen` : 'Onbekend'}</span>
                              <span><strong>Eindigt op:</strong> {formatDate(event.end)}</span>
                            </div>
                            <div style={{ color: '#111827', fontWeight: 600 }}>Projectnotities</div>
                            <div style={{ color: '#4b5563', whiteSpace: 'pre-wrap' }}>
                              {event.notes ? event.notes : 'Geen notities toegevoegd.'}
                            </div>
                            {event.alerts.length > 0 ? (
                              <div>
                                <div style={{ color: '#111827', fontWeight: 600, marginBottom: '6px' }}>Voorraaddetails</div>
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
