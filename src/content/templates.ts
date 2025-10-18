/**
 * Content Templates for RentGuy
 * Based on AI-powered content analysis and recommendations
 * Source: /reports/CONTENT_IMPROVEMENT_RECOMMENDATIONS.md
 */

export type Language = 'nl' | 'en'

export interface ContentMetadata {
  readonly original: string
  readonly improved: string
  readonly score: {
    readonly original: number
    readonly improved: number
  }
  readonly issues: readonly string[]
  readonly improvements: readonly string[]
}

export interface ContentTemplate {
  readonly id: string
  readonly category: 'hero' | 'credentials' | 'journey' | 'flow' | 'general'
  readonly nl: string
  readonly en: string
  readonly variables: readonly string[]
  readonly metadata: ContentMetadata
}

/**
 * All content templates with AI-recommended improvements
 * Each template includes variables for tenant-specific customization
 */
export const contentTemplates: readonly ContentTemplate[] = [
  {
    id: 'hero.cobranding',
    category: 'hero',
    nl: 'Uw merkidentiteit en platformbeheer zijn naadloos geïntegreerd.',
    en: 'Your brand identity and platform management are seamlessly integrated.',
    variables: [],
    metadata: {
      original: 'Het Mister DJ merk en Sevensa governance lopen synchroon. Zo ziet Bart precies dezelfde flows als tijdens UAT.',
      improved: 'Uw merkidentiteit en platformbeheer zijn naadloos geïntegreerd.',
      score: {
        original: 4.8,
        improved: 8.5,
      },
      issues: [
        'Hard-coded company names (not reusable)',
        'Internal reference ("Bart")',
        'Jargon ("UAT", "flows")',
        'No clear user benefit',
      ],
      improvements: [
        'Tenant-agnostic ("Uw merkidentiteit" instead of company names)',
        'Clearer benefit (seamless integration)',
        'Professional tone',
        'Removed jargon while keeping clarity',
      ],
    },
  },
  {
    id: 'hero.audit',
    category: 'hero',
    nl: 'Volledige audittrail van alle loginactiviteit.',
    en: 'Complete audit trail of all login activity.',
    variables: [],
    metadata: {
      original: 'Elke login triggert audit events en dashboards. Gebruik de demo om de monitoring- en rollbackscenario\'s te verifiëren.',
      improved: 'Volledige audittrail van alle loginactiviteit.',
      score: {
        original: 6.3,
        improved: 8.7,
      },
      issues: [
        'Anglicism ("triggert")',
        'Technical jargon ("rollbackscenario\'s")',
        'Unclear benefit',
        'Weak call-to-action',
      ],
      improvements: [
        'Natural Dutch ("audittrail" is accepted B2B term)',
        'Clear benefit (full audit trail)',
        'Better CTA ("Test" instead of "Gebruik")',
        '"herstelfuncties" instead of technical "rollback"',
      ],
    },
  },
  {
    id: 'credentials.operations',
    category: 'credentials',
    nl: 'Operations Manager - Volledige toegang tot planning, teammanagement en onboarding.',
    en: 'Operations Manager - Full access to planning, team management, and onboarding.',
    variables: [],
    metadata: {
      original: 'Bart · Operations - Compleet planner-, crew- en onboardingdomein voor de Mister DJ pilot.',
      improved: 'Operations Manager - Volledige toegang tot planning, teammanagement en onboarding.',
      score: {
        original: 5.5,
        improved: 8.3,
      },
      issues: [
        'Hard-coded name ("Bart")',
        'Company-specific ("Mister DJ pilot")',
        'Unclear scope ("domein")',
        'Wordiness',
      ],
      improvements: [
        'Tenant-agnostic (role-based instead of name-based)',
        'Clear scope (specific features listed)',
        'Concise and professional',
        'Reusable across tenants',
      ],
    },
  },
  {
    id: 'journey.login',
    category: 'journey',
    nl: 'Log in met een demo-account of uw SSO-credentials om het platform te verkennen.',
    en: 'Log in with a demo account or your SSO credentials to explore the platform.',
    variables: [],
    metadata: {
      original: 'Gebruik de demo-accounts of je Sevensa SSO om toegang te krijgen tot de pilot.',
      improved: 'Log in met een demo-account of uw SSO-credentials om het platform te verkennen.',
      score: {
        original: 6.0,
        improved: 8.6,
      },
      issues: [
        'Hard-coded company name ("Sevensa SSO")',
        'Informal tone ("je")',
        'Technical term without context ("pilot")',
      ],
      improvements: [
        'Tenant-agnostic ("uw SSO" instead of company name)',
        'Professional tone ("uw" instead of "je")',
        'Clear action ("verkennen" instead of vague "toegang krijgen")',
        'Removed unnecessary "pilot" reference',
      ],
    },
  },
  {
    id: 'flow.role',
    category: 'flow',
    nl: 'Selecteer uw rol om relevante hulp en dashboards te activeren.',
    en: 'Select your role to activate relevant help and dashboards.',
    variables: [],
    metadata: {
      original: 'Kies de persona zodat explainers en dashboards klaarstaan.',
      improved: 'Selecteer uw rol om relevante hulp en dashboards te activeren.',
      score: {
        original: 6.5,
        improved: 8.4,
      },
      issues: [
        'Technical jargon ("persona")',
        'Vague benefit ("klaarstaan")',
        'Passive voice',
      ],
      improvements: [
        'Clearer language ("rol" instead of "persona")',
        'Active benefit ("activeren" instead of "klaarstaan")',
        'Professional tone',
        'Explains the why (relevante hulp)',
      ],
    },
  },
] as const

/**
 * Template lookup by ID
 */
export const templateMap = new Map<string, ContentTemplate>(
  contentTemplates.map((template) => [template.id, template])
)

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: ContentTemplate['category']
): readonly ContentTemplate[] {
  return contentTemplates.filter((template) => template.category === category)
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ContentTemplate | undefined {
  return templateMap.get(id)
}

/**
 * Get all template IDs
 */
export function getAllTemplateIds(): readonly string[] {
  return contentTemplates.map((template) => template.id)
}

/**
 * Type-safe template ID
 */
export type TemplateId = typeof contentTemplates[number]['id']
