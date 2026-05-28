import { useState, useMemo, useCallback, useEffect } from 'react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { Eye, Download, InboxIcon, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Order, OrderStatus, PaymentMethod } from '../data/types'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { SlidePanel } from '../components/ui/SlidePanel'
import { useDebounce } from '../hooks/useDebounce'
import { useApi } from '../hooks/useApi'
import './Orders.scss'

const STATUS_CONFIG: Record<OrderStatus, { variant: 'green' | 'cyan' | 'amber' | 'red' | 'purple'; label: string }> = {
  completed: { variant: 'green', label: 'Completed' },
  processing: { variant: 'cyan', label: 'Processing' },
  pending: { variant: 'amber', label: 'Pending' },
  cancelled: { variant: 'red', label: 'Cancelled' },
  refunded: { variant: 'purple', label: 'Refunded' },
}

const PM_LABELS: Record<PaymentMethod, string> = {
  card: 'Card', paypal: 'PayPal', crypto: 'Crypto', bank: 'Bank',
}

type DatePreset = 'today' | '7d' | '30d' | '90d' | 'custom'
const PAGE_SIZE = 20

interface OrdersResponse {
  data: Order[]
  total: number
  page: number
  pageSize: number
}

function OrderDetailPanel({ order, onClose }: { order: Order; onClose: () => void }) {
  const sb = STATUS_CONFIG[order.status]
  const subtotal = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const tax = subtotal * 0.08
  const shipping = subtotal > 75 ? 0 : 9.99

  const TIMELINE_STEPS = order.status === 'cancelled' ? ['Order Placed', 'Cancelled']
    : order.status === 'refunded' ? ['Order Placed', 'Completed', 'Refunded']
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
      <div className="order-panel">
        <div className="order-panel__section">
          <div className="order-panel__row"><span>Status</span><Badge variant={sb.variant}>{sb.label}</Badge></div>
          <div className="order-panel__row"><span>Date</span><span className="number">{format(new Date(order.date), 'MMM dd, yyyy · HH:mm')}</span></div>
          <div className="order-panel__row"><span>Payment</span><span>{PM_LABELS[order.paymentMethod]}</span></div>
        </div>
        <div className="order-panel__section">
          <h4>Customer</h4>
          <div className="order-panel__customer">
            <Avatar src={order.customer.avatar} alt={order.customer.name} size={40} />
            <div>
              <div className="order-panel__customer-name">{order.customer.name}</div>
              <div className="order-panel__customer-sub">{order.customer.email}</div>
              <div className="order-panel__customer-sub">{order.customer.city}, {order.customer.country}</div>
            </div>
          </div>
        </div>
        <div className="order-panel__section">
          <h4>Items</h4>
          <table className="order-panel__items">
            <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
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
        <div className="order-panel__section">
          <h4>Total</h4>
          {[['Subtotal', `$${subtotal.toFixed(2)}`], ['Tax (8%)', `$${tax.toFixed(2)}`], ['Shipping', shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`]].map(([l, v]) => (
            <div key={l} className="order-panel__row order-panel__row--sm"><span>{l}</span><span className="number">{v}</span></div>
          ))}
          <div className="order-panel__row order-panel__row--grand"><span>Total</span><span className="number">${order.total.toFixed(2)}</span></div>
        </div>
        <div className="order-panel__section">
          <h4>Status Timeline</h4>
          {TIMELINE_STEPS.map((step) => (
            <div key={step} className={`order-panel__step ${stepCompleted(step) ? 'order-panel__step--done' : ''}`}>
              <div className="order-panel__step-dot" /><span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </SlidePanel>
  )
}

export function Orders() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [datePreset, setDatePreset] = useState<DatePreset>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [pmFilter, setPmFilter] = useState<PaymentMethod | 'all'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => { document.title = 'Orders — NexaMetrics' }, [])

  const dateRange = useMemo(() => {
    const now = new Date()
    if (datePreset === 'today') return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() }
    if (datePreset === '7d') return { from: subDays(now, 7).toISOString(), to: now.toISOString() }
    if (datePreset === '30d') return { from: subDays(now, 30).toISOString(), to: now.toISOString() }
    if (datePreset === '90d') return { from: subDays(now, 90).toISOString(), to: now.toISOString() }
    if (datePreset === 'custom' && customFrom && customTo) return { from: new Date(customFrom).toISOString(), to: new Date(customTo).toISOString() }
    return null
  }, [datePreset, customFrom, customTo])

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (pmFilter !== 'all') params.set('payment', pmFilter)
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (dateRange) { params.set('from', dateRange.from); params.set('to', dateRange.to) }
    params.set('page', String(page))
    params.set('pageSize', String(PAGE_SIZE))
    return `/api/orders?${params.toString()}`
  }, [statusFilter, pmFilter, debouncedSearch, dateRange, page])

  const { data: ordersRes, loading } = useApi<OrdersResponse>(apiUrl, [apiUrl])
  const { data: statusCounts } = useApi<Record<string, number>>('/api/orders/by-status')

  const orders = ordersRes?.data ?? []
  const totalPages = Math.max(1, Math.ceil((ordersRes?.total ?? 0) / PAGE_SIZE))

  const handleExport = useCallback(() => {
    toast.loading('Preparing export…')
    setTimeout(() => { toast.dismiss(); toast.success('Download ready') }, 1500)
  }, [])

  const handleFilterChange = useCallback(<T,>(setter: (v: T) => void) => (v: T) => {
    setter(v); setPage(1)
  }, [])

  const columns = useMemo<Column<Order>[]>(() => [
    { key: 'num', label: '#', render: (_, i) => <span className="number" style={{ color: 'var(--t3)' }}>{(page - 1) * PAGE_SIZE + i + 1}</span>, priority: 'low' },
    { key: 'id', label: 'Order ID', render: (o) => <span className="number orders__order-id">{o.id}</span> },
    { key: 'customer', label: 'Customer', render: (o) => (<div className="orders__customer-cell"><Avatar src={o.customer.avatar} alt={o.customer.name} size={28} /><span style={{ color: 'var(--t1)', fontWeight: 500 }}>{o.customer.name}</span></div>) },
    { key: 'items', label: 'Items', render: (o) => <span className="number" style={{ color: 'var(--t2)' }}>{o.items.length}</span>, priority: 'low' },
    { key: 'total', label: 'Total', render: (o) => <span className="number" style={{ color: 'var(--t1)', fontWeight: 600 }}>${o.total.toFixed(2)}</span>, sortable: true },
    { key: 'status', label: 'Status', render: (o) => { const s = STATUS_CONFIG[o.status]; return <Badge variant={s.variant}>{s.label}</Badge> } },
    { key: 'payment', label: 'Payment', render: (o) => <span style={{ color: 'var(--t2)', fontSize: '0.8125rem' }}>{PM_LABELS[o.paymentMethod]}</span>, priority: 'medium' },
    { key: 'date', label: 'Date', render: (o) => <span className="number" style={{ color: 'var(--t2)', fontSize: '0.75rem' }}>{format(new Date(o.date), 'MMM dd, yyyy')}</span>, sortable: true, priority: 'medium' },
    { key: 'actions', label: '', render: (o) => (<button className="orders__eye-btn" onClick={(e) => { e.stopPropagation(); setSelectedOrder(o) }} aria-label={`View order ${o.id}`}><Eye size={14} /></button>), priority: 'low' },
  ], [page])

  const pageNums = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }, [page, totalPages])

  const allCounts = statusCounts ?? {}

  return (
    <div className="orders">
      <div className="orders__toolbar">
        <div className="orders__status-tabs" role="tablist" aria-label="Filter by status">
          {(['all', 'completed', 'processing', 'pending', 'cancelled', 'refunded'] as const).map((s) => (
            <button key={s} role="tab" aria-selected={statusFilter === s} className={`orders__status-tab ${statusFilter === s ? 'orders__status-tab--active' : ''}`} onClick={() => { handleFilterChange(setStatusFilter)(s) }}>
              {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
              <span className="orders__count-badge">{s === 'all' ? Object.values(allCounts).reduce((a, b) => a + b, 0) : (allCounts[s] ?? 0)}</span>
            </button>
          ))}
        </div>
        <div className="orders__filters">
          <div className="orders__date-presets" role="group" aria-label="Date range presets">
            {([['today', 'Today'], ['7d', '7D'], ['30d', '30D'], ['90d', '90D'], ['custom', 'Custom']] as const).map(([v, l]) => (
              <button key={v} className={`orders__preset-btn ${datePreset === v ? 'orders__preset-btn--active' : ''}`} onClick={() => handleFilterChange(setDatePreset)(v)} aria-pressed={datePreset === v}>{l}</button>
            ))}
          </div>
          {datePreset === 'custom' && (
            <div className="orders__custom-dates">
              <label htmlFor="date-from" className="sr-only">From date</label>
              <input id="date-from" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="orders__date-input" />
              <span style={{ color: 'var(--t3)' }}>–</span>
              <label htmlFor="date-to" className="sr-only">To date</label>
              <input id="date-to" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="orders__date-input" />
            </div>
          )}
          <label htmlFor="pm-filter" className="sr-only">Payment method</label>
          <select id="pm-filter" className="orders__select" value={pmFilter} onChange={(e) => handleFilterChange(setPmFilter)(e.target.value as PaymentMethod | 'all')}>
            <option value="all">All payments</option>
            {(['card', 'paypal', 'crypto', 'bank'] as PaymentMethod[]).map((m) => <option key={m} value={m}>{PM_LABELS[m]}</option>)}
          </select>
          <div className="orders__search-wrap">
            <Search size={13} className="orders__search-icon" aria-hidden="true" />
            <label htmlFor="orders-search" className="sr-only">Search orders</label>
            <input id="orders-search" type="text" placeholder="Search by name or ID…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="orders__search" />
          </div>
          <button className="orders__export-btn" onClick={handleExport} aria-label="Export orders"><Download size={14} />Export</button>
        </div>
      </div>

      <div className="orders__table-card">
        <DataTable columns={columns} data={orders} keyExtractor={(o) => o.id} onRowClick={setSelectedOrder} emptyIcon={<InboxIcon size={40} />} emptyMessage="No orders match your filters" loading={loading} skeletonRows={5} />
        {!loading && (ordersRes?.total ?? 0) > 0 && (
          <div className="orders__pagination" aria-label="Pagination">
            <button className="orders__page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page">‹</button>
            {pageNums.map((p, i) =>
              p === '...' ? <span key={`e-${i}`} className="orders__page-ellipsis">…</span> :
              <button key={p} className={`orders__page-btn ${page === p ? 'orders__page-btn--active' : ''}`} onClick={() => setPage(p)} aria-label={`Page ${p}`} aria-current={page === p ? 'page' : undefined}>{p}</button>
            )}
            <button className="orders__page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Next page">›</button>
          </div>
        )}
      </div>

      {selectedOrder && <OrderDetailPanel order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  )
}
