import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react'

export interface NavigateOptions {
  readonly replace?: boolean
}

export interface Location {
  readonly pathname: string
}

export interface RouteObject {
  readonly path: string
  readonly element: ReactNode
  readonly match?: (pathname: string) => boolean
}

export interface Router {
  readonly routes: RouteObject[]
  readonly basename: string
}

interface RouterContextValue {
  readonly location: Location
  readonly navigate: (to: string, options?: NavigateOptions) => void
  readonly routes: RouteObject[]
  readonly basename: string
}

interface RouterProviderProps {
  readonly router: Router
}

interface NavigateProps {
  readonly to: string
  readonly replace?: boolean
}

const RouterContext = createContext<RouterContextValue | null>(null)

function ensureLeadingSlash(path: string): string {
  if (!path) {
    return '/'
  }
  return path.startsWith('/') ? path : `/${path}`
}

function normaliseBasename(basename: string | undefined): string {
  if (!basename || basename === '/') {
    return ''
  }
  const trimmed = basename.trim().replace(/\/$/, '')
  if (!trimmed) {
    return ''
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function normalisePath(path: string): string {
  if (!path) {
    return '/'
  }
  const trimmed = ensureLeadingSlash(path.trim())
  return trimmed.length > 1 && trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
}

function stripBasename(pathname: string, basename: string): string {
  if (!basename) {
    return normalisePath(pathname)
  }
  if (!pathname.startsWith(basename)) {
    return normalisePath(pathname)
  }
  const stripped = pathname.slice(basename.length)
  return normalisePath(stripped)
}

function joinBasename(path: string, basename: string): string {
  if (!basename) {
    return normalisePath(path)
  }
  const normalised = normalisePath(path)
  if (normalised === '/') {
    return basename || '/'
  }
  return `${basename}${normalised}`
}

function resolveInitialPath(basename: string): string {
  if (typeof window === 'undefined') {
    return '/'
  }
  const current = window.location.pathname || '/'
  return stripBasename(current, basename)
}

function renderRoute(routes: RouteObject[], pathname: string): ReactNode {
  const normalisedPath = normalisePath(pathname)
  let fallback: RouteObject | null = null
  for (const route of routes) {
    if (route.path === '*') {
      fallback = route
      continue
    }
    if (route.match) {
      if (route.match(normalisedPath)) {
        return route.element
      }
      continue
    }
    if (normalisePath(route.path) === normalisedPath) {
      return route.element
    }
  }
  return fallback?.element ?? null
}

export function createBrowserRouter(
  routes: RouteObject[],
  options: { basename?: string } = {},
): Router {
  return {
    routes,
    basename: normaliseBasename(options.basename),
  }
}

export function RouterProvider({ router }: RouterProviderProps): JSX.Element {
  const { routes, basename } = router
  const [pathname, setPathname] = useState<string>(() => resolveInitialPath(basename))

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const handler = () => {
      setPathname(resolveInitialPath(basename))
    }
    window.addEventListener('popstate', handler)
    return () => {
      window.removeEventListener('popstate', handler)
    }
  }, [basename])

  const navigate = useCallback<RouterContextValue['navigate']>(
    (to, options = {}) => {
      const target = normalisePath(to)
      const fullPath = joinBasename(target, basename)
      if (typeof window === 'undefined') {
        setPathname(target)
        return
      }
      if (options.replace) {
        window.history.replaceState({}, '', fullPath)
      } else {
        window.history.pushState({}, '', fullPath)
      }
      setPathname(target)
    },
    [basename],
  )

  const location = useMemo<Location>(() => ({ pathname }), [pathname])

  const contextValue = useMemo<RouterContextValue>(
    () => ({ location, navigate, routes, basename }),
    [location, navigate, routes, basename],
  )

  const element = useMemo(() => renderRoute(routes, pathname), [routes, pathname])

  return <RouterContext.Provider value={contextValue}>{element}</RouterContext.Provider>
}

export function useNavigate(): RouterContextValue['navigate'] {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('useNavigate must be used within a RouterProvider')
  }
  return context.navigate
}

export function useLocation(): Location {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('useLocation must be used within a RouterProvider')
  }
  return context.location
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  const location = useLocation()
  const pathname = location.pathname

  // Simple extraction from pathname - assumes format like /resource/:id
  const segments = pathname.split('/').filter(Boolean)
  const params: Record<string, string> = {}

  if (segments.length > 1) {
    params.id = segments[segments.length - 1]
  }

  return params as T
}

export function Navigate({ to, replace = false }: NavigateProps): null {
  const navigate = useNavigate()
  useEffect(() => {
    navigate(to, { replace })
  }, [navigate, to, replace])
  return null
}

export function Outlet(): null {
  return null
}

export interface LinkProps {
  readonly to: string
  readonly children?: ReactNode
  readonly replace?: boolean
  readonly className?: string
  readonly style?: CSSProperties
}

export function Link({ to, children, replace = false, className, style }: LinkProps): JSX.Element {
  const navigate = useNavigate()
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      navigate(to, { replace })
    },
    [navigate, to, replace],
  )

  return (
    <a href={to} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  )
}
