import { useState, useEffect } from 'react'
import { User, Palette, Bell, Store, Plug, Trash2, Check, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'
import './Settings.scss'

// ── Generic toggle ─────────────────────────────────────────────────────────
function Toggle({ on, onChange, id }: { on: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={on}
      className={`settings__toggle ${on ? 'settings__toggle--on' : ''}`}
      onClick={() => onChange(!on)}
    >
      <span className="settings__toggle-thumb" />
    </button>
  )
}

// ── Select wrapper ──────────────────────────────────────────────────────────
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="settings__select-wrap">
      <select className="settings__select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="settings__select-chevron" />
    </div>
  )
}

// ── Section wrapper ─────────────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="settings__section">
      <div className="settings__section-head">
        <span className="settings__section-icon">{icon}</span>
        <h2 className="settings__section-title">{title}</h2>
      </div>
      <div className="settings__section-body">{children}</div>
    </section>
  )
}

// ── Row ─────────────────────────────────────────────────────────────────────
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="settings__row">
      <div className="settings__row-label">
        <span>{label}</span>
        {hint && <span className="settings__row-hint">{hint}</span>}
      </div>
      <div className="settings__row-control">{children}</div>
    </div>
  )
}

const INTEGRATIONS = [
  { id: 'shopify', name: 'Shopify', logo: '🛍️', desc: 'Sync orders and products from your Shopify store', connected: true },
  { id: 'stripe', name: 'Stripe', logo: '💳', desc: 'Pull payment data and refund metrics from Stripe', connected: true },
  { id: 'woocommerce', name: 'WooCommerce', logo: '🛒', desc: 'Connect your WooCommerce store for unified analytics', connected: false },
  { id: 'klaviyo', name: 'Klaviyo', logo: '📧', desc: 'Link email campaigns to revenue attribution', connected: false },
]

export function Settings() {
  useEffect(() => { document.title = 'Settings — NexaMetrics' }, [])
  const { theme, toggleTheme } = useTheme()

  // Account
  const [name, setName] = useState('Nabil Amhaouch')
  const [email, setEmail] = useState('nabil@nexametrics.io')

  // Appearance
  const [density, setDensity] = useState('comfortable')
  const [language, setLanguage] = useState('en')

  // Notifications
  const [notifs, setNotifs] = useState({
    newOrders: true,
    lowStock: true,
    revenueMilestone: true,
    newCustomers: false,
    weeklyDigest: true,
  })

  // Store
  const [currency, setCurrency] = useState('USD')
  const [dateFormat, setDateFormat] = useState('MMM dd, yyyy')
  const [timezone, setTimezone] = useState('UTC')

  // Integrations
  const [integrations, setIntegrations] = useState<Record<string, boolean>>(
    Object.fromEntries(INTEGRATIONS.map((i) => [i.id, i.connected]))
  )

  const toggleNotif = (key: keyof typeof notifs) => setNotifs((n) => ({ ...n, [key]: !n[key] }))

  const handleSaveAccount = () => toast.success('Account saved')
  const handleSaveStore = () => toast.success('Store settings saved')

  const toggleIntegration = (id: string) => {
    const next = !integrations[id]
    setIntegrations((prev) => ({ ...prev, [id]: next }))
    toast(next ? `Connected to ${id}` : `Disconnected from ${id}`, { icon: next ? '🔗' : '🔌' })
  }

  return (
    <div className="settings">
      {/* ── Account ── */}
      <Section icon={<User size={16} />} title="Account">
        <Row label="Full name">
          <input
            className="settings__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Full name"
          />
        </Row>
        <Row label="Email address">
          <input
            className="settings__input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email address"
          />
        </Row>
        <Row label="Password">
          <button className="settings__btn settings__btn--ghost" onClick={() => toast('Password reset email sent', { icon: '📧' })}>
            Send reset email
          </button>
        </Row>
        <div className="settings__actions">
          <button className="settings__btn settings__btn--primary" onClick={handleSaveAccount}>
            <Check size={14} /> Save changes
          </button>
        </div>
      </Section>

      {/* ── Appearance ── */}
      <Section icon={<Palette size={16} />} title="Appearance">
        <Row label="Theme" hint="Affects all pages">
          <div className="settings__theme-btns">
            <button
              className={`settings__theme-btn ${theme === 'dark' ? 'settings__theme-btn--active' : ''}`}
              onClick={() => theme === 'light' && toggleTheme()}
              aria-pressed={theme === 'dark'}
            >
              🌙 Dark
            </button>
            <button
              className={`settings__theme-btn ${theme === 'light' ? 'settings__theme-btn--active' : ''}`}
              onClick={() => theme === 'dark' && toggleTheme()}
              aria-pressed={theme === 'light'}
            >
              ☀️ Light
            </button>
          </div>
        </Row>
        <Row label="Density" hint="Table row and card spacing">
          <Select
            value={density}
            onChange={(v) => { setDensity(v); toast(`Density set to ${v}`, { icon: '📐' }) }}
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
              { value: 'spacious', label: 'Spacious' },
            ]}
          />
        </Row>
        <Row label="Language">
          <Select
            value={language}
            onChange={(v) => { setLanguage(v); toast('Language updated') }}
            options={[
              { value: 'en', label: 'English' },
              { value: 'fr', label: 'Français' },
              { value: 'de', label: 'Deutsch' },
              { value: 'es', label: 'Español' },
            ]}
          />
        </Row>
      </Section>

      {/* ── Notifications ── */}
      <Section icon={<Bell size={16} />} title="Notifications">
        {(
          [
            ['newOrders', 'New orders', 'Alert when a new order is placed'],
            ['lowStock', 'Low stock alerts', 'Warn when inventory drops below threshold'],
            ['revenueMilestone', 'Revenue milestones', 'Notify on 25%, 50%, 75%, 100% of monthly target'],
            ['newCustomers', 'New customer signups', 'Alert on every new account registration'],
            ['weeklyDigest', 'Weekly digest email', 'Summary of key metrics every Monday morning'],
          ] as [keyof typeof notifs, string, string][]
        ).map(([key, label, hint]) => (
          <Row key={key} label={label} hint={hint}>
            <Toggle id={`notif-${key}`} on={notifs[key]} onChange={() => toggleNotif(key)} />
          </Row>
        ))}
      </Section>

      {/* ── Store settings ── */}
      <Section icon={<Store size={16} />} title="Store settings">
        <Row label="Currency">
          <Select
            value={currency}
            onChange={setCurrency}
            options={[
              { value: 'USD', label: 'USD — US Dollar' },
              { value: 'EUR', label: 'EUR — Euro' },
              { value: 'GBP', label: 'GBP — British Pound' },
              { value: 'CAD', label: 'CAD — Canadian Dollar' },
              { value: 'JPY', label: 'JPY — Japanese Yen' },
            ]}
          />
        </Row>
        <Row label="Date format">
          <Select
            value={dateFormat}
            onChange={setDateFormat}
            options={[
              { value: 'MMM dd, yyyy', label: 'Jun 10, 2026' },
              { value: 'dd/MM/yyyy', label: '10/06/2026' },
              { value: 'MM/dd/yyyy', label: '06/10/2026' },
              { value: 'yyyy-MM-dd', label: '2026-06-10' },
            ]}
          />
        </Row>
        <Row label="Timezone">
          <Select
            value={timezone}
            onChange={setTimezone}
            options={[
              { value: 'UTC', label: 'UTC' },
              { value: 'America/New_York', label: 'Eastern (UTC-5)' },
              { value: 'America/Los_Angeles', label: 'Pacific (UTC-8)' },
              { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
              { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
            ]}
          />
        </Row>
        <div className="settings__actions">
          <button className="settings__btn settings__btn--primary" onClick={handleSaveStore}>
            <Check size={14} /> Save settings
          </button>
        </div>
      </Section>

      {/* ── Integrations ── */}
      <Section icon={<Plug size={16} />} title="Integrations">
        <div className="settings__integrations">
          {INTEGRATIONS.map((intg) => (
            <div key={intg.id} className={`settings__integration ${integrations[intg.id] ? 'settings__integration--connected' : ''}`}>
              <div className="settings__integration-logo">{intg.logo}</div>
              <div className="settings__integration-info">
                <div className="settings__integration-name">{intg.name}</div>
                <div className="settings__integration-desc">{intg.desc}</div>
              </div>
              <button
                className={`settings__btn ${integrations[intg.id] ? 'settings__btn--ghost' : 'settings__btn--primary'}`}
                onClick={() => toggleIntegration(intg.id)}
              >
                {integrations[intg.id] ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Danger zone ── */}
      <Section icon={<Trash2 size={16} />} title="Danger zone">
        <Row label="Export all data" hint="Download a full JSON backup of your account">
          <button className="settings__btn settings__btn--ghost" onClick={() => toast('Preparing export…', { icon: '📦' })}>
            Export data
          </button>
        </Row>
        <Row label="Delete account" hint="Permanently removes all data — this cannot be undone">
          <button
            className="settings__btn settings__btn--danger"
            onClick={() => toast.error('For demo purposes, account deletion is disabled')}
          >
            Delete account
          </button>
        </Row>
      </Section>
    </div>
  )
}
