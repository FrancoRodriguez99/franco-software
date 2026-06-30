import { useState, useEffect } from 'react'
import styles from './Analytics.module.css'

const TOKEN_KEY = 'frs_analytics_token'

// ── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

function fmtDuration(ms) {
  if (!ms || ms <= 0) return '—'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  const m = Math.floor(ms / 60000)
  const s = Math.round((ms % 60000) / 1000)
  return `${m}m ${s}s`
}

function fmtDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  })
}

function botTier(score) {
  if (score >= 50) return 'red'
  if (score >= 20) return 'yellow'
  return 'green'
}

// ── event row ─────────────────────────────────────────────────────────────────

function EventRow({ ev, sessionStart }) {
  const relMs = new Date(ev.ts).getTime() - new Date(sessionStart).getTime()
  const rel = relMs < 1000 ? '+0s' : `+${fmtDuration(relMs)}`

  if (ev.type === 'pageview') {
    return (
      <div className={`${styles.evRow} ${styles.evPageview}`}>
        <span className={styles.evRel}>{rel}</span>
        <span className={styles.evIcon}>▸</span>
        <span className={styles.evText}>
          entered <strong>{ev.page || '/'}</strong>
        </span>
      </div>
    )
  }

  if (ev.type === 'page_exit') {
    return (
      <div className={`${styles.evRow} ${styles.evExit}`}>
        <span className={styles.evRel}>{rel}</span>
        <span className={styles.evIcon}>◂</span>
        <span className={styles.evText}>
          left <strong>{ev.page}</strong>{' — '}
          stayed <strong>{fmtDuration(ev.data?.durationMs)}</strong>
          {ev.data?.maxScrollPct != null && `, scrolled ${ev.data.maxScrollPct}%`}
        </span>
      </div>
    )
  }

  if (ev.type === 'external_link') {
    return (
      <div className={`${styles.evRow} ${styles.evExternal}`}>
        <span className={styles.evRel}>{rel}</span>
        <span className={styles.evIcon}>→</span>
        <span className={styles.evText}>
          opened{' '}
          <strong className={styles.evLabel}>[{ev.data?.label || 'external'}]</strong>{' '}
          <span className={styles.evHref}>{ev.data?.href}</span>
        </span>
      </div>
    )
  }

  if (ev.type === 'click') {
    const label = ev.data?.text || `<${ev.data?.tag}>`
    return (
      <div className={`${styles.evRow} ${styles.evClick}`}>
        <span className={styles.evRel}>{rel}</span>
        <span className={styles.evIcon}>·</span>
        <span className={styles.evText}>
          clicked <strong>{label}</strong> on {ev.page}
          {ev.data?.href && (
            <span className={styles.evHref}> → {ev.data.href}</span>
          )}
          <span className={styles.evCoords}>
            {' '}({ev.data?.xPct}%, {ev.data?.yPct}%)
          </span>
        </span>
      </div>
    )
  }

  return null
}

// ── session card ──────────────────────────────────────────────────────────────

function SessionCard({ session }) {
  const [open, setOpen] = useState(false)

  const tier = botTier(session.botScore ?? 0)
  const externalLinks = (session.events || []).filter(e => e.type === 'external_link')
  const totalMs = (session.events || [])
    .filter(e => e.type === 'page_exit')
    .reduce((sum, e) => sum + (e.data?.durationMs ?? 0), 0)
  const pages = [...new Set(
    (session.events || []).filter(e => e.type === 'pageview').map(e => e.page)
  )]

  return (
    <div className={styles.sessionCard} data-tier={tier}>
      <button className={styles.sessionRow} onClick={() => setOpen(o => !o)}>
        <span className={styles.dot} data-tier={tier} />

        <span className={styles.rowTime}>{timeAgo(session.startedAt)}</span>

        <span className={styles.rowDevice} data-tier="muted">
          [{session.deviceType || 'unknown'}]
        </span>

        <span className={styles.rowPages}>
          {pages.length
            ? pages.map(p => <code key={p} className={styles.pagePill}>{p}</code>)
            : <span className={styles.rowMuted}>no pages</span>
          }
        </span>

        <span className={styles.rowTags}>
          {totalMs > 0 && (
            <span className={styles.tag} data-color="muted">⏱ {fmtDuration(totalMs)}</span>
          )}
          {session.isReturning && (
            <span className={styles.tag} data-color="cyan">↩ return</span>
          )}
          {externalLinks.length > 0 && (
            <span className={styles.tag} data-color="green">
              → {[...new Set(externalLinks.map(e => e.data?.label))].join(', ')}
            </span>
          )}
          {session.isBot && (
            <span className={styles.tag} data-color="red">bot</span>
          )}
          {!session.mouseMoved && !session.isBot && (
            <span className={styles.tag} data-color="yellow">no mouse</span>
          )}
        </span>

        <span className={styles.rowScore} data-tier={tier}>
          {session.botScore ?? 0}%
        </span>

        <span className={styles.rowToggle}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={styles.detail}>
          <div className={styles.metaGrid}>
            <MetaRow label="Session ID" value={session.sid} />
            <MetaRow label="Visitor ID" value={session.vid} />
            <MetaRow label="IP" value={session.ip || '—'} />
            <MetaRow label="Started" value={fmtDate(session.startedAt)} />
            <MetaRow label="Last active" value={fmtDate(session.lastActiveAt)} />
            <MetaRow label="Device" value={session.deviceType || '—'} />
            <MetaRow label="Screen" value={session.screenW && session.screenH ? `${session.screenW}×${session.screenH}` : '—'} />
            <MetaRow label="Language" value={session.language || '—'} />
            <MetaRow label="Timezone" value={session.timezone || '—'} />
            <MetaRow label="Color scheme" value={session.colorScheme || '—'} />
            <MetaRow label="Referrer" value={session.referrer || 'direct'} />
            <MetaRow label="Mouse moved" value={session.mouseMoved ? 'yes' : 'no'} />
            <MetaRow
              label="Bot score"
              value={`${session.botScore ?? 0}/100 — ${session.botSignals?.join(', ') || 'clean'}`}
              tier={tier}
            />
            <MetaRow label="User agent" value={session.userAgent || '—'} wrap />
          </div>

          <div className={styles.timeline}>
            <span className={styles.timelineLabel}>// EVENT_TIMELINE</span>
            {!session.events?.length
              ? <p className={styles.empty}>no events recorded</p>
              : session.events.map((ev, i) => (
                  <EventRow key={i} ev={ev} sessionStart={session.startedAt} />
                ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

function MetaRow({ label, value, tier, wrap }) {
  return (
    <>
      <span className={styles.metaLabel}>{label}</span>
      <code className={styles.metaValue} data-tier={tier} data-wrap={wrap}>
        {value}
      </code>
    </>
  )
}

// ── dashboard ─────────────────────────────────────────────────────────────────

function Dashboard({ onExpired }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('humans')

  function load() {
    setLoading(true)
    setError(null)
    const token = sessionStorage.getItem(TOKEN_KEY)
    fetch('/api/analytics/data?limit=100', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (r.status === 401) { onExpired(); return null }
        return r.json()
      })
      .then(d => { if (d) { setData(d); setLoading(false) } })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const sessions = data?.sessions ?? []
  const humans = sessions.filter(s => !s.isBot)
  const bots = sessions.filter(s => s.isBot)
  const returning = humans.filter(s => s.isReturning)
  const clickedLinks = humans.filter(s =>
    (s.events || []).some(e => e.type === 'external_link')
  )

  const filtered = filter === 'humans' ? humans
    : filter === 'bots' ? bots
    : sessions

  return (
    <div className={`${styles.page} grid-bg`}>
      <div className={styles.pageHeader}>
        <span className={styles.headerLabel}>// ANALYTICS_CONSOLE</span>
        <div className={styles.headerRow}>
          <h1 className={styles.pageTitle}>VISITOR DATA</h1>
          <button className={styles.refreshBtn} onClick={load}>[ refresh ]</button>
          <button className={styles.refreshBtn} onClick={onExpired}>[ logout ]</button>
        </div>
        <p className={styles.pageSub}>
          showing last {sessions.length} sessions · {data?.total ?? '—'} total recorded
        </p>
      </div>

      <div className={styles.statsBar}>
        <Stat value={humans.length} label="humans" color="green" />
        <Stat value={bots.length} label="bots / crawlers" color="red" />
        <Stat value={returning.length} label="returning" color="cyan" />
        <Stat value={clickedLinks.length} label="clicked a link" color="green" />
      </div>

      <div className={styles.filterBar}>
        {['all', 'humans', 'bots'].map(f => (
          <button
            key={f}
            className={styles.filterBtn}
            data-active={filter === f}
            onClick={() => setFilter(f)}
          >
            [ {f} ]
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {loading && <p className={styles.stateMsg}>loading...</p>}
        {error && <p className={styles.stateMsg} data-tier="red">// error: {error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className={styles.stateMsg}>// no sessions yet — visit the site first</p>
        )}
        {!loading && !error && filtered.map(s => (
          <SessionCard key={s.sid || s._id} session={s} />
        ))}
      </div>
    </div>
  )
}

function Stat({ value, label, color }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statVal} data-color={color}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

// ── login gate ────────────────────────────────────────────────────────────────

function LoginGate({ onAuth }) {
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)
  const [wrong, setWrong] = useState(false)

  async function submit(e) {
    e.preventDefault()
    try {
      const r = await fetch('/api/analytics/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: input }),
      })
      if (r.ok) {
        const { token } = await r.json()
        sessionStorage.setItem(TOKEN_KEY, token)
        onAuth()
      } else {
        setShake(true)
        setWrong(true)
        setInput('')
        setTimeout(() => setShake(false), 500)
      }
    } catch {
      setShake(true)
      setInput('')
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className={styles.gate}>
      <div className={`${styles.gateBox} ${shake ? styles.shake : ''}`}>
        <p className={styles.gateLabel}>// RESTRICTED_ACCESS</p>
        <h2 className={styles.gateTitle}>ANALYTICS</h2>
        <form onSubmit={submit} className={styles.gateForm}>
          <input
            autoFocus
            type="password"
            placeholder="enter passphrase_"
            value={input}
            onChange={e => { setInput(e.target.value); setWrong(false) }}
            className={styles.gateInput}
            data-error={wrong}
          />
          <button type="submit" className={styles.gateBtn}>[ ENTER ]</button>
        </form>
        {wrong && <p className={styles.gateError}>// ACCESS_DENIED</p>}
      </div>
    </div>
  )
}

// ── root ──────────────────────────────────────────────────────────────────────

export default function Analytics() {
  const [authed, setAuthed] = useState(
    () => !!sessionStorage.getItem(TOKEN_KEY)
  )

  function expire() {
    sessionStorage.removeItem(TOKEN_KEY)
    setAuthed(false)
  }

  if (!authed) return <LoginGate onAuth={() => setAuthed(true)} />
  return <Dashboard onExpired={expire} />
}
