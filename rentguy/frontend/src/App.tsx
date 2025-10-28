import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'

const LoadingFallback = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontSize: '1rem',
      color: '#6B7280',
    }}
  >
    Loading...
  </div>
)

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}

export default App
