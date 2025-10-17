// adminTypes.ts
export enum ResourceType {
  USER = 'USER',
  ROLE = 'ROLE',
  SETTING = 'SETTING',
  PERMISSION = 'PERMISSION',
  CONTENT = 'CONTENT',
  API = 'API'
}

export enum ActionType {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MANAGE = 'MANAGE'
}

export interface Permission {
  id: string;
  resource: ResourceType;
  action: ActionType;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface GeneralSettings {
  appName: string;
  timezone: string;
  maintenanceMode: boolean;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
}

export interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireSpecialChar: boolean;
    requireNumber: boolean;
  };
  twoFactorEnabled: boolean;
  loginAttemptsLimit: number;
}

export interface IntegrationSettings {
  googleAuth: {
    clientId: string;
    clientSecret: string;
    enabled: boolean;
  };
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
}

export interface Settings {
  general: GeneralSettings;
  email: EmailSettings;
  security: SecuritySettings;
  integrations: IntegrationSettings;
}

export interface BaseResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    details: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> extends BaseResponse<T[]> {
  page: number;
  limit: number;
  total: number;
}

export type UserFormData = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'permissions'> & {
  roleId: string;
  permissionIds: string[];
};

export type RoleFormData = Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'permissions'> & {
  permissionIds: string[];
};

export type PermissionFormData = Omit<Permission, 'id'>;

export type SettingsFormData = {
  general?: Partial<GeneralSettings>;
  email?: Partial<EmailSettings>;
  security?: Partial<SecuritySettings>;
  integrations?: Partial<IntegrationSettings>;
};
