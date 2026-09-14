import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { todayISO } from '../lib/date'
import type { PlannedSession } from '../types'

export interface PlannedSessionWithTemplate {
  session: PlannedSession
  templateName: string
}

/** Planned sessions from today onward, soonest first. */
export function useUpcomingPlannedSessions(): PlannedSessionWithTemplate[] | undefined {
  return useLiveQuery(async () => {
    const sessions = await db.plannedSessions.where('date').aboveOrEqual(todayISO()).sortBy('date')
    return Promise.all(
      sessions.map(async (session) => {
        const template = await db.workoutTemplates.get(session.templateId)
        return { session, templateName: template?.name ?? 'Programme supprimé' }
      }),
    )
  }, [])
}

/** The planned session for one specific date, if any (`null` when none). */
export function usePlannedSessionForDate(date: string): PlannedSessionWithTemplate | null | undefined {
  return useLiveQuery(async () => {
    const session = await db.plannedSessions.where('date').equals(date).first()
    if (!session) return null
    const template = await db.workoutTemplates.get(session.templateId)
    return { session, templateName: template?.name ?? 'Programme supprimé' }
  }, [date])
}

/** date -> template name, for marking days on the planning calendar. */
export function usePlannedDates(): Map<string, string> | undefined {
  return useLiveQuery(async () => {
    const sessions = await db.plannedSessions.toArray()
    const map = new Map<string, string>()
    for (const s of sessions) {
      const template = await db.workoutTemplates.get(s.templateId)
      map.set(s.date, template?.name ?? '')
    }
    return map
  }, [])
}
