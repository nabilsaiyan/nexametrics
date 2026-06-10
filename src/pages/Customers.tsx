import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Users, Eye, Search } from 'lucide-react'
import { format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { Customer, CustomerSegment, CustomerStatus, Order } from '../data/types'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { KpiCard } from '../components/ui/KpiCard'
import { SlidePanel } from '../components/ui/SlidePanel'
import { useApi } from '../hooks/useApi'
import { useDebounce } from '../hooks/useDebounce'
import './Customers.scss'

const STATUS_CONFIG: Record<CustomerStatus, { variant: 'green' | 'purple' | 'muted'; label: string }> = {
  active: { variant: 'green', label: 'Active' },
  vip: { variant: 'purple', label: 'VIP' },
  inactive: { variant: 'muted', label: 'Inactive' },
}

const SEGMENT_CONFIG: Record<CustomerSegment, { variant: 'cyan' | 'blue' | 'amber' | 'red'; label: string }> = {
  new: { variant: 'cyan', label: 'New' },
  returning: { variant: 'blue', label: 'Returning' },
  loyal: { variant: 'amber', label: 'Loyal' },
  'at-risk': { variant: 'red', label: 'At Risk' },
}

const SEGMENTS: Array<CustomerSegment | 'all'> = ['all', 'new', 'returning', 'loyal', 'at-risk']

function CustomerDetailPanel({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const { data: customerOrders } = useApi<Order[]>(`/api/customers/${customer.id}/orders`)

  const monthsSince = Math.round((Date.now() - new Date(customer.joinedDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
  const avgOrderValue = customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0
  const statusConfig = STATUS_CONFIG[customer.status]
  const segmentConfig = SEGMENT_CONFIG[customer.segment]

  return (
    <SlidePanel isOpen onClose={onClose} title={customer.name}>
      <div className="customer-detail">
        <div className="customer-detail__hero">
          <Avatar src={customer.avatar} alt={customer.name} size={60} />
          <div className="customer-detail__hero-info">
            <h2 className="customer-detail__name">{customer.name}</h2>
            <p className="customer-detail__email">{customer.email}</p>
            <div className="customer-detail__badges">
              <Badge variant={statusConfig.variant} pulse={customer.status === 'vip'}>{statusConfig.label}</Badge>
              <Badge variant={segmentConfig.variant}>{segmentConfig.label}</Badge>
            </div>
          </div>
        </div>
        <div className="customer-detail__section">
          <div className="customer-detail__row"><span>Country</span><span>{customer.country}</span></div>
          <div className="customer-detail__row"><span>City</span><span>{customer.city}</span></div>
          <div className="customer-detail__row"><span>Joined</span><span className="number">{format(new Date(customer.joinedDate), 'MMM dd, yyyy')}</span></div>
          <div className="customer-detail__row"><span>Customer for</span><span>{monthsSince} months</span></div>
        </div>
        <div className="customer-detail__section">
          <h4>Lifetime Stats</h4>
          <div className="customer-detail__stats">
            <div className="customer-detail__stat"><span className="customer-detail__stat-label">Orders</span><span className="customer-detail__stat-val number">{customer.totalOrders}</span></div>
            <div className="customer-detail__stat"><span className="customer-detail__stat-label">Total Spent</span><span className="customer-detail__stat-val number">${customer.totalSpent.toFixed(2)}</span></div>
            <div className="customer-detail__stat"><span className="customer-detail__stat-label">Avg. Order</span><span className="customer-detail__stat-val number">${avgOrderValue.toFixed(2)}</span></div>
          </div>
        </div>
        <div className="customer-detail__section">
          <h4>Recent Orders</h4>
          {!customerOrders || customerOrders.length === 0 ? (
            <p style={{ color: '#3e4a66', fontSize: '0.8125rem' }}>No orders found</p>
          ) : (
            <table className="customer-detail__orders">
              <thead><tr><th>ID</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {customerOrders.map((o: Order) => (
                  <tr key={o.id}>
                    <td className="number">{o.id}</td>
                    <td className="number">${o.total.toFixed(2)}</td>
                    <td>
                      {o.status === 'completed' && <Badge variant="green">Done</Badge>}
                      {o.status === 'processing' && <Badge variant="cyan">Processing</Badge>}
                      {o.status === 'pending' && <Badge variant="amber">Pending</Badge>}
                      {o.status === 'cancelled' && <Badge variant="red">Cancelled</Badge>}
                      {o.status === 'refunded' && <Badge variant="purple">Refunded</Badge>}
                    </td>
                    <td className="number" style={{ color: '#3e4a66', fontSize: '0.75rem' }}>{format(new Date(o.date), 'MMM d')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </SlidePanel>
  )
}

export function Customers() {
  const [searchParams] = useSearchParams()
  const [segment, setSegment] = useState<CustomerSegment | 'all'>('all')
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => { document.title = 'Customers — NexaMetrics' }, [])

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (segment !== 'all') params.set('segment', segment)
    if (debouncedSearch) params.set('search', debouncedSearch)
    return `/api/customers?${params.toString()}`
  }, [segment, debouncedSearch])

  const { data: customers, loading } = useApi<Customer[]>(apiUrl, [apiUrl])
  const { data: topCustomers } = useApi<Customer[]>('/api/customers/top?n=10')
  const { data: sparkData } = useApi<number[]>('/api/metrics/sparkline?metric=newCustomers&days=7')

  const kpiStats = useMemo(() => {
    const list = customers ?? []
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const active = list.filter((c) => new Date(c.joinedDate) >= thirtyDaysAgo).length
    const vip = list.filter((c) => c.status === 'vip').length
    const avgLTV = list.length > 0 ? list.reduce((s, c) => s + c.totalSpent, 0) / list.length : 0
    return { total: list.length, active, vip, avgLTV }
  }, [customers])

  const segmentCounts = useMemo(() => {
    const list = customers ?? []
    const counts: Record<string, number> = { all: list.length }
    for (const c of list) counts[c.segment] = (counts[c.segment] ?? 0) + 1
    return counts
  }, [customers])

  const topCustomersChart = useMemo(() =>
    (topCustomers ?? []).map((c) => ({
      name: c.name.split(' ')[0]!,
      fullName: c.name,
      spent: Math.round(c.totalSpent),
    })),
    [topCustomers]
  )

  const columns = useMemo<Column<Customer>[]>(() => [
    {
      key: 'customer', label: 'Customer', render: (c) => (
        <div className="customers__customer-cell">
          <Avatar src={c.avatar} alt={c.name} size={32} />
          <div className="customers__customer-info">
            <div style={{ color: 'var(--t1)', fontWeight: 500 }}>{c.name}</div>
            <div style={{ color: 'var(--t3)', fontSize: '0.75rem' }}>{c.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'country', label: 'Country', render: (c) => <span style={{ color: 'var(--t2)' }}>{c.country}</span>, priority: 'medium' },
    { key: 'orders', label: 'Orders', render: (c) => <span className="number" style={{ color: 'var(--t2)' }}>{c.totalOrders}</span>, sortable: true, sortValue: (c) => c.totalOrders, priority: 'medium' },
    { key: 'spent', label: 'Total Spent', render: (c) => <span className="number" style={{ color: 'var(--t1)', fontWeight: 600 }}>${c.totalSpent.toFixed(2)}</span>, sortable: true, sortValue: (c) => c.totalSpent, priority: 'medium' },
    { key: 'status', label: 'Status', render: (c) => { const s = STATUS_CONFIG[c.status]; return <Badge variant={s.variant} pulse={c.status === 'vip'}>{s.label}</Badge> } },
    { key: 'segment', label: 'Segment', render: (c) => { const s = SEGMENT_CONFIG[c.segment]; return <Badge variant={s.variant}>{s.label}</Badge> }, priority: 'medium' },
    { key: 'joined', label: 'Joined', render: (c) => <span className="number" style={{ color: 'var(--t3)', fontSize: '0.75rem' }}>{format(new Date(c.joinedDate), 'MMM dd, yyyy')}</span>, sortable: true, sortValue: (c) => new Date(c.joinedDate).getTime(), priority: 'low' },
    { key: 'actions', label: '', render: (c) => (<button className="customers__eye-btn" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(c) }} aria-label={`View ${c.name}`}><Eye size={14} /></button>), priority: 'low' },
  ], [])

  return (
    <div className="customers">
      <div className="customers__kpi-grid">
        <KpiCard title="Total Customers" value={kpiStats.total} change={4.2} icon={<Users size={16} />} sparklineData={sparkData ?? []} loading={loading} />
        <KpiCard title="Active (30d)" value={kpiStats.active} change={8.1} icon={<Users size={16} />} sparklineData={sparkData ?? []} loading={loading} />
        <KpiCard title="VIP Members" value={kpiStats.vip} change={12.5} icon={<Users size={16} />} sparklineData={sparkData ?? []} loading={loading} />
        <KpiCard title="Avg. Lifetime Value" value={Math.round(kpiStats.avgLTV * 100)} change={3.7} icon={<Users size={16} />} format="decimal" sparklineData={sparkData ?? []} loading={loading} />
      </div>

      <div className="customers__chart-card">
        <h2>Top 10 Customers by Spending</h2>
        <div aria-label="Top customers bar chart">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topCustomersChart} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#3e4a66', fontSize: 11, fontFamily: 'Inconsolata' }} axisLine={false} tickLine={false} tickFormatter={(v: unknown) => `$${(Number(v) / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#7d8aa8', fontSize: 12 }} axisLine={false} tickLine={false} width={76} />
              <Tooltip formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, 'Total Spent']} contentStyle={{ background: '#131622', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#7d8aa8' }} itemStyle={{ color: '#eef0f8' }} />
              <Bar dataKey="spent" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={700}>
                {topCustomersChart.map((_, i) => (
                  <Cell key={i} fill="url(#custBarGrad)" />
                ))}
                <defs>
                  <linearGradient id="custBarGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="customers__toolbar">
        <div className="customers__segment-tabs" role="tablist" aria-label="Filter by segment">
          {SEGMENTS.map((s) => (
            <button key={s} role="tab" aria-selected={segment === s} className={`customers__seg-tab ${segment === s ? 'customers__seg-tab--active' : ''}`} onClick={() => setSegment(s)}>
              {s === 'all' ? 'All' : SEGMENT_CONFIG[s].label}
              <span className="customers__count-badge">{segmentCounts[s] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="customers__search-wrap">
          <Search size={13} className="customers__search-icon" aria-hidden="true" />
          <label htmlFor="customers-search" className="sr-only">Search customers</label>
          <input id="customers-search" type="text" placeholder="Search by name, email, country…" value={search} onChange={(e) => setSearch(e.target.value)} className="customers__search" />
        </div>
      </div>

      <div className="customers__table-card">
        <DataTable columns={columns} data={customers ?? []} keyExtractor={(c) => c.id} onRowClick={setSelectedCustomer} emptyMessage="No customers match your filters" emptyIcon={<Users size={40} />} loading={loading} skeletonRows={5} />
      </div>

      {selectedCustomer && <CustomerDetailPanel customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />}
    </div>
  )
}
