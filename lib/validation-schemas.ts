import { z } from "zod"

// Basic profile schema
export const profileSchema = z.object({
  user_id: z.string().uuid(),
  first_name: z.string().min(1, "First name is required").max(100).nullable(),
  age: z.number().int().min(0).max(120).nullable(),
  role: z.string().max(100).nullable(),
  consent_agreed: z.boolean().default(false),

  // Relationships
  spouse_name: z.string().max(100).nullable(),
  children_count: z.number().int().min(0).max(20).nullable(),
  children_ages: z.string().max(100).nullable(),
  spouse_relationship_rating: z.number().min(0).max(10).nullable(),
  spouse_relationship_reason: z.string().max(1000).nullable(),
  children_relationship_rating: z.number().min(0).max(10).nullable(),
  children_relationship_reason: z.string().max(1000).nullable(),
  spouse_relationship_goal: z.string().max(500).nullable(),
  parenting_goal: z.string().max(500).nullable(),
  upcoming_events: z.array(z.string()).nullable(),

  // Health & Wellness
  current_health_rating: z.number().min(0).max(10).nullable(),
  health_rating_reason: z.string().max(1000).nullable(),
  health_goal: z.string().max(500).nullable(),
  exercise_frequency: z.number().min(0).max(7).nullable(),
  sleep_hours: z.number().min(0).max(24).nullable(),

  // Mindset & Stress
  current_stress_level: z.number().min(0).max(10).nullable(),
  stress_rating_reason: z.string().max(1000).nullable(),
  personal_goal: z.string().max(500).nullable(),
  mindfulness_practices: z.array(z.string()).nullable(),

  // Daily Routine
  routine_description: z.string().max(2000).nullable(),

  // Future Goals
  family_future_goal: z.string().max(1000).nullable(),

  // Family Values
  family_value: z.string().max(1000).nullable(),

  // Technology
  wearable_usage: z.array(z.string()).nullable(),
  google_calendar_sync: z.boolean().default(false),
  apple_health_sync: z.boolean().default(false),

  // Preferences
  notification_channel: z.string().max(20).default("email"),
  quiet_hours_start: z.string().max(10).default("22:00"),
  quiet_hours_end: z.string().max(10).default("07:00"),
  data_deletion_acknowledged: z.boolean().default(false),

  // Progress tracking
  completed_stages: z.number().int().min(0).max(10).default(0),
  is_complete: z.boolean().default(false),
  last_saved: z.string().optional(),
  updated_at: z.string().optional(),
})

// Daily log schema
export const dailyLogSchema = z.object({
  user_id: z.string().uuid(),
  log_date: z.string(),
  sleep_hours: z.number().min(0).max(24),
  exercise_minutes: z.number().min(0).max(1440),
  quality_time: z.number().min(0).max(1440),
  mood_rating: z.number().min(1).max(10),
  notes: z.string().max(1000).nullable(),
  updated_at: z.string().optional(),
})

// Insight schema
export const insightSchema = z.object({
  user_id: z.string().uuid(),
  insight_text: z.string().max(5000),
  insight_type: z.string().max(50),
  created_at: z.string().optional(),
})

// Validation function for profile data based on stage
export function validateProfileForStage(data: any, stage: number) {
  // Create a partial schema based on the stage
  let stageSchema: z.ZodType<any>

  switch (stage) {
    case 1: // Basic Info
      stageSchema = profileSchema.pick({
        user_id: true,
        first_name: true,
        age: true,
        role: true,
        consent_agreed: true,
      })
      break

    case 2: // Relationships
      stageSchema = profileSchema.pick({
        user_id: true,
        spouse_name: true,
        children_count: true,
        children_ages: true,
        spouse_relationship_rating: true,
        spouse_relationship_reason: true,
        children_relationship_rating: true,
        children_relationship_reason: true,
        spouse_relationship_goal: true,
        parenting_goal: true,
        upcoming_events: true,
      })
      break

    // Add cases for other stages

    default:
      // For unknown stages, validate against the full schema
      stageSchema = profileSchema
  }

  return stageSchema.safeParse(data)
}
