import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Re-fetch on window focus so data stays fresh when the user tabs back
      refetchOnWindowFocus: true,
      // Stale after 30 s → next focus / mount triggers a background refetch
      staleTime: 30_000,
      // Surface network errors after 2 retries
      retry: 2,
    },
  },
})



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
