import './Skeleton.scss'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 6, className = '' }: SkeletonProps) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card__header">
        <Skeleton width={80} height={12} />
        <Skeleton width={32} height={32} borderRadius="50%" />
      </div>
      <Skeleton width={120} height={28} borderRadius={6} />
      <Skeleton width="60%" height={10} />
    </div>
  )
}
