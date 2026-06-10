import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, ShoppingCart, AlertTriangle, Star, TrendingUp, RefreshCw, User, Settings, LogOut, Check, Sun, Moon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSidebar } from '../../hooks/useSidebar'
import { useTheme } from '../../context/ThemeContext'
import { CommandPalette } from '../ui/CommandPalette'
import './Header.scss'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/orders': 'Orders',
  '/products': 'Products',
  '/customers': 'Customers',
  '/analytics': 'Analytics',
  '/profile': 'My Profile',
  '/settings': 'Settings',
}

interface Notification {
  id: string
  type: 'order' | 'alert' | 'vip' | 'revenue' | 'refund'
  title: string
  body: string
  time: string
  read: boolean
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'order',   title: 'New order received',     body: 'ORD-10498 · $234.50 · 2 items',         time: '2m ago',  read: false },
  { id: '2', type: 'alert',   title: 'Low stock alert',         body: 'Yoga Mat Premium — only 3 units left',  time: '14m ago', read: false },
  { id: '3', type: 'vip',    title: 'New VIP customer',         body: 'Sophia Martinez joined the Pro tier',   time: '1h ago',  read: false },
  { id: '4', type: 'revenue', title: 'Revenue milestone',       body: 'Monthly target is 87% achieved',       time: '3h ago',  read: false },
  { id: '5', type: 'refund',  title: 'Refund processed',        body: 'ORD-10441 · $189.99 refunded',         time: '5h ago',  read: true  },
]

function notifIcon(type: Notification['type']) {
  if (type === 'order')   return <ShoppingCart size={14} />
  if (type === 'alert')   return <AlertTriangle size={14} />
  if (type === 'vip')     return <Star size={14} />
  if (type === 'revenue') return <TrendingUp size={14} />
  return <RefreshCw size={14} />
}

function notifColor(type: Notification['type']) {
  if (type === 'order')   return '#7c3aed'
  if (type === 'alert')   return '#fbbf24'
  if (type === 'vip')     return '#a78bfa'
  if (type === 'revenue') return '#34d399'
  return '#f87171'
}

export function Header() {
  const { openMobile, collapsed } = useSidebar()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [clock, setClock] = useState('')
  const [commandOpen, setCommandOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'NexaMetrics'
  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setCommandOpen(true) }
      if (e.key === 'Escape') { setNotifOpen(false); setProfileOpen(false) }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const dismissNotif = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const handleProfileAction = useCallback((action: string) => {
    setProfileOpen(false)
    if (action === 'profile') { navigate('/profile') }
    else if (action === 'settings') { navigate('/settings') }
    else if (action === 'signout') {
      toast.success('Signed out successfully')
      setTimeout(() => navigate('/'), 800)
    }
  }, [navigate])

  return (
    <>
      <header className={`header ${collapsed ? 'header--collapsed' : ''}`}>
        <div className="header__left">
          <button className="header__hamburger" onClick={openMobile} aria-label="Open navigation menu">
            <Menu size={20} />
          </button>
          <h1 className="header__title">{pageTitle}</h1>
        </div>

        <div className="header__center">
          <button className="header__search" onClick={() => setCommandOpen(true)} aria-label="Search — Ctrl+K" tabIndex={0}>
            <Search size={14} className="header__search-icon" />
            <span className="header__search-placeholder">Search orders, customers, products…</span>
          </button>
        </div>

        <div className="header__right">
          <button className="header__search-mobile" onClick={() => setCommandOpen(true)} aria-label="Search">
            <Search size={18} />
          </button>
          <span className="header__clock" aria-label="Current time">{clock}</span>

          <button
            className="header__theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Notifications */}
          <div className="header__notif-wrap" ref={notifRef}>
            <button
              className={`header__bell ${notifOpen ? 'header__bell--open' : ''}`}
              onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false) }}
              aria-label={`${unreadCount} unread notifications`}
              aria-expanded={notifOpen}
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="header__bell-badge" aria-hidden="true">{unreadCount}</span>}
            </button>

            {notifOpen && (
              <div className="header__notif-dropdown" role="dialog" aria-label="Notifications">
                <div className="header__notif-header">
                  <span className="header__notif-title">Notifications</span>
                  {unreadCount > 0 && (
                    <button className="header__notif-mark-read" onClick={markAllRead}>
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="header__notif-list">
                  {notifications.length === 0 && (
                    <div className="header__notif-empty">All caught up!</div>
                  )}
                  {notifications.map((n) => (
                    <div key={n.id} className={`header__notif-item ${n.read ? 'header__notif-item--read' : ''}`}>
                      <div className="header__notif-icon" style={{ color: notifColor(n.type), background: `${notifColor(n.type)}18` }}>
                        {notifIcon(n.type)}
                      </div>
                      <div className="header__notif-content">
                        <div className="header__notif-item-title">{n.title}</div>
                        <div className="header__notif-item-body">{n.body}</div>
                        <div className="header__notif-item-time">{n.time}</div>
                      </div>
                      <button className="header__notif-dismiss" onClick={() => dismissNotif(n.id)} aria-label="Dismiss notification">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile menu */}
          <div className="header__profile-wrap" ref={profileRef}>
            <button
              className={`header__user-menu ${profileOpen ? 'header__user-menu--open' : ''}`}
              onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false) }}
              aria-label="Open user menu"
              aria-expanded={profileOpen}
            >
              <img src="/avatar.png" alt="Your avatar" className="header__avatar" />
            </button>

            {profileOpen && (
              <div className="header__profile-dropdown" role="menu">
                <div className="header__profile-info">
                  <img src="/avatar.png" alt="" className="header__profile-avatar" aria-hidden="true" />
                  <div>
                    <div className="header__profile-name">Nabil Amhaouch</div>
                    <div className="header__profile-email">nabil@nexametrics.io</div>
                  </div>
                </div>
                <div className="header__profile-divider" />
                <button className="header__profile-item" role="menuitem" onClick={() => handleProfileAction('profile')}>
                  <User size={14} /> My Profile
                </button>
                <button className="header__profile-item" role="menuitem" onClick={() => handleProfileAction('settings')}>
                  <Settings size={14} /> Settings
                </button>
                <div className="header__profile-divider" />
                <button className="header__profile-item header__profile-item--danger" role="menuitem" onClick={() => handleProfileAction('signout')}>
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <CommandPalette
        isOpen={commandOpen}
        onClose={() => { setCommandOpen(false); setSearchValue('') }}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />
    </>
  )
}
