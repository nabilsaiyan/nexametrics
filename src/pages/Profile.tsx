import { useState, useEffect } from 'react'
import { Check, Zap, Crown, Building2, ChevronRight, CreditCard, Calendar, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import './Profile.scss'

type Plan = 'starter' | 'pro' | 'enterprise'

interface PlanConfig {
  id: Plan
  name: string
  price: number
  period: string
  description: string
  features: string[]
  icon: React.ReactNode
  highlight?: boolean
}

const PLANS: PlanConfig[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    period: 'month',
    description: 'Perfect for small stores getting started',
    icon: <Zap size={20} />,
    features: [
      'Up to 1,000 orders / month',
      '3 team members',
      'Basic analytics (30 days)',
      'Email support',
      'CSV export',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    period: 'month',
    description: 'For growing businesses that need more power',
    icon: <Crown size={20} />,
    highlight: true,
    features: [
      'Unlimited orders',
      '10 team members',
      'Advanced analytics (365 days)',
      'Priority support & live chat',
      'API access',
      'Custom dashboards',
      'Webhook integrations',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    period: 'month',
    description: 'Full power for large-scale operations',
    icon: <Building2 size={20} />,
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Dedicated account manager',
      'SLA 99.99% uptime',
      'SSO & custom auth',
      'On-premise option',
      'Custom contract',
    ],
  },
]

const BILLING_HISTORY = [
  { date: '2026-06-01', amount: 49, status: 'paid', invoice: 'INV-2026-06' },
  { date: '2026-05-01', amount: 49, status: 'paid', invoice: 'INV-2026-05' },
  { date: '2026-04-01', amount: 49, status: 'paid', invoice: 'INV-2026-04' },
  { date: '2026-03-01', amount: 49, status: 'paid', invoice: 'INV-2026-03' },
]

export function Profile() {
  const [currentPlan, setCurrentPlan] = useState<Plan>('pro')
  const [upgrading, setUpgrading] = useState<Plan | null>(null)

  useEffect(() => { document.title = 'My Profile — NexaMetrics' }, [])

  const handlePlanChange = (plan: Plan) => {
    if (plan === currentPlan) return
    setUpgrading(plan)
    setTimeout(() => {
      setCurrentPlan(plan)
      setUpgrading(null)
      const planConfig = PLANS.find((p) => p.id === plan)!
      toast.success(`Switched to ${planConfig.name} plan!`)
    }, 1200)
  }

  return (
    <div className="profile">
      {/* ── User info ── */}
      <section className="profile__hero">
        <div className="profile__avatar-wrap">
          <img
            src="/avatar.png"
            alt="Your avatar"
            className="profile__avatar"
          />
          <span className="profile__avatar-ring" />
        </div>
        <div className="profile__info">
          <h1 className="profile__name">Nabil Amhaouch</h1>
          <p className="profile__email">nabil@nexametrics.io</p>
          <div className="profile__meta">
            <span className="profile__badge profile__badge--plan">
              <Crown size={11} />
              Pro Plan
            </span>
            <span className="profile__badge profile__badge--since">
              <Calendar size={11} />
              Member since Jan 2025
            </span>
          </div>
        </div>
        <div className="profile__stats">
          <div className="profile__stat">
            <span className="profile__stat-value number">12,480</span>
            <span className="profile__stat-label">Total Orders</span>
          </div>
          <div className="profile__stat">
            <span className="profile__stat-value number">$1.2M</span>
            <span className="profile__stat-label">Revenue Tracked</span>
          </div>
          <div className="profile__stat">
            <span className="profile__stat-value number">18mo</span>
            <span className="profile__stat-label">Active</span>
          </div>
        </div>
      </section>

      {/* ── Plans ── */}
      <section className="profile__section">
        <div className="profile__section-header">
          <h2 className="profile__section-title">Subscription Plan</h2>
          <p className="profile__section-sub">Choose the plan that fits your business</p>
        </div>

        <div className="profile__plans">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan
            const isUpgrading = upgrading === plan.id
            return (
              <div
                key={plan.id}
                className={`profile__plan ${plan.highlight ? 'profile__plan--highlight' : ''} ${isCurrent ? 'profile__plan--current' : ''}`}
              >
                {plan.highlight && (
                  <div className="profile__plan-popular">Most Popular</div>
                )}
                {isCurrent && (
                  <div className="profile__plan-active-badge">
                    <Check size={11} /> Current Plan
                  </div>
                )}
                <div className="profile__plan-icon">{plan.icon}</div>
                <div className="profile__plan-name">{plan.name}</div>
                <div className="profile__plan-price">
                  {plan.price === 0 ? (
                    <span className="profile__plan-amount">Free</span>
                  ) : (
                    <>
                      <span className="profile__plan-currency">$</span>
                      <span className="profile__plan-amount number">{plan.price}</span>
                      <span className="profile__plan-period">/ {plan.period}</span>
                    </>
                  )}
                </div>
                <p className="profile__plan-desc">{plan.description}</p>
                <ul className="profile__plan-features">
                  {plan.features.map((f) => (
                    <li key={f} className="profile__plan-feature">
                      <Check size={13} className="profile__feature-check" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`profile__plan-btn ${isCurrent ? 'profile__plan-btn--current' : ''} ${plan.highlight && !isCurrent ? 'profile__plan-btn--highlight' : ''}`}
                  onClick={() => handlePlanChange(plan.id)}
                  disabled={isCurrent || isUpgrading !== null}
                  aria-label={isCurrent ? `Currently on ${plan.name}` : `Switch to ${plan.name}`}
                >
                  {isUpgrading ? (
                    'Processing…'
                  ) : isCurrent ? (
                    <>
                      <Check size={14} /> Active Plan
                    </>
                  ) : (
                    <>
                      {plan.price > (PLANS.find((p) => p.id === currentPlan)?.price ?? 0) ? 'Upgrade' : 'Downgrade'}
                      <ChevronRight size={14} />
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Billing ── */}
      <section className="profile__section">
        <div className="profile__section-header">
          <h2 className="profile__section-title">Billing</h2>
        </div>

        <div className="profile__billing-row">
          <div className="profile__card profile__card--billing">
            <div className="profile__card-label">
              <CreditCard size={14} /> Payment method
            </div>
            <div className="profile__card-value">
              <span className="profile__card-brand">Visa</span>
              •••• •••• •••• 4242
            </div>
            <button className="profile__card-change" onClick={() => toast('Payment method update coming soon', { icon: '💳' })}>
              Update card
            </button>
          </div>

          <div className="profile__card profile__card--billing">
            <div className="profile__card-label">
              <Calendar size={14} /> Next billing date
            </div>
            <div className="profile__card-value">July 1, 2026</div>
            <div className="profile__card-note">$49.00 will be charged</div>
          </div>

          <div className="profile__card profile__card--billing">
            <div className="profile__card-label">
              <Shield size={14} /> Security
            </div>
            <div className="profile__card-value">2FA enabled</div>
            <button className="profile__card-change" onClick={() => toast('Security settings coming soon', { icon: '🔒' })}>
              Manage
            </button>
          </div>
        </div>

        <div className="profile__billing-history">
          <div className="profile__billing-history-title">Invoice history</div>
          <table className="profile__invoice-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {BILLING_HISTORY.map((row) => (
                <tr key={row.invoice}>
                  <td className="number">{row.date}</td>
                  <td className="number">{row.invoice}</td>
                  <td className="number">${row.amount}.00</td>
                  <td>
                    <span className="profile__invoice-status">
                      <Check size={11} /> {row.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="profile__invoice-download"
                      onClick={() => toast(`Downloading ${row.invoice}…`, { icon: '📄' })}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
