"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { basicInfoSchema } from "@/lib/intake-schemas"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import type { z } from "zod"
import { EnhancedInput } from "@/components/ui/enhanced-input"

type BasicInfoData = z.infer<typeof basicInfoSchema>

interface BasicInfoFormProps {
  defaultValues?: Partial<BasicInfoData>
  onSubmit: (data: BasicInfoData) => void
}

export function BasicInfoForm({ defaultValues, onSubmit }: BasicInfoFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<BasicInfoData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      age: 30,
      children_count: 0,
      ...defaultValues,
    },
    mode: "onChange",
  })

  const watchedRole = watch("role")
  const watchedAge = watch("age") || 30
  const watchedChildrenCount = watch("children_count") || 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Let's Get to Know You</CardTitle>
        <CardDescription>Tell us about yourself and your family to personalize your experience.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <EnhancedInput
              label="What is your first name?"
              field="first_name"
              formContext="This form collects basic personal information about the user and their family."
              value={watch("first_name") || ""}
              onValueChange={(value) => setValue("first_name", value, { shouldValidate: true })}
              placeholder="Enter your first name"
            />
            {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>What is your age? ({watchedAge} years old)</Label>
            <Slider
              value={[watchedAge]}
              onValueChange={(value) => setValue("age", value[0])}
              max={100}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>100</span>
            </div>
            {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>What is your role in the family?</Label>
            <Select value={watchedRole} onValueChange={(value) => setValue("role", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mother">Mother</SelectItem>
                <SelectItem value="father">Father</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="guardian">Guardian</SelectItem>
                <SelectItem value="caregiver">Caregiver</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
          </div>

          <div className="space-y-2">
            <EnhancedInput
              label="What is your spouse or partner's first name? (if applicable)"
              field="spouse_name"
              formContext="This form collects basic personal information about the user and their family."
              value={watch("spouse_name") || ""}
              onValueChange={(value) => setValue("spouse_name", value, { shouldValidate: true })}
              placeholder="Enter partner's name (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label>How many children do you have? ({watchedChildrenCount} children)</Label>
            <Select
              value={watchedChildrenCount.toString()}
              onValueChange={(value) => setValue("children_count", Number.parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 11 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {i} {i === 1 ? "child" : "children"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.children_count && <p className="text-sm text-destructive">{errors.children_count.message}</p>}
          </div>

          {watchedChildrenCount > 0 && (
            <div className="space-y-2">
              <EnhancedInput
                label="What are the ages of your children?"
                field="children_ages"
                formContext="This form collects basic personal information about the user and their family."
                value={watch("children_ages") || ""}
                onValueChange={(value) => setValue("children_ages", value, { shouldValidate: true })}
                placeholder="e.g., 5, 8, 12 or toddler, teen"
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={!isValid}>
            Continue to Relationships
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
