import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useWorkoutDetail } from '../hooks/useWorkout'
import { useWorkoutComparison } from '../hooks/useWorkoutComparison'
import { usePreferences } from '../hooks/usePreferences'
import { t } from '../i18n'
import { useCountUp } from '../hooks/useCountUp'
import { ExerciseComparisonCard } from '../components/ExerciseComparisonCard'
import { AngkorSilhouette } from '../components/AngkorSilhouette'
import { Confetti } from '../components/Confetti'
import {
  ClipboardIcon,
  ShareIcon,
  SpeakerOffIcon,
  SpeakerOnIcon,
  StarIcon,
  VibrationIcon,
} from '../components/Icons'
import { formatVolume, totalVolume } from '../lib/stats'
import { formatDateShort, formatDuration } from '../lib/date'
import { setHapticsEnabled, setSoundEnabled } from '../lib/settingsActions'
import { playRecordChime } from '../lib/sound'
import { hapticSuccess } from '../lib/haptics'
import { generateBilanImage, shareOrDownloadImage } from '../lib/shareImage'

export function BilanScreen() {
  const { workoutId } = useParams()
  const id = workoutId ? Number(workoutId) : undefined
  const detail = useWorkoutDetail(id)
  const comparison = useWorkoutComparison(id)
  const preferences = usePreferences()
  const template = useLiveQuery(
    () => (detail?.workout.templateId ? db.workoutTemplates.get(detail.workout.templateId) : undefined),
    [detail?.workout.templateId],
  )
  const navigate = useNavigate()
  const [sharing, setSharing] = useState(false)

  const hasPR = !!comparison && comparison.prExerciseNames.length > 0
  const chimePlayed = useRef(false)

  useEffect(() => {
    if (chimePlayed.current) return
    if (!hasPR || !preferences) return
    if (preferences.soundEnabled) playRecordChime()
    if (preferences.hapticsEnabled) hapticSuccess(true)
    chimePlayed.current = true
  }, [hasPR, preferences])

  if (!detail || !comparison) {
    return (
      <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
        <p className="text-muted">{t('summary.notFound')}</p>
      </div>
    )
  }

  const { workout, exercises } = detail
  const setCount = exercises.reduce((sum, we) => sum + we.sets.length, 0)
  const volume = totalVolume(exercises.flatMap((we) => we.sets))
  const setTimestamps = exercises.flatMap((we) => we.sets.map((s) => s.createdAt))
  const firstSetAt = setTimestamps.length ? Math.min(...setTimestamps) : null
  const durationMs = workout.finishedAt && firstSetAt != null ? workout.finishedAt - firstSetAt : null

  async function handleShare() {
    setSharing(true)
    try {
      const blob = await generateBilanImage({
        programName: workout.title ?? template?.name ?? t('common.freeSession'),
        date: formatDateShort(workout.date),
        exerciseCount: exercises.length,
        setCount,
        volumeLabel: volume > 0 ? `${formatVolume(volume)} kg` : '—',
        durationLabel: durationMs != null ? formatDuration(durationMs) : '—',
        prNames: comparison?.prExerciseNames ?? [],
      })
      await shareOrDownloadImage(blob, t('summary.fileName', { date: workout.date }), t('summary.shareTitle'))
    } catch {
      // Share can be cancelled by the user (AbortError) or unsupported — either way, nothing to recover from here.
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
      {hasPR && <Confetti />}

      <div className="relative isolate mb-5 text-center">
        <AngkorSilhouette className="inset-x-0 bottom-0 h-20 w-full" />
        <div className="absolute right-0 top-0 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-3 text-muted active:bg-surface-4 disabled:opacity-50"
            aria-label={t('summary.share')}
            title={t('summary.shareShort')}
          >
            <ShareIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setHapticsEnabled(!preferences?.hapticsEnabled)}
            className={`flex h-9 w-9 items-center justify-center rounded-full ${
              preferences?.hapticsEnabled ? 'bg-accent-soft text-accent-ink' : 'bg-surface-3 text-muted'
            } active:bg-surface-4`}
            aria-label={preferences?.hapticsEnabled ? t('summary.hapticsOff') : t('summary.hapticsOn')}
            title={preferences?.hapticsEnabled ? t('summary.hapticsEnabled') : t('summary.hapticsDisabled')}
          >
            <VibrationIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setSoundEnabled(!preferences?.soundEnabled)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-3 text-muted active:bg-surface-4"
            aria-label={preferences?.soundEnabled ? t('summary.soundOff') : t('summary.soundOn')}
            title={preferences?.soundEnabled ? t('summary.soundEnabled') : t('summary.soundDisabled')}
          >
            {preferences?.soundEnabled ? (
              <SpeakerOnIcon className="h-4 w-4" />
            ) : (
              <SpeakerOffIcon className="h-4 w-4" />
            )}
          </button>
        </div>
        <ClipboardIcon className="mx-auto mb-2 h-9 w-9 text-accent-ink" />
        <h1 className="text-lg font-bold text-ink">{t('screens.sessionSummary')}</h1>
        <p className="text-sm text-muted">{formatDateShort(workout.date)}</p>
      </div>

      {hasPR && (
        <div className="animate-pop-in mb-4 flex items-start gap-2.5 rounded-2xl border border-highlight-line bg-highlight-soft px-4 py-3.5">
          <StarIcon className="pr-star-glow mt-0.5 h-5 w-5 shrink-0 text-highlight" />
          <p className="text-sm font-semibold text-highlight-ink">
            {comparison.prExerciseNames.length === 1
              ? t('summary.newRecord', { name: comparison.prExerciseNames[0] })
              : t('summary.newRecords', { names: comparison.prExerciseNames.join(', ') })}
          </p>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-2.5">
        <SummaryTile label={t('share.exercises')} target={exercises.length} formatValue={(n) => String(Math.round(n))} />
        <SummaryTile label={t('share.sets')} target={setCount} formatValue={(n) => String(Math.round(n))} />
        <SummaryTile
          label={t('share.volume')}
          target={volume}
          formatValue={(n) => (volume > 0 ? `${formatVolume(n)} kg` : '—')}
        />
        <SummaryTile
          label={t('share.duration')}
          target={durationMs ?? 0}
          formatValue={(n) => (durationMs != null ? formatDuration(n) : '—')}
        />
      </div>

      {exercises.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-muted">
          {t('summary.noExercise')}
        </p>
      ) : (
        <div className="space-y-3">
          {exercises.map((we, i) => (
            <ExerciseComparisonCard
              key={we.id}
              we={we}
              comparison={comparison.byWorkoutExerciseId.get(we.id!)}
              style={{ animationDelay: `${i * 40}ms` }}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-6 w-full rounded-2xl bg-accent py-3.5 font-semibold text-on-accent shadow-sm active:bg-accent-hover"
      >
        {t('summary.backHome')}
      </button>
    </div>
  )
}

function SummaryTile({
  label,
  target,
  formatValue,
}: {
  label: string
  target: number
  formatValue: (n: number) => string
}) {
  const animated = useCountUp(target)
  return (
    <div className="rounded-2xl border border-line bg-surface px-3.5 py-3 text-center shadow-sm">
      <p className="text-lg font-bold font-numbers tabular-nums text-ink">{formatValue(animated)}</p>
      <p className="text-xs font-medium text-muted">{label}</p>
    </div>
  )
}
