import { useEffect, useState } from 'react'

export type Route = { page: 'list' } | { page: 'sheet' | 'play'; id: string }

function parseHash(): Route {
  const m = location.hash.match(/^#\/c\/([^/]+)\/(sheet|play)/)
  return m ? { page: m[2] as 'sheet' | 'play', id: decodeURIComponent(m[1]) } : { page: 'list' }
}

export function go(r: Route) {
  location.hash = r.page === 'list' ? '#/' : `#/c/${encodeURIComponent(r.id)}/${r.page}`
}

export function useRoute() {
  const [route, setRoute] = useState(parseHash)
  useEffect(() => {
    const on = () => setRoute(parseHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
