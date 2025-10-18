import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '@ui/App'
import Scanner from '@ui/Scanner'
import { env } from '@config/env'
import { preloadAllTenantContent } from '@config/tenants'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root element with id "root" not found')
}

const RootComponent = env.isScannerMode ? Scanner : App

// Preload CMS content for all tenants (async, non-blocking)
preloadAllTenantContent().catch((error) => {
  console.warn('Failed to preload CMS content:', error)
})

createRoot(container).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
)
