import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import PulsingDot from '../../components/PulsingDot/PulsingDot'
import { useStats } from '../../hooks/useStats'
import styles from './Stats.module.css'

// ── helpers ────────────────────────────────────────────────────────────────

function fmt(ms) {
  if (!ms) return '—'
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
  return `${Math.floor(s / 86400)}d`
}

function statusColor(st) {
  if (st === 'online') return '#00ff88'
  if (st === 'stopped') return '#ffcc00'
  return '#ff3860'
}

// ── sub-components ─────────────────────────────────────────────────────────

function Tip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.ttLabel}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value}{unit}
        </p>
      ))}
    </div>
  )
}

function Gauge({ pct = 0, color = '#00f5ff' }) {
  const r = 32
  const circ = 2 * Math.PI * r
  const dash = Math.min(pct / 100, 1) * circ
  return (
    <svg width={88} height={88} viewBox="0 0 88 88" className={styles.gauge}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(0,245,255,0.08)" strokeWidth="7" />
      <circle
        cx="44" cy="44" r={r} fill="none"
        stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 44 44)"
        style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 0.5s ease' }}
      />
      <text x="44" y="49" textAnchor="middle" fill={color}
        fontSize="15" fontFamily="Orbitron, sans-serif" fontWeight="700">
        {pct}%
      </text>
    </svg>
  )
}

function OfflineOverlay({ msg = 'API server offline' }) {
  return (
    <div className={styles.offline}>
      <span className={styles.offlineIcon}>⚠</span>
      <span>{msg}</span>
    </div>
  )
}

// ── main ───────────────────────────────────────────────────────────────────

export default function Stats() {
  const { serverOnline, metrics, pm2, db, caddy } = useStats()

  const cpu = metrics?.cpu
  const ram = metrics?.ram
  const netIn = metrics?.net?.in
  const netOut = metrics?.net?.out

  // merge in/out into one series for dual chart
  const netHistory = (netIn?.history ?? []).map((pt, i) => ({
    t: pt.t,
    in: pt.mbps,
    out: netOut?.history?.[i]?.mbps ?? 0,
  }))

  const ramPct = ram?.pct ?? 0
  const cpuPct = cpu?.current ?? 0

  return (
    <div className={`${styles.page} grid-bg`}>

      {/* ── header ── */}
      <div className={styles.pageHeader}>
        <span className={styles.headerLabel}>// SYSTEM_MONITOR</span>
        <h1 className={styles.pageTitle}>DASHBOARD</h1>
        <p className={styles.pageSubtitle}>
          Live system metrics — franco-software infrastructure
          {serverOnline === false && <span className={styles.apiDown}> · API OFFLINE</span>}
        </p>
      </div>

      <div className={styles.grid}>

        {/* ── CPU live card ── */}
        <div className={`${styles.panel} ${styles.panelCpuLive}`}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>CPU LOAD</span>
            <PulsingDot color={serverOnline ? 'cyan' : 'red'} />
          </div>
          <div className={styles.gaugeRow}>
            <Gauge pct={cpuPct} color="#00f5ff" />
            <div className={styles.gaugeMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaKey}>CURRENT</span>
                <span className={styles.metaVal} style={{ color: '#00f5ff' }}>{cpuPct}%</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaKey}>AVG (60s)</span>
                <span className={styles.metaVal}>
                  {cpu?.history?.length
                    ? Math.round(cpu.history.reduce((s, p) => s + p.load, 0) / cpu.history.length)
                    : '—'}%
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaKey}>PEAK (60s)</span>
                <span className={styles.metaVal}>
                  {cpu?.history?.length
                    ? Math.max(...cpu.history.map(p => p.load))
                    : '—'}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RAM live card ── */}
        <div className={`${styles.panel} ${styles.panelRamLive}`}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>MEMORY</span>
            <PulsingDot color={serverOnline ? 'green' : 'red'} />
          </div>
          <div className={styles.gaugeRow}>
            <Gauge pct={ramPct} color="#00ff88" />
            <div className={styles.gaugeMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaKey}>USED</span>
                <span className={styles.metaVal} style={{ color: '#00ff88' }}>{ram?.used ?? '—'} GB</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaKey}>FREE</span>
                <span className={styles.metaVal}>
                  {ram ? `${(ram.total - ram.used).toFixed(2)} GB` : '—'}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaKey}>TOTAL</span>
                <span className={styles.metaVal}>{ram?.total ?? '—'} GB</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Network live card ── */}
        <div className={`${styles.panel} ${styles.panelNetLive}`}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>ETHERNET</span>
            <PulsingDot color="cyan" label="LIVE" />
          </div>
          <div className={styles.netLiveWrap}>
            <div className={styles.netStat}>
              <span className={styles.netArrow} style={{ color: '#00f5ff' }}>↓</span>
              <span className={styles.netNum} style={{ color: '#00f5ff' }}>
                {netIn?.current?.toFixed(3) ?? '—'}
              </span>
              <span className={styles.netUnit}>MB/s IN</span>
            </div>
            <div className={styles.netDivider} />
            <div className={styles.netStat}>
              <span className={styles.netArrow} style={{ color: '#00ff88' }}>↑</span>
              <span className={styles.netNum} style={{ color: '#00ff88' }}>
                {netOut?.current?.toFixed(3) ?? '—'}
              </span>
              <span className={styles.netUnit}>MB/s OUT</span>
            </div>
          </div>
          <p className={styles.netNote}>// ethernet · encrypted · live</p>
        </div>

        {/* ── CPU chart (full width) ── */}
        <div className={`${styles.panel} ${styles.panelCpuChart}`}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>CPU LOAD — LAST 2 MIN</span>
            <PulsingDot color="cyan" />
          </div>
          {serverOnline === false
            ? <OfflineOverlay />
            : (
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={cpu?.history ?? []} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cpuG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#00f5ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,245,255,0.07)" />
                    <XAxis dataKey="t" tick={false} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#6a9bb5', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip unit="%" />} />
                    <Area type="monotone" dataKey="load" name="CPU" stroke="#00f5ff" strokeWidth={2} fill="url(#cpuG)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
        </div>

        {/* ── RAM chart ── */}
        <div className={`${styles.panel} ${styles.panelRamChart}`}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>RAM USAGE — LAST 2 MIN</span>
            <PulsingDot color="green" />
          </div>
          {serverOnline === false
            ? <OfflineOverlay />
            : (
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={ram?.history ?? []} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ramG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00ff88" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,245,255,0.07)" />
                    <XAxis dataKey="t" tick={false} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#6a9bb5', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip unit="%" />} />
                    <Area type="monotone" dataKey="pct" name="RAM" stroke="#00ff88" strokeWidth={2} fill="url(#ramG)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
        </div>

        {/* ── PM2 processes ── */}
        <div className={`${styles.panel} ${styles.panelPm2}`}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>PM2 PROCESSES</span>
            <PulsingDot color={pm2?.ok ? 'green' : 'red'} />
          </div>
          {!pm2
            ? <p className={styles.loading}>LOADING...</p>
            : pm2.procs.length === 0
            ? <p className={styles.loading}>NO PROCESSES FOUND</p>
            : (
              <div className={styles.pm2List}>
                {pm2.procs.map(p => (
                  <div key={p.id} className={styles.pm2Row}>
                    <span className={styles.pm2Dot} style={{ background: statusColor(p.status) }} />
                    <div className={styles.pm2Info}>
                      <span className={styles.pm2Name}>{p.name}</span>
                      <span className={styles.pm2Sub}>
                        PID {p.pid} · ↑{fmt(p.uptime)} · {p.restarts}R
                      </span>
                    </div>
                    <div className={styles.pm2Stats}>
                      <span className={styles.pm2Stat}>
                        <span className={styles.pm2StatLabel}>CPU</span>
                        {p.cpu}%
                      </span>
                      <span className={styles.pm2Stat}>
                        <span className={styles.pm2StatLabel}>MEM</span>
                        {p.memMB}M
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* ── Network chart ── */}
        <div className={`${styles.panel} ${styles.panelNetChart}`}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>NETWORK I/O — LAST 2 MIN</span>
            <PulsingDot color="cyan" label="LIVE" />
          </div>
          {serverOnline === false
            ? <OfflineOverlay />
            : (
              <>
                <div className={styles.chartWrap}>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={netHistory} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,245,255,0.07)" />
                      <XAxis dataKey="t" tick={false} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6a9bb5', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<Tip unit=" MB/s" />} />
                      <Line type="monotone" dataKey="in" name="IN" stroke="#00f5ff" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="out" name="OUT" stroke="#00ff88" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.legend}>
                  <span className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: '#00f5ff' }} /> Download
                  </span>
                  <span className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: '#00ff88' }} /> Upload
                  </span>
                </div>
              </>
            )}
        </div>

        {/* ── MongoDB panel ── */}
        <div className={`${styles.panel} ${styles.panelMongo}`}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>MONGODB</span>
            <PulsingDot color={db?.connected ? 'green' : 'red'} />
          </div>
          <div className={styles.statusBig}>
            <span className={db?.connected ? styles.statusOnline : styles.statusOffline}>
              {db ? (db.connected ? 'CONNECTED' : 'DISCONNECTED') : 'PROBING...'}
            </span>
          </div>
          {db?.connected && (
            <>
              <div className={styles.metaItem} style={{ marginBottom: '0.75rem' }}>
                <span className={styles.metaKey}>LATENCY</span>
                <span className={styles.metaVal}>{db.latencyMs}ms</span>
              </div>
              <div className={styles.collectionList}>
                {db.collections.length === 0
                  ? <p className={styles.loading}>NO USER COLLECTIONS</p>
                  : db.collections.map((c, i) => (
                    <div key={i} className={styles.collRow}>
                      <div className={styles.collInfo}>
                        <span className={styles.collDb}>{c.db}</span>
                        <span className={styles.collName}>{c.name}</span>
                      </div>
                      <span className={styles.collCount}>{c.count.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </>
          )}

          {/* Caddy status inline */}
          <div className={styles.caddyRow}>
            <span className={styles.panelLabel} style={{ marginRight: '0.5rem' }}>CADDY</span>
            <PulsingDot color={caddy?.running ? 'green' : 'red'} />
            <span className={caddy?.running ? styles.statusOnline : styles.statusOffline}
              style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>
              {caddy === null ? 'PROBING...' : caddy.running ? 'RUNNING' : 'OFFLINE'}
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}
