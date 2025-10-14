import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '../App.jsx'
import Scanner from '../scanner.jsx'
import { loadClientEnv } from './config/client'

const { isScannerMode } = loadClientEnv()
const RootComponent = isScannerMode ? Scanner : App

createRoot(document.getElementById('root')).render(<RootComponent />)
