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

// Legacy schemas for backward compatibility
export const identitySchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  age: z.number().min(0).max(120),
  gender: z.string().min(1, "Please select your gender"),
  location: z.string().min(1, "Location is required"),
})

export const householdSchema = z.object({
  maritalStatus: z.string().min(1, "Please select your marital status"),
  children: z.number().min(0).max(20),
  householdSize: z.number().min(1).max(50),
  livingArrangement: z.string().min(1, "Please select your living arrangement"),
})

export const wellnessSchema = z.object({
  fitnessLevel: z.string().min(1, "Please select your fitness level"),
  healthGoals: z.array(z.string()).min(1, "Please select at least one health goal"),
  sleepHours: z.number().min(4).max(12),
  dietaryRestrictions: z.array(z.string()),
})

export const mindsetSchema = z.object({
  personalityType: z.string().min(1, "Please select your personality type"),
  stressLevel: z.number().min(1).max(10),
  motivationStyle: z.string().min(1, "Please select your motivation style"),
  learningStyle: z.string().min(1, "Please select your learning style"),
})

export const purposeSchema = z.object({
  lifeGoals: z.array(z.string()).min(1, "Please select at least one life goal"),
  values: z.array(z.string()).min(1, "Please select at least one core value"),
  passions: z.string().min(1, "Please describe your passions"),
  legacy: z.string().min(1, "Please describe your desired legacy"),
})
