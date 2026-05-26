import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
} from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ScrollToTop } from './ScrollToTop'
import { useSidebar } from '../../hooks/useSidebar'
import './Layout.scss'
import { NavLink } from 'react-router-dom'

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

const BOTTOM_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

function PageContent() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        variants={PAGE_VARIANTS}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="layout__content"
      >
        <Outlet />
      </motion.main>
    </AnimatePresence>
  )
}

function BottomNav() {
  const location = useLocation()
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {BOTTOM_NAV.map(({ to, label, icon: Icon }) => {
        const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
        return (
          <NavLink
            key={to}
            to={to}
            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
            aria-label={label}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export function Layout() {
  const { collapsed } = useSidebar()

  return (
    <div className="layout">
      <ScrollToTop />
      <Sidebar />
      <Header />
      <div className={`layout__body ${collapsed ? 'layout__body--collapsed' : ''}`}>
        <PageContent />
      </div>
      <BottomNav />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-text)',
            border: '1px solid var(--toast-border)',
            borderRadius: '8px',
            fontSize: '0.875rem',
          },
          duration: 3000,
        }}
      />
    </div>
  )
}
