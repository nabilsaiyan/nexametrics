import { useState, useEffect, useCallback } from 'react'
import type { Order, CurrentMonthStats } from '../data/types'

export function useLiveMetrics(initialStats: CurrentMonthStats, initialOrders: Order[]) {
  const [liveOrders, setLiveOrders] = useState<Order[]>(initialOrders)
  const [stats, setStats] = useState<CurrentMonthStats>(initialStats)
  const [newOrderId, setNewOrderId] = useState<string | null>(null)

  const fetchLiveOrder = useCallback(async () => {
    try {
      const res = await fetch('/api/orders/live')
      if (!res.ok) return
      const order = await res.json() as Order
      setNewOrderId(order.id)
      setLiveOrders((prev) => [order, ...prev].slice(0, 10))
      setStats((prev) => ({
        ...prev,
        revenue: parseFloat((prev.revenue + order.total).toFixed(2)),
        orders: prev.orders + 1,
        avgOrderValue: parseFloat(((prev.revenue + order.total) / (prev.orders + 1)).toFixed(2)),
      }))
      setTimeout(() => setNewOrderId(null), 1500)
    } catch {
      // silently ignore — live updates are best-effort
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(fetchLiveOrder, 8000)
    return () => clearInterval(interval)
  }, [fetchLiveOrder])

  return { liveOrders, stats, newOrderId }
}
