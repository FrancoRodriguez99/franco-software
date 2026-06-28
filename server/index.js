import express from 'express'
import cors from 'cors'
import si from 'systeminformation'
import mongoose from 'mongoose'
import { exec } from 'child_process'
import { promisify } from 'util'

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

app.listen(PORT, () => console.log(`Stats API on :${PORT}`))
