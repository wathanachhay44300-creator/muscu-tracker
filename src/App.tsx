import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { ensureSeedData } from './db'
import { migrateLegacyExerciseData } from './lib/migrations'
import { BottomNav } from './components/BottomNav'
import { SeanceScreen } from './screens/SeanceScreen'
import { HistoriqueScreen } from './screens/HistoriqueScreen'
import { HistoriqueDetailScreen } from './screens/HistoriqueDetailScreen'
import { ExercicesScreen } from './screens/ExercicesScreen'
import { ExerciseDetailScreen } from './screens/ExerciseDetailScreen'
import { ProgrammesScreen } from './screens/ProgrammesScreen'
import { TemplateDetailScreen } from './screens/TemplateDetailScreen'
import { WeeklyBreakdownScreen } from './screens/WeeklyBreakdownScreen'
import { CalendrierScreen } from './screens/CalendrierScreen'
import { BilanScreen } from './screens/BilanScreen'
import { CorpsScreen } from './screens/CorpsScreen'
import { PhotosScreen } from './screens/PhotosScreen'
import { DonneesScreen } from './screens/DonneesScreen'
import { DumbbellIcon } from './components/Icons'
import { RestTimerWidget } from './components/RestTimerWidget'
import { ReglagesScreen } from './screens/ReglagesScreen'
import { SnackbarProvider } from './contexts/SnackbarContext'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ensureSeedData()
      .then(() => migrateLegacyExerciseData())
      .then(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-slate-50">
        <DumbbellIcon className="h-8 w-8 animate-pulse text-accent" />
      </div>
    )
  }

  return (
    <HashRouter>
      <SnackbarProvider>
        <div className="min-h-dvh bg-slate-50">
          <Routes>
            <Route path="/" element={<SeanceScreen />} />
            <Route path="/jour/:date" element={<SeanceScreen />} />
            <Route path="/historique" element={<HistoriqueScreen />} />
            <Route path="/historique/semaine" element={<WeeklyBreakdownScreen />} />
            <Route path="/historique/calendrier" element={<CalendrierScreen />} />
            <Route path="/historique/:workoutId" element={<HistoriqueDetailScreen />} />
            <Route path="/exercices" element={<ExercicesScreen />} />
            <Route path="/exercices/:exerciseId" element={<ExerciseDetailScreen />} />
            <Route path="/programmes" element={<ProgrammesScreen />} />
            <Route path="/programmes/:templateId" element={<TemplateDetailScreen />} />
            <Route path="/bilan/:workoutId" element={<BilanScreen />} />
            <Route path="/corps" element={<CorpsScreen />} />
            <Route path="/photos" element={<PhotosScreen />} />
            <Route path="/reglages" element={<ReglagesScreen />} />
            <Route path="/donnees" element={<DonneesScreen />} />
          </Routes>
          <RestTimerWidget />
          <BottomNav />
        </div>
      </SnackbarProvider>
    </HashRouter>
  )
}
