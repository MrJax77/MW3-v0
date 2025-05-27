import { z } from "zod"

// Module 1: Basic Info
export const basicInfoSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  age: z.number().min(0).max(100),
  role: z.string().min(1, "Please select your role"),
  spouse_name: z.string().optional(),
  children_count: z.number().min(0).max(10),
  children_ages: z.string().optional(),
})

// Module 2: Relationships
export const relationshipsSchema = z.object({
  spouse_relationship_rating: z.number().min(0).max(10),
  spouse_relationship_reason: z.string().min(1, "Please explain your rating"),
  children_relationship_rating: z.number().min(0).max(10),
  children_relationship_reason: z.string().min(1, "Please explain your rating"),
  spouse_relationship_goal: z.string().min(1, "Please share a relationship goal"),
  parenting_goal: z.string().min(1, "Please share a parenting goal"),
  upcoming_events: z.array(z.string()),
})

// Module 3: Health & Wellness
export const healthWellnessSchema = z.object({
  current_health_rating: z.number().min(0).max(10),
  health_rating_reason: z.string().min(1, "Please explain your rating"),
  health_goal: z.string().min(1, "Please share a health goal"),
  exercise_frequency: z.number().min(0).max(7),
  sleep_hours: z.number().min(0).max(10),
})

// Module 4: Mindset & Stress
export const mindsetStressSchema = z.object({
  current_stress_level: z.number().min(0).max(10),
  stress_rating_reason: z.string().min(1, "Please explain your stress level"),
  personal_goal: z.string().min(1, "Please share a personal goal"),
  mindfulness_practices: z.array(z.string()),
})

// Module 5: Routine
export const routineSchema = z.object({
  routine_description: z.string().min(10, "Please describe your typical weekday in detail"),
})

// Module 6: Future Goals
export const futureGoalsSchema = z.object({
  family_future_goal: z.string().min(1, "Please share your family's future goal"),
})

// Module 7: Technology (Expert)
export const technologySchema = z.object({
  wearable_usage: z.array(z.string()),
})

// Module 8: Values (Expert)
export const valuesSchema = z.object({
  family_value: z.string().min(1, "Please share a core family value"),
})

export const schemas = [
  basicInfoSchema,
  relationshipsSchema,
  healthWellnessSchema,
  mindsetStressSchema,
  routineSchema,
  futureGoalsSchema,
  technologySchema,
  valuesSchema,
]
