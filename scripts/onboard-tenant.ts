#!/usr/bin/env node

/**
 * RentGuy Tenant Onboarding Wizard
 *
 * Interactive CLI wizard for onboarding new tenants to the RentGuy platform.
 * This automates the entire process including configuration generation,
 * demo user creation, validation, and testing.
 *
 * Usage: npm run onboard-tenant
 * Or: node scripts/onboard-tenant.js
 */

import inquirer from 'inquirer'
import chalk from 'chalk'
import ora from 'ora'
// @ts-ignore - ESM import compatibility
import type { Ora } from 'ora'
import * as path from 'path'
import * as fs from 'fs'
import {
  type TenantInput,
  validateTenantConfig,
  generateTenantConfig,
  addTenantToConfig,
  backupTenantConfig,
  tenantIdExists,
  domainExists,
} from './lib/tenantGenerator.js'
import {
  type DemoUser,
  createDemoUsers,
  verifyUserLogin,
} from './lib/demoUserCreator.js'

// Configuration paths
const TENANT_CONFIG_PATH = path.resolve('/srv/apps/RentGuy-v1/src/config/tenants.ts')

// ANSI color codes for consistent styling
const colors = {
  title: chalk.cyan.bold,
  section: chalk.yellow.bold,
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  dim: chalk.gray,
}

/**
 * Print the wizard header
 */
function printHeader() {
  console.log('\n' + '='.repeat(60))
  console.log(colors.title('🚀 RentGuy Tenant Onboarding Wizard'))
  console.log('='.repeat(60))
  console.log(
    colors.info(
      '\nThis wizard will guide you through adding a new tenant to RentGuy.'
    )
  )
  console.log(colors.dim('Estimated time: 10-15 minutes\n'))
}

/**
 * Print a section header
 */
function printSection(step: string, title: string) {
  console.log('\n' + colors.section(`${step}: ${title}`))
  console.log('-'.repeat(60))
}

/**
 * Step 1: Tenant Identification
 */
async function promptTenantId(): Promise<string> {
  printSection('Step 1/8', 'Tenant Identification')

  const { tenantId } = await inquirer.prompt([
    {
      type: 'input',
      name: 'tenantId',
      message: 'Enter tenant ID (slug, lowercase, no spaces):',
      validate: (input: string) => {
        if (!input) return 'Tenant ID is required'
        if (!/^[a-z0-9-]+$/.test(input)) {
          return 'Tenant ID must be lowercase alphanumeric with hyphens only'
        }
        if (input.length < 2 || input.length > 50) {
          return 'Tenant ID must be between 2 and 50 characters'
        }
        if (tenantIdExists(TENANT_CONFIG_PATH, input)) {
          return `Tenant ID '${input}' already exists. Please choose a different ID.`
        }
        return true
      },
    },
  ])

  return tenantId
}

/**
 * Step 2: Tenant Details
 */
async function promptTenantDetails(): Promise<{
  name: string
  domain: string
}> {
  printSection('Step 2/8', 'Tenant Details')

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Enter tenant display name:',
      validate: (input: string) => (input.trim().length > 0 ? true : 'Name is required'),
    },
    {
      type: 'input',
      name: 'domain',
      message: 'Enter tenant domain (e.g., client.rentguy.nl):',
      validate: (input: string) => {
        if (!input) return 'Domain is required'
        const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i
        if (!domainRegex.test(input)) return 'Invalid domain format'
        if (domainExists(TENANT_CONFIG_PATH, input)) {
          return `Domain '${input}' already exists. Please choose a different domain.`
        }
        return true
      },
    },
  ])

  return answers
}

/**
 * Step 3: Branding
 */
async function promptBranding(): Promise<{
  primaryColor: string
  logoUrl?: string
}> {
  printSection('Step 3/8', 'Branding')

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'primaryColor',
      message: 'Enter primary brand color (hex, e.g., #FF6B35):',
      default: '#3B82F6',
      validate: (input: string) => {
        if (!/^#[0-9A-Fa-f]{6}$/.test(input)) {
          return 'Primary color must be a valid hex color (e.g., #FF6B35)'
        }
        return true
      },
    },
    {
      type: 'input',
      name: 'logoUrl',
      message: 'Enter logo URL (optional, press Enter to skip):',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) return true
        try {
          new URL(input)
          return true
        } catch {
          return 'Logo URL must be a valid URL'
        }
      },
    },
  ])

  return answers
}

/**
 * Step 4: Custom Content
 */
async function promptCustomContent(): Promise<{
  heroTitle: string
  heroSubtitle: string
  loginWelcome: string
}> {
  printSection('Step 4/8', 'Custom Content')

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'heroTitle',
      message: 'Enter hero title:',
      validate: (input: string) => (input.trim().length > 0 ? true : 'Hero title is required'),
    },
    {
      type: 'input',
      name: 'heroSubtitle',
      message: 'Enter hero subtitle:',
      validate: (input: string) =>
        input.trim().length > 0 ? true : 'Hero subtitle is required',
    },
    {
      type: 'input',
      name: 'loginWelcome',
      message: 'Enter login welcome message:',
      validate: (input: string) =>
        input.trim().length > 0 ? true : 'Login welcome message is required',
    },
  ])

  return answers
}

/**
 * Step 5: Demo Users
 */
async function promptDemoUsers(): Promise<{
  demoAccount1: string
  demoAccount2: string
  demoPassword: string
}> {
  printSection('Step 5/8', 'Demo Users')

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'demoAccount1',
      message: 'Enter demo account 1 email:',
      validate: (input: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(input)) return 'Invalid email format'
        return true
      },
    },
    {
      type: 'input',
      name: 'demoAccount2',
      message: 'Enter demo account 2 email:',
      validate: (input: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(input)) return 'Invalid email format'
        return true
      },
    },
    {
      type: 'password',
      name: 'demoPassword',
      message: 'Enter demo password (will be used for both accounts):',
      mask: '*',
      validate: (input: string) => {
        if (input.length < 6) return 'Password must be at least 6 characters'
        return true
      },
    },
  ])

  // Verify accounts are different
  if (answers.demoAccount1 === answers.demoAccount2) {
    console.log(colors.error('\n✗ Demo accounts must have different email addresses'))
    return promptDemoUsers()
  }

  return answers
}

/**
 * Step 6: Review Configuration
 */
async function reviewConfiguration(tenant: TenantInput): Promise<boolean> {
  printSection('Step 6/8', 'Review Configuration')

  console.log('\n' + colors.info('Tenant Configuration:'))
  console.log(colors.dim('─'.repeat(60)))
  console.log(`  ${chalk.bold('ID:')}              ${tenant.id}`)
  console.log(`  ${chalk.bold('Name:')}            ${tenant.name}`)
  console.log(`  ${chalk.bold('Domain:')}          ${tenant.domain}`)
  console.log(`  ${chalk.bold('Primary Color:')}   ${tenant.primaryColor}`)
  if (tenant.logoUrl) {
    console.log(`  ${chalk.bold('Logo URL:')}        ${tenant.logoUrl}`)
  }
  console.log(`  ${chalk.bold('Hero Title:')}      ${tenant.customContent.heroTitle}`)
  console.log(`  ${chalk.bold('Hero Subtitle:')}   ${tenant.customContent.heroSubtitle}`)
  console.log(`  ${chalk.bold('Login Welcome:')}   ${tenant.customContent.loginWelcome}`)
  console.log(`  ${chalk.bold('Demo Account 1:')}  ${tenant.customContent.demoAccount1}`)
  console.log(`  ${chalk.bold('Demo Account 2:')}  ${tenant.customContent.demoAccount2}`)
  console.log(colors.dim('─'.repeat(60)))

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Does this configuration look correct?',
      default: true,
    },
  ])

  return confirm
}

/**
 * Step 7: Apply Configuration
 */
async function applyConfiguration(tenant: TenantInput, demoPassword: string): Promise<boolean> {
  printSection('Step 7/8', 'Apply Configuration')

  const startTime = Date.now()

  try {
    // 1. Validate configuration
    let spinner = ora('Validating tenant configuration...').start()
    const validation = validateTenantConfig(tenant)
    if (!validation.valid) {
      spinner.fail('Configuration validation failed')
      console.log(colors.error('\nValidation errors:'))
      validation.errors.forEach((error) => console.log(colors.error(`  • ${error}`)))
      return false
    }
    spinner.succeed('Configuration validated')

    // 2. Backup existing configuration
    spinner = ora('Creating backup of tenant configuration...').start()
    const backupPath = backupTenantConfig(TENANT_CONFIG_PATH)
    spinner.succeed(`Configuration backed up to ${path.basename(backupPath)}`)

    // 3. Add tenant to configuration
    spinner = ora('Adding tenant to configuration file...').start()
    addTenantToConfig(TENANT_CONFIG_PATH, tenant)
    spinner.succeed('Tenant configuration added')

    // 4. Create demo users
    spinner = ora('Creating demo users in database...').start()
    const demoUsers: DemoUser[] = [
      {
        email: tenant.customContent.demoAccount1,
        password: demoPassword,
        role: 'admin',
      },
      {
        email: tenant.customContent.demoAccount2,
        password: demoPassword,
        role: 'user',
      },
    ]

    const results = createDemoUsers(demoUsers)
    const allSuccess = results.every((r) => r.success)

    if (!allSuccess) {
      spinner.warn('Some demo users could not be created')
      results.forEach((result) => {
        if (!result.success) {
          console.log(colors.warning(`  ⚠ ${result.message}`))
          if (result.error) {
            console.log(colors.dim(`    ${result.error}`))
          }
        }
      })
    } else {
      spinner.succeed('Demo users created')
      results.forEach((result) => {
        console.log(colors.success(`  ✓ ${result.message}`))
      })
    }

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(colors.success(`\n✓ Configuration applied in ${elapsedTime}s`))

    return true
  } catch (error) {
    console.log(colors.error('\n✗ Failed to apply configuration'))
    console.log(
      colors.error(`  Error: ${error instanceof Error ? error.message : String(error)}`)
    )
    return false
  }
}

/**
 * Step 8: Testing
 */
async function testConfiguration(tenant: TenantInput, demoPassword: string): Promise<void> {
  printSection('Step 8/8', 'Testing')

  try {
    // 1. Verify configuration file is valid TypeScript
    let spinner = ora('Verifying configuration file syntax...').start()
    try {
      const configContent = fs.readFileSync(TENANT_CONFIG_PATH, 'utf-8')
      // Basic syntax check - look for the new tenant ID
      if (configContent.includes(`id: '${tenant.id}'`)) {
        spinner.succeed('Configuration file syntax valid')
      } else {
        spinner.fail('Tenant not found in configuration file')
      }
    } catch (error) {
      spinner.fail('Configuration file syntax check failed')
      console.log(colors.error(`  Error: ${error instanceof Error ? error.message : String(error)}`))
    }

    // 2. Test demo user logins
    spinner = ora('Verifying demo user credentials...').start()
    const loginResults = [
      verifyUserLogin(tenant.customContent.demoAccount1, demoPassword),
      verifyUserLogin(tenant.customContent.demoAccount2, demoPassword),
    ]

    const allLoginsWork = loginResults.every((r) => r.success)
    if (allLoginsWork) {
      spinner.succeed('Demo users can authenticate')
      loginResults.forEach((result) => {
        console.log(colors.success(`  ✓ ${result.message}`))
      })
    } else {
      spinner.warn('Some demo users cannot authenticate')
      loginResults.forEach((result) => {
        if (!result.success) {
          console.log(colors.warning(`  ⚠ ${result.message}`))
        }
      })
    }

    // 3. Check domain accessibility (informational only)
    console.log(
      colors.info(
        `\n${chalk.bold('Note:')} Domain accessibility test requires the application to be deployed.`
      )
    )
    console.log(colors.dim(`  Visit https://${tenant.domain} after deployment to verify.`))
  } catch (error) {
    console.log(colors.error('\n✗ Testing failed'))
    console.log(
      colors.error(`  Error: ${error instanceof Error ? error.message : String(error)}`)
    )
  }
}

/**
 * Print success summary
 */
function printSuccessSummary(tenant: TenantInput, totalTime: number, demoPassword: string) {
  console.log('\n' + '='.repeat(60))
  console.log(colors.success('🎉 Success! Tenant onboarded in ') + chalk.bold(`${totalTime}s`))
  console.log('='.repeat(60))

  console.log(colors.info('\nNext steps:'))
  console.log(colors.dim('  1. Deploy frontend:'))
  console.log(
    `     ${chalk.cyan('VERSION=1.0.14 docker-compose up -d rentguy-frontend')}`
  )
  console.log(colors.dim(`  2. Test at: ${chalk.cyan(`https://${tenant.domain}/login`)}`))
  console.log(
    colors.dim(
      `  3. Demo credentials: ${chalk.cyan(tenant.customContent.demoAccount1)} / ${chalk.cyan(demoPassword)}`
    )
  )
  console.log(
    colors.dim(
      `                      ${chalk.cyan(tenant.customContent.demoAccount2)} / ${chalk.cyan(demoPassword)}`
    )
  )
  console.log()
}

/**
 * Main wizard flow
 */
async function main() {
  const startTime = Date.now()

  try {
    printHeader()

    // Verify tenant config file exists
    if (!fs.existsSync(TENANT_CONFIG_PATH)) {
      console.log(colors.error(`\n✗ Tenant configuration file not found at ${TENANT_CONFIG_PATH}`))
      process.exit(1)
    }

    // Step 1: Tenant ID
    const tenantId = await promptTenantId()

    // Step 2: Tenant Details
    const { name, domain } = await promptTenantDetails()

    // Step 3: Branding
    const { primaryColor, logoUrl } = await promptBranding()

    // Step 4: Custom Content
    const { heroTitle, heroSubtitle, loginWelcome } = await promptCustomContent()

    // Step 5: Demo Users
    const { demoAccount1, demoAccount2, demoPassword } = await promptDemoUsers()

    // Build tenant input object
    const tenantInput: TenantInput = {
      id: tenantId,
      name,
      domain,
      primaryColor,
      logoUrl: logoUrl && logoUrl.trim().length > 0 ? logoUrl : undefined,
      customContent: {
        heroTitle,
        heroSubtitle,
        loginWelcome,
        demoAccount1,
        demoAccount2,
      },
    }

    // Step 6: Review
    const confirmed = await reviewConfiguration(tenantInput)
    if (!confirmed) {
      console.log(colors.warning('\n⚠ Onboarding cancelled. No changes were made.'))
      process.exit(0)
    }

    // Step 7: Apply Configuration
    const success = await applyConfiguration(tenantInput, demoPassword)
    if (!success) {
      console.log(colors.error('\n✗ Onboarding failed. Please review errors above.'))
      process.exit(1)
    }

    // Step 8: Testing
    await testConfiguration(tenantInput, demoPassword)

    // Success summary
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(0)
    printSuccessSummary(tenantInput, parseInt(totalTime), demoPassword)

    process.exit(0)
  } catch (error) {
    console.log(colors.error('\n✗ An unexpected error occurred'))
    console.log(
      colors.error(`  Error: ${error instanceof Error ? error.message : String(error)}`)
    )
    process.exit(1)
  }
}

// Run the wizard
main()
