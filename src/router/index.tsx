import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Dashboard } from '../pages/Dashboard'
import { Orders } from '../pages/Orders'
import { Products } from '../pages/Products'
import { Customers } from '../pages/Customers'
import { Analytics } from '../pages/Analytics'
import { Profile } from '../pages/Profile'
import { Settings } from '../pages/Settings'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'orders', element: <Orders /> },
      { path: 'products', element: <Products /> },
      { path: 'customers', element: <Customers /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'profile', element: <Profile /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])
