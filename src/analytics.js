const SESSION_KEY = 'frs_sid'
const VISITOR_KEY = 'frs_vid'
const ENDPOINT = '/api/vitals'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function safeStorage(type) {
  try {
    const s = window[type]
    s.setItem('__t__', '1')
    s.removeItem('__t__')
    return s
  } catch { return null }
}

function getOrCreate(storage, key) {
  if (!storage) return uid()
  let v = storage.getItem(key)
  if (!v) { v = uid(); storage.setItem(key, v) }
  return v
}

function detectBot() {
  const signals = []
  let score = 0

  if (navigator.webdriver) { signals.push('webdriver'); score += 65 }

  const ua = navigator.userAgent.toLowerCase()
  const botUAs = [
    'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'slurp', 'baiduspider',
    'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot', 'facebookexternalhit',
    'twitterbot', 'linkedinbot', 'slackbot', 'discordbot', 'telegrambot',
    'screaming frog', 'heritrix', 'wget', 'curl', 'python-requests',
    'java/', 'go-http-client', 'headlesschrome', 'phantomjs', 'selenium',
    'lighthouse', 'pagespeed', 'chrome-lighthouse',
  ]
  if (botUAs.some(p => ua.includes(p))) { signals.push('bot_ua'); score += 80 }

  if (!window.matchMedia) { signals.push('no_matchmedia'); score += 25 }
  if (screen.width === 0 || screen.height === 0) { signals.push('zero_screen'); score += 55 }
  if (screen.colorDepth <= 1) { signals.push('low_colordepth'); score += 25 }
  if (!navigator.languages?.length) { signals.push('no_languages'); score += 20 }
  // no plugins + no touch → likely headless
  if (!(navigator.plugins?.length) && !('ontouchstart' in window)) {
    signals.push('no_plugins'); score += 15
  }

  return { score: Math.min(score, 100), signals }
}

function getDeviceType() {
  const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  if (touch && screen.width < 768) return 'mobile'
  if (touch) return 'tablet'
  return 'desktop'
}

const tracker = {
  sid: null,
  vid: null,
  _pending: null,
  _queue: [],
  _page: null,
  _enteredAt: null,
  _maxScroll: 0,
  _mouseMoved: false,

  init() {
    if (this.sid) return  // already initialized
    const ss = safeStorage('sessionStorage')
    const ls = safeStorage('localStorage')
    this.sid = getOrCreate(ss, SESSION_KEY)
    this.vid = getOrCreate(ls, VISITOR_KEY)

    const { score, signals } = detectBot()
    const isReturning = ls?.getItem('frs_ret') === '1'
    ls?.setItem('frs_ret', '1')

    this._pending = {
      botScore: score,
      botSignals: signals,
      isBot: score >= 50,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenW: screen.width,
      screenH: screen.height,
      deviceType: getDeviceType(),
      colorScheme: window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      referrer: document.referrer || null,
      isReturning,
    }

    window.addEventListener('mousemove', () => { this._mouseMoved = true }, { once: true, passive: true })
    document.addEventListener('click', e => this._click(e), true)
    window.addEventListener('scroll', () => this._scroll(), { passive: true })
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this._hide()
    })
    window.addEventListener('beforeunload', () => this._hide())
    setInterval(() => this.flush(), 15000)
  },

  page(path) {
    if (!this.sid) return
    if (this._page) this._pushExit()
    this._page = path
    this._enteredAt = Date.now()
    this._maxScroll = 0
    this._push({ type: 'pageview', page: path, data: {} })
    setTimeout(() => this.flush(), 600)
  },

  _pushExit() {
    if (!this._page || !this._enteredAt) return
    this._push({
      type: 'page_exit',
      page: this._page,
      data: {
        durationMs: Date.now() - this._enteredAt,
        maxScrollPct: this._maxScroll,
      },
    })
    this._enteredAt = null
  },

  _hide() {
    this._pushExit()
    this.flush(true)
  },

  _click(e) {
    if (!this.sid) return
    const el = e.target
    const tag = el.tagName?.toLowerCase()
    if (!tag || ['html', 'body', 'main', 'section', 'article'].includes(tag)) return

    const anchor = el.closest('a')
    const href = anchor?.href || null
    const isExternal = href && !href.startsWith(location.origin)

    if (isExternal) {
      let label = 'external'
      if (href.includes('github.com')) label = 'github'
      else if (href.includes('linkedin.com')) label = 'linkedin'
      else if (href.includes('franco-software.com')) label = 'demo'

      this._push({
        type: 'external_link',
        page: this._page,
        data: {
          href,
          text: (anchor.textContent || '').trim().slice(0, 60),
          label,
        },
      })
      this.flush()
      return
    }

    const text = (el.textContent || '').trim().slice(0, 60)
    if (!text && !href && !el.getAttribute('aria-label')) return

    this._push({
      type: 'click',
      page: this._page,
      data: {
        tag,
        text,
        href,
        xPct: Math.round((e.clientX / innerWidth) * 100),
        yPct: Math.round((e.clientY / innerHeight) * 100),
      },
    })
  },

  _scroll() {
    const pct = Math.round(((scrollY + innerHeight) / document.documentElement.scrollHeight) * 100)
    if (pct > this._maxScroll) this._maxScroll = Math.min(pct, 100)
  },

  _push(event) {
    this._queue.push({ ...event, ts: new Date().toISOString() })
  },

  flush(beacon = false) {
    if (!this._queue.length) return

    const body = JSON.stringify({
      sid: this.sid,
      vid: this.vid,
      mouseMoved: this._mouseMoved,
      session: this._pending,
      events: this._queue.splice(0),
    })
    if (this._pending) this._pending = null

    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
    } else {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  },
}

export default tracker
