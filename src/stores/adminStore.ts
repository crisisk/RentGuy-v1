import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  AdminDashboardSnapshot,
  AdminStatus,
  AdminUserSummary,
  AuditLogEntry,
  FeatureFlag,
  SystemSetting,
} from '@rg-types/adminTypes'

export type AdminStoreStatus = 'idle' | 'loading' | 'ready' | 'error'

interface AdminBaseState {
  status: AdminStoreStatus
  error: string | null
  settings: SystemSetting[]
  users: AdminUserSummary[]
  auditLog: AuditLogEntry[]
  featureFlags: FeatureFlag[]
  snapshot: AdminDashboardSnapshot | null
  filterStatus: AdminStatus | 'all'
}

export interface AdminStoreState extends AdminBaseState {
  load(data: Partial<Omit<AdminStoreState, 'load' | 'updateUserStatus' | 'toggleFeatureFlag' | 'setError'>>): void
  updateUserStatus(id: string, status: AdminStatus): void
  toggleFeatureFlag(key: string, enabled: boolean): void
  setError(message: string): void
}

function createInitialState(): AdminBaseState {
  return {
    status: 'idle',
    error: null,
    settings: [],
    users: [],
    auditLog: [],
    featureFlags: [],
    snapshot: null,
    filterStatus: 'all',
  }
}

export const useAdminStore = create<AdminStoreState>(
  immer((set, get) => ({
    ...createInitialState(),
    load: (data) => {
      set((draft) => {
        draft.status = data.status ?? 'ready'
        if (data.settings) draft.settings = data.settings
        if (data.users) draft.users = data.users
        if (data.auditLog) draft.auditLog = data.auditLog
        if (data.featureFlags) draft.featureFlags = data.featureFlags
        if (data.snapshot !== undefined) draft.snapshot = data.snapshot
        if (data.filterStatus) draft.filterStatus = data.filterStatus
        if (data.error !== undefined) {
          draft.error = data.error
        }
      })
    },
    updateUserStatus: (id, status) => {
      set((draft) => {
        draft.users = draft.users.map((user) => (user.id === id ? { ...user, status } : user))
      })
    },
    toggleFeatureFlag: (key, enabled) => {
      set((draft) => {
        const flag = draft.featureFlags.find((item) => item.key === key)
        if (flag) {
          flag.enabled = enabled
        } else {
          draft.featureFlags.push({ key, label: key, enabled })
        }
      })
    },
    setError: (message) => {
      const { status } = get()
      set((draft) => {
        draft.error = message
        draft.status = status === 'loading' ? 'error' : status
      })
    },
  })),
)

export function resetAdminStore(): void {
  const base = createInitialState()
  useAdminStore.setState((draft) => {
    draft.status = base.status
    draft.error = base.error
    draft.settings = base.settings
    draft.users = base.users
    draft.auditLog = base.auditLog
    draft.featureFlags = base.featureFlags
    draft.snapshot = base.snapshot
    draft.filterStatus = base.filterStatus
  })
}
