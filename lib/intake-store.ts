import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface IntakeData {
  identity_json: any
  household_json: any
  mindset_json: any
  wellness_json: any
  purpose_json: any
  work_json: any
  lifestyle_json: any
  devices_json: any
  finance_json: any
  preferences_json: any
}

interface IntakeStore {
  currentStep: number
  data: Partial<IntakeData>
  setStep: (step: number) => void
  updateData: (step: keyof IntakeData, data: any) => void
  resetForm: () => void
}

const stepKeys: (keyof IntakeData)[] = [
  "identity_json",
  "household_json",
  "mindset_json",
  "wellness_json",
  "purpose_json",
  "work_json",
  "lifestyle_json",
  "devices_json",
  "finance_json",
  "preferences_json",
]

export const useIntakeStore = create<IntakeStore>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      data: {},
      setStep: (step) => set({ currentStep: step }),
      updateData: (step, data) =>
        set((state) => ({
          data: { ...state.data, [step]: data },
        })),
      resetForm: () => set({ currentStep: 1, data: {} }),
    }),
    {
      name: "intake-storage",
    },
  ),
)

export { stepKeys }
