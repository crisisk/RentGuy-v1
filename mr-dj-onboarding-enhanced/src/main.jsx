import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { reportWebVitals } from './performance/WebVitals'
import './index.css'
import App from './App.jsx'
import { useStore } from './store'

reportWebVitals(console.log);
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App useStore={useStore} />
  </StrictMode>,
)
