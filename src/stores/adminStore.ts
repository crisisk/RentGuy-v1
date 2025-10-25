import { create } from 'zustand'
import { produce } from 'immer'
import { api } from '@infra/http/api'
import { mapUnknownToApiError } from '@errors'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export interface SystemStats {
  totalUsers: number
  activeUsers: number
  uptimeSeconds: number
  memoryUsage: number
}

export interface UserActivity {
  id: string
  username: string
  lastLogin: string
  loginCount: number
}

export interface GeneralSettings {
  systemName?: string
}

export interface EmailSettings {
  smtpServer?: string
}

export interface SecuritySettings {
  twoFactorEnabled?: 'enabled' | 'disabled'
}

export interface AdminSettings {
  general: GeneralSettings
  email: EmailSettings
  security: SecuritySettings
}

interface AdminState {
  users: AdminUser[]
  roles: string[]
  settings: AdminSettings
  loading: boolean
  error: string | null
  loadUsers: () => Promise<AdminUser[]>
  fetchUsers: () => Promise<AdminUser[]>
  createUser: (user: Partial<AdminUser>) => Promise<AdminUser | null>
  updateUser: (id: string, userData: Partial<AdminUser>) => Promise<AdminUser | null>
  deleteUser: (id: string) => Promise<void>
  fetchRoles: () => Promise<string[]>
  getSystemStats: () => Promise<SystemStats>
  getUserActivities: () => Promise<UserActivity[]>
  getSystemSettings: () => Promise<AdminSettings>
  updateSystemSettings: (settings: AdminSettings) => Promise<AdminSettings>
}

const ADMIN_BASE_PATH = '/api/v1/admin'

function resolveError(error: unknown): string {
  return mapUnknownToApiError(error).message
}

const defaultSettings: AdminSettings = {
  general: {},
  email: {},
  security: {},
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function parseAdminUser(data: unknown): AdminUser | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const record = data as Record<string, unknown>
  const idCandidate = record.id ?? record.userId
  const createdAtCandidate = record.createdAt ?? record.created_at

  if (!idCandidate || (!isString(idCandidate) && typeof idCandidate !== 'number')) {
    return null
  }

  if (!isString(record.name) || !isString(record.email) || !isString(record.role)) {
    return null
  }

  if (!createdAtCandidate || !isString(createdAtCandidate)) {
    return null
  }

  return {
    id: String(idCandidate),
    name: record.name,
    email: record.email,
    role: record.role,
    createdAt: createdAtCandidate,
  }
}

function parseSystemStats(data: unknown): SystemStats {
  if (!data || typeof data !== 'object') {
    return {
      totalUsers: 0,
      activeUsers: 0,
      uptimeSeconds: 0,
      memoryUsage: 0,
    }
  }

  const record = data as Record<string, unknown>

  return {
    totalUsers: toFiniteNumber(record.totalUsers),
    activeUsers: toFiniteNumber(record.activeUsers),
    uptimeSeconds: toFiniteNumber(record.uptimeSeconds ?? record.serverUptime),
    memoryUsage: toFiniteNumber(record.memoryUsage),
  }
}

function parseUserActivity(data: unknown): UserActivity | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const record = data as Record<string, unknown>
  const idCandidate = record.id ?? record.activityId
  const usernameCandidate = record.username ?? record.userName
  const lastLoginCandidate = record.lastLogin ?? record.last_login
  const loginCountCandidate = record.loginCount ?? record.login_count

  if (!idCandidate || (!isString(idCandidate) && typeof idCandidate !== 'number')) {
    return null
  }

  if (!isString(usernameCandidate) || !isString(lastLoginCandidate)) {
    return null
  }

  const loginCount = toFiniteNumber(loginCountCandidate, -1)
  if (loginCount < 0) {
    return null
  }

  return {
    id: String(idCandidate),
    username: usernameCandidate,
    lastLogin: lastLoginCandidate,
    loginCount,
  }
}

function parseAdminSettings(data: unknown): AdminSettings {
  if (!data || typeof data !== 'object') {
    return { ...defaultSettings }
  }

  const record = data as Record<string, unknown>
  const settings: AdminSettings = {
    general: {},
    email: {},
    security: {},
  }

  const general = record.general
  if (general && typeof general === 'object') {
    const generalRecord = general as Record<string, unknown>
    if (isString(generalRecord.systemName)) {
      settings.general.systemName = generalRecord.systemName
    }
  }

  const email = record.email
  if (email && typeof email === 'object') {
    const emailRecord = email as Record<string, unknown>
    if (isString(emailRecord.smtpServer)) {
      settings.email.smtpServer = emailRecord.smtpServer
    }
  }

  const security = record.security
  if (security && typeof security === 'object') {
    const securityRecord = security as Record<string, unknown>
    const twoFactorRaw = securityRecord.twoFactorEnabled ?? securityRecord.two_factor_enabled

    if (typeof twoFactorRaw === 'boolean') {
      settings.security.twoFactorEnabled = twoFactorRaw ? 'enabled' : 'disabled'
    } else if (isString(twoFactorRaw)) {
      if (twoFactorRaw === 'enabled' || twoFactorRaw === 'disabled') {
        settings.security.twoFactorEnabled = twoFactorRaw
      } else if (twoFactorRaw === 'true') {
        settings.security.twoFactorEnabled = 'enabled'
      } else if (twoFactorRaw === 'false') {
        settings.security.twoFactorEnabled = 'disabled'
      }
    }
  }

  return settings
}

export const adminStore = create<AdminState>((set) => {
  const setLoading = (loading: boolean) => {
    set(
      produce((state: AdminState) => {
        state.loading = loading
      }),
    )
  }

  const setError = (message: string | null) => {
    set(
      produce((state: AdminState) => {
        state.error = message
      }),
    )
  }

  const loadUsers = async (): Promise<AdminUser[]> => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`${ADMIN_BASE_PATH}/users`)
      const users = Array.isArray(response.data)
        ? response.data.map(parseAdminUser).filter((user): user is AdminUser => Boolean(user))
        : []

      set(
        produce((state: AdminState) => {
          state.users = users
        }),
      )

      return users
    } catch (error: unknown) {
      const message = resolveError(error)
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const getSystemStats = async (): Promise<SystemStats> => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`${ADMIN_BASE_PATH}/stats`)
      const stats = parseSystemStats(response.data)
      return stats
    } catch (error: unknown) {
      const message = resolveError(error)
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const getUserActivities = async (): Promise<UserActivity[]> => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`${ADMIN_BASE_PATH}/activities`)
      const activities = Array.isArray(response.data)
        ? response.data
            .map(parseUserActivity)
            .filter((activity): activity is UserActivity => Boolean(activity))
        : []

      return activities
    } catch (error: unknown) {
      const message = resolveError(error)
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const getSystemSettings = async (): Promise<AdminSettings> => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`${ADMIN_BASE_PATH}/settings`)
      const parsedSettings = parseAdminSettings(response.data)

      set(
        produce((state: AdminState) => {
          state.settings = parsedSettings
        }),
      )

      return parsedSettings
    } catch (error: unknown) {
      const message = resolveError(error)
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const updateSystemSettings = async (settings: AdminSettings): Promise<AdminSettings> => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.patch(`${ADMIN_BASE_PATH}/settings`, settings)
      const parsedSettings = parseAdminSettings(response.data ?? settings)

      set(
        produce((state: AdminState) => {
          state.settings = parsedSettings
        }),
      )

      return parsedSettings
    } catch (error: unknown) {
      const message = resolveError(error)
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  return {
    users: [],
    roles: [],
    settings: { ...defaultSettings },
    loading: false,
    error: null,
    loadUsers,
    fetchUsers: loadUsers,
    createUser: async (user) => {
      setLoading(true)
      setError(null)
      try {
        const response = await api.post(`${ADMIN_BASE_PATH}/users`, user)
        const parsedUser = parseAdminUser(response.data)

        if (parsedUser) {
          set(
            produce((state: AdminState) => {
              const existingIndex = state.users.findIndex(
                (existing) => existing.id === parsedUser.id,
              )
              if (existingIndex >= 0) {
                state.users[existingIndex] = parsedUser
              } else {
                state.users.push(parsedUser)
              }
            }),
          )
        }

        return parsedUser ?? null
      } catch (error: unknown) {
        const message = resolveError(error)
        setError(message)
        throw new Error(message)
      } finally {
        setLoading(false)
      }
    },
    updateUser: async (id, userData) => {
      setLoading(true)
      setError(null)
      try {
        const response = await api.put(`${ADMIN_BASE_PATH}/users/${id}`, userData)
        const parsedUser = parseAdminUser(response.data)

        if (parsedUser) {
          set(
            produce((state: AdminState) => {
              state.users = state.users.map((user) =>
                user.id === parsedUser.id ? parsedUser : user,
              )
            }),
          )
        }

        return parsedUser ?? null
      } catch (error: unknown) {
        const message = resolveError(error)
        setError(message)
        throw new Error(message)
      } finally {
        setLoading(false)
      }
    },
    deleteUser: async (id) => {
      setLoading(true)
      setError(null)
      try {
        await api.delete(`${ADMIN_BASE_PATH}/users/${id}`)
        set(
          produce((state: AdminState) => {
            state.users = state.users.filter((user) => user.id !== id)
          }),
        )
      } catch (error: unknown) {
        const message = resolveError(error)
        setError(message)
        throw new Error(message)
      } finally {
        setLoading(false)
      }
    },
    fetchRoles: async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await api.get(`${ADMIN_BASE_PATH}/roles`)
        const roles = Array.isArray(response.data)
          ? response.data.filter((role): role is string => typeof role === 'string')
          : []

        set(
          produce((state: AdminState) => {
            state.roles = roles
          }),
        )

        return roles
      } catch (error: unknown) {
        const message = resolveError(error)
        setError(message)
        throw new Error(message)
      } finally {
        setLoading(false)
      }
    },
    getSystemStats,
    getUserActivities,
    getSystemSettings,
    updateSystemSettings,
  }
})

export default adminStore
