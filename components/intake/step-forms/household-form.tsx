"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { householdSchema } from "@/lib/intake-schemas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { z } from "zod"

type HouseholdFormData = z.infer<typeof householdSchema>

interface HouseholdFormProps {
  defaultValues?: Partial<HouseholdFormData>
  onSubmit: (data: HouseholdFormData) => void
}

export function HouseholdForm({ defaultValues, onSubmit }: HouseholdFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<HouseholdFormData>({
    resolver: zodResolver(householdSchema),
    defaultValues,
    mode: "onChange",
  })

  const watchedMaritalStatus = watch("maritalStatus")
  const watchedLivingArrangement = watch("livingArrangement")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Household Information</CardTitle>
        <CardDescription>Tell us about your living situation to better understand your lifestyle.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Marital Status</Label>
            <Select value={watchedMaritalStatus} onValueChange={(value) => setValue("maritalStatus", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your marital status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
                <SelectItem value="partnered">In a relationship</SelectItem>
              </SelectContent>
            </Select>
            {errors.maritalStatus && <p className="text-sm text-destructive">{errors.maritalStatus.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="children">Number of Children</Label>
            <Input
              id="children"
              type="number"
              min="0"
              {...register("children", { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.children && <p className="text-sm text-destructive">{errors.children.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="householdSize">Total Household Size</Label>
            <Input
              id="householdSize"
              type="number"
              min="1"
              {...register("householdSize", { valueAsNumber: true })}
              placeholder="Including yourself"
            />
            {errors.householdSize && <p className="text-sm text-destructive">{errors.householdSize.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Living Arrangement</Label>
            <Select value={watchedLivingArrangement} onValueChange={(value) => setValue("livingArrangement", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your living arrangement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="own-house">Own house</SelectItem>
                <SelectItem value="rent-house">Rent house</SelectItem>
                <SelectItem value="own-apartment">Own apartment</SelectItem>
                <SelectItem value="rent-apartment">Rent apartment</SelectItem>
                <SelectItem value="with-family">Living with family</SelectItem>
                <SelectItem value="shared-housing">Shared housing</SelectItem>
              </SelectContent>
            </Select>
            {errors.livingArrangement && <p className="text-sm text-destructive">{errors.livingArrangement.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={!isValid}>
            Next Step
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
