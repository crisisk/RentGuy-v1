import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuthUser } from '@application/auth/api'
import { AppRoutes, type NavigateFunction } from './routes'

function ensureLeadingSlash(path: string): string {
  if (!path) {
    return '/'
  }
  return path.startsWith('/') ? path : `/${path}`
}

function normaliseBasename(basename: string | undefined): string {
  if (!basename) {
    return ''
  }
  if (basename === '/') {
    return ''
  }
  const trimmed = basename.trim().replace(/\/$/, '')
  if (!trimmed) {
    return ''
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function stripBasename(path: string, basename: string): string {
  if (!basename) {
    return ensureLeadingSlash(path)
  }
  if (!path.startsWith(basename)) {
    return ensureLeadingSlash(path)
  }
  const stripped = path.slice(basename.length)
  return stripped ? ensureLeadingSlash(stripped) : '/'
}

function joinBasename(path: string, basename: string): string {
  if (!basename) {
    return ensureLeadingSlash(path)
  }
  const normalised = ensureLeadingSlash(path)
  if (normalised === '/') {
    return basename || '/'
  }
  return `${basename}${normalised}`
}

function useBrowserLocation(basename: string): [string, NavigateFunction] {
  const getPath = useCallback(() => {
    if (typeof window === 'undefined') {
      return '/'
    }
    const pathname = window.location.pathname || '/'
    return stripBasename(pathname, basename)
  }, [basename])

  const [currentPath, setCurrentPath] = useState<string>(() => getPath())

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const handler = () => {
      setCurrentPath(getPath())
    }
    window.addEventListener('popstate', handler)
    return () => {
      window.removeEventListener('popstate', handler)
    }
  }, [getPath])

  const navigate = useCallback<NavigateFunction>(
    (path, options = {}) => {
      const target = ensureLeadingSlash(path)
      if (typeof window === 'undefined') {
        setCurrentPath(target)
        return
      }
      const nextUrl = joinBasename(target, basename)
      if (options.replace) {
        window.history.replaceState({}, '', nextUrl)
      } else {
        window.history.pushState({}, '', nextUrl)
      }
      setCurrentPath(target)
    },
    [basename],
  )

  return [currentPath, navigate]
}

export interface AppRouterProps {
  readonly isAuthenticated: boolean
  readonly onLogin: (token: string, user: AuthUser) => void
  readonly onLogout: () => void
  readonly basename?: string
}

export function AppRouter({ isAuthenticated, onLogin, onLogout, basename = '' }: AppRouterProps): JSX.Element {
  const normalisedBase = useMemo(() => normaliseBasename(basename), [basename])
  const [currentPath, navigate] = useBrowserLocation(normalisedBase)

  return (
    <AppRoutes
      currentPath={currentPath}
      navigate={navigate}
      isAuthenticated={isAuthenticated}
      onLogin={onLogin}
      onLogout={onLogout}
    />
  )
}

export default AppRouter
