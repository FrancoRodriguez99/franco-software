import styles from './PulsingDot.module.css'

export default function PulsingDot({ color = 'cyan', label }) {
  return (
    <span className={styles.wrapper}>
      <span className={`${styles.dot} ${styles[color]}`} />
      {label && <span className={styles.label}>{label}</span>}
    </span>
  )
}
