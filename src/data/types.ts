export type OrderStatus = 'completed' | 'processing' | 'pending' | 'cancelled' | 'refunded'
export type PaymentMethod = 'card' | 'paypal' | 'crypto' | 'bank'
export type CustomerStatus = 'active' | 'inactive' | 'vip'
export type CustomerSegment = 'new' | 'returning' | 'loyal' | 'at-risk'
export type ProductTrend = 'up' | 'down' | 'stable'

export interface Customer {
  id: string
  name: string
  email: string
  avatar: string
  country: string
  city: string
  totalSpent: number
  totalOrders: number
  joinedDate: Date
  status: CustomerStatus
  segment: CustomerSegment
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export interface Order {
  id: string
  customer: Customer
  items: OrderItem[]
  total: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  date: Date
  country: string
  city: string
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  sold: number
  revenue: number
  rating: number
  reviews: number
  trend: ProductTrend
}

export interface DailyMetric {
  date: string
  revenue: number
  orders: number
  newCustomers: number
  avgOrderValue: number
}

export interface MonthlyMetric {
  month: string
  year: number
  revenue: number
  revenueLastYear: number
  orders: number
  newCustomers: number
}

export interface CurrentMonthStats {
  revenue: number
  revenueChange: number
  orders: number
  ordersChange: number
  customers: number
  customersChange: number
  avgOrderValue: number
  avgOrderValueChange: number
}
