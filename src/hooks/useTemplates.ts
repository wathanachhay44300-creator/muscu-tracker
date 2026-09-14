import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Exercise, TemplateExercise, WorkoutTemplate } from '../types'

export interface TemplateSummary {
  template: WorkoutTemplate
  exerciseCount: number
}

/** All templates with how many exercises each one has. */
export function useTemplates(): TemplateSummary[] | undefined {
  return useLiveQuery(async () => {
    const templates = await db.workoutTemplates.orderBy('name').toArray()
    return Promise.all(
      templates.map(async (template) => {
        const exerciseCount = await db.templateExercises
          .where('templateId')
          .equals(template.id!)
          .count()
        return { template, exerciseCount }
      }),
    )
  }, [])
}

export interface TemplateExerciseWithDetails extends TemplateExercise {
  exercise: Exercise
}

export interface TemplateDetail {
  template: WorkoutTemplate
  exercises: TemplateExerciseWithDetails[]
}

/** A single template with its ordered exercise list, joined with exercise details. */
export function useTemplateDetail(templateId: number | undefined): TemplateDetail | undefined {
  return useLiveQuery(async () => {
    if (!templateId) return undefined
    const template = await db.workoutTemplates.get(templateId)
    if (!template) return undefined

    const links = await db.templateExercises.where('templateId').equals(templateId).sortBy('order')
    const exercises = await Promise.all(
      links.map(async (link) => {
        const exercise = await db.exercises.get(link.exerciseId)
        return { ...link, exercise: exercise! }
      }),
    )
    return { template, exercises }
  }, [templateId])
}
