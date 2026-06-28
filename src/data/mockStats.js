// All mock data — replace with real API calls when backend is ready

export const serverStatus = {
  online: true,
  uptime: 99.7,
  region: 'EU-WEST-1',
  version: 'v2.4.1',
}

export const dbStatus = {
  connected: true,
  userCount: 39,
  schemaCount: 12,
  latencyMs: 4,
  name: 'MongoDB Atlas',
}

export const wiredStatus = {
  liveDataIn: 2.1,
  liveDataOut: 1.0,
  unit: 'MB/s',
}

// Last 24 hours, one point per hour
function buildHourly(baseMs, variance) {
  return Array.from({ length: 24 }, (_, i) => {
    const hour = i
    const label = `${String(hour).padStart(2, '0')}:00`
    const val = Math.round((baseMs + (Math.random() - 0.5) * variance) * 10) / 10
    return { time: label, value: val }
  })
}

export const apiResponseData = buildHourly(42, 30)

// User interactions over last 7 days
export const userInteractionData = [
  { day: 'Mon', visits: 14, interactions: 38 },
  { day: 'Tue', visits: 22, interactions: 61 },
  { day: 'Wed', visits: 18, interactions: 44 },
  { day: 'Thu', visits: 31, interactions: 89 },
  { day: 'Fri', visits: 27, interactions: 72 },
  { day: 'Sat', visits: 9,  interactions: 21 },
  { day: 'Sun', visits: 12, interactions: 35 },
]

// CPU load history (last 12 intervals)
export const cpuData = Array.from({ length: 20 }, (_, i) => ({
  t: i,
  load: Math.round(20 + Math.random() * 55),
}))
