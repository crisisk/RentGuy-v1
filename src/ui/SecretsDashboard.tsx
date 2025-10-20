import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { fetchEmailDiagnostics, fetchManagedSecrets, syncManagedSecrets, updateManagedSecret } from '@application/platform/secrets/api'
import type { EmailDiagnostics, ManagedSecret } from '@rg-types/platform'
import { brand, brandFontStack, headingFontStack, withOpacity } from '@ui/branding'
import { buildHelpCenterUrl, resolveSupportConfig } from './experienceConfig'
import FlowGuidancePanel, { type FlowItem } from '@ui/FlowGuidancePanel'
import FlowExperienceShell, { type FlowExperienceAction, type FlowExperiencePersona } from '@ui/FlowExperienceShell'
import FlowExplainerList, { type FlowExplainerItem } from '@ui/FlowExplainerList'
import FlowJourneyMap, { type FlowJourneyStep } from '@ui/FlowJourneyMap'
import { createFlowNavigation, type FlowNavigationStatus } from '@ui/flowNavigation'
import { useAuthStore } from '@stores/authStore'

interface SecretsDashboardProps {
  onLogout: () => void
}

type FeedbackTone = 'success' | 'error' | 'info'

interface FeedbackMessage {
  tone: FeedbackTone
  message: string
}

interface ValidationResult {
  valid: boolean
  message?: string
}

const timestampFormatter = new Intl.DateTimeFormat('nl-NL', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatTimestamp(value?: string | null): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return timestampFormatter.format(parsed)
}

const categoryLabels: Record<string, string> = {
  core: 'Kernconfiguratie',
  email: 'E-mail & notificaties',
  payments: 'Betalingen',
  integrations: 'Integraties',
  mr_dj: 'Mr. DJ integratie',
  observability: 'Observability',
  custom: 'Aangepast',
}

const categoryOrder = ['core', 'email', 'payments', 'integrations', 'mr_dj', 'observability', 'custom']

function categoryWeight(category: string): number {
  const index = categoryOrder.indexOf(category)
  return index === -1 ? categoryOrder.length : index
}

const integrationKeys = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'MAIL_FROM',
  'MRDJ_API_URL',
  'MRDJ_SERVICE_ACCOUNT_EMAIL',
  'MRDJ_SERVICE_ACCOUNT_PASSWORD',
  'MRDJ_WEBHOOK_SECRET',
] as const

const requiredSecretKeys = new Set<string>(integrationKeys)

function validateSecretInput(key: string, rawValue: string, secret?: ManagedSecret | null): ValidationResult {
  const value = rawValue.trim()
  const normalizedKey = key.toUpperCase()

  if (requiredSecretKeys.has(normalizedKey) && value.length === 0) {
    return { valid: false, message: 'Dit veld is verplicht voor de MR DJ koppeling.' }
  }

  if (normalizedKey.endsWith('_PORT') && value.length > 0) {
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
      return { valid: false, message: 'Gebruik een geldig poortnummer tussen 1 en 65535.' }
    }
  }

  if ((normalizedKey.includes('EMAIL') || normalizedKey === 'MAIL_FROM') && value.length > 0) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(value)) {
      return { valid: false, message: 'Voer een geldig e-mailadres in (bijv. alerts@rentguy.nl).' }
    }
  }

  if (normalizedKey.includes('URL') && value.length > 0) {
    try {
      const parsedUrl = new URL(value)
      if (!/^https?:$/.test(parsedUrl.protocol)) {
        return { valid: false, message: 'Alleen http(s) URL\'s zijn toegestaan.' }
      }
    } catch (error) {
      return { valid: false, message: 'Gebruik een volledige URL inclusief protocol (bijv. https://).' }
    }
  }

  if (/(PASSWORD|SECRET|TOKEN)$/.test(normalizedKey) && value.length > 0) {
    if (value.length < 12) {
      return { valid: false, message: 'Geheime waarden moeten minimaal 12 tekens bevatten.' }
    }
    const hasNumber = /\d/.test(value)
    const hasLetter = /[a-zA-Z]/.test(value)
    if (!hasNumber || !hasLetter) {
      return { valid: false, message: 'Gebruik een mix van letters en cijfers voor extra veiligheid.' }
    }
  }

  if (!secret?.hasValue && value.length === 0 && secret && !requiredSecretKeys.has(normalizedKey)) {
    return { valid: false, message: 'Vul een waarde in voordat je opslaat.' }
  }

  return { valid: true }
}

const roleLabelMap: Record<string, string> = {
  admin: 'Administrator',
  planner: 'Operations planner',
  crew: 'Crew lead',
  warehouse: 'Warehouse coördinator',
  finance: 'Finance specialist',
  viewer: 'Project stakeholder',
}

interface SlaMatrixRow {
  tier: string
  rto: string
  rpo: string
  coverage: string
  escalation: string
}

const slaMatrixRows: SlaMatrixRow[] = [
  {
    tier: 'Launch',
    rto: '< 12 uur',
    rpo: '4 uur',
    coverage: 'Ma–Vr 08:00-20:00 CET',
    escalation: 'Slack #rentguy-launch → CS manager',
  },
  {
    tier: 'Professional',
    rto: '< 6 uur',
    rpo: '1 uur',
    coverage: '7 dagen 07:00-22:00 CET',
    escalation: 'NOC hotline → Duty engineer → Customer success lead',
  },
  {
    tier: 'Enterprise',
    rto: '< 1 uur',
    rpo: '15 minuten',
    coverage: '24/7 follow-the-sun',
    escalation: 'NOC bridge → Sevensa SRE → RentGuy leadership',
  },
]

const changelogTeasers = [
  {
    version: '2025.02',
    highlights: 'Nieuwe FlowExperienceShell met nav-rail automation en planner hand-offs.',
  },
  {
    version: '2025.01',
    highlights: 'UAT R2 voltooid, secrets-sync herstart indicator en monitoring dry-run.',
  },
  {
    version: '2024.12',
    highlights: 'Multi-tenant router update + marketing hero storytelling.',
  },
]

export default function SecretsDashboard({ onLogout }: SecretsDashboardProps): JSX.Element {
  const [secrets, setSecrets] = useState<ManagedSecret[]>([])
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)
  const [savingKeys, setSavingKeys] = useState<Set<string>>(() => new Set())
  const [syncing, setSyncing] = useState(false)
  const [emailDiagnostics, setEmailDiagnostics] = useState<EmailDiagnostics | null>(null)
  const [activeTab, setActiveTab] = useState<'secrets' | 'integration'>('secrets')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [fieldSuccess, setFieldSuccess] = useState<Record<string, string>>({})
  const user = useAuthStore(state => state.user)
  const userEmail = user?.email ?? ''
  const userRole = user?.role ?? ''
  const userFirstName = (user?.first_name ?? '').trim()
  const userLastName = (user?.last_name ?? '').trim()
  const userDisplayName = [userFirstName, userLastName].filter(Boolean).join(' ').trim()
  const support = useMemo(() => resolveSupportConfig(), [])
  const complianceUrl = useMemo(() => buildHelpCenterUrl(support, 'compliance'), [support])

  const markSaving = useCallback((key: string, saving: boolean) => {
    setSavingKeys(prev => {
      const next = new Set(prev)
      if (saving) {
        next.add(key)
      } else {
        next.delete(key)
      }
      return next
    })
  }, [])

  const secretMap = useMemo(() => {
    const map = new Map<string, ManagedSecret>()
    for (const secret of secrets) {
      map.set(secret.key, secret)
    }
    return map
  }, [secrets])

  const setFieldError = useCallback((key: string, message?: string) => {
    setFieldErrors(prev => {
      if (!message && !(key in prev)) {
        return prev
      }
      const next = { ...prev }
      if (!message) {
        delete next[key]
      } else {
        next[key] = message
      }
      return next
    })
  }, [])

  const setFieldSuccessMessage = useCallback((key: string, message?: string) => {
    setFieldSuccess(prev => {
      if (!message && !(key in prev)) {
        return prev
      }
      const next = { ...prev }
      if (!message) {
        delete next[key]
      } else {
        next[key] = message
      }
      return next
    })
  }, [])

  const fetchSecrets = useCallback(async () => {
    const result = await fetchManagedSecrets()
    if (result.ok) {
      setSecrets(result.value)
      setError(null)
      return true
    }
    setError(result.error.message ?? 'Secrets konden niet geladen worden.')
    return false
  }, [])

  const refreshEmailDiagnostics = useCallback(async () => {
    const result = await fetchEmailDiagnostics()
    if (result.ok) {
      setEmailDiagnostics(result.value)
    } else {
      setEmailDiagnostics(null)
      console.warn('Kon e-maildiagnose niet laden', result.error)
    }
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      await fetchSecrets()
      if (active) {
        setLoading(false)
      }
    })()
    refreshEmailDiagnostics()
    return () => {
      active = false
    }
  }, [fetchSecrets, refreshEmailDiagnostics])

  const grouped = useMemo(() => {
    const buckets = new Map<string, ManagedSecret[]>()
    for (const secret of secrets) {
      const bucketKey = secret.category || 'custom'
      const bucket = buckets.get(bucketKey) ?? []
      bucket.push(secret)
      buckets.set(bucketKey, bucket)
    }
    return buckets
  }, [secrets])

  const integrationSecrets = useMemo(
    () =>
      integrationKeys.map(key => ({
        key,
        secret: secrets.find(item => item.key === key) ?? null,
      })),
    [secrets],
  )

  const missingIntegrationKeys = useMemo(
    () => integrationSecrets.filter(entry => !entry.secret || !entry.secret.hasValue).map(entry => entry.key),
    [integrationSecrets],
  )

  const integrationReady = missingIntegrationKeys.length === 0

  const configuredIntegrations = useMemo(
    () => integrationSecrets.reduce((count, entry) => (entry.secret?.hasValue ? count + 1 : count), 0),
    [integrationSecrets],
  )

  const integrationCoverage = integrationSecrets.length
    ? Math.round((configuredIntegrations / integrationSecrets.length) * 100)
    : 0

  const handleInputChange = useCallback(
    (key: string, value: string, secretOverride?: ManagedSecret | null) => {
      setFormValues(prev => ({
        ...prev,
        [key]: value,
      }))
      setFieldSuccessMessage(key)
      const secret = secretOverride ?? secretMap.get(key) ?? null
      const validation = validateSecretInput(key, value, secret)
      if (!validation.valid) {
        setFieldError(key, validation.message ?? 'Ongeldige invoer')
      } else {
        setFieldError(key)
      }
    },
    [secretMap, setFieldError, setFieldSuccessMessage],
  )

  const handleResetField = useCallback(
    (key: string) => {
      setFormValues(prev => ({
        ...prev,
        [key]: '',
      }))
      setFieldError(key)
      setFieldSuccessMessage(key)
    },
    [setFieldError, setFieldSuccessMessage],
  )

  const openRecoveryGuide = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open(
        'https://github.com/crisisk/RentGuy-v1/blob/work/docs/secrets_onboarding_playbook.md',
        '_blank',
        'noopener,noreferrer',
      )
    }
  }, [])

  const handleSave = useCallback(
    async (secret: ManagedSecret) => {
      const draftValue = formValues[secret.key] ?? ''
      const trimmed = draftValue.trim()

      const validation = validateSecretInput(secret.key, draftValue, secret)
      if (!validation.valid) {
        const message = validation.message ?? `Controleer de invoer voor ${secret.label}.`
        setFieldError(secret.key, message)
        setFieldSuccessMessage(secret.key)
        setFeedback({ tone: 'error', message })
        return
      }

      setFeedback(null)
      markSaving(secret.key, true)
      const result = await updateManagedSecret(secret.key, { value: trimmed.length > 0 ? trimmed : '' })
      if (result.ok) {
        setSecrets(prev => prev.map(item => (item.key === secret.key ? result.value : item)))
        setFormValues(prev => ({ ...prev, [secret.key]: '' }))
        const savedMessage = `${secret.label} ${trimmed.length > 0 ? 'opgeslagen' : 'leeg gemaakt'} (${timestampFormatter.format(new Date())}).`
        setFeedback({ tone: trimmed.length > 0 ? 'success' : 'info', message: savedMessage })
        setFieldError(secret.key)
        setFieldSuccessMessage(secret.key, savedMessage)
        await refreshEmailDiagnostics()
      } else {
        setFeedback({ tone: 'error', message: result.error.message ?? 'Opslaan mislukt. Probeer het opnieuw.' })
        const errorMessage = result.error.message ?? 'Opslaan mislukt. Controleer verbinding en toegangsrechten.'
        setFieldError(secret.key, errorMessage)
        setFieldSuccessMessage(secret.key)
      }
      markSaving(secret.key, false)
    },
    [formValues, markSaving, refreshEmailDiagnostics, setFieldError, setFieldSuccessMessage],
  )

  const handleSync = useCallback(async () => {
    setFeedback(null)
    setSyncing(true)
    const result = await syncManagedSecrets()
    if (result.ok) {
      const restartHint = result.value.triggeredRestart ? ' Herstart de backend-service om wijzigingen toe te passen.' : ''
      setFeedback({
        tone: 'success',
        message: `Secrets opgeslagen naar ${result.value.envPath}. ${restartHint}`.trim(),
      })
      await fetchSecrets()
      await refreshEmailDiagnostics()
    } else {
      setFeedback({ tone: 'error', message: result.error.message ?? 'Synchroniseren naar het systeem is mislukt.' })
    }
    setSyncing(false)
  }, [fetchSecrets, refreshEmailDiagnostics])

  const totalSecrets = secrets.length

  const configuredSecrets = useMemo(
    () => secrets.reduce((count, secret) => (secret.hasValue ? count + 1 : count), 0),
    [secrets],
  )

  const emailStatusLabel = useMemo(() => {
    if (!emailDiagnostics) {
      return 'E-mailstatus onbekend'
    }
    const labelMap: Record<EmailDiagnostics['status'], string> = {
      ok: 'OK',
      warning: 'Waarschuwing',
      error: 'Storing',
    }
    return `E-mailstatus: ${labelMap[emailDiagnostics.status]}`
  }, [emailDiagnostics])

  const openSecretsTab = useCallback(() => setActiveTab('secrets'), [])

  const openIntegrationTab = useCallback(() => setActiveTab('integration'), [])

  const triggerSync = useCallback(() => {
    if (!syncing) {
      void handleSync()
    }
  }, [handleSync, syncing])

  const triggerEmailRefresh = useCallback(() => {
    void refreshEmailDiagnostics()
  }, [refreshEmailDiagnostics])

  const openGithubRepo = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open('https://github.com/crisisk/mr-djv1', '_blank', 'noopener,noreferrer')
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const params = new URLSearchParams(window.location.search)
    const focus = params.get('focus') ?? ''
    if (!focus) {
      return
    }

    if (focus === 'integration') {
      setActiveTab('integration')
    } else if (focus === 'email' || focus === 'sla' || focus === 'changelog') {
      setActiveTab('secrets')
    }

    const focusToElement: Record<string, string> = {
      integration: 'integration-overview',
      email: 'email-diagnostics-card',
      sla: 'secrets-sla-matrix',
      changelog: 'secrets-changelog-teaser',
    }

    const targetId = focusToElement[focus]
    if (targetId) {
      window.setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 250)
    }

    if (params.get('action') === 'sync') {
      window.setTimeout(() => {
        triggerSync()
      }, 400)
    }
  }, [triggerSync])

  const flowItems = useMemo<FlowItem[]>(() => {
    const missingSecrets = Math.max(totalSecrets - configuredSecrets, 0)
    const syncLabel = syncing ? 'Synchroniseert…' : 'Sync naar omgeving'
    const integrationTone: FlowItem['status'] = integrationReady
      ? 'success'
      : missingIntegrationKeys.length > 2
      ? 'danger'
      : 'warning'
    const integrationMetric = integrationReady
      ? 'Compleet'
      : `${missingIntegrationKeys.length} ontbreekt`
    const integrationHelper = integrationReady
      ? 'Alle koppelingen zijn ingericht. Plan nu een end-to-end regressietest.'
      : `Ontbrekend: ${missingIntegrationKeys.slice(0, 3).join(', ')}${missingIntegrationKeys.length > 3 ? '…' : ''}`
    const emailTone: FlowItem['status'] = !emailDiagnostics
      ? 'warning'
      : emailDiagnostics.status === 'ok'
      ? 'success'
      : emailDiagnostics.status === 'warning'
      ? 'warning'
      : 'danger'
    const emailMetric = emailDiagnostics ? emailDiagnostics.status.toUpperCase() : 'Geen data'
    const emailHelper = emailDiagnostics
      ? emailDiagnostics.missing.length > 0
        ? `Ontbrekend: ${emailDiagnostics.missing.join(', ')}`
        : 'Alle vereiste velden zijn gevuld. Controleer logs voor deliverability.'
      : 'Voer een test om SMTP en notificaties te valideren.'

    const integrationSecondary: FlowItem['secondaryAction'] = integrationReady
      ? undefined
      : { label: 'Open GitHub checklist', onClick: openGithubRepo, variant: 'secondary' }

    return [
      {
        id: 'core-secrets',
        title: 'Basisconfiguratie',
        icon: '🔐',
        status: missingSecrets > 0 ? 'warning' : 'success',
        metricLabel: 'Secrets ingevuld',
        metricValue: totalSecrets > 0 ? `${configuredSecrets}/${totalSecrets}` : '0/0',
        description:
          'Zorg dat kernvariabelen voor SMTP, betalingen en observability ingevuld zijn voordat je synchroniseert.',
        helperText:
          'Best practice: werk categorie voor categorie af en log wijzigingen voor het Sevensa auditregister.',
        primaryAction: { label: 'Open secrets-tab', onClick: openSecretsTab },
        secondaryAction: { label: syncLabel, onClick: triggerSync, variant: 'secondary' },
      },
      {
        id: 'integration-bridge',
        title: 'MR DJ integraties',
        icon: '🌐',
        status: integrationTone,
        metricLabel: 'Integratievariabelen',
        metricValue: integrationMetric,
        description:
          'Controleer service-accounts en webhook-secrets voor de Express/React koppeling zodat deploys vlekkeloos verlopen.',
        helperText: integrationHelper,
        primaryAction: { label: 'Bekijk integraties', onClick: openIntegrationTab },
        ...(integrationSecondary ? { secondaryAction: integrationSecondary } : {}),
      },
      {
        id: 'email-delivery',
        title: 'E-mail deliverability',
        icon: '✉️',
        status: emailTone,
        metricLabel: 'SMTP status',
        metricValue: emailMetric,
        description:
          'Monitor de Express-mail pipeline en valideer dat authenticatie en SPF/DMARC configuraties actief blijven.',
        helperText: emailHelper,
        primaryAction: { label: 'Ververs diagnose', onClick: triggerEmailRefresh },
        secondaryAction: { label: 'Naar secrets-tab', onClick: openSecretsTab, variant: 'secondary' },
      },
    ]
  }, [
    configuredSecrets,
    emailDiagnostics,
    integrationReady,
    missingIntegrationKeys,
    openGithubRepo,
    openIntegrationTab,
    openSecretsTab,
    syncing,
    totalSecrets,
    triggerEmailRefresh,
    triggerSync,
  ])

  const heroExplainers = useMemo<FlowExplainerItem[]>(() => {
    const coveragePct = totalSecrets > 0 ? Math.round((configuredSecrets / totalSecrets) * 100) : 0
    const missingList = missingIntegrationKeys.length
      ? `${missingIntegrationKeys.slice(0, 2).join(', ')}${missingIntegrationKeys.length > 2 ? '…' : ''}`
      : 'Geen'
    const emailDescription = emailDiagnostics
      ? emailDiagnostics.message
      : 'Voer een diagnose uit om SMTP, authenticatie en notificaties te valideren voordat je live gaat.'
    const emailMeta = emailDiagnostics
      ? emailDiagnostics.nodeReady
        ? 'Express notificaties klaar'
        : 'Node configuratie vereist'
      : 'Diagnose nog niet uitgevoerd'

    return [
      {
        id: 'coverage',
        icon: '🔐',
        title: 'Secrets coverage',
        description:
          totalSecrets > 0
            ? `${configuredSecrets} van ${totalSecrets} secrets ingevuld (${coveragePct}%).`
            : 'Nog geen secrets ingeladen. Synchroniseer om de basisconfiguratie op te bouwen.',
        meta: syncing ? 'Synchroniseren…' : 'Laatste wijzigingen klaar voor sync',
        ...(syncing ? {} : { action: { label: 'Synchroniseer nu', onClick: triggerSync } }),
      },
      {
        id: 'integration-readiness',
        icon: '🧩',
        title: 'Integratiegereedheid',
        description: integrationReady
          ? 'Alle MR DJ integratievariabelen zijn ingevuld. Je kunt de release checklist afronden.'
          : 'Werk ontbrekende integratievariabelen bij en synchroniseer opnieuw voor een groene status.',
        meta: integrationReady ? 'Compleet' : `Ontbrekend: ${missingList}`,
        ...(integrationReady ? {} : { action: { label: 'Bekijk integraties', onClick: openIntegrationTab } }),
      },
      {
        id: 'email-diagnostics',
        icon: '📬',
        title: 'E-maildiagnose',
        description: emailDescription,
        meta: emailMeta,
        action: { label: 'Ververs diagnose', onClick: triggerEmailRefresh },
      },
    ]
  }, [
    configuredSecrets,
    emailDiagnostics,
    integrationReady,
    missingIntegrationKeys,
    openIntegrationTab,
    syncing,
    totalSecrets,
    triggerEmailRefresh,
    triggerSync,
  ])

  const secretsJourney = useMemo<FlowJourneyStep[]>(() => {
    const plannerMeta = totalSecrets > 0 ? `${totalSecrets} secrets geregistreerd` : 'Nog geen secrets geladen'
    const integrationMeta = `${integrationCoverage}% integraties compleet${
      missingIntegrationKeys.length ? ` · ${missingIntegrationKeys.length} ontbrekend` : ''
    }`
    const emailMeta = emailDiagnostics ? emailDiagnostics.message : 'Voer een diagnose uit voor e-mail en notificaties'
    const launchReady = integrationReady && emailDiagnostics?.status === 'ok'

    return [
      {
        id: 'login',
        title: '1. Inloggen',
        description: 'Je bent aangemeld als Sevensa administrator. Alle wijzigingen worden gelogd.',
        status: 'complete',
        badge: 'Authenticatie',
        meta: userEmail ? `Ingelogd als ${userEmail}` : undefined,
      },
      {
        id: 'role',
        title: '2. Administratorrechten',
        description: 'Beheerderstoegang geeft je de mogelijkheid om secrets te synchroniseren en integraties te activeren.',
        status: userRole === 'admin' ? 'complete' : 'blocked',
        badge: 'Rollen',
        meta: userRole ? `Rol: ${userRole}` : 'Rol onbekend',
      },
      {
        id: 'planner',
        title: '3. Operationele cockpit',
        description: 'Verifieer dat planners en crew flows draaien voordat je wijzigingen pusht.',
        status: 'complete',
        badge: 'Operations',
        meta: plannerMeta,
        href: '/planner',
      },
      {
        id: 'secrets',
        title: '4. Secrets & integraties',
        description: 'Vul ontbrekende waarden aan en synchroniseer naar de platformdiensten voor productiepariteit.',
        status: 'current',
        badge: 'Configuratie',
        meta: integrationMeta,
      },
      {
        id: 'launch',
        title: '5. Go-live review',
        description: launchReady
          ? 'Plan een laatste review en activeer monitoring voordat je live gaat.'
          : 'Los integratie- of e-mailissues op voordat je een release plant.',
        status: launchReady ? 'upcoming' : 'blocked',
        badge: 'Go-live',
        meta: emailMeta,
      },
    ]
  }, [
    emailDiagnostics,
    integrationCoverage,
    integrationReady,
    missingIntegrationKeys.length,
    totalSecrets,
    userEmail,
    userRole,
  ])

  const renderFeedback = () => {
    if (!feedback || feedback.tone === 'error') return null
    let color = brand.colors.primary
    if (feedback.tone === 'success') {
      color = brand.colors.success
    }
    return (
      <div
        role="status"
        style={{
          padding: '14px 18px',
          borderRadius: 16,
          background: withOpacity(color, 0.12),
          border: `1px solid ${withOpacity(color, 0.4)}`,
          color: color,
          fontWeight: 600,
        }}
      >
        {feedback.message}
      </div>
    )
  }

  const renderEmailDiagnostics = () => {
    if (!emailDiagnostics) {
      return (
        <div
          style={{
            display: 'grid',
            gap: 8,
            padding: '20px 24px',
            borderRadius: 20,
            background: withOpacity(brand.colors.primary, 0.05),
            border: `1px dashed ${withOpacity(brand.colors.primary, 0.4)}`,
          }}
        >
          <strong style={{ fontFamily: headingFontStack, color: brand.colors.primary }}>E-maildiagnose niet beschikbaar</strong>
          <span style={{ color: brand.colors.mutedText }}>
            De status kon niet worden opgehaald. Controleer de verbinding en probeer het later opnieuw.
          </span>
        </div>
      )
    }

    const statusColor = emailDiagnostics.status === 'ok' ? brand.colors.success : emailDiagnostics.status === 'warning' ? brand.colors.warning : brand.colors.danger
    return (
      <div
        id="email-diagnostics-card"
        style={{
          display: 'grid',
          gap: 12,
          padding: '24px 28px',
          borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(227, 232, 255, 0.82) 100%)',
          border: `1px solid ${withOpacity(statusColor, 0.4)}`,
          boxShadow: brand.colors.shadow,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.22em', color: brand.colors.mutedText }}>
              E-mailintegratie
            </span>
            <h3 style={{ margin: 4, fontFamily: headingFontStack, color: statusColor }}>Status: {emailDiagnostics.status.toUpperCase()}</h3>
          </div>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              fontWeight: 600,
              color: '#fff',
              background: statusColor,
              letterSpacing: '0.04em',
            }}
          >
            {emailDiagnostics.nodeReady ? 'Express-ready' : 'Configuratie vereist'}
          </div>
        </div>
        <p style={{ margin: 0, color: brand.colors.mutedText }}>{emailDiagnostics.message}</p>
        {emailDiagnostics.missing.length > 0 && (
          <div style={{ color: brand.colors.danger }}>
            Ontbrekend: {emailDiagnostics.missing.join(', ')}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, color: brand.colors.mutedText }}>
          <strong style={{ fontFamily: headingFontStack }}>Geconfigureerd:</strong>
          {emailDiagnostics.configured.length > 0 ? emailDiagnostics.configured.join(', ') : '—'}
        </div>
        <div style={{ color: brand.colors.mutedText }}>
          Authenticatie: {emailDiagnostics.authConfigured ? 'ingesteld' : 'niet ingesteld'}
        </div>
      </div>
    )
  }

  const renderIntegrationTab = () => {
    return (
      <div style={{ display: 'grid', gap: 24 }}>
        <section
          id="integration-overview"
          style={{
            display: 'grid',
            gap: 16,
            padding: '24px 28px',
            borderRadius: 28,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(231, 240, 255, 0.88) 100%)',
            border: `1px solid ${withOpacity(brand.colors.secondary, 0.25)}`,
            boxShadow: brand.colors.shadow,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.22em', color: brand.colors.mutedText }}>
                Mr. DJ Express/React koppeling
              </span>
              <h2 style={{ margin: 0, fontFamily: headingFontStack, color: brand.colors.secondary }}>
                Productie-credentials overzicht
              </h2>
              <p style={{ margin: 0, maxWidth: 620, color: brand.colors.mutedText }}>
                Synchroniseer deze waardes naar het mr-djv1 project ({' '}
                <a href="https://github.com/crisisk/mr-djv1" target="_blank" rel="noreferrer" style={{ color: brand.colors.primary }}>
                  GitHub
                </a>
                ) om de Express API en React frontend te laten authenticeren tegen RentGuy en SMTP e-mail af te handelen.
              </p>
            </div>
            <div
              style={{
                padding: '8px 18px',
                borderRadius: 999,
                fontWeight: 600,
                color: '#fff',
                background: integrationReady ? brand.colors.success : brand.colors.warning,
                letterSpacing: '0.04em',
                minWidth: 220,
                textAlign: 'center',
              }}
            >
              {integrationReady ? 'Productiesetup compleet' : 'Aanvullende configuratie vereist'}
            </div>
          </div>
          {!integrationReady && missingIntegrationKeys.length > 0 && (
            <div style={{ color: brand.colors.danger, fontWeight: 600 }}>
              Ontbrekende variabelen: {missingIntegrationKeys.join(', ')}
            </div>
          )}
        </section>

        <section style={{ display: 'grid', gap: 16 }}>
          <h3 style={{ margin: 0, fontFamily: headingFontStack, color: brand.colors.secondary }}>Benodigde variabelen</h3>
          <div
            style={{
              display: 'grid',
              gap: 12,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(227, 233, 255, 0.85) 100%)',
              borderRadius: 24,
              padding: '18px 22px',
              border: `1px solid ${withOpacity(brand.colors.primary, 0.18)}`,
              boxShadow: brand.colors.shadow,
            }}
          >
            {integrationSecrets.map(entry => {
              const secret = entry.secret
              const hasValue = secret?.hasValue ?? false
              const valueHint = secret?.valueHint ?? 'Nog niet ingesteld'
              const label = secret?.label ?? entry.key
              const description = secret?.description ?? 'Configureer deze variabele in het secrets dashboard.'

              return (
                <div
                  key={entry.key}
                  style={{
                    display: 'grid',
                    gap: 6,
                    padding: '12px 14px',
                    borderRadius: 16,
                    background: '#ffffff',
                    border: `1px solid ${withOpacity(brand.colors.primary, 0.1)}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'grid', gap: 4 }}>
                      <strong style={{ fontFamily: headingFontStack }}>{label}</strong>
                      <span style={{ fontSize: '0.85rem', color: brand.colors.mutedText }}>{entry.key}</span>
                    </div>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: withOpacity(hasValue ? brand.colors.success : brand.colors.warning, 0.18),
                        color: hasValue ? brand.colors.success : brand.colors.warning,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {hasValue ? 'Geconfigureerd' : 'Ontbreekt'}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: brand.colors.mutedText }}>{description}</p>
                  {secret && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: brand.colors.mutedText, flexWrap: 'wrap', gap: 8 }}>
                      <span>Laatst gewijzigd: {formatTimestamp(secret.updatedAt)}</span>
                      <span>Waardevoorbeeld: {secret.isSensitive ? secret.valueHint ?? 'Verborgen' : valueHint}</span>
                    </div>
                  )}
                  {!secret && <span style={{ color: brand.colors.mutedText }}>Wordt toegevoegd bij de eerstvolgende synchronisatie.</span>}
                </div>
              )
            })}
          </div>
        </section>

        <section style={{ display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0, fontFamily: headingFontStack, color: brand.colors.secondary }}>SMTP status</h3>
          {renderEmailDiagnostics()}
        </section>

        <section
          style={{
            display: 'grid',
            gap: 12,
            padding: '22px 26px',
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(232, 240, 255, 0.82) 100%)',
            border: `1px solid ${withOpacity(brand.colors.secondary, 0.2)}`,
            boxShadow: brand.colors.shadow,
          }}
        >
          <h3 style={{ margin: 0, fontFamily: headingFontStack, color: brand.colors.secondary }}>Aanbevolen integratiestappen</h3>
          <ol style={{ margin: 0, paddingLeft: 20, color: brand.colors.mutedText, display: 'grid', gap: 8 }}>
            <li>
              Vul alle SMTP- en Mr. DJ-variabelen in en klik op <strong>Secrets synchroniseren</strong> om <code>.env.secrets</code> te
              genereren. Mount dit bestand als <code>.env.production</code> in de Express-host.
            </li>
            <li>
              Update het mr-djv1 project met deze waarden ({' '}
              <code>MRDJ_SERVICE_ACCOUNT_EMAIL</code>, <code>MRDJ_SERVICE_ACCOUNT_PASSWORD</code> en <code>MRDJ_WEBHOOK_SECRET</code>) en gebruik
              ze in de Express authenticatiemiddleware voor aanroepen naar RentGuy.
            </li>
            <li>
              Configureer de React frontend (.env) met <code>VITE_API_URL</code> of een gelijkwaardige variabele die verwijst naar{' '}
              <code>MRDJ_API_URL</code>. Zorg ervoor dat de mailer in mr-djv1 dezelfde SMTP-instellingen gebruikt als hierboven opgeslagen.
            </li>
            <li>
              Gebruik het webhook secret om inkomende events vanuit RentGuy te verifiëren en registreer het geheim ook in de mr-djv1
              configuratie (bijvoorbeeld <code>RENTGUY_WEBHOOK_SECRET</code>).
            </li>
            <li>
              Documenteer bij wijzigingen welke services opnieuw moeten starten. Secrets met het label <em>Herstart vereist</em> dienen na
              synchronisatie zowel op FastAPI als Express opnieuw geladen te worden.
            </li>
          </ol>
          <p style={{ margin: 0, color: brand.colors.mutedText }}>
            Zie de integratiehandleiding voor meer details over CI/CD en secret sync tussen RentGuy en mr-djv1.
          </p>
        </section>
      </div>
    )
  }

  const renderSecretManagement = () => (
    <>
      {error && (
        <div
          role="alert"
          style={{
            padding: '16px 20px',
            borderRadius: 18,
            border: `1px solid ${withOpacity(brand.colors.danger, 0.4)}`,
            background: withOpacity(brand.colors.danger, 0.08),
            color: brand.colors.danger,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {renderFeedback()}

      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: brand.colors.mutedText }}>Synchroniseer opgeslagen waarden naar het systeem.</span>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: 'none',
              background: syncing ? withOpacity(brand.colors.primary, 0.4) : brand.colors.primary,
              color: '#fff',
              fontWeight: 600,
              cursor: syncing ? 'not-allowed' : 'pointer',
              boxShadow: syncing ? 'none' : '0 12px 24px rgba(79, 70, 229, 0.24)',
              transition: 'background 0.2s ease',
            }}
          >
            {syncing ? 'Synchroniseren…' : 'Secrets synchroniseren'}
          </button>
        </div>
        {renderEmailDiagnostics()}
      </div>

      <div style={{ display: 'grid', gap: 24 }}>
        {Array.from(grouped.entries())
          .sort((a, b) => categoryWeight(a[0]) - categoryWeight(b[0]))
          .map(([category, items]) => {
            const label = categoryLabels[category] ?? categoryLabels.custom
            const sortedItems = [...items].sort((a, b) => a.label.localeCompare(b.label))
            return (
              <section key={category} style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontFamily: headingFontStack, color: brand.colors.secondary }}>{label}</h2>
                  <span style={{ color: brand.colors.mutedText }}>{sortedItems.length} variabelen</span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gap: 16,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(227, 232, 255, 0.86) 100%)',
                    borderRadius: 24,
                    padding: '18px 24px',
                    border: `1px solid ${withOpacity(brand.colors.primary, 0.18)}`,
                    boxShadow: brand.colors.shadow,
                  }}
                >
                  {sortedItems.map(item => {
                    const inputValue = formValues[item.key] ?? ''
                    const saving = savingKeys.has(item.key)
                    const placeholder = item.hasValue
                      ? item.isSensitive
                        ? item.valueHint ?? 'Waarde geconfigureerd'
                        : item.valueHint ?? 'Waarde geconfigureerd'
                      : 'Nog niet ingesteld'

                    return (
                      <div
                        key={item.key}
                        style={{
                          display: 'grid',
                          gap: 8,
                          padding: '14px 16px',
                          borderRadius: 18,
                          background: '#ffffff',
                          border: `1px solid ${withOpacity(brand.colors.primary, 0.12)}`,
                        }}
                      >
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
                          <div>
                            <strong style={{ fontFamily: headingFontStack }}>{item.label}</strong>
                            <div style={{ fontSize: '0.85rem', color: brand.colors.mutedText }}>{item.description ?? '—'}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: 999,
                                background: withOpacity(item.hasValue ? brand.colors.success : brand.colors.warning, 0.15),
                                color: item.hasValue ? brand.colors.success : brand.colors.warning,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                letterSpacing: '0.05em',
                              }}
                            >
                              {item.hasValue ? 'Geconfigureerd' : 'Ontbreekt'}
                            </span>
                            {item.requiresRestart && (
                              <span
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 999,
                                  background: withOpacity(brand.colors.secondary, 0.15),
                                  color: brand.colors.secondary,
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  letterSpacing: '0.05em',
                                }}
                              >
                                Herstart vereist
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gap: 12 }}>
                          {(() => {
                            const errorMessage = fieldErrors[item.key]
                            const successMessage = fieldSuccess[item.key]
                            const messageId = errorMessage || successMessage ? `${item.key}-message` : undefined
                            const borderColor = errorMessage
                              ? withOpacity(brand.colors.danger, 0.7)
                              : successMessage
                              ? withOpacity(brand.colors.success, 0.6)
                              : withOpacity(brand.colors.primary, 0.24)
                            return (
                              <>
                                <input
                                  type={item.isSensitive ? 'password' : 'text'}
                                  value={inputValue}
                                  placeholder={placeholder}
                                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    handleInputChange(item.key, event.target.value, item)
                                  }
                                  onBlur={() => {
                                    const nextValue = formValues[item.key] ?? ''
                                    const validation = validateSecretInput(item.key, nextValue, item)
                                    if (!validation.valid) {
                                      setFieldError(item.key, validation.message)
                                    }
                                  }}
                                  aria-invalid={Boolean(errorMessage)}
                                  aria-describedby={messageId}
                                  style={{
                                    padding: '10px 14px',
                                    borderRadius: 12,
                                    border: `1px solid ${borderColor}`,
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    boxShadow: successMessage
                                      ? `0 0 0 3px ${withOpacity(brand.colors.success, 0.18)}`
                                      : errorMessage
                                      ? `0 0 0 3px ${withOpacity(brand.colors.danger, 0.12)}`
                                      : 'none',
                                    transition: 'border 0.2s ease, box-shadow 0.2s ease',
                                  }}
                                />
                                {(errorMessage || successMessage) && (
                                  <div
                                    id={messageId}
                                    style={{
                                      fontSize: '0.85rem',
                                      color: errorMessage ? brand.colors.danger : brand.colors.success,
                                      display: 'grid',
                                      gap: 8,
                                    }}
                                  >
                                    <span>{errorMessage ?? successMessage}</span>
                                    {errorMessage && (
                                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <button
                                          type="button"
                                          onClick={() => handleResetField(item.key)}
                                          style={{
                                            padding: '6px 12px',
                                            borderRadius: 999,
                                            border: `1px solid ${withOpacity(brand.colors.danger, 0.4)}`,
                                            background: '#fff',
                                            color: brand.colors.danger,
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                          }}
                                        >
                                          Reset invoer
                                        </button>
                                        <button
                                          type="button"
                                          onClick={openRecoveryGuide}
                                          style={{
                                            padding: '6px 12px',
                                            borderRadius: 999,
                                            border: 'none',
                                            background: brand.colors.danger,
                                            color: '#fff',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                          }}
                                        >
                                          Herstelgids openen
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )
                          })()}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: brand.colors.mutedText }}>
                            <span>Laatst gewijzigd: {formatTimestamp(item.updatedAt)}</span>
                            <span>Laatste sync: {formatTimestamp(item.lastSyncedAt)}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleSave(item)}
                              disabled={saving}
                              style={{
                                padding: '8px 18px',
                                borderRadius: 999,
                                border: 'none',
                                background: saving ? withOpacity(brand.colors.primary, 0.4) : brand.colors.primary,
                                color: '#fff',
                                fontWeight: 600,
                                cursor: saving ? 'not-allowed' : 'pointer',
                                boxShadow: saving ? 'none' : '0 10px 20px rgba(79, 70, 229, 0.2)',
                                minWidth: 140,
                              }}
                            >
                              {saving ? 'Opslaan…' : 'Opslaan'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}

        <section
          id="secrets-sla-matrix"
          style={{
            display: 'grid',
            gap: 16,
            padding: '22px 26px',
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(226, 232, 255, 0.84) 100%)',
            border: `1px solid ${withOpacity(brand.colors.secondary, 0.2)}`,
            boxShadow: brand.colors.shadow,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <h3 style={{ margin: 0, fontFamily: headingFontStack, color: brand.colors.secondary }}>SLA matrix</h3>
              <p style={{ margin: 0, color: brand.colors.mutedText }}>
                Gebruik deze matrix om escalaties te verbinden aan Sevensa support en klantverwachtingen te bevestigen per pakket.
              </p>
            </div>
            <button
              type="button"
              onClick={openRecoveryGuide}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: `1px solid ${withOpacity(brand.colors.secondary, 0.4)}`,
                background: '#fff',
                color: brand.colors.secondary,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Bekijk playbook
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 540,
                fontSize: '0.9rem',
                color: brand.colors.secondary,
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.2)}` }}>Pakket</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.2)}` }}>RTO</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.2)}` }}>RPO</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.2)}` }}>Coverage</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.2)}` }}>Escalatiepad</th>
                </tr>
              </thead>
              <tbody>
                {slaMatrixRows.map(row => (
                  <tr key={row.tier}>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.12)}`, fontWeight: 600 }}>{row.tier}</td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.12)}` }}>{row.rto}</td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.12)}` }}>{row.rpo}</td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.12)}` }}>{row.coverage}</td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.12)}` }}>{row.escalation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section
          id="secrets-changelog-teaser"
          style={{
            display: 'grid',
            gap: 16,
            padding: '22px 26px',
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(226, 232, 255, 0.82) 100%)',
            border: `1px solid ${withOpacity(brand.colors.primary, 0.22)}`,
            boxShadow: brand.colors.shadow,
          }}
        >
          <div style={{ display: 'grid', gap: 6 }}>
            <h3 style={{ margin: 0, fontFamily: headingFontStack, color: brand.colors.primary }}>Release highlights</h3>
            <p style={{ margin: 0, color: brand.colors.mutedText }}>
              Deze teaser laat de laatste wijzigingen zien. De volledige changelog staat in het helpcenter en wordt gekoppeld aan het monitoringrapport.
            </p>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {changelogTeasers.map(item => (
              <article
                key={item.version}
                style={{
                  padding: '14px 16px',
                  borderRadius: 16,
                  background: '#ffffff',
                  border: `1px solid ${withOpacity(brand.colors.primary, 0.16)}`,
                  display: 'grid',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontFamily: headingFontStack, color: brand.colors.secondary }}>Versie {item.version}</strong>
                  <a
                    href={`https://github.com/crisisk/RentGuy-v1/releases/tag/${item.version}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: brand.colors.primary, fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}
                  >
                    Volledige release →
                  </a>
                </div>
                <span style={{ color: brand.colors.mutedText }}>{item.highlights}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  )

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: brand.colors.appBackground,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: brandFontStack,
          color: brand.colors.text,
        }}
      >
        <div style={{ display: 'grid', gap: 16, textAlign: 'center' }}>
          <div
            aria-hidden
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: `4px solid ${withOpacity(brand.colors.primary, 0.2)}`,
              borderTopColor: brand.colors.primary,
              animation: 'rg-spin 1s linear infinite',
              margin: '0 auto',
            }}
          />
          <span style={{ fontWeight: 600 }}>Gegevens laden…</span>
          <style>
            {`@keyframes rg-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
          </style>
        </div>
      </div>
    )
  }

  const heroFooter = (
    <FlowJourneyMap
      steps={secretsJourney}
      subtitle="Check elke stap zodat configuratie, monitoring en release readiness aantoonbaar zijn."
    />
  )

  const breadcrumbs = useMemo(() => {
    const base = [
      { id: 'home', label: 'Pilot start', href: '/' },
      { id: 'governance', label: 'Governance', href: '/dashboard' },
      { id: 'secrets', label: 'Secrets & configuratie' },
    ]
    if (activeTab === 'integration') {
      base.push({ id: 'integration', label: 'Integraties' })
    }
    return base
  }, [activeTab])

  const personaSummary = useMemo<FlowExperiencePersona>(
    () => {
      const persona: FlowExperiencePersona = {
        name: userDisplayName || 'Sevensa beheer',
        role: roleLabelMap[userRole ?? 'admin'] ?? 'Administrator',
      }
      if (userEmail) {
        persona.meta = userEmail
      }
      return persona
    },
    [userDisplayName, userEmail, userRole],
  )

  const stage = useMemo(() => {
    if (!integrationReady) {
      return {
        label: 'Integraties configureren',
        status: 'in-progress' as const,
        detail: `${missingIntegrationKeys.length} sleutel${missingIntegrationKeys.length === 1 ? '' : 's'} ontbreekt`,
      }
    }
    if (!emailDiagnostics) {
      return {
        label: 'Diagnose uitvoeren',
        status: 'in-progress' as const,
        detail: 'Voer de e-maildiagnose uit om monitoring te bevestigen.',
      }
    }
    if (emailDiagnostics.status === 'error') {
      return {
        label: 'Herstel e-mail & notificaties',
        status: 'in-progress' as const,
        detail: emailDiagnostics.message,
      }
    }
    if (emailDiagnostics.status === 'warning') {
      return {
        label: 'Controleer waarschuwingen',
        status: 'in-progress' as const,
        detail:
          emailDiagnostics.missing.length > 0
            ? `Ontbrekend: ${emailDiagnostics.missing.join(', ')}`
            : 'Controleer de logboeken voor aanvullende details.',
      }
    }
    return {
      label: 'Launch klaar',
      status: 'completed' as const,
      detail: 'Alle secrets gesynchroniseerd en e-mail diagnostics groen.',
    }
  }, [emailDiagnostics, integrationReady, missingIntegrationKeys.length])

  const statusMessage = useMemo(() => {
    if (feedback?.tone === 'error') {
      return {
        tone: 'danger' as const,
        title: 'Opslaan mislukt',
        description: feedback.message,
      }
    }
    if (error) {
      return {
        tone: 'danger' as const,
        title: 'Kon secrets niet laden',
        description: error,
      }
    }
    if (!integrationReady) {
      return {
        tone: 'warning' as const,
        title: 'Secrets ontbreken',
        description: `Vul ${missingIntegrationKeys.length} kritieke secrets in voordat je synchroniseert.`,
      }
    }
    if (emailDiagnostics?.status === 'error') {
      return {
        tone: 'danger' as const,
        title: 'E-maildiagnose gefaald',
        description: emailDiagnostics.message,
      }
    }
    if (emailDiagnostics?.status === 'warning') {
      return {
        tone: 'warning' as const,
        title: 'E-maildiagnose met waarschuwingen',
        description:
          emailDiagnostics.missing.length > 0
            ? `Ontbrekend: ${emailDiagnostics.missing.join(', ')}`
            : 'Controleer DKIM/SPF en webhookconfiguratie.',
      }
    }
    if (feedback?.tone === 'success') {
      return {
        tone: 'success' as const,
        title: 'Wijziging opgeslagen',
        description: feedback.message,
      }
    }
    return {
      tone: 'info' as const,
      title: 'Secrets gesynchroniseerd',
      description: integrationReady
        ? 'Alle integraties zijn gevuld. Voer periodiek een synchronisatie uit om tenants aligned te houden.'
        : 'Beheer secrets en integraties vanuit dit command center.',
    }
  }, [emailDiagnostics, error, feedback, integrationReady, missingIntegrationKeys.length])

  const actions = useMemo(() => {
    const items: FlowExperienceAction[] = [
      {
        id: 'sync-secrets',
        label: syncing ? 'Synchroniseren…' : 'Synchroniseer secrets',
        variant: 'primary',
        onClick: handleSync,
        icon: '🔄',
        disabled: syncing,
      },
      {
        id: 'back-planner',
        label: 'Naar planner',
        variant: 'secondary',
        href: '/planner',
        icon: '🗂️',
      },
      {
        id: 'logout',
        label: 'Uitloggen',
        variant: 'ghost',
        onClick: onLogout,
        icon: '🚪',
        testId: 'logout-button',
      },
    ]
    return items
  }, [handleSync, onLogout, syncing])

  const footerAside = useMemo(
    () => (
      <div style={{ display: 'grid', gap: 10 }}>
        <strong style={{ fontSize: '0.95rem' }}>Compliance & monitoring</strong>
        <p style={{ margin: 0, fontSize: '0.85rem', color: withOpacity('#FFFFFF', 0.82) }}>
          Houd secrets, e-mail en webhooks aantoonbaar compliant door elke deploy een diagnose en synchronisatie te loggen.
        </p>
        <div style={{ display: 'grid', gap: 6, fontSize: '0.8rem', color: withOpacity('#FFFFFF', 0.8) }}>
          <span>• Integratiecoverage: {integrationCoverage}% ({configuredIntegrations}/{integrationSecrets.length})</span>
          <span>• Node readiness: {emailDiagnostics?.nodeReady ? 'gereed' : 'actie vereist'}</span>
          <span>• Authenticatie: {emailDiagnostics?.authConfigured ? 'ingesteld' : 'niet ingesteld'}</span>
        </div>
        <a
          href={complianceUrl}
          target="_blank"
          rel="noreferrer"
          style={{ color: '#ffffff', fontWeight: 600, textDecoration: 'none' }}
        >
          Bekijk het compliance-dossier →
        </a>
      </div>
    ),
    [
      complianceUrl,
      configuredIntegrations,
      emailDiagnostics?.authConfigured,
      emailDiagnostics?.nodeReady,
      integrationCoverage,
      integrationSecrets.length,
    ],

    )

  const navigationRail = useMemo(() => {
    const roleStatus: FlowNavigationStatus = userRole && userRole !== 'pending' ? 'complete' : 'blocked'
    const plannerStatus: FlowNavigationStatus = integrationReady ? 'complete' : 'blocked'
    const emailSummary = emailDiagnostics
      ? `E-mailstatus: ${emailDiagnostics.status.toUpperCase()}`
      : 'Voer de e-maildiagnose uit om notificaties te bevestigen.'

    return {
      title: 'Pilot gebruikersflows',
      caption: 'Monitor de eindstappen voor go-live. Gebruik dit overzicht als navigatie tijdens release reviews.',
      items: createFlowNavigation(
        'secrets',
        {
          role: roleStatus,
          planner: plannerStatus,
        },
        {
          login: userEmail ? `Beheerder: ${userEmail}` : 'Actieve admin-sessie',
          role:
            roleStatus === 'complete'
              ? `Rol bevestigd (${userRole || 'admin'})`
              : 'Rol nog niet bevestigd door governance.',
          planner:
            plannerStatus === 'complete'
              ? 'Integraties gesynchroniseerd vanuit de planner flows.'
              : `Ontbrekend: ${missingIntegrationKeys.length} integratie${missingIntegrationKeys.length === 1 ? '' : 's'}.`,
          secrets: emailSummary,
        },
      ),
      footer: (
        <span>
          Combineer deze navigator met de releasechecklist zodat alle compliance-stappen aantoonbaar blijven tijdens go-live.
        </span>
      ),
    }
  }, [emailDiagnostics, integrationReady, missingIntegrationKeys.length, userEmail, userRole])

  return (

    <FlowExperienceShell
      eyebrow="Configuration command center"
      heroBadge="Compliance & integraties"
      title="Secrets & configuratie-dashboard"
      description={
        <>
          <span>Beheer alle .env-variabelen centraal en publiceer ze veilig naar de platformdiensten.</span>
          <span>Gebruik de explainers om integraties, e-mail en synchronisaties aantoonbaar gereed te houden.</span>
        </>
      }
      heroPrologue={<FlowExplainerList items={heroExplainers} minWidth={240} />}
      heroFooter={heroFooter}
      breadcrumbs={breadcrumbs}
      persona={personaSummary}
      stage={stage}
      actions={actions}
      statusMessage={statusMessage}
      footerAside={footerAside}
      navigationRail={navigationRail}
    >
      <>
        <FlowGuidancePanel
          eyebrow="Setup flows"
          title="Volg de platformconfiguratie"
          description="Deze checklist laat zien welke stappen voor secrets, integraties en e-mail nog aandacht vragen. Gebruik dit als command center zodat elk deploy-venster aantoonbaar compliant is."
          flows={flowItems}
        />

        <div
          role="tablist"
          aria-label="Secrets tabs"
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            background: withOpacity(brand.colors.primary, 0.08),
            padding: '8px 10px',
            borderRadius: 999,
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'secrets'}
            onClick={() => setActiveTab('secrets')}
            style={{
              padding: '10px 22px',
              borderRadius: 999,
              border: 'none',
              background: activeTab === 'secrets' ? brand.colors.primary : 'transparent',
              color: activeTab === 'secrets' ? '#fff' : brand.colors.primary,
              fontWeight: 600,
              cursor: activeTab === 'secrets' ? 'default' : 'pointer',
              boxShadow: activeTab === 'secrets' ? '0 10px 24px rgba(79, 70, 229, 0.24)' : 'none',
              transition: 'background 0.2s ease',
            }}
          >
            Secretbeheer
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'integration'}
            onClick={() => setActiveTab('integration')}
            style={{
              padding: '10px 22px',
              borderRadius: 999,
              border: 'none',
              background: activeTab === 'integration' ? brand.colors.secondary : 'transparent',
              color: activeTab === 'integration' ? '#fff' : brand.colors.secondary,
              fontWeight: 600,
              cursor: activeTab === 'integration' ? 'default' : 'pointer',
              boxShadow: activeTab === 'integration' ? '0 10px 24px rgba(99, 102, 241, 0.22)' : 'none',
              transition: 'background 0.2s ease',
            }}
          >
            Mr. DJ integratie
          </button>
        </div>

        {activeTab === 'integration' ? renderIntegrationTab() : renderSecretManagement()}
      </>
    </FlowExperienceShell>
  )
}
