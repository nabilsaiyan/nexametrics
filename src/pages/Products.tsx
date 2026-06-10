import { useState, useMemo, useEffect, useCallback } from 'react'
import { LayoutGrid, List, X, Star, TrendingUp, TrendingDown, Minus, Search, ChevronDown } from 'lucide-react'
import type { Product } from '../data/types'
import { Badge } from '../components/ui/Badge'
import { DataTable, type Column } from '../components/ui/DataTable'
import { useApi } from '../hooks/useApi'
import { useDebounce } from '../hooks/useDebounce'
import './Products.scss'

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home', 'Sports', 'Beauty', 'Food']

const CATEGORY_GRADIENTS: Record<string, string> = {
  Electronics: 'linear-gradient(135deg, #0d2a4a 0%, #0a3060 100%)',
  Fashion: 'linear-gradient(135deg, #2a0d3a 0%, #3a0a50 100%)',
  Home: 'linear-gradient(135deg, #0a2d1a 0%, #0a3820 100%)',
  Sports: 'linear-gradient(135deg, #2d2000 0%, #3a2a00 100%)',
  Beauty: 'linear-gradient(135deg, #2d0a0a 0%, #3a0d0d 100%)',
  Food: 'linear-gradient(135deg, #0a1a2d 0%, #0a2040 100%)',
}

const CATEGORY_ACCENT: Record<string, string> = {
  Electronics: '#8b5cf6', Fashion: '#a78bfa', Home: '#34d399',
  Sports: '#f59e0b', Beauty: '#ef4444', Food: '#60a5fa',
}

type SortKey = 'revenue-desc' | 'revenue-asc' | 'price-desc' | 'price-asc' | 'rating-desc' | 'stock-desc'
type ViewMode = 'grid' | 'table'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="star-rating" aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className="star-rating__star" style={{ color: star <= Math.floor(rating) ? '#f59e0b' : '#3e4a66' }}>
          <Star size={11} fill="currentColor" />
        </span>
      ))}
      <span className="star-rating__value number">{rating.toFixed(1)}</span>
    </div>
  )
}

function StockPill({ stock }: { stock: number }) {
  const variant = stock >= 50 ? 'green' : stock >= 10 ? 'amber' : 'red'
  const label = stock === 0 ? 'Out of stock' : stock < 10 ? `Only ${stock} left` : stock < 50 ? `${stock} left` : `${stock} in stock`
  return <Badge variant={variant}>{label}</Badge>
}

function TrendIcon({ trend }: { trend: Product['trend'] }) {
  if (trend === 'up') return <TrendingUp size={14} style={{ color: '#34d399' }} />
  if (trend === 'down') return <TrendingDown size={14} style={{ color: '#ef4444' }} />
  return <Minus size={14} style={{ color: '#3e4a66' }} />
}

function ProductCard({ product }: { product: Product }) {
  const gradient = CATEGORY_GRADIENTS[product.category] ?? CATEGORY_GRADIENTS['Electronics']!
  const accent = CATEGORY_ACCENT[product.category] ?? '#8b5cf6'
  const badgeVariant = (product.category === 'Electronics' ? 'cyan' : product.category === 'Fashion' ? 'purple' : product.category === 'Home' ? 'green' : product.category === 'Sports' ? 'amber' : product.category === 'Beauty' ? 'red' : 'blue') as 'cyan' | 'purple' | 'green' | 'amber' | 'red' | 'blue'

  return (
    <div className="product-card">
      <div className="product-card__header" style={{ background: gradient, borderBottom: `1px solid ${accent}22` }}>
        <span className="product-card__category-dot" style={{ background: accent }} aria-hidden="true" />
        <Badge variant={badgeVariant}>{product.category}</Badge>
      </div>
      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        <div className="product-card__price number">${product.price.toFixed(2)}</div>
        <StarRating rating={product.rating} />
        <div className="product-card__meta"><StockPill stock={product.stock} /><TrendIcon trend={product.trend} /></div>
        <div className="product-card__stats">
          <span className="product-card__stat"><span className="product-card__stat-label">Sold</span><span className="number product-card__stat-val">{product.sold.toLocaleString()}</span></span>
          <span className="product-card__stat"><span className="product-card__stat-label">Revenue</span><span className="number product-card__stat-val">${Math.round(product.revenue / 1000)}k</span></span>
          <span className="product-card__stat"><span className="product-card__stat-label">Reviews</span><span className="number product-card__stat-val">{product.reviews}</span></span>
        </div>
      </div>
    </div>
  )
}

export function Products() {
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<SortKey>('revenue-desc')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>(() => (localStorage.getItem('products-view') as ViewMode) ?? 'grid')
  const [dismissedLowStock, setDismissedLowStock] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => { document.title = 'Products — NexaMetrics' }, [])
  useEffect(() => { localStorage.setItem('products-view', view) }, [view])

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (category !== 'All') params.set('category', category)
    if (debouncedSearch) params.set('search', debouncedSearch)
    params.set('sort', sort)
    return `/api/products?${params.toString()}`
  }, [category, debouncedSearch, sort])

  const { data: products, loading } = useApi<Product[]>(apiUrl, [apiUrl])

  const categoryCounts = useMemo(() => {
    const all = products ?? []
    const counts: Record<string, number> = { All: all.length }
    for (const p of all) counts[p.category] = (counts[p.category] ?? 0) + 1
    return counts
  }, [products])

  const { data: allProducts } = useApi<Product[]>('/api/products')
  const lowStockProducts = useMemo(() => (allProducts ?? []).filter((p) => p.stock < 10), [allProducts])

  const handleDismiss = useCallback(() => setDismissedLowStock(true), [])

  const tableColumns = useMemo<Column<Product>[]>(() => [
    { key: 'name', label: 'Product', render: (p) => (<div><div style={{ color: 'var(--t1)', fontWeight: 500 }}>{p.name}</div><div style={{ color: 'var(--t3)', fontSize: '0.75rem' }}>{p.id}</div></div>) },
    { key: 'cat', label: 'Category', render: (p) => <Badge variant={p.category === 'Electronics' ? 'cyan' : p.category === 'Fashion' ? 'purple' : p.category === 'Home' ? 'green' : p.category === 'Sports' ? 'amber' : p.category === 'Beauty' ? 'red' : 'blue'}>{p.category}</Badge>, priority: 'medium' },
    { key: 'price', label: 'Price', render: (p) => <span className="number" style={{ color: 'var(--t1)', fontWeight: 600 }}>${p.price.toFixed(2)}</span>, sortable: true },
    { key: 'stock', label: 'Stock', render: (p) => <StockPill stock={p.stock} />, priority: 'medium' },
    { key: 'sold', label: 'Sold', render: (p) => <span className="number" style={{ color: 'var(--t2)' }}>{p.sold.toLocaleString()}</span>, sortable: true, priority: 'low' },
    { key: 'revenue', label: 'Revenue', render: (p) => <span className="number" style={{ color: 'var(--t1)', fontWeight: 600 }}>${Math.round(p.revenue / 1000)}k</span>, sortable: true },
    { key: 'rating', label: 'Rating', render: (p) => <StarRating rating={p.rating} />, sortable: true, priority: 'medium' },
    { key: 'trend', label: 'Trend', render: (p) => <TrendIcon trend={p.trend} />, priority: 'low' },
  ], [])

  return (
    <div className="products">
      {!dismissedLowStock && lowStockProducts.length > 0 && (
        <div className="products__low-stock-banner" role="alert">
          <span>⚠ {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's are' : ' is'} low on stock: {lowStockProducts.slice(0, 3).map((p) => p.name).join(', ')}{lowStockProducts.length > 3 ? ` +${lowStockProducts.length - 3} more` : ''}</span>
          <button onClick={handleDismiss} aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      <div className="products__toolbar">
        <div className="products__category-tabs" role="tablist" aria-label="Filter by category">
          {CATEGORIES.map((cat) => (
            <button key={cat} role="tab" aria-selected={category === cat} className={`products__cat-tab ${category === cat ? 'products__cat-tab--active' : ''}`} onClick={() => setCategory(cat)}>
              {cat}<span className="products__cat-count">{categoryCounts[cat] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="products__controls">
          <label htmlFor="products-sort" className="sr-only">Sort products</label>
          <div className="products__sort-wrap">
            <select id="products-sort" className="products__sort-select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="revenue-desc">Revenue ↓</option>
              <option value="revenue-asc">Revenue ↑</option>
              <option value="price-desc">Price ↓</option>
              <option value="price-asc">Price ↑</option>
              <option value="rating-desc">Rating ↓</option>
              <option value="stock-desc">Stock ↓</option>
            </select>
            <ChevronDown size={13} className="products__sort-chevron" aria-hidden="true" />
          </div>
          <div className="products__search-wrap">
            <Search size={13} className="products__search-icon" aria-hidden="true" />
            <label htmlFor="products-search" className="sr-only">Search products</label>
            <input id="products-search" type="text" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} className="products__search" />
          </div>
          <div className="products__view-toggle" role="group" aria-label="View mode">
            <button className={`products__view-btn ${view === 'grid' ? 'products__view-btn--active' : ''}`} onClick={() => setView('grid')} aria-pressed={view === 'grid'} aria-label="Grid view"><LayoutGrid size={16} /></button>
            <button className={`products__view-btn ${view === 'table' ? 'products__view-btn--active' : ''}`} onClick={() => setView('table')} aria-pressed={view === 'table'} aria-label="Table view"><List size={16} /></button>
          </div>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="products__grid">
          {loading ? Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="product-card" style={{ minHeight: 220 }}>
              <div className="product-card__header" style={{ background: '#131622' }} />
              <div className="product-card__body" style={{ gap: 10 }}>
                {[80, 50, 70, 40].map((w) => (
                  <span key={w} style={{ display: 'block', height: 12, width: `${w}%`, background: 'linear-gradient(90deg,#131622 0%,rgba(58,85,112,0.15) 50%,#131622 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 4 }} />
                ))}
              </div>
            </div>
          )) : (products ?? []).map((p) => <ProductCard key={p.id} product={p} />)}
          {!loading && (products ?? []).length === 0 && (
            <div className="products__empty"><Search size={32} style={{ color: '#3e4a66', opacity: 0.5 }} /><p>No products match your filters</p></div>
          )}
        </div>
      ) : (
        <div className="products__table-card">
          <DataTable columns={tableColumns} data={products ?? []} keyExtractor={(p) => p.id} emptyMessage="No products match your filters" emptyIcon={<Search size={32} />} loading={loading} />
        </div>
      )}
    </div>
  )
}
