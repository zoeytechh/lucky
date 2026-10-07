import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import UpdatePrompt from './components/UpdatePrompt'
import './index.css'
import { AuthProvider } from './lib/AuthContext'
import { WalletProvider } from './lib/WalletContext'
import Draw from './pages/Draw'
import HowToPlay from './pages/HowToPlay'
import Leaderboard from './pages/Leaderboard'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Profile from './pages/Profile'
import RecentEntries from './pages/RecentEntries'
import Wallet from './pages/Wallet'
import Winners from './pages/Winners'

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/onboarding', element: <Onboarding /> },
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Draw /> },
      { path: 'how-to-play', element: <HowToPlay /> },
      { path: 'draw/recent', element: <RecentEntries /> },
      { path: 'draw/winners', element: <Winners /> },
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
        <UpdatePrompt />
      </WalletProvider>
    </AuthProvider>
  </StrictMode>,
)
