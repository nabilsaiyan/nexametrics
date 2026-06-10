import { useState, useMemo, useCallback, useEffect } from 'react'
import { DollarSign, ShoppingCart, Users, TrendingUp, Eye, InboxIcon } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import { KpiCard } from '../components/ui/KpiCard'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { SlidePanel } from '../components/ui/SlidePanel'
import { useApi } from '../hooks/useApi'
import { useLiveMetrics } from '../hooks/useLiveMetrics'
import type { Order, OrderStatus, CurrentMonthStats, DailyMetric, Product } from '../data/types'
import './Dashboard.scss'

const CATEGORY_COLORS: Record<string, string> = {
  Electronics: '#8b5cf6',
  Fashion: '#a78bfa',
  Home: '#34d399',
  Sports: '#f59e0b',
  Beauty: '#ef4444',
  Food: '#60a5fa',
}

const STATUS_BADGE: Record<OrderStatus, { variant: 'green' | 'cyan' | 'amber' | 'red' | 'purple'; label: string }> = {
  completed: { variant: 'green', label: 'Completed' },
  processing: { variant: 'cyan', label: 'Processing' },
  pending: { variant: 'amber', label: 'Pending' },
  cancelled: { variant: 'red', label: 'Cancelled' },
  refunded: { variant: 'purple', label: 'Refunded' },
}

type TimeRange = '7D' | '30D' | '90D' | '1Y'
const RANGE_DAYS: Record<TimeRange, number> = { '7D': 7, '30D': 30, '90D': 90, '1Y': 365 }

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string }>
  label?: string
}

function RevenueTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__date">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="chart-tooltip__row">
          <span>{p.name === 'revenue' ? 'Revenue' : 'Orders'}</span>
          <span className="number">
            {p.name === 'revenue' ? `$${p.value.toLocaleString()}` : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function OrderDetailPanel({ order, onClose }: { order: Order; onClose: () => void }) {
  const sb = STATUS_BADGE[order.status]
  const subtotal = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const tax = subtotal * 0.08
  const shipping = subtotal > 75 ? 0 : 9.99

  const TIMELINE_STEPS = order.status === 'cancelled'
    ? ['Order Placed', 'Cancelled']
    : order.status === 'refunded'
    ? ['Order Placed', 'Completed', 'Refunded']
    : ['Order Placed', 'Processing', 'Shipped', 'Delivered']

  const stepCompleted = (step: string) => {
    if (order.status === 'completed') return true
    if (order.status === 'processing') return step === 'Order Placed' || step === 'Processing'
    if (order.status === 'pending') return step === 'Order Placed'
    if (order.status === 'cancelled') return step === 'Order Placed' || step === 'Cancelled'
    if (order.status === 'refunded') return true
    return false
  }

  return (
    <SlidePanel isOpen onClose={onClose} title={`Order ${order.id}`}>
      <div className="order-detail">
        <div className="order-detail__section">
          <div className="order-detail__row"><span className="order-detail__label">Status</span><Badge variant={sb.variant}>{sb.label}</Badge></div>
          <div className="order-detail__row"><span className="order-detail__label">Date</span><span className="order-detail__value number">{format(new Date(order.date), 'MMM dd, yyyy · HH:mm')}</span></div>
          <div className="order-detail__row"><span className="order-detail__label">Payment</span><span className="order-detail__value">{order.paymentMethod.toUpperCase()}</span></div>
        </div>
        <div className="order-detail__section">
          <h4 className="order-detail__section-title">Customer</h4>
          <div className="order-detail__customer">
            <Avatar src={order.customer.avatar} alt={order.customer.name} size={40} />
            <div>
              <div className="order-detail__customer-name">{order.customer.name}</div>
              <div className="order-detail__customer-email">{order.customer.email}</div>
              <div className="order-detail__customer-location">{order.customer.city}, {order.customer.country}</div>
            </div>
          </div>
        </div>
        <div className="order-detail__section">
          <h4 className="order-detail__section-title">Items</h4>
          <table className="order-detail__items">
            <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.productId}>
                  <td>{item.productName}</td>
                  <td className="number">{item.quantity}</td>
                  <td className="number">${item.unitPrice.toFixed(2)}</td>
                  <td className="number">${(item.unitPrice * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="order-detail__section">
          <h4 className="order-detail__section-title">Total Breakdown</h4>
          <div className="order-detail__totals">
            {[['Subtotal', `$${subtotal.toFixed(2)}`], ['Tax (8%)', `$${tax.toFixed(2)}`], ['Shipping', shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`]].map(([l, v]) => (
              <div key={l} className="order-detail__total-row"><span>{l}</span><span className="number">{v}</span></div>
            ))}
            <div className="order-detail__total-row order-detail__total-row--grand"><span>Total</span><span className="number">${order.total.toFixed(2)}</span></div>
          </div>
        </div>
        <div className="order-detail__section">
          <h4 className="order-detail__section-title">Status Timeline</h4>
          <div className="order-detail__timeline">
            {TIMELINE_STEPS.map((step) => (
              <div key={step} className={`order-detail__step ${stepCompleted(step) ? 'order-detail__step--done' : ''}`}>
                <div className="order-detail__step-dot" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlidePanel>
  )
}

export function Dashboard() {
  const [range, setRange] = useState<TimeRange>('30D')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const { data: statsData, loading: statsLoading } = useApi<CurrentMonthStats>('/api/metrics/current')
  const { data: recentOrders, loading: ordersLoading } = useApi<Order[]>('/api/orders/recent?n=10')
  const { data: topProducts, loading: productsLoading } = useApi<Product[]>('/api/products/top?n=5')
  const { data: categoryRevenue } = useApi<Record<string, number>>('/api/products/revenue-by-category')
  const { data: sparkRevenue } = useApi<number[]>('/api/metrics/sparkline?metric=revenue&days=7')
  const { data: sparkOrders } = useApi<number[]>('/api/metrics/sparkline?metric=orders&days=7')
  const { data: sparkCustomers } = useApi<number[]>('/api/metrics/sparkline?metric=newCustomers&days=7')
  const { data: sparkAOV } = useApi<number[]>('/api/metrics/sparkline?metric=avgOrderValue&days=7')
  const { data: dailyData } = useApi<DailyMetric[]>(`/api/metrics/daily?days=${RANGE_DAYS[range]}`, [range])

  const initialStats = useMemo<CurrentMonthStats>(() => statsData ?? {
    revenue: 0, revenueChange: 0, orders: 0, ordersChange: 0,
    customers: 0, customersChange: 0, avgOrderValue: 0, avgOrderValueChange: 0,
  }, [statsData])

  const initialOrders = useMemo<Order[]>(() => recentOrders ?? [], [recentOrders])

  const { liveOrders, stats, newOrderId } = useLiveMetrics(initialStats, initialOrders)

  useEffect(() => { document.title = 'Dashboard — NexaMetrics' }, [])

  const chartData = useMemo(() =>
    (dailyData ?? []).map((d) => ({ date: d.date, revenue: Math.round(d.revenue), orders: d.orders })),
    [dailyData]
  )

  const pieData = useMemo(() =>
    Object.entries(categoryRevenue ?? {}).map(([name, value]) => ({ name, value: Math.round(value) })),
    [categoryRevenue]
  )

  const maxProductRevenue = useMemo(() =>
    Math.max(...(topProducts ?? []).map((p) => p.revenue), 1),
    [topProducts]
  )

  const loading = statsLoading || ordersLoading

  const orderColumns = useMemo<Column<Order>[]>(() => [
    { key: 'id', label: 'Order ID', render: (o) => <span className="number" style={{ color: 'var(--t2)', fontSize: '0.8125rem' }}>{o.id}</span>, priority: 'medium' as const },
    {
      key: 'customer', label: 'Customer', render: (o) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Avatar src={o.customer.avatar} alt={o.customer.name} size={24} />
          <span style={{ color: 'var(--t1)', fontWeight: 500, fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customer.name}</span>
        </div>
      ),
    },
    { key: 'total', label: 'Amount', render: (o) => <span className="number" style={{ color: 'var(--t1)', fontWeight: 600 }}>${o.total.toFixed(2)}</span>, priority: 'medium' as const },
    { key: 'status', label: 'Status', render: (o) => { const s = STATUS_BADGE[o.status]; return <Badge variant={s.variant}>{s.label}</Badge> } },
    { key: 'date', label: 'Date', render: (o) => <span className="number" style={{ color: 'var(--chart-axis-label)', fontSize: '0.75rem' }}>{format(new Date(o.date), 'MMM dd, HH:mm')}</span>, priority: 'medium' as const },
    {
      key: 'actions', label: '', render: (o) => (
        <button className="dashboard__eye-btn" onClick={(e) => { e.stopPropagation(); setSelectedOrder(o) }} aria-label={`View order ${o.id}`}>
          <Eye size={14} />
        </button>
      ), priority: 'low' as const,
    },
  ], [])

  const handleRowClick = useCallback((order: Order) => setSelectedOrder(order), [])

  return (
    <div className="dashboard">
      <div className="dashboard__kpi-grid">
        <KpiCard title="Monthly Revenue" value={Math.round(stats.revenue)} change={stats.revenueChange} icon={<DollarSign size={16} />} format="currency" sparklineData={sparkRevenue ?? []} loading={loading} />
        <KpiCard title="Total Orders" value={stats.orders} change={stats.ordersChange} icon={<ShoppingCart size={16} />} sparklineData={sparkOrders ?? []} loading={loading} />
        <KpiCard title="Active Customers" value={stats.customers} change={stats.customersChange} icon={<Users size={16} />} sparklineData={sparkCustomers ?? []} loading={loading} />
        <KpiCard title="Avg. Order Value" value={Math.round(stats.avgOrderValue * 100)} change={stats.avgOrderValueChange} icon={<TrendingUp size={16} />} format="decimal" sparklineData={sparkAOV ?? []} loading={loading} />
      </div>

      <div className="dashboard__row2">
        <div className="dashboard__chart-card">
          <div className="dashboard__chart-header">
            <h2 className="dashboard__chart-title">Revenue Over Time</h2>
            <div className="dashboard__range-tabs" role="group" aria-label="Time range">
              {(['7D', '30D', '90D', '1Y'] as TimeRange[]).map((r) => (
                <button key={r} className={`dashboard__range-tab ${range === r ? 'dashboard__range-tab--active' : ''}`} onClick={() => setRange(r)} aria-pressed={range === r}>{r}</button>
              ))}
            </div>
          </div>
          <div className="dashboard__chart-body" aria-label="Revenue area chart">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#3e4a66', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd"
                  tickFormatter={(v: string) => { const d = new Date(v); return (range === '7D' || range === '30D') ? format(d, 'MMM d') : format(d, 'MMM') }} />
                <YAxis tick={{ fill: '#3e4a66', fontSize: 11, fontFamily: 'Inconsolata' }} axisLine={false} tickLine={false} tickFormatter={(v: unknown) => `$${(Number(v) / 1000).toFixed(0)}k`} width={42} />
                <ReTooltip content={<RevenueTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#revenueGrad)" isAnimationActive animationDuration={700} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard__pie-card">
          <h2 className="dashboard__chart-title">Revenue by Category</h2>
          <div aria-label="Revenue by category donut chart">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" isAnimationActive animationDuration={700}>
                  {pieData.map((entry) => <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? '#7d8aa8'} />)}
                </Pie>
                <Legend formatter={(value) => <span style={{ color: 'var(--chart-axis-label)', fontSize: '0.75rem' }}>{value}</span>} />
                <ReTooltip formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: 'var(--chart-tooltip-value)' }} itemStyle={{ color: 'var(--chart-tooltip-label)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dashboard__row3">
        <div className="dashboard__orders-card">
          <div className="dashboard__section-header">
            <h2>Recent Orders</h2>
            <span className="dashboard__live-badge"><span className="dashboard__live-dot" aria-hidden="true" />Live</span>
          </div>
          <DataTable columns={orderColumns} data={liveOrders} keyExtractor={(o) => o.id} onRowClick={handleRowClick} newRowId={newOrderId} emptyIcon={<InboxIcon size={32} />} emptyMessage="No recent orders" loading={ordersLoading} />
        </div>

        <div className="dashboard__products-card">
          <h2 className="dashboard__section-title">Top Products</h2>
          {productsLoading ? (
            <div className="dashboard__products-list">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="dashboard__product-item">
                  <span className="dashboard__product-rank number" style={{ background: 'rgba(58,85,112,0.15)', borderRadius: 4, width: 16, height: 12, display: 'block' }} />
                  <div className="dashboard__product-info">
                    <span style={{ background: 'rgba(58,85,112,0.15)', borderRadius: 4, display: 'block', height: 12, width: '80%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard__products-list">
              {(topProducts ?? []).map((product, i) => (
                <div key={product.id} className="dashboard__product-item">
                  <span className="dashboard__product-rank number">{i + 1}</span>
                  <div className="dashboard__product-info">
                    <span className="dashboard__product-name">{product.name}</span>
                    <Badge variant="cyan" className="dashboard__product-cat">{product.category}</Badge>
                  </div>
                  <div className="dashboard__product-bar-wrap">
                    <div className="dashboard__product-bar" style={{ width: `${(product.revenue / maxProductRevenue) * 100}%` }} />
                  </div>
                  <span className="dashboard__product-revenue number">${Math.round(product.revenue / 1000)}k</span>
                  {product.trend === 'up' && <span style={{ color: '#34d399', fontSize: 12 }}>▲</span>}
                  {product.trend === 'down' && <span style={{ color: '#ef4444', fontSize: 12 }}>▼</span>}
                  {product.trend === 'stable' && <span style={{ color: 'var(--t2)', fontSize: 12 }}>—</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedOrder && <OrderDetailPanel order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  )
}
