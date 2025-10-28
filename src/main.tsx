import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '@ui/App'
import Scanner from '@ui/Scanner'
import { env } from '@config/env'

const container = document.querySelector<HTMLDivElement>('#root')

if (!container) {
  throw new Error('Root element with id "root" not found')
}

const RootComponent = env.isScannerMode ? Scanner : App

createRoot(container).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>,
)
