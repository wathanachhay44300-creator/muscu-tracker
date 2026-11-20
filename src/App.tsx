import { lazy, Suspense, useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { migrateLegacyExerciseData } from './lib/migrations'
import { syncExerciseLibrary } from './lib/exerciseLibrarySync'
import { BottomNav } from './components/BottomNav'
import { AujourdhuiScreen } from './screens/AujourdhuiScreen'
import { SeanceScreen } from './screens/SeanceScreen'
import { ProgresScreen } from './screens/ProgresScreen'
import { ResumeSessionBanner } from './components/ResumeSessionBanner'
import { HistoriqueScreen } from './screens/HistoriqueScreen'
import { HistoriqueDetailScreen } from './screens/HistoriqueDetailScreen'
import { ExercicesScreen } from './screens/ExercicesScreen'
import { ProgrammesScreen } from './screens/ProgrammesScreen'
import { DumbbellIcon } from './components/Icons'
import { RestTimerWidget } from './components/RestTimerWidget'
import { SnackbarProvider } from './contexts/SnackbarContext'
import { DeepLinkImporter } from './components/DeepLinkImporter'
import { I18nProvider } from './i18n/I18nProvider'

// Rarely-opened screens are split out of the main bundle (still precached by the service worker, so they open offline).
const ExerciseDetailScreen = lazy(() => import('./screens/ExerciseDetailScreen').then((m) => ({ default: m.ExerciseDetailScreen })))
const TemplateDetailScreen = lazy(() => import('./screens/TemplateDetailScreen').then((m) => ({ default: m.TemplateDetailScreen })))
const WeeklyBreakdownScreen = lazy(() => import('./screens/WeeklyBreakdownScreen').then((m) => ({ default: m.WeeklyBreakdownScreen })))
const CalendrierScreen = lazy(() => import('./screens/CalendrierScreen').then((m) => ({ default: m.CalendrierScreen })))
const BilanScreen = lazy(() => import('./screens/BilanScreen').then((m) => ({ default: m.BilanScreen })))
const CorpsScreen = lazy(() => import('./screens/CorpsScreen').then((m) => ({ default: m.CorpsScreen })))
const DonneesScreen = lazy(() => import('./screens/DonneesScreen').then((m) => ({ default: m.DonneesScreen })))
const SuiviScreen = lazy(() => import('./screens/SuiviScreen').then((m) => ({ default: m.SuiviScreen })))
const ReglagesScreen = lazy(() => import('./screens/ReglagesScreen').then((m) => ({ default: m.ReglagesScreen })))

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    migrateLegacyExerciseData()
      .then(() => syncExerciseLibrary())
      .then(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-page">
        <DumbbellIcon className="h-8 w-8 animate-pulse text-accent-ink" />
      </div>
    )
  }

  return (
    <HashRouter>
      {/* Re-mounts the screens when the language changes (no reload, route kept). */}
      <I18nProvider>
      <SnackbarProvider>
        <div className="app-main min-h-dvh bg-page">
          <ResumeSessionBanner />
          <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<AujourdhuiScreen />} />
            <Route path="/seance" element={<SeanceScreen />} />
            <Route path="/seance/:workoutId" element={<SeanceScreen />} />
            <Route path="/progres" element={<ProgresScreen />} />
            <Route path="/progres/muscles" element={<WeeklyBreakdownScreen />} />
            <Route path="/historique" element={<HistoriqueScreen />} />
            <Route path="/historique/semaine" element={<Navigate to="/progres/muscles" replace />} />
            <Route path="/historique/calendrier" element={<CalendrierScreen />} />
            <Route path="/historique/:workoutId" element={<HistoriqueDetailScreen />} />
            <Route path="/exercices" element={<ExercicesScreen />} />
            <Route path="/exercices/:exerciseId" element={<ExerciseDetailScreen />} />
            <Route path="/programmes" element={<ProgrammesScreen />} />
            <Route path="/programmes/:templateId" element={<TemplateDetailScreen />} />
            <Route path="/bilan/:workoutId" element={<BilanScreen />} />
            <Route path="/corps" element={<CorpsScreen />} />
            <Route path="/suivi" element={<SuiviScreen />} />
            <Route path="/reglages" element={<ReglagesScreen />} />
            <Route path="/donnees" element={<DonneesScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
          <DeepLinkImporter />
          <RestTimerWidget />
          <BottomNav />
        </div>
      </SnackbarProvider>
      </I18nProvider>
    </HashRouter>
  )
}
