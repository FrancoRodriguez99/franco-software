import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import Landing from './pages/Landing/Landing'
import Stats from './pages/Stats/Stats'
import Projects from './pages/Projects/Projects'
import Personal from './pages/Personal/Personal'
import styles from './App.module.css'

export default function App() {
  return (
    <div className={styles.app}>
      <Navbar />
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/personal" element={<Personal />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
