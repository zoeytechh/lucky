import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import Draw from './pages/Draw'
import Leaderboard from './pages/Leaderboard'
import Login from './pages/Login'
import Wallet from './pages/Wallet'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Draw /> },
      { path: 'wallet', element: <Wallet /> },
      { path: 'leaderboard', element: <Leaderboard /> },
      { path: 'login', element: <Login /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
