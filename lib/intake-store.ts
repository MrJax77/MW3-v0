import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface IntakeData {
  // Stage 0: Consent
  consent_agreed?: boolean

  // Stage 1: Basic Info
  first_name?: string
  age?: number
  role?: string
  spouse_name?: string
  children_count?: number
  children_ages?: string

  // Stage 2: Relationships
  spouse_relationship_rating?: number
  spouse_relationship_reason?: string
  children_relationship_rating?: number
  children_relationship_reason?: string
  spouse_relationship_goal?: string
  parenting_goal?: string
  upcoming_events?: string[]

  // Stage 3: Health & Wellness
  current_health_rating?: number
  health_rating_reason?: string
  health_goal?: string
  exercise_frequency?: number
  sleep_hours?: number

  // Stage 4: Mindset & Stress
  current_stress_level?: number
  stress_rating_reason?: string
  personal_goal?: string
  mindfulness_practices?: string[]

  // Stage 5: Daily Routine
  routine_description?: string

  // Stage 6: Future Goals
  family_future_goal?: string

  // Stage 7: Family Values
  family_value?: string

  // Stage 8: Technology
  wearable_usage?: string[]
  google_calendar_sync?: boolean
  apple_health_sync?: boolean

  // Stage 9: Preferences
  notification_channel?: string
  quiet_hours_start?: string
  quiet_hours_end?: string
  data_deletion_acknowledged?: boolean

  // Meta
  completed_stages?: number
  is_complete?: boolean
  last_saved?: string
}

interface IntakeStore {
  currentStage: number
  data: IntakeData
  hasShownMidpointModal: boolean
  lastAutoSave: number
  isInitialized: boolean
  setStage: (stage: number) => void
  updateData: (stageData: Partial<IntakeData>) => void
  setMidpointModalShown: (shown: boolean) => void
  updateLastAutoSave: () => void
  resetForm: () => void
  finishLater: () => void
  initializeFromProfile: (profileData: any) => void
  setInitialized: (initialized: boolean) => void
}

export const useIntakeStore = create<IntakeStore>()(
  persist(
    (set, get) => ({
      currentStage: 0,
      data: {},
      hasShownMidpointModal: false,
      lastAutoSave: 0,
      isInitialized: false,

      setStage: (stage) => set({ currentStage: stage }),

      updateData: (stageData) =>
        set((state) => ({
          data: {
            ...state.data,
            ...stageData,
            last_saved: new Date().toISOString(),
          },
        })),

      setMidpointModalShown: (shown) => set({ hasShownMidpointModal: shown }),

      updateLastAutoSave: () => set({ lastAutoSave: Date.now() }),

      resetForm: () =>
        set({
          currentStage: 0,
          data: {},
          hasShownMidpointModal: false,
          lastAutoSave: 0,
          isInitialized: false,
        }),

      finishLater: () =>
        set((state) => ({
          data: {
            ...state.data,
            completed_stages: state.currentStage,
          },
        })),

      initializeFromProfile: (profileData) => {
        if (!profileData) return

        const mappedData: IntakeData = {
          // Map all profile fields to intake data
          consent_agreed: profileData.consent_agreed,
          first_name: profileData.first_name,
          age: profileData.age,
          role: profileData.role,
          spouse_name: profileData.spouse_name,
          children_count: profileData.children_count,
          children_ages: profileData.children_ages,
          spouse_relationship_rating: profileData.spouse_relationship_rating,
          spouse_relationship_reason: profileData.spouse_relationship_reason,
          children_relationship_rating: profileData.children_relationship_rating,
          children_relationship_reason: profileData.children_relationship_reason,
          spouse_relationship_goal: profileData.spouse_relationship_goal,
          parenting_goal: profileData.parenting_goal,
          upcoming_events: profileData.upcoming_events,
          current_health_rating: profileData.current_health_rating,
          health_rating_reason: profileData.health_rating_reason,
          health_goal: profileData.health_goal,
          exercise_frequency: profileData.exercise_frequency,
          sleep_hours: profileData.sleep_hours,
          current_stress_level: profileData.current_stress_level,
          stress_rating_reason: profileData.stress_rating_reason,
          personal_goal: profileData.personal_goal,
          mindfulness_practices: profileData.mindfulness_practices,
          routine_description: profileData.routine_description,
          family_future_goal: profileData.family_future_goal,
          family_value: profileData.family_value,
          wearable_usage: profileData.wearable_usage,
          google_calendar_sync: profileData.google_calendar_sync,
          apple_health_sync: profileData.apple_health_sync,
          notification_channel: profileData.notification_channel,
          quiet_hours_start: profileData.quiet_hours_start,
          quiet_hours_end: profileData.quiet_hours_end,
          data_deletion_acknowledged: profileData.data_deletion_acknowledged,
          completed_stages: profileData.completed_stages,
          is_complete: profileData.is_complete,
          last_saved: profileData.last_saved,
        }

        // Determine current stage based on completed stages
        const currentStage = profileData.is_complete ? 10 : profileData.completed_stages || 0

        set({
          data: mappedData,
          currentStage,
          hasShownMidpointModal: currentStage > 4,
          isInitialized: true,
        })
      },

      setInitialized: (initialized) => set({ isInitialized: initialized }),
    }),
    {
      name: "intake-storage",
      // Only persist certain fields to avoid conflicts
      partialize: (state) => ({
        hasShownMidpointModal: state.hasShownMidpointModal,
        lastAutoSave: state.lastAutoSave,
      }),
    },
  ),
)
