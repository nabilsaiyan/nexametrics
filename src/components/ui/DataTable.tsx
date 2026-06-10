import { type ReactNode, useState, useCallback, useMemo } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import './DataTable.scss'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  sortValue?: (row: T) => string | number
  render: (row: T, index: number) => ReactNode
  priority?: 'high' | 'medium' | 'low'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  newRowId?: string | null
  emptyMessage?: string
  emptyIcon?: ReactNode
  loading?: boolean
  skeletonRows?: number
}

type SortDir = 'asc' | 'desc'

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  newRowId,
  emptyMessage = 'No data found',
  emptyIcon,
  loading = false,
  skeletonRows = 5,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }, [sortKey])

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    const col = columns.find((c) => c.key === sortKey)
    return [...data].sort((a, b) => {
      const aVal = col?.sortValue ? col.sortValue(a) : (a as Record<string, unknown>)[sortKey]
      const bVal = col?.sortValue ? col.sortValue(b) : (b as Record<string, unknown>)[sortKey]
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })
  }, [data, sortKey, sortDir, columns])

  if (loading) {
    return (
      <div className="data-table-wrapper">
        <table className="data-table" aria-label="Loading data">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`data-table__th priority-${col.priority ?? 'high'}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: skeletonRows }, (_, i) => (
              <tr key={i} className="data-table__row">
                {columns.map((col) => (
                  <td key={col.key} className={`data-table__td priority-${col.priority ?? 'high'}`}>
                    <span className="data-table__skeleton" style={{ width: `${60 + Math.random() * 30}%` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="data-table-empty">
        {emptyIcon && <div className="data-table-empty__icon" aria-hidden="true">{emptyIcon}</div>}
        <p className="data-table-empty__msg">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="data-table-wrapper" role="region" aria-label="Data table">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`data-table__th priority-${col.priority ?? 'high'} ${col.sortable ? 'data-table__th--sortable' : ''}`}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                aria-sort={
                  sortKey === col.key
                    ? sortDir === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
                tabIndex={col.sortable ? 0 : undefined}
                onKeyDown={col.sortable ? (e) => e.key === 'Enter' && handleSort(col.key) : undefined}
              >
                <span className="data-table__th-inner">
                  {col.label}
                  {col.sortable && (
                    <span className="data-table__sort-icons" aria-hidden="true">
                      <ChevronUp
                        size={11}
                        className={sortKey === col.key && sortDir === 'asc' ? 'active' : ''}
                      />
                      <ChevronDown
                        size={11}
                        className={sortKey === col.key && sortDir === 'desc' ? 'active' : ''}
                      />
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => {
            const id = keyExtractor(row)
            const isNew = newRowId === id
            return (
              <tr
                key={id}
                className={`data-table__row ${onRowClick ? 'data-table__row--clickable' : ''} ${isNew ? 'data-table__row--new' : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`data-table__td priority-${col.priority ?? 'high'}`}>
                    {col.render(row, index)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
