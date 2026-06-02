import { useEffect } from 'react'
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from 'recharts'
import { useApi } from '../hooks/useApi'
import type { MonthlyMetric, DailyMetric } from '../data/types'
import './Analytics.scss'

const CATEGORY_COLORS: Record<string, string> = {
  Electronics: '#8b5cf6', Fashion: '#a78bfa', Home: '#34d399',
  Sports: '#f59e0b', Beauty: '#ef4444', Food: '#60a5fa',
}

const PM_COLORS = ['#8b5cf6', '#a78bfa', '#34d399', '#f59e0b']
const PM_LABELS = ['Card', 'PayPal', 'Crypto', 'Bank']
const PM_VALUES = [52, 28, 12, 8]

const FUNNEL_STAGES = [
  { label: 'Visitors', pct: 100, count: 48200 },
  { label: 'Add to Cart', pct: 38, count: 18316 },
  { label: 'Checkout', pct: 22, count: 10604 },
  { label: 'Purchased', pct: 14, count: 6748 },
]

const TOOLTIP_STYLE = {
  background: 'var(--chart-tooltip-bg)',
  border: '1px solid var(--chart-tooltip-border)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtCurrency(v: unknown): string { return `$${Number(v).toLocaleString()}` }
function fmtPct(v: unknown): string { return `${Number(v)}%` }
function fmtHourLabel(v: unknown): string { return `${String(Number(v)).padStart(2, '0')}:00` }
function fmtKAxis(v: unknown): string { return `$${(Number(v) / 1000).toFixed(0)}k` }
function renderPieLabel({ name, value }: PieLabelRenderProps): string { return `${name ?? ''} ${value ?? ''}%` }

function ChartCard({ title, children, fullWidth = false }: { title: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={`analytics__card ${fullWidth ? 'analytics__card--full' : ''}`}>
      <h2 className="analytics__card-title">{title}</h2>
      {children}
    </div>
  )
}

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div style={{ height, background: 'linear-gradient(90deg,var(--shimmer-from) 0%,var(--shimmer-shine) 50%,var(--shimmer-from) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 8 }} aria-hidden="true" />
  )
}

export function Analytics() {
  useEffect(() => { document.title = 'Analytics — NexaMetrics' }, [])

  const { data: monthlyRaw, loading: monthlyLoading } = useApi<MonthlyMetric[]>('/api/metrics/monthly')
  const { data: dowData, loading: dowLoading } = useApi<Array<{ day: string; orders: number }>>('/api/orders/by-day')
  const { data: hourData, loading: hourLoading } = useApi<Array<{ hour: number; orders: number }>>('/api/orders/by-hour')
  const { data: categoryRevenue, loading: catLoading } = useApi<Record<string, number>>('/api/products/revenue-by-category')
  const { data: countryData, loading: countryLoading } = useApi<Array<{ country: string; orders: number; revenue: number }>>('/api/orders/by-country')
  const { data: dailyRaw } = useApi<DailyMetric[]>('/api/metrics/daily?days=365')

  const revenueData = (monthlyRaw ?? []).map((m) => ({
    month: m.month,
    'This Year': Math.round(m.revenue),
    'Last Year': Math.round(m.revenueLastYear),
  }))

  const categoryData = Object.entries(categoryRevenue ?? {})
    .map(([name, value]) => ({ name, revenue: Math.round(value) }))
    .sort((a, b) => b.revenue - a.revenue)

  const newCustomersData = (dailyRaw ?? []).reduce<Array<{ month: string; customers: number }>>((acc, d) => {
    const month = d.date.slice(0, 7)
    const existing = acc.find((x) => x.month === month)
    if (existing) existing.customers += d.newCustomers
    else acc.push({ month: d.date.slice(5, 7) + '/' + d.date.slice(2, 4), customers: d.newCustomers })
    return acc
  }, []).slice(-12)

  const maxHourOrders = Math.max(...(hourData ?? []).map((h) => h.orders), 1)

  const pmData = PM_LABELS.map((l, i) => ({ name: l, value: PM_VALUES[i]! }))
  const countryChart = (countryData ?? []).map((c) => ({ country: c.country, revenue: Math.round(c.revenue) }))

  return (
    <div className="analytics">
      <ChartCard title="Revenue Trend — This Year vs Last Year" fullWidth>
        {monthlyLoading ? <ChartSkeleton height={260} /> : (
          <div aria-label="Revenue comparison area chart">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="thisYearGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lastYearGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#3e4a66', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#3e4a66', fontSize: 11, fontFamily: 'Inconsolata' }} axisLine={false} tickLine={false} tickFormatter={fmtKAxis} width={46} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: 'var(--chart-tooltip-label)' }} itemStyle={{ color: 'var(--chart-tooltip-value)' }} formatter={fmtCurrency} />
                <Legend formatter={(value) => <span style={{ color: 'var(--chart-axis-label)', fontSize: '0.75rem' }}>{value}</span>} />
                <Area type="monotone" dataKey="This Year" stroke="#8b5cf6" strokeWidth={2} fill="url(#thisYearGrad)" isAnimationActive animationDuration={700} />
                <Area type="monotone" dataKey="Last Year" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 3" fill="url(#lastYearGrad)" isAnimationActive animationDuration={700} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <div className="analytics__grid-2">
        <ChartCard title="Orders by Day of Week">
          {dowLoading ? <ChartSkeleton /> : (
            <div aria-label="Orders by day of week bar chart">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dowData ?? []} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.05)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#3e4a66', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#3e4a66', fontSize: 11, fontFamily: 'Inconsolata' }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: 'var(--chart-tooltip-label)' }} itemStyle={{ color: 'var(--chart-tooltip-value)' }} />
                  <Bar dataKey="orders" fill="#8b5cf6" fillOpacity={0.7} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={700} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Orders by Hour of Day">
          {hourLoading ? <ChartSkeleton /> : (
            <div aria-label="Orders by hour bar chart">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hourData ?? []} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.05)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: '#3e4a66', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis tick={{ fill: '#3e4a66', fontSize: 11, fontFamily: 'Inconsolata' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: 'var(--chart-tooltip-label)' }} itemStyle={{ color: 'var(--chart-tooltip-value)' }} labelFormatter={fmtHourLabel} />
                  <Bar dataKey="orders" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={700}>
                    {(hourData ?? []).map((d, i) => (
                      <Cell key={i} fill={d.orders >= maxHourOrders * 0.75 ? '#f59e0b' : '#8b5cf6'} fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Revenue by Category">
          {catLoading ? <ChartSkeleton /> : (
            <div aria-label="Revenue by category horizontal bar chart">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 72 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#3e4a66', fontSize: 11, fontFamily: 'Inconsolata' }} axisLine={false} tickLine={false} tickFormatter={fmtKAxis} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#7d8aa8', fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: 'var(--chart-tooltip-label)' }} itemStyle={{ color: 'var(--chart-tooltip-value)' }} formatter={fmtCurrency} />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={700}>
                    {categoryData.map((d) => <Cell key={d.name} fill={CATEGORY_COLORS[d.name] ?? '#8b5cf6'} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="New Customers per Month">
          <div aria-label="New customers line chart">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={newCustomersData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#3e4a66', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#3e4a66', fontSize: 11, fontFamily: 'Inconsolata' }} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: 'var(--chart-tooltip-label)' }} itemStyle={{ color: 'var(--chart-tooltip-value)' }} />
                <Line type="monotone" dataKey="customers" stroke="#34d399" strokeWidth={2} dot={{ fill: '#34d399', r: 3 }} isAnimationActive animationDuration={700} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="analytics__grid-funnel">
        <ChartCard title="Conversion Funnel">
          <div className="analytics__funnel" aria-label="Conversion funnel">
            {FUNNEL_STAGES.map((stage, i) => (
              <div key={stage.label} className="analytics__funnel-step">
                <div className="analytics__funnel-bar" style={{ width: `${stage.pct}%`, opacity: 0.85 - i * 0.12 }} aria-label={`${stage.label}: ${stage.pct}%`}>
                  <span className="analytics__funnel-label">{stage.label}</span>
                  <span className="analytics__funnel-pct number">{stage.pct}%</span>
                </div>
                <div className="analytics__funnel-meta">
                  <span className="number">{stage.count.toLocaleString()}</span>
                  {i > 0 && <span className="analytics__funnel-drop">↓ {(100 - Math.round((stage.pct / FUNNEL_STAGES[i - 1]!.pct) * 100))}% drop</span>}
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <div className="analytics__grid-pm-country">
          <ChartCard title="Payment Methods">
            <div aria-label="Payment methods pie chart">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pmData} cx="50%" cy="50%" outerRadius={70} dataKey="value" isAnimationActive animationDuration={700} label={renderPieLabel} labelLine={false}>
                    {pmData.map((_, i) => <Cell key={i} fill={PM_COLORS[i % PM_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={fmtPct} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Top Countries by Revenue">
            {countryLoading ? <ChartSkeleton height={220} /> : (
              <div aria-label="Top countries bar chart">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={countryChart} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 90 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#3e4a66', fontSize: 10, fontFamily: 'Inconsolata' }} axisLine={false} tickLine={false} tickFormatter={fmtKAxis} />
                    <YAxis type="category" dataKey="country" tick={{ fill: '#7d8aa8', fontSize: 10 }} axisLine={false} tickLine={false} width={88} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={fmtCurrency} />
                    <Bar dataKey="revenue" fill="#8b5cf6" fillOpacity={0.65} radius={[0, 4, 4, 0]} isAnimationActive animationDuration={700} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
