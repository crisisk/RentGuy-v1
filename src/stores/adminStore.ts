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
  clearError: () => void
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

const useAdminStoreBase = create<AdminState>()(
  immer((set, get) => ({
    users: [],
    roles: [],
    settings: { ...defaultSettings },
    loading: false,
    error: null,

    clearError: () => {
      set((state) => {
        state.error = null
      })
    },

    loadUsers: async () => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.get(`${ADMIN_BASE_PATH}/users`)
        const users = Array.isArray(response.data)
          ? response.data.map(parseAdminUser).filter((user): user is AdminUser => Boolean(user))
          : []

        set((state) => {
          state.users = users
          state.loading = false
        })

        return users
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    fetchUsers: () => get().loadUsers(),

    createUser: async (user) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.post(`${ADMIN_BASE_PATH}/users`, user)
        const parsedUser = parseAdminUser(response.data)

        if (parsedUser) {
          set((state) => {
            const index = state.users.findIndex((existing) => existing.id === parsedUser.id)
            if (index >= 0) {
              state.users[index] = parsedUser
            } else {
              state.users.push(parsedUser)
            }
            state.loading = false
          })
        } else {
          set((state) => {
            state.loading = false
          })
        }

        return parsedUser ?? null
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },

    updateUser: async (id, userData) => {
      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        const response = await api.put(`${ADMIN_BASE_PATH}/users/${id}`, userData)
        const parsedUser = parseAdminUser(response.data)

        if (parsedUser) {
          set((state) => {
            state.users = state.users.map((user) => (user.id === parsedUser.id ? parsedUser : user))
            state.loading = false
          })
        } else {
          set((state) => {
            state.loading = false
          })
        }

        return parsedUser ?? null
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
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
        await api.delete(`${ADMIN_BASE_PATH}/users/${id}`)
        set((state) => {
          state.users = state.users.filter((user) => user.id !== id)
          state.loading = false
        })
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
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
        const response = await api.get(`${ADMIN_BASE_PATH}/roles`)
        const roles = Array.isArray(response.data)
          ? response.data.filter((role): role is string => typeof role === 'string')
          : []

        set((state) => {
          state.roles = roles
          state.loading = false
        })

        return roles
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
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
        const response = await api.get(`${ADMIN_BASE_PATH}/stats`)
        const stats = parseSystemStats(response.data)
        set((state) => {
          state.loading = false
        })
        return stats
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
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
        const response = await api.get(`${ADMIN_BASE_PATH}/activities`)
        const activities = Array.isArray(response.data)
          ? response.data
              .map(parseUserActivity)
              .filter((activity): activity is UserActivity => Boolean(activity))
          : []

        set((state) => {
          state.loading = false
        })

        return activities
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
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
        const response = await api.get(`${ADMIN_BASE_PATH}/settings`)
        const parsedSettings = parseAdminSettings(response.data)

        set((state) => {
          state.settings = parsedSettings
          state.loading = false
        })

        return parsedSettings
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
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
        const response = await api.put(`${ADMIN_BASE_PATH}/settings`, settings)
        const parsed = parseAdminSettings(response.data)

        set((state) => {
          state.settings = parsed
          state.loading = false
        })

        return parsed
      } catch (error) {
        const message = resolveError(error)
        set((state) => {
          state.error = message
          state.loading = false
        })
        throw new Error(message)
      }
    },
  })),
)

const adminStore = Object.assign(useAdminStoreBase, {
  loadUsers: () => useAdminStoreBase.getState().loadUsers(),
  fetchUsers: () => useAdminStoreBase.getState().fetchUsers(),
  createUser: (user: Partial<AdminUser>) => useAdminStoreBase.getState().createUser(user),
  updateUser: (id: string, userData: Partial<AdminUser>) =>
    useAdminStoreBase.getState().updateUser(id, userData),
  deleteUser: (id: string) => useAdminStoreBase.getState().deleteUser(id),
  fetchRoles: () => useAdminStoreBase.getState().fetchRoles(),
  getSystemStats: () => useAdminStoreBase.getState().getSystemStats(),
  getUserActivities: () => useAdminStoreBase.getState().getUserActivities(),
  getSystemSettings: () => useAdminStoreBase.getState().getSystemSettings(),
  updateSystemSettings: (settings: AdminSettings) =>
    useAdminStoreBase.getState().updateSystemSettings(settings),
  clearError: () => useAdminStoreBase.getState().clearError(),
})

export default adminStore
