import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '@ui/App'
import Scanner from '@ui/Scanner.jsx'
import { env } from '@config/env'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root element with id "root" not found')
}

const RootComponent = env.isScannerMode ? Scanner : App

createRoot(container).render(<RootComponent />)
