import { NavLink } from 'react-router-dom'
import styles from './Navbar.module.css'

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <NavLink to="/" className={styles.logo}>
        <span className={styles.logoText}>FS</span>
        <span className={styles.logoFull}>Franco-Software</span>
      </NavLink>

      <ul className={styles.links}>
        <li>
          <NavLink
            to="/"
            end
            className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
          >
            HOME
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/stats"
            className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
          >
            STATS
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/projects"
            className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
          >
            PROJECTS
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/personal"
            className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
          >
            PERSONAL
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}
