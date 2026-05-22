import { useState, useEffect, useCallback, useRef } from 'react'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>(url: string | null, deps: unknown[] = []) {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: !!url, error: null })
  const abortRef = useRef<AbortController | null>(null)

  const fetch_ = useCallback(async (fetchUrl: string) => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const res = await fetch(fetchUrl, { signal: ctrl.signal })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const json = await res.json() as T
      setState({ data: json, loading: false, error: null })
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setState({ data: null, loading: false, error: (err as Error).message })
    }
  }, [])

  useEffect(() => {
    if (!url) return
    void fetch_(url)
    return () => abortRef.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps])

  const refetch = useCallback(() => { if (url) void fetch_(url) }, [url, fetch_])

  return { ...state, refetch }
}
