import { useEffect, useState, useRef, type ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import './KpiCard.scss'

interface KpiCardProps {
  title: string
  value: number
  change: number
  icon: ReactNode
  format?: 'currency' | 'number' | 'decimal'
  sparklineData: number[]
  loading?: boolean
}

function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    startRef.current = null
    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return count
}

function formatValue(value: number, format: KpiCardProps['format']): string {
  if (format === 'currency') {
    return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 })
  }
  if (format === 'decimal') {
    return '$' + (value / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return value.toLocaleString('en-US')
}

export function KpiCard({ title, value, change, icon, format = 'number', sparklineData, loading = false }: KpiCardProps) {
  const animatedValue = useCountUp(value)
  const isPositive = change >= 0
  const sparkData = sparklineData.map((v, i) => ({ i, v }))

  if (loading) {
    return (
      <div className="kpi-card kpi-card--loading">
        <div className="kpi-card__skeleton-header" />
        <div className="kpi-card__skeleton-value" />
        <div className="kpi-card__skeleton-trend" />
      </div>
    )
  }

  return (
    <div className="kpi-card">
      <div className="kpi-card__header">
        <span className="kpi-card__title">{title}</span>
        <span className="kpi-card__icon" aria-hidden="true">{icon}</span>
      </div>
      <div className="kpi-card__value" aria-label={`${title}: ${formatValue(value, format)}`}>
        {formatValue(animatedValue, format)}
      </div>
      <div className="kpi-card__footer">
        <span className={`kpi-card__change ${isPositive ? 'kpi-card__change--up' : 'kpi-card__change--down'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{Math.abs(change).toFixed(1)}% vs last month</span>
        </span>
        <div className="kpi-card__sparkline" aria-label={`${title} sparkline`}>
          <ResponsiveContainer width="100%" height={36}>
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={isPositive ? '#22c55e' : '#ef4444'}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={true}
                animationDuration={700}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
