import { faker } from '@faker-js/faker'
import { subDays, subMonths, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import type {
  Customer,
  Order,
  OrderItem,
  Product,
  DailyMetric,
  MonthlyMetric,
  CurrentMonthStats,
  OrderStatus,
  PaymentMethod,
  CustomerStatus,
  CustomerSegment,
  ProductTrend,
} from './types'

faker.seed(12345)

const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'France', 'Canada',
  'Australia', 'Japan', 'Brazil', 'India', 'Netherlands',
  'Sweden', 'Spain', 'Italy', 'South Korea', 'Mexico',
  'Singapore', 'UAE', 'Switzerland', 'Poland', 'Argentina',
]

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow'],
  'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt'],
  'France': ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'],
  'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
  'Japan': ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Sapporo'],
  'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza'],
  'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'],
  'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
  'Sweden': ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås'],
  'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza'],
  'Italy': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo'],
  'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon'],
  'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana'],
  'Singapore': ['Singapore'],
  'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah'],
  'Switzerland': ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne'],
  'Poland': ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań'],
  'Argentina': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata'],
}

const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Sports', 'Beauty', 'Food']

const PRODUCT_NAMES: Record<string, string[]> = {
  Electronics: [
    'Pro Wireless Headphones', 'Ultra HD Monitor 27"', 'Mechanical Keyboard RGB',
    'Gaming Mouse Pro', 'USB-C Hub 10-in-1', '4K Webcam', 'Smart Watch Series 5',
    'Portable SSD 1TB', 'Noise Cancelling Earbuds', 'Laptop Stand Adjustable',
  ],
  Fashion: [
    'Premium Leather Jacket', 'Slim Fit Chinos', 'Merino Wool Sweater',
    'Running Sneakers Air', 'Canvas Tote Bag', 'Polarized Sunglasses',
    'Oxford Button Shirt', 'Yoga Leggings Pro',
  ],
  Home: [
    'Espresso Machine Auto', 'Air Purifier HEPA', 'Smart LED Desk Lamp',
    'Cast Iron Skillet 12"', 'Bamboo Cutting Board Set', 'French Press Coffee',
    'Weighted Blanket 15lb', 'Memory Foam Pillow',
  ],
  Sports: [
    'Resistance Band Set', 'Yoga Mat Premium', 'Whey Protein 5lb',
    'Adjustable Dumbbells', 'Jump Rope Speed', 'Foam Roller Deep Tissue',
    'Running Belt Waterproof', 'Cycling Gloves Pro',
  ],
  Beauty: [
    'Vitamin C Serum 30ml', 'Retinol Night Cream', 'Hyaluronic Toner',
    'SPF 50 Sunscreen', 'Jade Roller Set', 'Collagen Eye Patches',
    'Argan Oil Hair Mask', 'Bamboo Charcoal Cleanser',
  ],
  Food: [
    'Organic Green Tea 100g', 'Dark Chocolate 85% Box', 'Mixed Nuts Premium',
    'Cold Brew Coffee Pack', 'Protein Granola 500g', 'Matcha Powder Grade A',
    'Manuka Honey 250g', 'Chia Seeds Organic',
  ],
}

// Generate customers
export const customers: Customer[] = Array.from({ length: 180 }, (_, i) => {
  const country = COUNTRIES[i % COUNTRIES.length]
  const cities = CITIES_BY_COUNTRY[country] ?? ['Unknown']
  const city = cities[Math.floor(faker.number.float() * cities.length)]
  const totalOrders = faker.number.int({ min: 1, max: 45 })
  const totalSpent = parseFloat((totalOrders * faker.number.float({ min: 40, max: 380 })).toFixed(2))
  const statusRoll = faker.number.float()
  let status: CustomerStatus = 'active'
  if (statusRoll < 0.08) status = 'vip'
  else if (statusRoll < 0.25) status = 'inactive'

  const segmentRoll = faker.number.float()
  let segment: CustomerSegment = 'returning'
  if (segmentRoll < 0.2) segment = 'new'
  else if (segmentRoll < 0.55) segment = 'returning'
  else if (segmentRoll < 0.78) segment = 'loyal'
  else segment = 'at-risk'

  const seed = i + 1
  return {
    id: `cust-${String(seed).padStart(4, '0')}`,
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
    country,
    city,
    totalSpent,
    totalOrders,
    joinedDate: faker.date.between({ from: subMonths(new Date(), 24), to: subMonths(new Date(), 1) }),
    status,
    segment,
  }
})

// Generate products
export const products: Product[] = CATEGORIES.flatMap((category) => {
  const names = PRODUCT_NAMES[category]!
  return names.map((name, idx) => {
    const price = parseFloat(faker.number.float({
      min: category === 'Electronics' ? 49 : category === 'Fashion' ? 29 : 12,
      max: category === 'Electronics' ? 599 : category === 'Fashion' ? 249 : 89,
    }).toFixed(2))
    const sold = faker.number.int({ min: 80, max: 2200 })
    const stock = faker.number.int({ min: 0, max: 200 })
    const trendRoll = faker.number.float()
    let trend: ProductTrend = 'stable'
    if (trendRoll < 0.35) trend = 'up'
    else if (trendRoll < 0.55) trend = 'down'

    return {
      id: `prod-${category.slice(0, 3).toLowerCase()}-${String(idx + 1).padStart(2, '0')}`,
      name,
      category,
      price,
      stock,
      sold,
      revenue: parseFloat((price * sold * faker.number.float({ min: 0.82, max: 1.0 })).toFixed(2)),
      rating: parseFloat(faker.number.float({ min: 3.4, max: 5.0 }).toFixed(1)),
      reviews: faker.number.int({ min: 12, max: 890 }),
      trend,
    }
  })
}).slice(0, 48)

const ORDER_STATUSES: OrderStatus[] = ['completed', 'processing', 'pending', 'cancelled', 'refunded']
const PAYMENT_METHODS: PaymentMethod[] = ['card', 'paypal', 'crypto', 'bank']
const STATUS_WEIGHTS = [0.55, 0.18, 0.12, 0.09, 0.06]

function weightedStatus(): OrderStatus {
  const r = faker.number.float()
  let cumulative = 0
  for (let i = 0; i < STATUS_WEIGHTS.length; i++) {
    cumulative += STATUS_WEIGHTS[i]!
    if (r < cumulative) return ORDER_STATUSES[i]!
  }
  return 'completed'
}

function generateOrderDate(orderIndex: number, total: number): Date {
  const now = new Date()
  const progress = (orderIndex / total)
  const dayOffset = Math.floor(Math.pow(1 - progress, 1.8) * 365)
  const baseDate = subDays(now, dayOffset)
  return new Date(baseDate.getTime() + faker.number.int({ min: 0, max: 86400000 }))
}

// Generate orders
export const orders: Order[] = Array.from({ length: 500 }, (_, i) => {
  const customer = customers[i % customers.length]!
  const numItems = faker.number.int({ min: 1, max: 4 })
  const items: OrderItem[] = Array.from({ length: numItems }, () => {
    const product = products[faker.number.int({ min: 0, max: products.length - 1 })]!
    return {
      productId: product.id,
      productName: product.name,
      quantity: faker.number.int({ min: 1, max: 3 }),
      unitPrice: product.price,
    }
  })
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const tax = parseFloat((subtotal * 0.08).toFixed(2))
  const shipping = subtotal > 75 ? 0 : 9.99
  const total = parseFloat((subtotal + tax + shipping).toFixed(2))

  return {
    id: `ORD-${String(10000 + i).padStart(5, '0')}`,
    customer,
    items,
    total,
    status: weightedStatus(),
    paymentMethod: PAYMENT_METHODS[faker.number.int({ min: 0, max: 3 })]!,
    date: generateOrderDate(i, 500),
    country: customer.country,
    city: customer.city,
  }
}).sort((a, b) => b.date.getTime() - a.date.getTime())

// Generate daily metrics for last 365 days
const BASE_DAILY_REVENUE = 8500
export const dailyMetrics: DailyMetric[] = Array.from({ length: 365 }, (_, i) => {
  const daysAgo = 364 - i
  const date = subDays(new Date(), daysAgo)
  const growthFactor = 1 + (i / 365) * 0.15
  const dayOfWeek = date.getDay()
  const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.72 : 1.0
  const noise = 0.85 + faker.number.float() * 0.35
  const revenue = parseFloat((BASE_DAILY_REVENUE * growthFactor * weekendFactor * noise).toFixed(2))
  const ordersCount = Math.round(revenue / faker.number.float({ min: 95, max: 145 }))
  const newCustomers = Math.round(ordersCount * faker.number.float({ min: 0.18, max: 0.35 }))
  return {
    date: format(date, 'yyyy-MM-dd'),
    revenue,
    orders: ordersCount,
    newCustomers,
    avgOrderValue: parseFloat((revenue / Math.max(1, ordersCount)).toFixed(2)),
  }
})

// Generate monthly metrics for last 12 months
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const monthlyMetrics: MonthlyMetric[] = Array.from({ length: 12 }, (_, i) => {
  const monthsAgo = 11 - i
  const date = subMonths(new Date(), monthsAgo)
  const monthIdx = date.getMonth()
  const year = date.getFullYear()
  const seasonFactor = 1 + Math.sin(((monthIdx - 2) / 12) * Math.PI * 2) * 0.15
  const growthFactor = 1 + (i / 12) * 0.15
  const baseRevenue = BASE_DAILY_REVENUE * 30 * seasonFactor * growthFactor
  const revenue = parseFloat((baseRevenue * (0.9 + faker.number.float() * 0.2)).toFixed(2))
  const revenueLastYear = parseFloat((revenue * faker.number.float({ min: 0.78, max: 0.92 })).toFixed(2))
  const ordersCount = Math.round(revenue / faker.number.float({ min: 100, max: 130 }))
  const newCustomers = Math.round(ordersCount * faker.number.float({ min: 0.2, max: 0.32 }))
  return {
    month: MONTH_NAMES[monthIdx]!,
    year,
    revenue,
    revenueLastYear,
    orders: ordersCount,
    newCustomers,
  }
})

// Computed helpers
export function getOrdersByStatus(): Record<OrderStatus, number> {
  const counts: Record<OrderStatus, number> = {
    completed: 0,
    processing: 0,
    pending: 0,
    cancelled: 0,
    refunded: 0,
  }
  for (const order of orders) {
    counts[order.status]++
  }
  return counts
}

export function getRevenueByCategory(): Record<string, number> {
  const revenue: Record<string, number> = {}
  for (const product of products) {
    revenue[product.category] = (revenue[product.category] ?? 0) + product.revenue
  }
  return revenue
}

export function getTopCustomers(n: number): Customer[] {
  return [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, n)
}

export function getTopProducts(n: number): Product[] {
  return [...products].sort((a, b) => b.revenue - a.revenue).slice(0, n)
}

export function getOrdersByCountry(): Array<{ country: string; orders: number; revenue: number }> {
  const counts: Record<string, { orders: number; revenue: number }> = {}
  for (const order of orders) {
    if (!counts[order.country]) counts[order.country] = { orders: 0, revenue: 0 }
    counts[order.country]!.orders++
    counts[order.country]!.revenue += order.total
  }
  return Object.entries(counts)
    .map(([country, data]) => ({ country, ...data }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10)
}

export function getOrdersByDayOfWeek(): Array<{ day: string; orders: number }> {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const counts = new Array<number>(7).fill(0)
  for (const order of orders) {
    const dayIdx = (order.date.getDay() + 6) % 7
    counts[dayIdx]!++
  }
  return days.map((day, i) => ({ day, orders: counts[i]! }))
}

export function getOrdersByHour(): Array<{ hour: number; orders: number }> {
  const counts = new Array<number>(24).fill(0)
  for (const order of orders) {
    counts[order.date.getHours()]!++
  }
  return Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: counts[h]! }))
}

export function getRecentOrders(n: number): Order[] {
  return orders.slice(0, n)
}

export function getCurrentMonthStats(): CurrentMonthStats {
  const now = new Date()
  const currentStart = startOfMonth(now)
  const currentEnd = endOfMonth(now)
  const lastStart = startOfMonth(subMonths(now, 1))
  const lastEnd = endOfMonth(subMonths(now, 1))

  const current = orders.filter((o) =>
    isWithinInterval(o.date, { start: currentStart, end: currentEnd })
  )
  const last = orders.filter((o) =>
    isWithinInterval(o.date, { start: lastStart, end: lastEnd })
  )

  const currentRevenue = current.reduce((s, o) => s + o.total, 0)
  const lastRevenue = last.reduce((s, o) => s + o.total, 0)
  const currentOrders = current.length
  const lastOrders = last.length
  const currentCustomers = new Set(current.map((o) => o.customer.id)).size
  const lastCustomers = new Set(last.map((o) => o.customer.id)).size
  const currentAOV = currentOrders > 0 ? currentRevenue / currentOrders : 0
  const lastAOV = lastOrders > 0 ? lastRevenue / lastOrders : 0

  const pctChange = (curr: number, prev: number) =>
    prev === 0 ? 0 : parseFloat((((curr - prev) / prev) * 100).toFixed(1))

  return {
    revenue: parseFloat(currentRevenue.toFixed(2)),
    revenueChange: pctChange(currentRevenue, lastRevenue),
    orders: currentOrders,
    ordersChange: pctChange(currentOrders, lastOrders),
    customers: currentCustomers,
    customersChange: pctChange(currentCustomers, lastCustomers),
    avgOrderValue: parseFloat(currentAOV.toFixed(2)),
    avgOrderValueChange: pctChange(currentAOV, lastAOV),
  }
}

export function getSparklineData(metric: keyof Omit<DailyMetric, 'date'>, days: number): number[] {
  return dailyMetrics.slice(-days).map((d) => d[metric])
}
