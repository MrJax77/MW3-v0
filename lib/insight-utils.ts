// Define insight types for better categorization and processing
export type InsightType =
  | "relationship_tip"
  | "wellness_tip"
  | "mindset_tip"
  | "goal_tip"
  | "daily_tip"
  | "parenting_tip"
  | "work_life_balance_tip"
  | "general_tip"

// Helper function to determine insight focus based on user data and rotation strategy
export function determineInsightFocus(
  profile: any,
  recentActivity: any[],
  trends: any,
  previousInsightTypes: string[],
): { insightType: InsightType; focusArea: string } {
  // Default values
  let insightType: InsightType = "general_tip"
  let focusArea = "general wellbeing"

  // Define priority areas based on profile data
  const priorityAreas = []

  // Check relationship priorities
  if (profile.spouse_relationship_rating !== null && profile.spouse_relationship_rating < 7) {
    priorityAreas.push({
      type: "relationship_tip" as InsightType,
      area: "relationship with " + (profile.spouse_name || "partner"),
      priority: 10 - profile.spouse_relationship_rating,
      lastUsed: previousInsightTypes.findIndex((t) => t === "relationship_tip"),
    })
  }

  if (profile.children_relationship_rating !== null && profile.children_relationship_rating < 7) {
    priorityAreas.push({
      type: "parenting_tip" as InsightType,
      area: "parenting and family relationships",
      priority: 10 - profile.children_relationship_rating,
      lastUsed: previousInsightTypes.findIndex((t) => t === "parenting_tip"),
    })
  }

  // Check health priorities
  if (profile.current_health_rating !== null && profile.current_health_rating < 7) {
    priorityAreas.push({
      type: "wellness_tip" as InsightType,
      area: "health and wellness",
      priority: 10 - profile.current_health_rating,
      lastUsed: previousInsightTypes.findIndex((t) => t === "wellness_tip"),
    })
  }

  // Check mindset priorities
  if (profile.current_stress_level !== null && profile.current_stress_level > 6) {
    priorityAreas.push({
      type: "mindset_tip" as InsightType,
      area: "stress management",
      priority: profile.current_stress_level,
      lastUsed: previousInsightTypes.findIndex((t) => t === "mindset_tip"),
    })
  }

  // Check goal priorities
  if (profile.family_future_goal) {
    priorityAreas.push({
      type: "goal_tip" as InsightType,
      area: "goal achievement",
      priority: 5, // Medium priority
      lastUsed: previousInsightTypes.findIndex((t) => t === "goal_tip"),
    })
  }

  // Check work-life balance based on routine description
  if (
    profile.routine_description &&
    (profile.routine_description.toLowerCase().includes("work") ||
      profile.routine_description.toLowerCase().includes("busy"))
  ) {
    priorityAreas.push({
      type: "work_life_balance_tip" as InsightType,
      area: "work-life balance",
      priority: 6,
      lastUsed: previousInsightTypes.findIndex((t) => t === "work_life_balance_tip"),
    })
  }

  // Add daily habits if we have recent activity data
  if (recentActivity.length > 0) {
    priorityAreas.push({
      type: "daily_tip" as InsightType,
      area: "daily habits",
      priority: 4, // Lower priority
      lastUsed: previousInsightTypes.findIndex((t) => t === "daily_tip"),
    })
  }

  // Add general tip as fallback
  priorityAreas.push({
    type: "general_tip" as InsightType,
    area: "personal growth",
    priority: 3,
    lastUsed: previousInsightTypes.findIndex((t) => t === "general_tip"),
  })

  // If we have priority areas, select one based on priority and rotation
  if (priorityAreas.length > 0) {
    // Sort by priority (highest first)
    priorityAreas.sort((a, b) => b.priority - a.priority)

    // Check if the highest priority area was used recently
    const highestPriority = priorityAreas[0]

    // If highest priority wasn't used in the last 3 insights or has very high priority, use it
    if (highestPriority.lastUsed === -1 || highestPriority.lastUsed > 2 || highestPriority.priority > 8) {
      insightType = highestPriority.type
      focusArea = highestPriority.area
    } else {
      // Otherwise rotate through other areas that haven't been used recently
      const unusedAreas = priorityAreas.filter((area) => area.lastUsed === -1)
      const leastRecentlyUsed = priorityAreas.sort((a, b) => {
        // Sort by last used (oldest first, -1 means never used)
        if (a.lastUsed === -1) return -1
        if (b.lastUsed === -1) return 1
        return b.lastUsed - a.lastUsed
      })

      // Select either an unused area or least recently used
      const selected = unusedAreas.length > 0 ? unusedAreas[0] : leastRecentlyUsed[0]
      insightType = selected.type
      focusArea = selected.area
    }
  }

  return { insightType, focusArea }
}

// Helper function to validate insight quality
export function validateInsightQuality(
  insight: string,
  insightType: InsightType,
  focusArea: string,
): { isValid: boolean; reason?: string } {
  // Basic validation
  if (insight.length < 50) {
    return { isValid: false, reason: "Insight too short" }
  }

  if (!insight.includes(" ")) {
    return { isValid: false, reason: "Invalid formatting" }
  }

  // Check if insight contains actionable advice
  const actionWords = ["try", "consider", "start", "practice", "focus", "prioritize", "schedule", "create", "implement"]
  const containsActionableAdvice = actionWords.some((word) => insight.toLowerCase().includes(word))

  if (!containsActionableAdvice) {
    return { isValid: false, reason: "No actionable advice" }
  }

  // Check if insight is relevant to the focus area
  const focusAreaKeywords = focusArea.toLowerCase().split(" ")
  const isRelevantToFocusArea = focusAreaKeywords.some(
    (keyword) => insight.toLowerCase().includes(keyword) && keyword.length > 3,
  )

  if (!isRelevantToFocusArea && focusArea !== "general wellbeing") {
    return { isValid: false, reason: "Not relevant to focus area" }
  }

  return { isValid: true }
}
