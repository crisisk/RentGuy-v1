export type UserRole = 'pending' | 'planner' | 'crew' | 'warehouse' | 'finance' | 'viewer' | 'admin'

export type SelectableRole = Exclude<UserRole, 'pending'>

export interface UserCreatePayload {
  readonly email: string
  readonly password: string
  readonly role?: UserRole
}

export interface UserLoginPayload {
  readonly email: string
  readonly password: string
}

export interface UserRoleUpdatePayload {
  readonly role: SelectableRole
}

export interface AdminUser {
  readonly id: number
  readonly email: string
  readonly role: UserRole
}

export interface AuthTokenResponse {
  readonly accessToken: string
  readonly tokenType: 'bearer'
}

export interface SSOLoginRequestPayload {
  readonly redirectUri?: string | null
  readonly returnUrl?: string | null
}

export interface SSOLoginResponsePayload {
  readonly authorizationUrl: string
  readonly state: string
  readonly codeChallenge: string
  readonly expiresIn: number
}

export interface SSOCallbackRequestPayload {
  readonly code: string
  readonly state: string
  readonly returnUrl?: string | null
}

export interface SSOCallbackResponsePayload {
  readonly sessionToken: string
  readonly redirectUrl: string
  readonly expiresIn: number
  readonly tenant: string
}

export interface RequestSample {
  readonly path: string
  readonly method: string
  readonly statusCode: number
  readonly latencyMs: number
  readonly timestamp: string
}

export interface ObservabilityStatus {
  readonly uptimeSeconds: number
  readonly uptimeHuman: string
  readonly totalRequests: number
  readonly availability: number
  readonly averageLatencyMs: number
  readonly errorCount: number
  readonly sampleSize: number
  readonly recentRequests: RequestSample[]
  readonly generatedAt: string
}
