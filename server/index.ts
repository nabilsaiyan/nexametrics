import express from 'express'
import {
  customers,
  orders,
  products,
  dailyMetrics,
  monthlyMetrics,
  getCurrentMonthStats,
  getOrdersByStatus,
  getRevenueByCategory,
  getTopCustomers,
  getTopProducts,
  getOrdersByCountry,
  getOrdersByDayOfWeek,
  getOrdersByHour,
  getRecentOrders,
  getSparklineData,
} from '../src/data/generators.js'
import type { DailyMetric } from '../src/data/types.js'

const app = express()
const PORT = 3001

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// ── Metrics ────────────────────────────────────────────────────────────────

app.get('/api/metrics/current', async (_req, res) => {
  await delay(280)
  res.json(getCurrentMonthStats())
})

app.get('/api/metrics/daily', async (req, res) => {
  await delay(340)
  const days = Number(req.query['days'] ?? 30)
  res.json(dailyMetrics.slice(-days))
})

app.get('/api/metrics/monthly', async (_req, res) => {
  await delay(320)
  res.json(monthlyMetrics)
})

app.get('/api/metrics/sparkline', async (req, res) => {
  await delay(200)
  const metric = (req.query['metric'] ?? 'revenue') as keyof Omit<DailyMetric, 'date'>
  const days = Number(req.query['days'] ?? 7)
  res.json(getSparklineData(metric, days))
})

// ── Orders ─────────────────────────────────────────────────────────────────

app.get('/api/orders/live', (_req, res) => {
  const customer = customers[Math.floor(Math.random() * customers.length)]!
  const product = products[Math.floor(Math.random() * products.length)]!
  const qty = Math.floor(Math.random() * 3) + 1
  const subtotal = product.price * qty
  const tax = parseFloat((subtotal * 0.08).toFixed(2))
  const shipping = subtotal > 75 ? 0 : 9.99
  const total = parseFloat((subtotal + tax + shipping).toFixed(2))

  res.json({
    id: `ORD-${Date.now()}`,
    customer,
    items: [{ productId: product.id, productName: product.name, quantity: qty, unitPrice: product.price }],
    total,
    status: 'processing',
    paymentMethod: 'card',
    date: new Date().toISOString(),
    country: customer.country,
    city: customer.city,
  })
})

app.get('/api/orders/recent', async (req, res) => {
  await delay(260)
  const n = Number(req.query['n'] ?? 10)
  res.json(getRecentOrders(n))
})

app.get('/api/orders/by-status', async (_req, res) => {
  await delay(200)
  res.json(getOrdersByStatus())
})

app.get('/api/orders/by-country', async (_req, res) => {
  await delay(240)
  res.json(getOrdersByCountry())
})

app.get('/api/orders/by-day', async (_req, res) => {
  await delay(220)
  res.json(getOrdersByDayOfWeek())
})

app.get('/api/orders/by-hour', async (_req, res) => {
  await delay(220)
  res.json(getOrdersByHour())
})

app.get('/api/orders', async (req, res) => {
  await delay(380)
  const status = req.query['status'] as string | undefined
  const payment = req.query['payment'] as string | undefined
  const search = ((req.query['search'] as string | undefined) ?? '').toLowerCase()
  const from = req.query['from'] as string | undefined
  const to = req.query['to'] as string | undefined
  const page = Number(req.query['page'] ?? 1)
  const pageSize = Number(req.query['pageSize'] ?? 20)

  let result = [...orders]

  if (status && status !== 'all') result = result.filter((o) => o.status === status)
  if (payment && payment !== 'all') result = result.filter((o) => o.paymentMethod === payment)
  if (from) result = result.filter((o) => o.date >= new Date(from))
  if (to) result = result.filter((o) => o.date <= new Date(to))
  if (search) {
    result = result.filter(
      (o) =>
        o.id.toLowerCase().includes(search) ||
        o.customer.name.toLowerCase().includes(search),
    )
  }

  const total = result.length
  const data = result.slice((page - 1) * pageSize, page * pageSize)
  res.json({ data, total, page, pageSize })
})

// ── Products ───────────────────────────────────────────────────────────────

app.get('/api/products/top', async (req, res) => {
  await delay(240)
  const n = Number(req.query['n'] ?? 5)
  res.json(getTopProducts(n))
})

app.get('/api/products/revenue-by-category', async (_req, res) => {
  await delay(220)
  res.json(getRevenueByCategory())
})

app.get('/api/products', async (req, res) => {
  await delay(360)
  const category = req.query['category'] as string | undefined
  const search = ((req.query['search'] as string | undefined) ?? '').toLowerCase()
  const sort = (req.query['sort'] as string | undefined) ?? 'revenue-desc'

  let result = [...products]

  if (category && category !== 'All') result = result.filter((p) => p.category === category)
  if (search) {
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search),
    )
  }

  result.sort((a, b) => {
    if (sort === 'revenue-desc') return b.revenue - a.revenue
    if (sort === 'revenue-asc') return a.revenue - b.revenue
    if (sort === 'price-desc') return b.price - a.price
    if (sort === 'price-asc') return a.price - b.price
    if (sort === 'rating-desc') return b.rating - a.rating
    if (sort === 'stock-desc') return b.stock - a.stock
    return 0
  })

  res.json(result)
})

// ── Customers ──────────────────────────────────────────────────────────────

app.get('/api/customers/top', async (req, res) => {
  await delay(240)
  const n = Number(req.query['n'] ?? 10)
  res.json(getTopCustomers(n))
})

app.get('/api/customers/:id/orders', async (req, res) => {
  await delay(300)
  const { id } = req.params
  const result = orders.filter((o) => o.customer.id === id).slice(0, 5)
  res.json(result)
})

app.get('/api/customers', async (req, res) => {
  await delay(400)
  const segment = req.query['segment'] as string | undefined
  const search = ((req.query['search'] as string | undefined) ?? '').toLowerCase()

  let result = [...customers]

  if (segment && segment !== 'all') result = result.filter((c) => c.segment === segment)
  if (search) {
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.country.toLowerCase().includes(search),
    )
  }

  res.json(result)
})

// ── Export for Vercel serverless ───────────────────────────────────────────
export default app

// ── Local dev server (skipped on Vercel) ──────────────────────────────────
if (!process.env['VERCEL']) {
  app.listen(PORT, () => {
    console.log(`\x1b[36m[api]\x1b[0m NexaMetrics API ready → http://localhost:${PORT}`)
  })
}
