import styles from './Personal.module.css'

const stack = [
  'Node.js', 'JavaScript', 'Express', 'Socket.io',
  'MongoDB', 'GCP', 'React', 'Git', 'OAuth 2.0', 'REST APIs', 'Docker', 'Pulumi'
]

const whyHire = [
  '2 years production experience — real systems, real scale, real deadlines.',
  'Polyglot communicator: Spanish (native), Italian (bilingual), English (C2). Zero friction in any EU team.',
  'Self-taught. I ship first, then optimize — no tutorial paralysis.',
  'EU citizen (Italian passport) — no visa, no sponsorship, no waiting.',
]

const languages = [
  { name: 'Spanish', level: 'Native' },
  { name: 'Italian', level: 'Bilingual' },
  { name: 'English', level: 'C2' },
]

export default function Personal() {
  return (
    <div className={`${styles.page} grid-bg`}>
      <div className={styles.pageHeader}>
        <span className={styles.headerLabel}>// OPERATOR_PROFILE</span>
        <h1 className={styles.pageTitle}>PERSONAL</h1>
      </div>

      <div className={styles.layout}>
        {/* Left column */}
        <div className={styles.left}>
          {/* Avatar */}
          <div className={styles.avatarPanel}>
            <div className={styles.avatar}>
              <span className={styles.avatarInitials}>FR</span>
            </div>
            <div className={styles.identity}>
              <p className={styles.fullName}>Franco Rodriguez</p>
              <p className={styles.role}>Backend Developer</p>
              <p className={styles.location}>◈ Buenos Aires → Europe</p>
            </div>
          </div>

          {/* Languages */}
          <div className={styles.panel}>
            <p className={styles.sectionLabel}>// LANGUAGES</p>
            <div className={styles.langList}>
              {languages.map((l) => (
                <div key={l.name} className={styles.langRow}>
                  <span className={styles.langName}>{l.name}</span>
                  <span className={styles.langLevel}>{l.level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className={styles.panel}>
            <p className={styles.sectionLabel}>// CONTACT</p>
            <div className={styles.contactList}>
              <a href="https://github.com/FrancoRodriguez99" target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                <span className={styles.contactIcon}>⌥</span> GitHub
              </a>
              <span className={styles.contactLink}>
                <span className={styles.contactIcon}>✉</span> juanfrancorodriguez99@gmail.com
              </span>
              <a href="https://www.linkedin.com/in/juan-franco-rodriguez/" target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                <span className={styles.contactIcon}>◈</span> LinkedIn
              </a>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className={styles.right}>
          {/* Bio */}
          <div className={styles.panel}>
            <p className={styles.sectionLabel}>// WHO_AM_I</p>
            <p className={styles.bioText}>
              Argentine backend developer, self-taught, with 2 years of production experience.
              I build real systems — microservices on GCP, real-time apps with WebSockets, auth flows with OAuth 2.0, and databases in MongoDB.
            </p>
            <p className={styles.bioText}>
              Italian citizen, EU passport — based in Europe. I work in English, Spanish, and Italian without missing a beat.
            </p>
          </div>

          {/* Tech Stack */}
          <div className={styles.panel}>
            <p className={styles.sectionLabel}>// TECH_STACK</p>
            <div className={styles.stackGrid}>
              {stack.map((s) => (
                <span key={s} className={styles.stackTag}>{s}</span>
              ))}
            </div>
          </div>

          {/* Why hire me */}
          <div className={styles.panel}>
            <p className={styles.sectionLabel}>// WHY_HIRE_ME</p>
            <ul className={styles.whyList}>
              {whyHire.map((item, i) => (
                <li key={i} className={styles.whyItem}>
                  <span className={styles.bullet}>→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
