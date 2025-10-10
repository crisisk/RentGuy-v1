import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Scanner from './scanner.jsx'

const entryMode = (import.meta.env?.VITE_APP_MODE || '').toLowerCase()
const RootComponent = entryMode === 'scanner' ? Scanner : App

createRoot(document.getElementById('root')).render(<RootComponent />)
