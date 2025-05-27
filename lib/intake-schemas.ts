import { z } from "zod"

export const identitySchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  age: z.number().min(18, "Must be 18 or older").max(120),
  gender: z.string().min(1, "Please select a gender"),
  location: z.string().min(1, "Location is required"),
})

export const householdSchema = z.object({
  maritalStatus: z.string().min(1, "Please select marital status"),
  children: z.number().min(0),
  householdSize: z.number().min(1),
  livingArrangement: z.string().min(1, "Please select living arrangement"),
})

export const mindsetSchema = z.object({
  personalityType: z.string().min(1, "Please select personality type"),
  stressLevel: z.number().min(1).max(10),
  motivationStyle: z.string().min(1, "Please select motivation style"),
  learningStyle: z.string().min(1, "Please select learning style"),
})

export const wellnessSchema = z.object({
  fitnessLevel: z.string().min(1, "Please select fitness level"),
  healthGoals: z.array(z.string()).min(1, "Select at least one health goal"),
  sleepHours: z.number().min(4).max(12),
  dietaryRestrictions: z.array(z.string()),
})

export const purposeSchema = z.object({
  lifeGoals: z.array(z.string()).min(1, "Select at least one life goal"),
  values: z.array(z.string()).min(1, "Select at least one value"),
  passions: z.string().min(1, "Please describe your passions"),
  legacy: z.string().min(1, "Please describe your desired legacy"),
})

export const workSchema = z.object({
  occupation: z.string().min(1, "Occupation is required"),
  workStyle: z.string().min(1, "Please select work style"),
  careerGoals: z.array(z.string()).min(1, "Select at least one career goal"),
  workLifeBalance: z.number().min(1).max(10),
})

export const lifestyleSchema = z.object({
  hobbies: z.array(z.string()).min(1, "Select at least one hobby"),
  socialLevel: z.number().min(1).max(10),
  travelFrequency: z.string().min(1, "Please select travel frequency"),
  environmentalConcern: z.number().min(1).max(10),
})

export const devicesSchema = z.object({
  primaryDevice: z.string().min(1, "Please select primary device"),
  screenTime: z.number().min(0).max(24),
  techComfort: z.number().min(1).max(10),
  preferredApps: z.array(z.string()),
})

export const financeSchema = z.object({
  incomeRange: z.string().min(1, "Please select income range"),
  financialGoals: z.array(z.string()).min(1, "Select at least one financial goal"),
  investmentExperience: z.string().min(1, "Please select investment experience"),
  budgetingStyle: z.string().min(1, "Please select budgeting style"),
})

export const preferencesSchema = z.object({
  communicationStyle: z.string().min(1, "Please select communication style"),
  coachingFrequency: z.string().min(1, "Please select coaching frequency"),
  reminderPreference: z.array(z.string()).min(1, "Select at least one reminder preference"),
  privacyLevel: z.string().min(1, "Please select privacy level"),
})

export const schemas = [
  identitySchema,
  householdSchema,
  mindsetSchema,
  wellnessSchema,
  purposeSchema,
  workSchema,
  lifestyleSchema,
  devicesSchema,
  financeSchema,
  preferencesSchema,
]
