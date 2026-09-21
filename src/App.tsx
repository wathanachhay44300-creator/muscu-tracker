import { lazy, Suspense, useEffect, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { ensureSeedData } from './db'
import { migrateLegacyExerciseData } from './lib/migrations'
import { BottomNav } from './components/BottomNav'
import { SeanceScreen } from './screens/SeanceScreen'
import { HistoriqueScreen } from './screens/HistoriqueScreen'
import { HistoriqueDetailScreen } from './screens/HistoriqueDetailScreen'
import { ExercicesScreen } from './screens/ExercicesScreen'
import { ProgrammesScreen } from './screens/ProgrammesScreen'
import { DumbbellIcon } from './components/Icons'
import { RestTimerWidget } from './components/RestTimerWidget'
import { SnackbarProvider } from './contexts/SnackbarContext'

// Rarely-opened screens are split out of the main bundle (still precached by the service worker, so they open offline).
const ExerciseDetailScreen = lazy(() => import('./screens/ExerciseDetailScreen').then((m) => ({ default: m.ExerciseDetailScreen })))
const TemplateDetailScreen = lazy(() => import('./screens/TemplateDetailScreen').then((m) => ({ default: m.TemplateDetailScreen })))
const WeeklyBreakdownScreen = lazy(() => import('./screens/WeeklyBreakdownScreen').then((m) => ({ default: m.WeeklyBreakdownScreen })))
const CalendrierScreen = lazy(() => import('./screens/CalendrierScreen').then((m) => ({ default: m.CalendrierScreen })))
const BilanScreen = lazy(() => import('./screens/BilanScreen').then((m) => ({ default: m.BilanScreen })))
const CorpsScreen = lazy(() => import('./screens/CorpsScreen').then((m) => ({ default: m.CorpsScreen })))
const PhotosScreen = lazy(() => import('./screens/PhotosScreen').then((m) => ({ default: m.PhotosScreen })))
const DonneesScreen = lazy(() => import('./screens/DonneesScreen').then((m) => ({ default: m.DonneesScreen })))
const ReglagesScreen = lazy(() => import('./screens/ReglagesScreen').then((m) => ({ default: m.ReglagesScreen })))

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ensureSeedData()
      .then(() => migrateLegacyExerciseData())
      .then(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-page">
        <DumbbellIcon className="h-8 w-8 animate-pulse text-accent" />
      </div>
    )
  }

  return (
    <HashRouter>
      <SnackbarProvider>
        <div className="min-h-dvh bg-page">
          <Suspense fallback={null}>
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
          </Suspense>
          <RestTimerWidget />
          <BottomNav />
        </div>
      </SnackbarProvider>
    </HashRouter>
  )
}
