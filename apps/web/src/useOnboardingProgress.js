import { useEffect, useMemo, useRef, useState } from 'react'
import { getSteps, getProgress, completeStep } from './onbApi.js'

export const STATUS = { LOADING: 'loading', READY: 'ready', EMPTY: 'empty', ERROR: 'error' }

const toCompletedSet = list =>
  new Set(
    Array.isArray(list)
      ? list.filter(item => item.status === 'complete').map(item => item.step_code)
      : [],
  )

const personaStepTemplates = {
  cfo: [
    {
      code: 'finance-cockpit',
      title: 'Finance cockpit activeren',
      description: 'Koppel facturatie, cashflow en marge KPI\'s zodat dashboards realtime vullen.',
    },
    {
      code: 'finance-kpis',
      title: 'Configureer cashflow KPI\'s',
      description: 'Selecteer DSO, marge en forecast rapporten voor wekelijkse executive updates.',
    },
    {
      code: 'finance-audit',
      title: 'Audit logging veiligstellen',
      description: 'Plan export van journaallijnen en stel budget alerts in voor afwijkingen.',
    },
  ],
  compliance: [
    {
      code: 'compliance-psra',
      title: 'PSRA veiligheidsdossier uploaden',
      description: 'Upload vergunningen, risico-analyses en veiligheidsplannen voor goedkeuring.',
    },
    {
      code: 'compliance-access',
      title: 'Toegangsrechten controleren',
      description: 'Bevestig MFA voor kritieke rollen en documenteer bewijs voor audits.',
    },
    {
      code: 'compliance-trace',
      title: 'Audit trail activeren',
      description: 'Activeer logboek export naar compliance-archief met dagelijkse snapshots.',
    },
  ],
  general: [
    {
      code: 'kickoff-overview',
      title: 'Kick-off met je projectteam',
      description: 'Verifieer contactpersonen, SLA\'s en eventkalender voor het komende kwartaal.',
    },
    {
      code: 'invite-team',
      title: 'Team uitnodigen en rollen toewijzen',
      description: 'Activeer operations, finance en sales accounts inclusief toegangsrechten.',
    },
    {
      code: 'import-inventory',
      title: 'Voorraad importeren',
      description: 'Upload gear- en transportinventaris zodat planners direct kunnen reserveren.',
    },
    {
      code: 'connect-datasets',
      title: 'Databronnen koppelen',
      description: 'Koppel ERP/CRM en laad voorbeelddata om dashboards te vullen.',
    },
    {
      code: 'plan-first-event',
      title: 'Plan eerste live event',
      description: 'Maak draaiboek, crewplanning en transport voor een proefevent.',
    },
    {
      code: 'launch-communications',
      title: 'Communicatiesjablonen activeren',
      description: 'Zorg dat stakeholders automatische updates en rapportages ontvangen.',
    },
  ],
}

function detectPersona(email) {
  if (!email) return 'general'
  const userKey = String(email).split('@')[0]?.toLowerCase() || ''
  if (/finance|cfo|treasury|rentguy/.test(userKey)) return 'cfo'
  if (/psra|compliance|safety|audit/.test(userKey)) return 'compliance'
  return 'general'
}

function isAbortError(error) {
  if (!error) return false
  return error.name === 'AbortError' || error.code === 'ERR_CANCELED'
}

function formatLoadError(error) {
  if (!error) return ''
  const status = error?.response?.status
  const detail = error?.response?.data?.detail
  if (status && detail) return `status ${status}: ${detail}`
  if (status) return `status ${status}`
  if (typeof error?.message === 'string' && error.message.trim()) return error.message
  if (typeof error === 'string' && error.trim()) return error.trim()
  return ''
}

function formatErrorMessage(error) {
  if (!error) return 'Onbekende fout. Probeer het later opnieuw.'
  if (error?.response?.data?.detail) return error.response.data.detail
  if (typeof error?.message === 'string' && error.message.trim()) return error.message
  return 'De onboarding kon niet geladen worden. Controleer je verbinding en probeer opnieuw.'
}

export function useOnboardingProgress(email) {
  const [steps, setSteps] = useState([])
  const [done, setDone] = useState(() => new Set())
  const [status, setStatus] = useState(STATUS.LOADING)
  const [errorMessage, setErrorMessage] = useState('')
  const [marking, setMarking] = useState({})
  const [canRetry, setCanRetry] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const persona = useMemo(() => detectPersona(email), [email])
  const hasLoadedRef = useRef(false)

  const fallbackSteps = useMemo(() => personaStepTemplates[persona] || personaStepTemplates.general, [persona])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setStatus(STATUS.LOADING)
    setErrorMessage('')
    setCanRetry(false)

    Promise.allSettled([
      getSteps({ signal: controller.signal }),
      getProgress(email, { signal: controller.signal }),
    ])
      .then(results => {
        if (!active) return

        const [stepsResult, progressResult] = results
        const rejected = results.filter(
          result => result.status === 'rejected' && !isAbortError(result.reason),
        )
        const hadError = rejected.length > 0

        const stepsData =
          stepsResult.status === 'fulfilled' && Array.isArray(stepsResult.value)
            ? stepsResult.value
            : []
        const progressData =
          progressResult.status === 'fulfilled' ? progressResult.value : []

        const usedFallbackSteps = stepsData.length === 0
        const finalSteps = usedFallbackSteps ? fallbackSteps : stepsData

        setSteps(finalSteps)
        setDone(toCompletedSet(progressData))
        hasLoadedRef.current = finalSteps.length > 0
        setStatus(finalSteps.length ? STATUS.READY : STATUS.EMPTY)

        if (hadError) {
          const detail = formatLoadError(rejected[0]?.reason)
          const baseMessage =
            'Onboarding data kan niet geladen worden. Probeer het later opnieuw of contacteer Sevensa support.'
          setErrorMessage(detail ? `${baseMessage} (${detail})` : baseMessage)
          setCanRetry(true)
        } else if (usedFallbackSteps) {
          setErrorMessage(
            'Live onboardingdata is tijdelijk niet beschikbaar. Controleer je dashboards voordat je live gaat en probeer het opnieuw.',
          )
          setCanRetry(true)
        } else {
          setErrorMessage('')
          setCanRetry(false)
        }
      })
      .catch(() => {
        // no-op: individual promises handled in allSettled branch
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [email, reloadToken, fallbackSteps])

  async function mark(step) {
    if (!step?.code) return
    setMarking(prev => {
      if (prev[step.code]) return prev
      return { ...prev, [step.code]: true }
    })
    setErrorMessage('')

    try {
      await completeStep(email, step.code)
      const updated = await getProgress(email)
      setDone(toCompletedSet(updated))
    } catch (error) {
      setErrorMessage(formatErrorMessage(error))
      setCanRetry(true)
    } finally {
      setMarking(prev => {
        const { [step.code]: _ignored, ...rest } = prev
        return rest
      })
    }
  }

  return {
    steps,
    done,
    status,
    errorMessage,
    marking,
    persona,
    canRetry,
    progress: steps.length ? Math.round((done.size / steps.length) * 100) : 0,
    mark,
    retry: () => setReloadToken(token => token + 1),
  }
}
