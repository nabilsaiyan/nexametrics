import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, Users, Package } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Order, Customer, Product } from '../../data/types'
import './CommandPalette.scss'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  searchValue: string
  onSearchChange: (v: string) => void
}

interface CommandItem {
  id: string
  label: string
  sublabel: string
  type: 'order' | 'customer' | 'product'
  path: string
}

function toOrderItem(o: Order): CommandItem {
  return { id: o.id, label: o.id, sublabel: `${o.customer.name} · $${o.total.toFixed(2)}`, type: 'order', path: '/orders' }
}
function toCustomerItem(c: Customer): CommandItem {
  return { id: c.id, label: c.name, sublabel: c.email, type: 'customer', path: '/customers' }
}
function toProductItem(p: Product): CommandItem {
  return { id: p.id, label: p.name, sublabel: `${p.category} · $${p.price}`, type: 'product', path: '/products' }
}

export function CommandPalette({ isOpen, onClose, searchValue, onSearchChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [results, setResults] = useState<CommandItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setActiveIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)

    const q = searchValue.trim()
    const timer = setTimeout(async () => {
      try {
        if (!q) {
          const [ordersRes, customersRes, productsRes] = await Promise.all([
            fetch('/api/orders/recent?n=3').then((r) => r.json()) as Promise<Order[]>,
            fetch('/api/customers').then((r) => r.json()) as Promise<Customer[]>,
            fetch('/api/products/top?n=3').then((r) => r.json()) as Promise<Product[]>,
          ])
          setResults([
            ...ordersRes.slice(0, 3).map(toOrderItem),
            ...customersRes.slice(0, 3).map(toCustomerItem),
            ...productsRes.slice(0, 3).map(toProductItem),
          ])
        } else {
          const encoded = encodeURIComponent(q)
          const [ordersRes, customersRes, productsRes] = await Promise.all([
            fetch(`/api/orders?search=${encoded}&pageSize=3`).then((r) => r.json()) as Promise<{ data: Order[] }>,
            fetch(`/api/customers?search=${encoded}`).then((r) => r.json()) as Promise<Customer[]>,
            fetch(`/api/products?search=${encoded}`).then((r) => r.json()) as Promise<Product[]>,
          ])
          setResults([
            ...(ordersRes.data ?? []).slice(0, 3).map(toOrderItem),
            ...customersRes.slice(0, 3).map(toCustomerItem),
            ...productsRes.slice(0, 3).map(toProductItem),
          ])
        }
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, q ? 200 : 0)

    return () => clearTimeout(timer)
  }, [searchValue, isOpen])

  const handleSelect = useCallback((item: CommandItem) => {
    navigate(item.path)
    onClose()
  }, [navigate, onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % Math.max(results.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1))
    } else if (e.key === 'Enter' && results[activeIndex]) {
      handleSelect(results[activeIndex]!)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [results, activeIndex, handleSelect, onClose])

  const iconFor = (type: CommandItem['type']) => {
    if (type === 'order') return <ShoppingCart size={14} />
    if (type === 'customer') return <Users size={14} />
    return <Package size={14} />
  }

  const sectionFor = (type: CommandItem['type']) => {
    if (type === 'order') return 'Orders'
    if (type === 'customer') return 'Customers'
    return 'Products'
  }

  let lastSection = ''

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="cmd-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="cmd-palette"
            role="dialog"
            aria-label="Command palette"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.16 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            <div className="cmd-palette__search">
              <Search size={16} className="cmd-palette__search-icon" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={(e) => { onSearchChange(e.target.value); setActiveIndex(0) }}
                placeholder="Search orders, customers, products…"
                className="cmd-palette__input"
                aria-label="Search"
                aria-autocomplete="list"
                aria-activedescendant={results[activeIndex] ? `cmd-item-${activeIndex}` : undefined}
              />
              <kbd className="cmd-palette__esc">ESC</kbd>
            </div>
            <div className="cmd-palette__results" role="listbox" aria-label="Search results">
              {loading && <div className="cmd-palette__empty" aria-live="polite">Searching…</div>}
              {!loading && results.length === 0 && (
                <div className="cmd-palette__empty">No results found</div>
              )}
              {!loading && results.map((item, i) => {
                const section = sectionFor(item.type)
                const showHeader = section !== lastSection
                lastSection = section
                return (
                  <div key={item.id}>
                    {showHeader && (
                      <div className="cmd-palette__section-header">{section}</div>
                    )}
                    <button
                      id={`cmd-item-${i}`}
                      role="option"
                      aria-selected={i === activeIndex}
                      className={`cmd-palette__item ${i === activeIndex ? 'cmd-palette__item--active' : ''}`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setActiveIndex(i)}
                    >
                      <span className="cmd-palette__item-icon" aria-hidden="true">{iconFor(item.type)}</span>
                      <span className="cmd-palette__item-content">
                        <span className="cmd-palette__item-label">{item.label}</span>
                        <span className="cmd-palette__item-sub">{item.sublabel}</span>
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="cmd-palette__footer">
              <span><kbd>↑↓</kbd> navigate</span>
              <span><kbd>↵</kbd> select</span>
              <span><kbd>ESC</kbd> close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
