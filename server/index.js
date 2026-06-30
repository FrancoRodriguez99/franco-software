import express from 'express'
import cors from 'cors'
import si from 'systeminformation'
import mongoose from 'mongoose'
import { exec } from 'child_process'
import { promisify } from 'util'
import jwt from 'jsonwebtoken'

const ANALYTICS_PASSWORD = 'olakase852'
const JWT_SECRET = 'fr-analytics-9x4mKpQ2wLzT8nVjYsE1bUhC'
const JWT_EXPIRES = '12h'

const execAsync = promisify(exec)
const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json())

app.set('etag', false)
app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next() })

const PORT = process.env.PORT || 3001
const HISTORY_LEN = 60

const history = {
  cpu: [],
  ram: [],
  netIn: [],
  netOut: [],
}

let prevNet = null

function push(arr, val) {
  arr.push(val)
  if (arr.length > HISTORY_LEN) arr.shift()
}

function ts() {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

async function sample() {
  const t = ts()
  try {
    const [load, mem, nets] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.networkStats(),
    ])

    push(history.cpu, { t, load: Math.round(load.currentLoad) })

    push(history.ram, {
      t,
      used: parseFloat((mem.used / 1e9).toFixed(2)),
      total: parseFloat((mem.total / 1e9).toFixed(2)),
      pct: Math.round((mem.used / mem.total) * 100),
    })

    // pick first non-loopback interface with traffic
    const eth =
      nets.find(
        n =>
          n.rx_bytes > 0 &&
          !n.iface.toLowerCase().includes('lo') &&
          !n.iface.toLowerCase().includes('loopback'),
      ) || nets[0]

    if (eth && prevNet) {
      const inRate = Math.max(0, (eth.rx_bytes - prevNet.rx_bytes) / 1e6 / 2)
      const outRate = Math.max(0, (eth.tx_bytes - prevNet.tx_bytes) / 1e6 / 2)
      push(history.netIn, { t, mbps: parseFloat(inRate.toFixed(3)) })
      push(history.netOut, { t, mbps: parseFloat(outRate.toFixed(3)) })
    } else {
      push(history.netIn, { t, mbps: 0 })
      push(history.netOut, { t, mbps: 0 })
    }
    if (eth) prevNet = eth
  } catch (e) {
    console.error('sample error:', e.message)
  }
}

await sample()
setInterval(sample, 2000)

// MongoDB — connect once, keep alive
let mongoConnected = false
try {
  await mongoose.connect('mongodb://127.0.0.1:27017/', {
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 3000,
  })
  mongoConnected = true
  console.log('MongoDB connected')
} catch (e) {
  console.warn('MongoDB unavailable:', e.message)
}

// ── routes ─────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/api/metrics', (_req, res) => {
  const cpu = history.cpu.at(-1) ?? { load: 0 }
  const ram = history.ram.at(-1) ?? { used: 0, total: 0, pct: 0 }
  res.json({
    cpu: { current: cpu.load, history: history.cpu },
    ram: { ...ram, history: history.ram },
    net: {
      in: { current: history.netIn.at(-1)?.mbps ?? 0, history: history.netIn },
      out: { current: history.netOut.at(-1)?.mbps ?? 0, history: history.netOut },
    },
  })
})

app.get('/api/pm2', async (_req, res) => {
  try {
    const { stdout } = await execAsync('pm2 jlist', { windowsHide: true })
    const procs = JSON.parse(stdout).map(p => ({
      id: p.pm_id,
      name: p.name,
      pid: p.pid,
      status: p.pm2_env.status,
      cpu: p.monit?.cpu ?? 0,
      memMB: parseFloat(((p.monit?.memory ?? 0) / 1e6).toFixed(1)),
      uptime: p.pm2_env.pm_uptime ?? null,
      restarts: p.pm2_env.restart_time ?? 0,
    }))
    res.json({ ok: true, procs })
  } catch (e) {
    res.json({ ok: false, procs: [], error: e.message })
  }
})

app.get('/api/db', async (_req, res) => {
  if (!mongoConnected || !mongoose.connection.db) {
    return res.json({ connected: false, latencyMs: null, collections: [] })
  }
  try {
    const t0 = Date.now()
    const admin = mongoose.connection.db.admin()
    const { databases } = await admin.listDatabases()
    const latencyMs = Date.now() - t0

    const userDbs = databases.filter(
      d => !['admin', 'local', 'config'].includes(d.name),
    )
    const collections = []
    for (const d of userDbs) {
      const db = mongoose.connection.client.db(d.name)
      const colls = await db.listCollections().toArray()
      for (const c of colls) {
        const count = await db.collection(c.name).estimatedDocumentCount()
        collections.push({ db: d.name, name: c.name, count })
      }
    }
    res.json({ connected: true, latencyMs, collections })
  } catch (e) {
    res.json({ connected: false, latencyMs: null, collections: [], error: e.message })
  }
})

app.get('/api/caddy', async (_req, res) => {
  try {
    const r = await fetch('http://localhost:2019/config/', {
      signal: AbortSignal.timeout(2000),
    })
    res.json({ running: r.ok })
  } catch {
    res.json({ running: false })
  }
})

// ── analytics ───────────────────────────────────────────────────────────────

const aSessionSchema = new mongoose.Schema({
  sid:         { type: String, index: true, unique: true },
  vid:         { type: String, index: true },
  ip:          String,
  botScore:    Number,
  botSignals:  [String],
  isBot:       Boolean,
  mouseMoved:  { type: Boolean, default: false },
  userAgent:   String,
  language:    String,
  timezone:    String,
  screenW:     Number,
  screenH:     Number,
  deviceType:  String,
  colorScheme: String,
  referrer:    String,
  isReturning: Boolean,
  startedAt:   { type: Date, default: Date.now },
  lastActiveAt:{ type: Date, default: Date.now },
  pageCount:   { type: Number, default: 0 },
  eventCount:  { type: Number, default: 0 },
}, { collection: 'analytics_sessions', versionKey: false })

const aEventSchema = new mongoose.Schema({
  sid:  String,
  vid:  String,
  type: String,
  ts:   Date,
  page: String,
  data: mongoose.Schema.Types.Mixed,
}, { collection: 'analytics_events', versionKey: false })

const ASession = mongoose.model('ASession', aSessionSchema)
const AEvent   = mongoose.model('AEvent',   aEventSchema)

app.post('/api/analytics/auth', (req, res) => {
  const { password } = req.body
  if (password !== ANALYTICS_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'invalid password' })
  }
  const token = jwt.sign({ role: 'analytics' }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
  res.json({ ok: true, token })
})

function requireToken(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ ok: false })
  try {
    jwt.verify(auth.slice(7), JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ ok: false, error: 'token expired' })
  }
}

app.get('/api/analytics/data', requireToken, async (req, res) => {
  if (!mongoConnected) return res.json({ ok: false, sessions: [], total: 0 })
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const skip  = parseInt(req.query.skip) || 0

    const [sessions, total] = await Promise.all([
      ASession.find().sort({ startedAt: -1 }).skip(skip).limit(limit).lean(),
      ASession.countDocuments(),
    ])

    const sids = sessions.map(s => s.sid)
    const events = await AEvent.find({ sid: { $in: sids } }).sort({ ts: 1 }).lean()

    const bySession = {}
    for (const e of events) {
      if (!bySession[e.sid]) bySession[e.sid] = []
      bySession[e.sid].push(e)
    }

    res.json({
      ok: true,
      total,
      sessions: sessions.map(s => ({ ...s, events: bySession[s.sid] || [] })),
    })
  } catch (e) {
    console.error('analytics/data error:', e.message)
    res.json({ ok: false, sessions: [], total: 0 })
  }
})

app.post('/api/vitals', async (req, res) => {
  // always ack immediately so the browser is never blocked
  res.json({ ok: true })
  if (!mongoConnected) return

  try {
    const { sid, vid, session, mouseMoved, events = [] } = req.body
    if (!sid) return

    const ip = [
      req.headers['x-forwarded-for'],
      req.headers['x-real-ip'],
      req.socket?.remoteAddress,
    ].find(Boolean)?.split(',')[0].trim() ?? ''

    const pvCount = events.filter(e => e.type === 'pageview').length
    const inc = { eventCount: events.length }
    if (pvCount > 0) inc.pageCount = pvCount

    const update = {
      $set: { lastActiveAt: new Date(), mouseMoved: Boolean(mouseMoved) },
      $inc: inc,
    }
    if (session) {
      update.$setOnInsert = { ...session, sid, vid, ip, startedAt: new Date() }
    }

    await Promise.all([
      ASession.findOneAndUpdate({ sid }, update, { upsert: true }),
      events.length
        ? AEvent.insertMany(events.map(e => ({ ...e, sid, vid, ts: new Date(e.ts) })))
        : Promise.resolve(),
    ])
  } catch (e) {
    console.error('analytics error:', e.message)
  }
})

app.listen(PORT, () => console.log(`Stats API on :${PORT}`))
