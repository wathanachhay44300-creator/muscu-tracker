import { useMemo, useState } from 'react'
import type { Equipment, Exercise, MuscleGroup } from '../types'
import type { ExerciseLibrary } from './useExerciseLibrary'
import { filterExercises, isSecondaryMatch } from '../lib/exerciseSearch'

export type BrowseMode = 'browse' | 'grouped' | 'search'

/**
 * Search + filters + the favorites / recently-used shortcuts, shared by the
 * exercise library screen and the picker. With nothing typed or selected it
 * shows favorites, then recent ones, then everything else by muscle group;
 * with only filters it groups the matches by muscle; with a query it shows a
 * single ranked list.
 */
export function useExerciseBrowser(library: ExerciseLibrary | undefined, excludeIds: number[] = []) {
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<MuscleGroup[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])

  const excludeKey = excludeIds.join(',')
  const all = useMemo(() => {
    const excluded = new Set(excludeIds)
    return (library?.all ?? []).filter((e) => !excluded.has(e.id!))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [library, excludeKey])

  const searching = query.trim().length > 0
  const filtering = groups.length > 0 || equipment.length > 0
  const mode: BrowseMode = searching ? 'search' : filtering ? 'grouped' : 'browse'

  const results = useMemo(() => filterExercises(all, { query, groups, equipment }), [all, query, groups, equipment])

  /** Results that only match the muscle filter through a secondary muscle. */
  const secondaryOnly = useMemo(
    () => new Set(results.filter((e) => isSecondaryMatch(e, groups)).map((e) => e.id!)),
    [results, groups],
  )

  const { favorites, recent, grouped, secondaryList } = useMemo(() => {
    const byGroup = (list: Exercise[]) => {
      const map = new Map<MuscleGroup, Exercise[]>()
      for (const ex of list) {
        if (!map.has(ex.muscleGroup)) map.set(ex.muscleGroup, [])
        map.get(ex.muscleGroup)!.push(ex)
      }
      return map
    }
    if (mode !== 'browse') {
      // Filters only: main-muscle matches grouped by muscle, then the ones that only work it as a secondary.
      const main = mode === 'grouped' ? results.filter((e) => !secondaryOnly.has(e.id!)) : results
      const secondary = mode === 'grouped' ? results.filter((e) => secondaryOnly.has(e.id!)) : []
      return { favorites: [] as Exercise[], recent: [] as Exercise[], grouped: byGroup(main), secondaryList: secondary }
    }
    const fav = (library?.favorites ?? []).filter((e) => all.some((a) => a.id === e.id))
    const byId = new Map(all.map((e) => [e.id!, e]))
    const rec = (library?.recentIds ?? []).map((id) => byId.get(id)).filter((e): e is Exercise => !!e)
    const shortcut = new Set([...fav, ...rec].map((e) => e.id!))
    return {
      favorites: fav,
      recent: rec,
      grouped: byGroup(all.filter((e) => !shortcut.has(e.id!))),
      secondaryList: [] as Exercise[],
    }
  }, [mode, library, all, results, secondaryOnly])

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
  }

  return {
    query,
    setQuery,
    groups,
    equipment,
    toggleGroup: (g: MuscleGroup) => setGroups((l) => toggle(l, g)),
    toggleEquipment: (e: Equipment) => setEquipment((l) => toggle(l, e)),
    clearFilters: () => {
      setGroups([])
      setEquipment([])
    },
    mode,
    searching,
    filtering,
    results,
    secondaryOnly,
    secondaryList,
    favorites,
    recent,
    grouped,
  }
}
