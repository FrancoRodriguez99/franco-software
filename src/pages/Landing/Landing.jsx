import NavCard from '../../components/NavCard/NavCard'
import PulsingDot from '../../components/PulsingDot/PulsingDot'
import styles from './Landing.module.css'

const cards = [
  {
    title: 'STATS',
    description: 'Live system dashboard — server uptime, database metrics, API response times, and traffic analytics.',
    icon: '📡',
    to: '/stats',
    tag: 'LIVE',
  },
  {
    title: 'PROJECTS',
    description: 'Open-source builds and production deployments. Real software, real scale.',
    icon: '⚙️',
    to: '/projects',
    tag: 'PORTFOLIO',
  },
  {
    title: 'PERSONAL',
    description: 'Who I am, what I build, and why you should hire me. No corporate fluff.',
    icon: '◈',
    to: '/personal',
    tag: 'PROFILE',
  },
]

export default function Landing() {
  return (
    <div className={`${styles.page} grid-bg`}>
      <div className={styles.noise} />

      <section className={styles.hero}>
        <div className={styles.systemLine}>
          <PulsingDot color="green" />
          <span className={styles.systemText}>SYSTEM ONLINE — franco-software.com</span>
          <span className={styles.cursor}>█</span>
        </div>

        <div className={styles.nameBlock}>
          <p className={styles.label}>// IDENTITY</p>
          <h1 className={styles.name}>
            <span className={styles.nameFirst}>FRANCO</span>
            <span className={styles.nameLast}> RODRIGUEZ</span>
          </h1>
          <div className={styles.titleRow}>
            <span className={styles.bracket}>[</span>
            <span className={styles.title}>Backend Developer</span>
            <span className={styles.bracket}>]</span>
          </div>
          <p className={styles.subtitle}>
            Node.js · TypeScript · GCP · MongoDB · WebSockets
          </p>
        </div>

        <div className={styles.cards}>
          {cards.map((card) => (
            <NavCard key={card.to} {...card} />
          ))}
        </div>
      </section>

      <div className={styles.cornerTL} />
      <div className={styles.cornerBR} />
    </div>
  )
}
