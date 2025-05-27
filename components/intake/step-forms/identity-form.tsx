"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { identitySchema } from "@/lib/intake-schemas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { z } from "zod"

type IdentityFormData = z.infer<typeof identitySchema>

interface IdentityFormProps {
  defaultValues?: Partial<IdentityFormData>
  onSubmit: (data: IdentityFormData) => void
}

export function IdentityForm({ defaultValues, onSubmit }: IdentityFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<IdentityFormData>({
    resolver: zodResolver(identitySchema),
    defaultValues,
    mode: "onChange",
  })

  const watchedGender = watch("gender")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tell us about yourself</CardTitle>
        <CardDescription>Let's start with some basic information to personalize your experience.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...register("firstName")} placeholder="Enter your first name" />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...register("lastName")} placeholder="Enter your last name" />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input id="age" type="number" {...register("age", { valueAsNumber: true })} placeholder="Enter your age" />
            {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={watchedGender} onValueChange={(value) => setValue("gender", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="non-binary">Non-binary</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...register("location")} placeholder="City, State/Country" />
            {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={!isValid}>
            Next Step
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
