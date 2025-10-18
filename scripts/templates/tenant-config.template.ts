/**
 * Tenant Configuration Template
 *
 * This template is used by the onboarding wizard to generate new tenant configurations.
 * Placeholders are replaced with actual values during the tenant onboarding process.
 */

export const tenantConfigTemplate = `  {
    id: '{{TENANT_ID}}',
    name: '{{TENANT_NAME}}',
    domain: '{{DOMAIN}}',
    primaryColor: '{{PRIMARY_COLOR}}',{{LOGO_URL}}
    customContent: {
      heroTitle: '{{HERO_TITLE}}',
      heroSubtitle: '{{HERO_SUBTITLE}}',
      loginWelcome: '{{LOGIN_WELCOME}}',
      demoAccount1: '{{DEMO_ACCOUNT_1}}',
      demoAccount2: '{{DEMO_ACCOUNT_2}}',
    },
  }`

/**
 * Available placeholders:
 * - {{TENANT_ID}}: Unique identifier (slug format, e.g., 'newclient')
 * - {{TENANT_NAME}}: Display name (e.g., 'New Client')
 * - {{DOMAIN}}: Tenant domain (e.g., 'newclient.rentguy.nl')
 * - {{PRIMARY_COLOR}}: Brand color in hex format (e.g., '#FF6B35')
 * - {{LOGO_URL}}: Optional logo URL (will be omitted if not provided)
 * - {{HERO_TITLE}}: Hero section title
 * - {{HERO_SUBTITLE}}: Hero section subtitle
 * - {{LOGIN_WELCOME}}: Login page welcome message
 * - {{DEMO_ACCOUNT_1}}: First demo account email
 * - {{DEMO_ACCOUNT_2}}: Second demo account email
 */
