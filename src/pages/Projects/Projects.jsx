import styles from './Projects.module.css'

const projects = [
  {
    name: 'Secret Dictator',
    description: 'Online multiplayer social deduction game. Inspired by Secret Hitler — players are secretly assigned roles and must deceive or deduce their way to victory.',
    stack: ['Node.js', 'Express', 'Socket.io', 'React', 'MongoDB'],
    status: 'In Dev',
    github: 'https://github.com/FrancoRodriguez99/secretdictator',
    demo: 'https://secret-dictator.franco-software.com/',
  },
  {
    name: 'Dark Room',
    description: 'A social platform for photographers to share their work, participate in weekly creative challenges, and sell their prints or digital files.',
    stack: ['React', 'Redux', 'Node.js', 'MongoDb', 'Express'],
    status: 'Live',
    github: 'https://github.com/FrancoRodriguez99/C7-Dark-Room-Deploy',
    demo: 'https://c7.franco-software.com/',
  },
  {
    name: 'La esquina de Walter',
    description: 'A full-featured e-commerce platform for an Argentinian restaurant, enabling customers to browse the menu, place orders for delivery or pickup, and pay online.',
    stack: ['React', ],
    status: 'Live',
    github: 'https://github.com/FrancoRodriguez99/ax',
    demo: 'https://esquina-de-walter.franco-software.com/',
  },
  {
    name: 'Imposter',
    description: 'Real-time multiplayer word deduction game. Players share a secret word while impostors try to blend in — and guess it. Built with Socket.io rooms, QR code joining, and anonymous analytics.',
    stack: ['React', 'Vite', 'Socket.io', 'Node.js', 'MongoDB'],
    status: 'Live',
    github: 'https://github.com/FrancoRodriguez99/imposter',
    demo: 'https://imposter.franco-software.com/',
  },
  {
    name: 'Cacerola',
    description: 'Party word-guessing game where players submit a person, action, and adjective to build absurd prompts. The host gives clues while teammates race to guess the combination.',
    stack: ['React', 'Vite', 'Socket.io', 'Node.js'],
    status: 'Live',
    github: 'https://github.com/FrancoRodriguez99/cacerola',
    demo: 'https://cacerola.franco-software.com/',
  },
  {
    name: 'Verdikt',
    description: 'Real-time multiplayer ranking and voting party game. Players answer questions by ranking or voting, results are revealed live, and the host controls the pace.',
    stack: ['React', 'Vite', 'Socket.io', 'Node.js', 'MongoDB'],
    status: 'Live',
    github: 'https://github.com/FrancoRodriguez99/verdikt',
    demo: 'https://verdikt.franco-software.com/',
  },
]

const statusColor = {
  Live: 'green',
  'In Dev': 'cyan',
  Planned: 'yellow',
  Archived: 'red',
}

export default function Projects() {
  return (
    <div className={`${styles.page} grid-bg`}>
      <div className={styles.pageHeader}>
        <span className={styles.headerLabel}>// PROJECT_INDEX</span>
        <h1 className={styles.pageTitle}>PROJECTS</h1>
        <p className={styles.pageSubtitle}>Open-source builds and production deployments</p>
      </div>

      <div className={styles.grid}>
        {projects.map((p) => (
          <div key={p.name} className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardName}>{p.name}</h2>
              <span
                className={styles.statusBadge}
                data-status={statusColor[p.status] || 'cyan'}
              >
                {p.status}
              </span>
            </div>

            <p className={styles.desc}>{p.description}</p>

            <div className={styles.tags}>
              {p.stack.map((t) => (
                <span key={t} className={styles.tag}>{t}</span>
              ))}
            </div>

            <div className={styles.links}>
              {p.github && (
                <a href={p.github} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  [ GitHub ]
                </a>
              )}
              {p.demo && (
                <a href={p.demo} target="_blank" rel="noopener noreferrer" className={`${styles.link} ${styles.linkDemo}`}>
                  [ Live Demo ]
                </a>
              )}
              {!p.github && !p.demo && (
                <span className={styles.linkMuted}>// no links yet</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
