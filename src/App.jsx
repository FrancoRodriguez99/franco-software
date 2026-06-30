import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import Landing from './pages/Landing/Landing'
import Stats from './pages/Stats/Stats'
import Projects from './pages/Projects/Projects'
import Personal from './pages/Personal/Personal'
import Analytics from './pages/Analytics/Analytics'
import styles from './App.module.css'
import tracker from './analytics'

export default function App() {
  const location = useLocation()

  useEffect(() => {
    tracker.page(location.pathname)
  }, [location.pathname])

  return (
    <div className={styles.app}>
      <Navbar />
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/personal" element={<Personal />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
