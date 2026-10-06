import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './lib/AuthContext'
import { WalletProvider } from './lib/WalletContext'
import Draw from './pages/Draw'
import Leaderboard from './pages/Leaderboard'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Profile from './pages/Profile'
import Wallet from './pages/Wallet'

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/onboarding', element: <Onboarding /> },
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Draw /> },
      { path: 'wallet', element: <Wallet /> },
      { path: 'leaderboard', element: <Leaderboard /> },
      { path: 'profile', element: <Profile /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <WalletProvider>
        <RouterProvider router={router} />
      </WalletProvider>
    </AuthProvider>
  </StrictMode>,
)
