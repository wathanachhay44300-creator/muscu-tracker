import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ContextMenuSheet } from '../components/ContextMenuSheet'
import { RenameSheet } from '../components/RenameSheet'
import { useLongPress } from '../hooks/useLongPress'
import { usePreferences } from '../hooks/usePreferences'
import { hapticMenuOpen } from '../lib/haptics'
import { updateWorkoutTitle } from '../lib/workoutActions'
import type { WorkoutSummary } from '../hooks/useHistory'
import { useWorkoutHistory } from '../hooks/useHistory'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { PullToRefreshIndicator } from '../components/PullToRefreshIndicator'
import { formatDateLong } from '../lib/date'
import { formatVolume } from '../lib/stats'
import {
  CalendarIcon,
  CameraIcon,
  ChartIcon,
  ChevronRightIcon,
  DownloadIcon,
  PencilIcon,
  ScaleIcon,
  SettingsIcon,
} from '../components/Icons'

export function HistoriqueScreen() {
  const history = useWorkoutHistory()
  const pullToRefresh = usePullToRefresh()

  return (
    <div
      className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in"
      onPointerDown={pullToRefresh.handlers.onPointerDown}
      onPointerMove={pullToRefresh.handlers.onPointerMove}
      onPointerUp={pullToRefresh.handlers.onPointerUp}
      onPointerCancel={pullToRefresh.handlers.onPointerCancel}
    >
      <PullToRefreshIndicator pullY={pullToRefresh.pullY} refreshing={pullToRefresh.refreshing} />
      <h1 className="mb-5 text-lg font-bold text-slate-900">Historique</h1>

      <div className="mb-4 space-y-2.5">
        <Link
          to="/historique/calendrier"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-surface px-4 py-3.5 shadow-sm active:bg-slate-50"
        >
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="h-5 w-5 text-accent" />
            <span className="font-medium text-slate-800">Calendrier</span>
          </div>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
        </Link>

        <Link
          to="/historique/semaine"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-surface px-4 py-3.5 shadow-sm active:bg-slate-50"
        >
          <div className="flex items-center gap-2.5">
            <ChartIcon className="h-5 w-5 text-accent" />
            <span className="font-medium text-slate-800">Répartition par muscle (semaine)</span>
          </div>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
        </Link>

        <Link
          to="/corps"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-surface px-4 py-3.5 shadow-sm active:bg-slate-50"
        >
          <div className="flex items-center gap-2.5">
            <ScaleIcon className="h-5 w-5 text-accent" />
            <span className="font-medium text-slate-800">Poids &amp; mensurations</span>
          </div>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
        </Link>

        <Link
          to="/photos"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-surface px-4 py-3.5 shadow-sm active:bg-slate-50"
        >
          <div className="flex items-center gap-2.5">
            <CameraIcon className="h-5 w-5 text-accent" />
            <span className="font-medium text-slate-800">Photos de progression</span>
          </div>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
        </Link>

        <Link
          to="/donnees"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-surface px-4 py-3.5 shadow-sm active:bg-slate-50"
        >
          <div className="flex items-center gap-2.5">
            <DownloadIcon className="h-5 w-5 text-accent" />
            <span className="font-medium text-slate-800">Export / import des données</span>
          </div>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
        </Link>

        <Link
          to="/reglages"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-surface px-4 py-3.5 shadow-sm active:bg-slate-50"
        >
          <div className="flex items-center gap-2.5">
            <SettingsIcon className="h-5 w-5 text-accent" />
            <span className="font-medium text-slate-800">Réglages (vibrations, notifications)</span>
          </div>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
        </Link>
      </div>

      {history && history.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 px-4 py-14 text-center">
          <CalendarIcon className="h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-600">Pas encore de séance enregistrée</p>
          <p className="text-sm text-slate-400">
            Vos séances passées apparaîtront ici une fois enregistrées.
          </p>
        </div>
      )}

      <div className="space-y-2.5">
        {history?.map((summary) => (
          <HistoryListItem key={summary.workout.id} summary={summary} />
        ))}
      </div>
    </div>
  )
}

function HistoryListItem({ summary }: { summary: WorkoutSummary }) {
  const { workout, exerciseCount, setCount, volume, title } = summary
  const preferences = usePreferences()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const longPress = useLongPress(() => {
    hapticMenuOpen(!!preferences?.hapticsEnabled)
    setMenuOpen(true)
  })

  return (
    <>
      {/* A div (not <a>): Safari would show its link-preview menu on long-press. */}
      <div
        role="link"
        tabIndex={0}
        onClick={() => navigate(`/historique/${workout.id}`)}
        onKeyDown={(e) => e.key === 'Enter' && navigate(`/historique/${workout.id}`)}
        onContextMenu={longPress.onContextMenu}
        className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-surface px-4 py-3.5 shadow-sm active:bg-slate-50"
        onPointerDown={longPress.onPointerDown}
        onPointerMove={longPress.onPointerMove}
        onPointerUp={longPress.onPointerUp}
        onPointerCancel={longPress.onPointerCancel}
        onClickCapture={longPress.onClickCapture}
      >
        <div>
          <p className="font-semibold text-slate-900">{title}</p>
          <p className="text-sm font-medium text-slate-600">{formatDateLong(workout.date)}</p>
          <p className="mt-1 text-sm text-slate-500">
            {exerciseCount} exercice{exerciseCount > 1 ? 's' : ''} · {setCount} série
            {setCount > 1 ? 's' : ''}
            {volume > 0 && <> · {formatVolume(volume)} kg</>}
          </p>
        </div>
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-300" />
      </div>

      {menuOpen && (
        <ContextMenuSheet
          title={title}
          actions={[{ label: 'Renommer', icon: PencilIcon, onSelect: () => setRenaming(true) }]}
          onClose={() => setMenuOpen(false)}
        />
      )}

      {renaming && (
        <RenameSheet
          title="Renommer la séance"
          initialName={title}
          allowEmpty
          placeholder="Séance libre"
          onRename={(name) => {
            updateWorkoutTitle(workout.id!, name)
            setRenaming(false)
          }}
          onCancel={() => setRenaming(false)}
        />
      )}
    </>
  )
}
