import { useEffect, useRef, useState } from 'react'
import { getSteps, getProgress, completeStep } from './onbApi.js'

export const STATUS = { LOADING: 'loading', READY: 'ready', EMPTY: 'empty', ERROR: 'error' }

const toCompletedSet = list =>
  new Set(
    Array.isArray(list)
      ? list.filter(item => item.status === 'complete').map(item => item.step_code)
      : [],
  )

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
  const [reloadToken, setReloadToken] = useState(0)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setStatus(STATUS.LOADING)
    setErrorMessage('')

    Promise.all([getSteps({ signal: controller.signal }), getProgress(email, { signal: controller.signal })])
      .then(([stepsResponse, progressResponse]) => {
        if (!active) return
        const normalizedSteps = Array.isArray(stepsResponse) ? stepsResponse : []
        const completedCodes = toCompletedSet(progressResponse)

        setSteps(normalizedSteps)
        setDone(completedCodes)
        hasLoadedRef.current = normalizedSteps.length > 0
        setStatus(normalizedSteps.length ? STATUS.READY : STATUS.EMPTY)
      })
      .catch(error => {
        if (!active) return
        setErrorMessage(formatErrorMessage(error))
        setStatus(hasLoadedRef.current ? STATUS.READY : STATUS.ERROR)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [email, reloadToken])

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
    progress: steps.length ? Math.round((done.size / steps.length) * 100) : 0,
    mark,
    retry: () => setReloadToken(token => token + 1),
  }
}
