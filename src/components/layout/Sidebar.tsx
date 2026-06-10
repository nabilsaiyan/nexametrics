import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  ChevronLeft,
  Settings,
  X,
  UserCircle,
} from 'lucide-react'
import { useSidebar } from '../../hooks/useSidebar'
import './Sidebar.scss'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/profile', label: 'My Profile', icon: UserCircle },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function NexaLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="3" y="16" width="5" height="9" rx="2" fill="#a78bfa" />
      <rect x="11.5" y="10" width="5" height="15" rx="2" fill="#7c3aed" />
      <rect x="20" y="4" width="5" height="21" rx="2" fill="#a78bfa" />
      <polyline
        points="5.5,16 14,10 22.5,4"
        stroke="#7c3aed"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  )
}

export function Sidebar() {
  const { collapsed, mobileOpen, toggleCollapsed, closeMobile } = useSidebar()
  const location = useLocation()

  const handleBackdropClick = () => closeMobile()

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={handleBackdropClick} aria-hidden="true" />
      )}
      <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`}>
        <div className="sidebar__header">
          <Link to="/" className="sidebar__logo" aria-label="NexaMetrics — go to dashboard" onClick={mobileOpen ? closeMobile : undefined}>
            <div className="sidebar__logo-mark" aria-hidden="true">
              <NexaLogo size={28} />
            </div>
            {(!collapsed || mobileOpen) && <span className="sidebar__logo-text">NexaMetrics</span>}
          </Link>
          {mobileOpen && (
            <button
              className="sidebar__close-btn"
              onClick={closeMobile}
              aria-label="Close navigation menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="sidebar__nav" aria-label="Main navigation">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
                onClick={mobileOpen ? closeMobile : undefined}
                aria-label={collapsed ? label : undefined}
                title={collapsed ? label : undefined}
              >
                <span className="sidebar__nav-icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                {(!collapsed || mobileOpen) && <span className="sidebar__nav-label">{label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {!mobileOpen && (
          <button
            className="sidebar__toggle"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft size={15} className={`sidebar__collapse-icon ${collapsed ? 'sidebar__collapse-icon--rotated' : ''}`} />
            {!collapsed && <span className="sidebar__toggle-label">Collapse</span>}
          </button>
        )}

        <div className="sidebar__footer">
          <Link to="/profile" className="sidebar__user" onClick={mobileOpen ? closeMobile : undefined} aria-label="My profile">
            <img
              src="/avatar.png"
              alt="User avatar"
              className="sidebar__user-avatar"
            />
            {(!collapsed || mobileOpen) && (
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">Nabil Amhaouch</span>
                <span className="sidebar__user-plan">Pro Plan</span>
              </div>
            )}
          </Link>
        </div>
      </aside>
    </>
  )
}
