import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { ensureSeedData } from './db'
import { BottomNav } from './components/BottomNav'
import { SeanceScreen } from './screens/SeanceScreen'
import { HistoriqueScreen } from './screens/HistoriqueScreen'
import { HistoriqueDetailScreen } from './screens/HistoriqueDetailScreen'
import { ExercicesScreen } from './screens/ExercicesScreen'
import { ExerciseDetailScreen } from './screens/ExerciseDetailScreen'
import { DumbbellIcon } from './components/Icons'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ensureSeedData().then(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-slate-50">
        <DumbbellIcon className="h-8 w-8 animate-pulse text-brand-400" />
      </div>
    )
  }

  return (
    <HashRouter>
      <div className="min-h-dvh bg-slate-50">
        <Routes>
          <Route path="/" element={<SeanceScreen />} />
          <Route path="/historique" element={<HistoriqueScreen />} />
          <Route path="/historique/:workoutId" element={<HistoriqueDetailScreen />} />
          <Route path="/exercices" element={<ExercicesScreen />} />
          <Route path="/exercices/:exerciseId" element={<ExerciseDetailScreen />} />
        </Routes>
        <BottomNav />
      </div>
    </HashRouter>
  )
}
