import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import SplashLoader from './components/SplashLoader'
import UpdatePrompt from './components/UpdatePrompt'
import './index.css'
import { AuthProvider } from './lib/AuthContext'
import { WalletProvider } from './lib/WalletContext'
import Draw from './pages/Draw'
import Login from './pages/Login'

// Draw and Login are eager — they're the near-universal first thing
// every visitor hits (the index route, and the unauthenticated
// redirect target), so lazy-loading them would only add a pointless
// flicker for the common case instead of saving anything. Everything
// else here is a page most visitors won't touch on a given session
// (Admin especially — three accounts, ever) or only once (Onboarding),
// so there's no reason for every visitor's first bundle to carry them.
const Onboarding = lazy(() => import('./pages/Onboarding'))
const HowToPlay = lazy(() => import('./pages/HowToPlay'))
const RecentEntries = lazy(() => import('./pages/RecentEntries'))
const Comments = lazy(() => import('./pages/Comments'))
const Winners = lazy(() => import('./pages/Winners'))
const Wallet = lazy(() => import('./pages/Wallet'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const Profile = lazy(() => import('./pages/Profile'))
const Support = lazy(() => import('./pages/Support'))
const Admin = lazy(() => import('./pages/Admin'))

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
      { path: 'draw/comments', element: <Comments /> },
      { path: 'draw/winners', element: <Winners /> },
      { path: 'wallet', element: <Wallet /> },
      { path: 'leaderboard', element: <Leaderboard /> },
      { path: 'profile', element: <Profile /> },
      { path: 'support', element: <Support /> },
      { path: 'admin', element: <Admin /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <WalletProvider>
        <Suspense fallback={<SplashLoader />}>
          <RouterProvider router={router} />
        </Suspense>
        <UpdatePrompt />
      </WalletProvider>
    </AuthProvider>
  </StrictMode>,
)
