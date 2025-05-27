export function validateIntakeData(data: any, stage: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Stage 0: Consent
  if (stage >= 0 && !data.consent_agreed) {
    errors.push("Consent is required to proceed")
  }

  // Stage 1: Basic Info
  if (stage >= 1) {
    if (!data.first_name || data.first_name.trim() === "") {
      errors.push("First name is required")
    }
    if (!data.age || data.age < 0 || data.age > 120) {
      errors.push("Valid age is required")
    }
    if (!data.role || data.role.trim() === "") {
      errors.push("Role is required")
    }
    if (data.children_count < 0 || data.children_count > 20) {
      errors.push("Children count must be between 0 and 20")
    }
  }

  // Stage 2: Relationships
  if (stage >= 2) {
    if (
      data.spouse_relationship_rating !== null &&
      (data.spouse_relationship_rating < 0 || data.spouse_relationship_rating > 10)
    ) {
      errors.push("Spouse relationship rating must be between 0-10")
    }
    if (
      data.children_relationship_rating !== null &&
      (data.children_relationship_rating < 0 || data.children_relationship_rating > 10)
    ) {
      errors.push("Children relationship rating must be between 0-10")
    }
  }

  // Stage 3: Health & Wellness
  if (stage >= 3) {
    if (data.current_health_rating !== null && (data.current_health_rating < 0 || data.current_health_rating > 10)) {
      errors.push("Health rating must be between 0-10")
    }
    if (data.exercise_frequency !== null && (data.exercise_frequency < 0 || data.exercise_frequency > 7)) {
      errors.push("Exercise frequency must be between 0-7 days")
    }
    if (data.sleep_hours !== null && (data.sleep_hours < 0 || data.sleep_hours > 24)) {
      errors.push("Sleep hours must be between 0-24")
    }
  }

  // Stage 4: Mindset & Stress
  if (stage >= 4) {
    if (data.current_stress_level !== null && (data.current_stress_level < 0 || data.current_stress_level > 10)) {
      errors.push("Stress level must be between 0-10")
    }
  }

  // Text length validations
  const textFields = [
    { field: "first_name", maxLength: 100 },
    { field: "spouse_name", maxLength: 100 },
    { field: "role", maxLength: 50 },
    { field: "spouse_relationship_reason", maxLength: 1000 },
    { field: "children_relationship_reason", maxLength: 1000 },
    { field: "spouse_relationship_goal", maxLength: 500 },
    { field: "parenting_goal", maxLength: 500 },
    { field: "health_rating_reason", maxLength: 1000 },
    { field: "health_goal", maxLength: 500 },
    { field: "stress_rating_reason", maxLength: 1000 },
    { field: "personal_goal", maxLength: 500 },
    { field: "routine_description", maxLength: 2000 },
    { field: "family_future_goal", maxLength: 1000 },
    { field: "family_value", maxLength: 1000 },
  ]

  textFields.forEach(({ field, maxLength }) => {
    if (data[field] && data[field].length > maxLength) {
      errors.push(`${field.replace("_", " ")} is too long (max ${maxLength} characters)`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function sanitizeIntakeData(data: any): any {
  const sanitized = { ...data }

  // Trim all string fields
  Object.keys(sanitized).forEach((key) => {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitized[key].trim()
    }
  })

  // Ensure arrays are properly formatted
  const arrayFields = ["upcoming_events", "mindfulness_practices", "wearable_usage"]
  arrayFields.forEach((field) => {
    if (!Array.isArray(sanitized[field])) {
      sanitized[field] = []
    }
  })

  // Ensure numbers are properly typed
  const numberFields = [
    "age",
    "children_count",
    "spouse_relationship_rating",
    "children_relationship_rating",
    "current_health_rating",
    "exercise_frequency",
    "sleep_hours",
    "current_stress_level",
    "completed_stages",
  ]
  numberFields.forEach((field) => {
    if (sanitized[field] !== null && sanitized[field] !== undefined) {
      sanitized[field] = Number(sanitized[field])
    }
  })

  // Ensure booleans are properly typed
  const booleanFields = [
    "consent_agreed",
    "google_calendar_sync",
    "apple_health_sync",
    "data_deletion_acknowledged",
    "is_complete",
  ]
  booleanFields.forEach((field) => {
    if (sanitized[field] !== null && sanitized[field] !== undefined) {
      sanitized[field] = Boolean(sanitized[field])
    }
  })

  return sanitized
}
