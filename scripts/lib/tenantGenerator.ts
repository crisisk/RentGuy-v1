/**
 * Tenant Configuration Generator
 *
 * Utilities for generating and adding tenant configurations to the RentGuy platform.
 */

import * as fs from 'fs'
import * as path from 'path'
import { tenantConfigTemplate } from '../templates/tenant-config.template.js'

export interface TenantInput {
  id: string
  name: string
  domain: string
  primaryColor: string
  logoUrl?: string
  customContent: {
    heroTitle: string
    heroSubtitle: string
    loginWelcome: string
    demoAccount1: string
    demoAccount2: string
  }
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validates a tenant ID (slug format)
 */
function validateTenantId(id: string): string[] {
  const errors: string[] = []

  if (!id) {
    errors.push('Tenant ID is required')
    return errors
  }

  if (!/^[a-z0-9-]+$/.test(id)) {
    errors.push('Tenant ID must be lowercase alphanumeric with hyphens only')
  }

  if (id.length < 2 || id.length > 50) {
    errors.push('Tenant ID must be between 2 and 50 characters')
  }

  if (id.startsWith('-') || id.endsWith('-')) {
    errors.push('Tenant ID cannot start or end with a hyphen')
  }

  return errors
}

/**
 * Validates a domain name
 */
function validateDomain(domain: string): string[] {
  const errors: string[] = []

  if (!domain) {
    errors.push('Domain is required')
    return errors
  }

  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i
  if (!domainRegex.test(domain)) {
    errors.push('Invalid domain format')
  }

  return errors
}

/**
 * Validates a hex color code
 */
function validateHexColor(color: string): string[] {
  const errors: string[] = []

  if (!color) {
    errors.push('Primary color is required')
    return errors
  }

  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    errors.push('Primary color must be a valid hex color (e.g., #FF6B35)')
  }

  return errors
}

/**
 * Validates an email address
 */
function validateEmail(email: string): string[] {
  const errors: string[] = []

  if (!email) {
    errors.push('Email is required')
    return errors
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    errors.push(`Invalid email format: ${email}`)
  }

  return errors
}

/**
 * Validates a complete tenant configuration
 */
export function validateTenantConfig(tenant: TenantInput): ValidationResult {
  const errors: string[] = []

  // Validate ID
  errors.push(...validateTenantId(tenant.id))

  // Validate name
  if (!tenant.name || tenant.name.trim().length === 0) {
    errors.push('Tenant name is required')
  }

  // Validate domain
  errors.push(...validateDomain(tenant.domain))

  // Validate primary color
  errors.push(...validateHexColor(tenant.primaryColor))

  // Validate logo URL (if provided)
  if (tenant.logoUrl && tenant.logoUrl.trim().length > 0) {
    try {
      new URL(tenant.logoUrl)
    } catch {
      errors.push('Logo URL must be a valid URL')
    }
  }

  // Validate custom content
  if (!tenant.customContent.heroTitle || tenant.customContent.heroTitle.trim().length === 0) {
    errors.push('Hero title is required')
  }

  if (!tenant.customContent.heroSubtitle || tenant.customContent.heroSubtitle.trim().length === 0) {
    errors.push('Hero subtitle is required')
  }

  if (!tenant.customContent.loginWelcome || tenant.customContent.loginWelcome.trim().length === 0) {
    errors.push('Login welcome message is required')
  }

  // Validate demo accounts
  errors.push(...validateEmail(tenant.customContent.demoAccount1))
  errors.push(...validateEmail(tenant.customContent.demoAccount2))

  if (tenant.customContent.demoAccount1 === tenant.customContent.demoAccount2) {
    errors.push('Demo accounts must have different email addresses')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Generates tenant configuration code from input
 */
export function generateTenantConfig(input: TenantInput): string {
  let config = tenantConfigTemplate

  // Replace placeholders
  config = config.replace(/\{\{TENANT_ID\}\}/g, input.id)
  config = config.replace(/\{\{TENANT_NAME\}\}/g, input.name)
  config = config.replace(/\{\{DOMAIN\}\}/g, input.domain)
  config = config.replace(/\{\{PRIMARY_COLOR\}\}/g, input.primaryColor)

  // Handle optional logo URL
  if (input.logoUrl && input.logoUrl.trim().length > 0) {
    config = config.replace(
      /\{\{LOGO_URL\}\}/g,
      `\n    logoUrl: '${input.logoUrl}',`
    )
  } else {
    config = config.replace(/\{\{LOGO_URL\}\}/g, '')
  }

  // Replace custom content placeholders
  config = config.replace(/\{\{HERO_TITLE\}\}/g, input.customContent.heroTitle)
  config = config.replace(/\{\{HERO_SUBTITLE\}\}/g, input.customContent.heroSubtitle)
  config = config.replace(/\{\{LOGIN_WELCOME\}\}/g, input.customContent.loginWelcome)
  config = config.replace(/\{\{DEMO_ACCOUNT_1\}\}/g, input.customContent.demoAccount1)
  config = config.replace(/\{\{DEMO_ACCOUNT_2\}\}/g, input.customContent.demoAccount2)

  return config
}

/**
 * Adds a new tenant to the existing tenant configuration file
 */
export function addTenantToConfig(configPath: string, newTenant: TenantInput): void {
  // Read the current configuration file
  let content = fs.readFileSync(configPath, 'utf-8')

  // Generate the new tenant configuration
  const newTenantConfig = generateTenantConfig(newTenant)

  // Find the tenants array and add the new tenant
  // Look for the closing bracket of the tenants array
  const tenantsArrayRegex = /(const tenants: TenantConfig\[\] = \[[\s\S]*?)(\])/

  const match = content.match(tenantsArrayRegex)
  if (!match) {
    throw new Error('Could not find tenants array in configuration file')
  }

  // Insert the new tenant before the closing bracket
  const insertion = match[1] + ',\n' + newTenantConfig + '\n' + match[2]
  content = content.replace(tenantsArrayRegex, insertion)

  // Write the updated configuration back to the file
  fs.writeFileSync(configPath, content, 'utf-8')
}

/**
 * Creates a backup of the tenant configuration file
 */
export function backupTenantConfig(configPath: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = configPath.replace('.ts', `.backup-${timestamp}.ts`)

  fs.copyFileSync(configPath, backupPath)

  return backupPath
}

/**
 * Checks if a tenant ID already exists in the configuration
 */
export function tenantIdExists(configPath: string, tenantId: string): boolean {
  const content = fs.readFileSync(configPath, 'utf-8')

  // Look for tenant ID in the format: id: 'tenantId'
  const idRegex = new RegExp(`id:\\s*['"]${tenantId}['"]`, 'i')

  return idRegex.test(content)
}

/**
 * Checks if a domain already exists in the configuration
 */
export function domainExists(configPath: string, domain: string): boolean {
  const content = fs.readFileSync(configPath, 'utf-8')

  // Look for domain in the format: domain: 'example.com'
  const domainRegex = new RegExp(`domain:\\s*['"]${domain}['"]`, 'i')

  return domainRegex.test(content)
}
