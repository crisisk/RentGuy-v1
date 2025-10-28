import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
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
  legalEntity?: string
}

export interface EmailSettings {
  smtpServer?: string
  senderEmail?: string
}

export interface SecuritySettings {
  twoFactorEnabled?: 'enabled' | 'disabled'
  sessionTimeoutMinutes?: number
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
  clearError: () => void
  loadUsers: () => Promise<AdminUser[]>
  fetchUsers: () => Promise<AdminUser[]>
  createUser: (payload: Partial<AdminUser>) => Promise<AdminUser>
  updateUser: (id: string, payload: Partial<AdminUser>) => Promise<AdminUser>
  deleteUser: (id: string) => Promise<void>
  fetchRoles: () => Promise<string[]>
  getSystemStats: () => Promise<SystemStats>
  getUserActivities: () => Promise<UserActivity[]>
  getSystemSettings: () => Promise<AdminSettings>
  updateSystemSettings: (settings: AdminSettings) => Promise<AdminSettings>
}

const ADMIN_BASE_PATH = '/api/v1/admin'
const USERS_PATH = `${ADMIN_BASE_PATH}/users`
const ROLES_PATH = `${ADMIN_BASE_PATH}/roles`
const STATS_PATH = `${ADMIN_BASE_PATH}/system/stats`
const ACTIVITIES_PATH = `${ADMIN_BASE_PATH}/activity`
const SETTINGS_PATH = `${ADMIN_BASE_PATH}/settings`

const EMPTY_SETTINGS: AdminSettings = {
  general: {},
  email: {},
  security: {},
}

function resolveError(error: unknown, fallback: string): string {
  const mapped = mapUnknownToApiError(error)
  return mapped.message || fallback
}

function toStringSafe(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return fallback
}

function toNumber(value: unknown, fallback = 0): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function parseUser(payload: unknown): AdminUser | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const record = payload as Record<string, unknown>
  const id = record.id ?? record.userId
  const name = record.name ?? record.fullName
  const email = record.email ?? record.mail
  const role = record.role ?? record.permission ?? 'user'
  const createdAt = record.createdAt ?? record.created_at ?? new Date().toISOString()

  if (!id || !name || !email) {
    return null
  }

  return {
    id: toStringSafe(id),
    name: toStringSafe(name),
    email: toStringSafe(email),
    role: toStringSafe(role, 'user'),
    createdAt: new Date(createdAt as string | number | Date).toISOString(),
  }
}

function parseSystemStats(payload: unknown): SystemStats {
  if (!payload || typeof payload !== 'object') {
    return {
      totalUsers: 0,
      activeUsers: 0,
      uptimeSeconds: 0,
      memoryUsage: 0,
    }
  }

  const record = payload as Record<string, unknown>

  return {
    totalUsers: toNumber(record.totalUsers ?? record.total_users),
    activeUsers: toNumber(record.activeUsers ?? record.active_users),
    uptimeSeconds: toNumber(record.uptimeSeconds ?? record.server_uptime ?? 0),
    memoryUsage: toNumber(record.memoryUsage ?? record.memory_usage ?? 0),
  }
}

function parseActivity(payload: unknown): UserActivity | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const record = payload as Record<string, unknown>
  const id = record.id ?? record.activityId ?? crypto.randomUUID?.() ?? `${Date.now()}`
  const username = record.username ?? record.user ?? record.userName
  const lastLogin = record.lastLogin ?? record.last_login ?? new Date().toISOString()
  const loginCount = record.loginCount ?? record.login_count ?? 0

  if (!username) {
    return null
  }

  return {
    id: toStringSafe(id),
    username: toStringSafe(username, 'Onbekend'),
    lastLogin: new Date(lastLogin as string | number | Date).toISOString(),
    loginCount: toNumber(loginCount),
  }
}

function mergeSettings(payload: unknown): AdminSettings {
  if (!payload || typeof payload !== 'object') {
    return EMPTY_SETTINGS
  }

  const record = payload as Record<string, unknown>

  const general: GeneralSettings = {}
  const generalSource = (record.general as Record<string, unknown>) ?? {}
  const generalName = toStringSafe(generalSource.systemName ?? record.systemName)
  if (generalName) {
    general.systemName = generalName
  }
  const generalEntity = toStringSafe(generalSource.legalEntity ?? record.legalEntity)
  if (generalEntity) {
    general.legalEntity = generalEntity
  }

  const email: EmailSettings = {}
  const emailSource = (record.email as Record<string, unknown>) ?? {}
  const smtpServer = toStringSafe(emailSource.smtpServer ?? record.smtpServer)
  if (smtpServer) {
    email.smtpServer = smtpServer
  }
  const sender = toStringSafe(emailSource.senderEmail ?? record.senderEmail)
  if (sender) {
    email.senderEmail = sender
  }

  const security: SecuritySettings = {}
  const securitySource = (record.security as Record<string, unknown>) ?? {}
  const twoFactor = securitySource.twoFactorEnabled ?? record.twoFactorEnabled
  if (twoFactor === 'enabled' || twoFactor === 'disabled') {
    security.twoFactorEnabled = twoFactor
  }
  const timeoutRaw = securitySource.sessionTimeoutMinutes ?? record.sessionTimeoutMinutes
  const timeoutValue = toNumber(timeoutRaw, Number.NaN)
  if (Number.isFinite(timeoutValue)) {
    security.sessionTimeoutMinutes = timeoutValue
  }

  return {
    general,
    email,
    security,
  }
}

export const useAdminStore = create<AdminState>()(
  immer((set, get) => ({
    users: [],
    roles: [],
    settings: EMPTY_SETTINGS,
    loading: false,
    error: null,

    clearError: () => {
      set((state) => {
        state.error = null
      })
    },

    loadUsers: async () => {
      const { users } = get()
      if (users.length > 0) {
        return users
      }
      return get().fetchUsers()
    },

    fetchUsers: async () => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(USERS_PATH)
        const users = Array.isArray(response.data)
          ? response.data.map(parseUser).filter((user): user is AdminUser => Boolean(user))
          : []

        set((state) => {
          state.users = users
          state.loading = false
        })

        return users
      } catch (error) {
        const message = resolveError(error, 'Kon gebruikers niet ophalen')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    createUser: async (payload) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.post(USERS_PATH, payload)
        const user = parseUser(response.data ?? payload)
        if (!user) {
          throw new Error('Onbekend gebruikersantwoord ontvangen')
        }

        set((state) => {
          state.users.push(user)
          state.loading = false
        })

        return user
      } catch (error) {
        const message = resolveError(error, 'Kon gebruiker niet aanmaken')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    updateUser: async (id, payload) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.put(`${USERS_PATH}/${id}`, payload)
        const updated = parseUser({ ...payload, ...response.data, id })
        if (!updated) {
          throw new Error('Onbekend gebruikersantwoord ontvangen')
        }

        set((state) => {
          const index = state.users.findIndex((user) => user.id === id)
          if (index >= 0) {
            state.users[index] = updated
          } else {
            state.users.push(updated)
          }
          state.loading = false
        })

        return updated
      } catch (error) {
        const message = resolveError(error, 'Kon gebruiker niet bijwerken')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    deleteUser: async (id) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        await api.delete(`${USERS_PATH}/${id}`)
        set((state) => {
          state.users = state.users.filter((user) => user.id !== id)
          state.loading = false
        })
      } catch (error) {
        const message = resolveError(error, 'Kon gebruiker niet verwijderen')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    fetchRoles: async () => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(ROLES_PATH)
        const roles = Array.isArray(response.data)
          ? response.data.filter((role): role is string => typeof role === 'string')
          : []

        set((state) => {
          state.roles = roles
          state.loading = false
        })

        return roles
      } catch (error) {
        const message = resolveError(error, 'Kon rollen niet ophalen')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    getSystemStats: async () => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(STATS_PATH)
        const stats = parseSystemStats(response.data)

        set((state) => {
          state.loading = false
        })

        return stats
      } catch (error) {
        const message = resolveError(error, 'Kon systeemsstatistieken niet ophalen')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    getUserActivities: async () => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(ACTIVITIES_PATH)
        const activities = Array.isArray(response.data)
          ? response.data
              .map(parseActivity)
              .filter((activity): activity is UserActivity => Boolean(activity))
          : []

        set((state) => {
          state.loading = false
        })

        return activities
      } catch (error) {
        const message = resolveError(error, 'Kon gebruikersactiviteit niet ophalen')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    getSystemSettings: async () => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(SETTINGS_PATH)
        const settings = mergeSettings(response.data)

        set((state) => {
          state.settings = settings
          state.loading = false
        })

        return settings
      } catch (error) {
        const message = resolveError(error, 'Kon systeeminstellingen niet ophalen')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },

    updateSystemSettings: async (settings) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.put(SETTINGS_PATH, settings)
        const merged = mergeSettings({ ...settings, ...response.data })

        set((state) => {
          state.settings = merged
          state.loading = false
        })

        return merged
      } catch (error) {
        const message = resolveError(error, 'Kon systeeminstellingen niet bijwerken')
        set((state) => {
          state.loading = false
          state.error = message
        })
        throw new Error(message)
      }
    },
  })),
)

const adminStore = Object.assign(useAdminStore, {
  loadUsers: () => useAdminStore.getState().loadUsers(),
  fetchUsers: () => useAdminStore.getState().fetchUsers(),
  createUser: (payload: Partial<AdminUser>) => useAdminStore.getState().createUser(payload),
  updateUser: (id: string, payload: Partial<AdminUser>) =>
    useAdminStore.getState().updateUser(id, payload),
  deleteUser: (id: string) => useAdminStore.getState().deleteUser(id),
  fetchRoles: () => useAdminStore.getState().fetchRoles(),
  getSystemStats: () => useAdminStore.getState().getSystemStats(),
  getUserActivities: () => useAdminStore.getState().getUserActivities(),
  getSystemSettings: () => useAdminStore.getState().getSystemSettings(),
  updateSystemSettings: (settings: AdminSettings) =>
    useAdminStore.getState().updateSystemSettings(settings),
  clearError: () => useAdminStore.getState().clearError(),
})

export default adminStore
