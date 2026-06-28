import { useNavigate } from 'react-router-dom'
import styles from './NavCard.module.css'

export default function NavCard({ title, description, icon, to, tag }) {
  const navigate = useNavigate()

  return (
    <button className={styles.card} onClick={() => navigate(to)}>
      <div className={styles.topRow}>
        <span className={styles.icon}>{icon}</span>
        {tag && <span className={styles.tag}>{tag}</span>}
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.desc}>{description}</p>
      <span className={styles.cta}>ACCESS_SYSTEM →</span>
    </button>
  )
}
