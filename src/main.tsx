import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '../App.jsx'
import Scanner from '../scanner.jsx'
import { env } from './config/env'

const RootComponent = env.appMode === 'scanner' ? Scanner : App

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element with id "root" was not found in the document.')
}

createRoot(container).render(<RootComponent />)
