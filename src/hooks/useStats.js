import { useState, useEffect, useRef } from 'react'

const METRICS_MS = 2000
const PM2_MS = 6000
const DB_MS = 15000
const CADDY_MS = 30000

async function fetchJSON(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(r.statusText)
  return r.json()
}

export function useStats() {
  const [serverOnline, setServerOnline] = useState(null) // null = unknown
  const [metrics, setMetrics] = useState(null)
  const [pm2, setPm2] = useState(null)
  const [db, setDb] = useState(null)
  const [caddy, setCaddy] = useState(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true

    async function pollMetrics() {
      try {
        const data = await fetchJSON('/api/metrics')
        if (mounted.current) { setMetrics(data); setServerOnline(true) }
      } catch (e) {
        console.warn('[useStats] metrics fetch failed:', e.message)
        if (mounted.current) setServerOnline(false)
      }
    }

    async function pollPm2() {
      try {
        const data = await fetchJSON('/api/pm2')
        if (mounted.current) setPm2(data)
      } catch {}
    }

    async function pollDb() {
      try {
        const data = await fetchJSON('/api/db')
        if (mounted.current) setDb(data)
      } catch {}
    }

    async function pollCaddy() {
      try {
        const data = await fetchJSON('/api/caddy')
        if (mounted.current) setCaddy(data)
      } catch {}
    }

    pollMetrics(); pollPm2(); pollDb(); pollCaddy()

    const t1 = setInterval(pollMetrics, METRICS_MS)
    const t2 = setInterval(pollPm2, PM2_MS)
    const t3 = setInterval(pollDb, DB_MS)
    const t4 = setInterval(pollCaddy, CADDY_MS)

    return () => {
      mounted.current = false
      clearInterval(t1); clearInterval(t2); clearInterval(t3); clearInterval(t4)
    }
  }, [])

  return { serverOnline, metrics, pm2, db, caddy }
}
