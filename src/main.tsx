import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '../App.jsx'
import Scanner from '../scanner.jsx'
import { env } from './config/env'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root element with id "root" not found')
}

const RootComponent = env.isScannerMode ? Scanner : App

createRoot(container).render(<RootComponent />)
