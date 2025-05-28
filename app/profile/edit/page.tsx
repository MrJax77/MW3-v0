"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getClientProfile, saveClientIntakeModule } from "@/lib/client-actions"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  User,
  Heart,
  Activity,
  Brain,
  Calendar,
  Target,
  Home,
  Laptop,
  Settings,
  Edit,
  Check,
  X,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function ProfileEditPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("basic-info")
  const [editMode, setEditMode] = useState<Record<string, boolean>>({
    "basic-info": false,
    relationships: false,
    health: false,
    mindset: false,
    routine: false,
    goals: false,
    values: false,
    technology: false,
    preferences: false,
  })
  const [formData, setFormData] = useState<any>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        const profileData = await getClientProfile()
        if (!profileData) {
          toast({
            title: "Error",
            description: "Could not load your profile. Please try again.",
            variant: "destructive",
          })
          router.push("/dashboard")
          return
        }

        setProfile(profileData)
        setFormData(profileData)
      } catch (error) {
        console.error("Error loading profile:", error)
        toast({
          title: "Error",
          description: "Could not load your profile. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [router, toast])

  const toggleEditMode = (tab: string) => {
    setEditMode((prev) => ({
      ...prev,
      [tab]: !prev[tab],
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSliderChange = (name: string, value: number[]) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value[0],
    }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleArrayChange = (name: string, value: string, checked: boolean) => {
    setFormData((prev) => {
      const currentArray = Array.isArray(prev[name]) ? [...prev[name]] : []
      if (checked) {
        return { ...prev, [name]: [...currentArray, value] }
      } else {
        return { ...prev, [name]: currentArray.filter((item) => item !== value) }
      }
    })
  }

  const handleSaveSection = async (section: string) => {
    try {
      setIsSaving(true)

      // Preserve existing data and merge with form changes
      const dataToSave = {
        ...profile,
        ...formData,
      }

      await saveClientIntakeModule(dataToSave)

      // Update profile state with new data
      setProfile(dataToSave)

      toast({
        title: "Section Updated",
        description: `Your ${section} information has been saved.`,
      })

      // Exit edit mode
      toggleEditMode(activeTab)
    } catch (error) {
      console.error("Error saving section:", error)
      toast({
        title: "Save Failed",
        description: "Could not save your changes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = (tab: string) => {
    // Reset form data to original profile data
    setFormData(profile)
    toggleEditMode(tab)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleNextSection = () => {
    const tabs = [
      "basic-info",
      "relationships",
      "health",
      "mindset",
      "routine",
      "goals",
      "values",
      "technology",
      "preferences",
    ]

    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Your Profile</h1>
          <p className="text-muted-foreground">Update your profile information and preferences</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Dashboard
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-9 mb-8">
          <TabsTrigger value="basic-info" className="flex flex-col items-center gap-1 py-2">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Basic Info</span>
          </TabsTrigger>
          <TabsTrigger value="relationships" className="flex flex-col items-center gap-1 py-2">
            <Heart className="h-4 w-4" />
            <span className="hidden md:inline">Relationships</span>
          </TabsTrigger>
          <TabsTrigger value="health" className="flex flex-col items-center gap-1 py-2">
            <Activity className="h-4 w-4" />
            <span className="hidden md:inline">Health</span>
          </TabsTrigger>
          <TabsTrigger value="mindset" className="flex flex-col items-center gap-1 py-2">
            <Brain className="h-4 w-4" />
            <span className="hidden md:inline">Mindset</span>
          </TabsTrigger>
          <TabsTrigger value="routine" className="flex flex-col items-center gap-1 py-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden md:inline">Routine</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex flex-col items-center gap-1 py-2">
            <Target className="h-4 w-4" />
            <span className="hidden md:inline">Goals</span>
          </TabsTrigger>
          <TabsTrigger value="values" className="flex flex-col items-center gap-1 py-2">
            <Home className="h-4 w-4" />
            <span className="hidden md:inline">Values</span>
          </TabsTrigger>
          <TabsTrigger value="technology" className="flex flex-col items-center gap-1 py-2">
            <Laptop className="h-4 w-4" />
            <span className="hidden md:inline">Technology</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex flex-col items-center gap-1 py-2">
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline">Preferences</span>
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic-info">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </div>
              {!editMode["basic-info"] && (
                <Button variant="outline" size="sm" onClick={() => toggleEditMode("basic-info")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editMode["basic-info"] ? (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" name="age" type="number" value={formData.age || ""} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" name="role" value={formData.role || ""} onChange={handleInputChange} />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>
                    <strong>Name:</strong> {profile.first_name || "Not provided"}
                  </p>
                  <p>
                    <strong>Age:</strong> {profile.age || "Not provided"}
                  </p>
                  <p>
                    <strong>Role:</strong> {profile.role || "Not provided"}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {editMode["basic-info"] ? (
                <>
                  <Button variant="outline" onClick={() => handleCancelEdit("basic-info")}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={() => handleSaveSection("basic info")} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    Cancel
                  </Button>
                  <Button onClick={handleNextSection}>Next Section</Button>
                </>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Relationships Tab */}
        <TabsContent value="relationships">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Relationships</CardTitle>
                <CardDescription>Update your relationship information</CardDescription>
              </div>
              {!editMode["relationships"] && (
                <Button variant="outline" size="sm" onClick={() => toggleEditMode("relationships")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editMode["relationships"] ? (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="spouse_name">Spouse/Partner Name</Label>
                    <Input
                      id="spouse_name"
                      name="spouse_name"
                      value={formData.spouse_name || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="spouse_relationship_rating">Spouse/Partner Relationship Rating (0-10)</Label>
                    <Slider
                      defaultValue={[formData.spouse_relationship_rating || 5]}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleSliderChange("spouse_relationship_rating", value)}
                    />
                    <span className="text-center">{formData.spouse_relationship_rating || 5}</span>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="spouse_relationship_reason">Reason for Rating</Label>
                    <Textarea
                      id="spouse_relationship_reason"
                      name="spouse_relationship_reason"
                      value={formData.spouse_relationship_reason || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="children_count">Number of Children</Label>
                    <Input
                      id="children_count"
                      name="children_count"
                      type="number"
                      value={formData.children_count || 0}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>
                    <strong>Spouse/Partner:</strong> {profile.spouse_name || "Not provided"}
                  </p>
                  <p>
                    <strong>Relationship Rating:</strong>{" "}
                    {profile.spouse_relationship_rating !== null ? profile.spouse_relationship_rating : "Not rated"}/10
                  </p>
                  <p>
                    <strong>Reason:</strong> {profile.spouse_relationship_reason || "Not provided"}
                  </p>
                  <p>
                    <strong>Children:</strong> {profile.children_count || 0}
                  </p>
                  {profile.children_ages && (
                    <p>
                      <strong>Children Ages:</strong> {profile.children_ages}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {editMode["relationships"] ? (
                <>
                  <Button variant="outline" onClick={() => handleCancelEdit("relationships")}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={() => handleSaveSection("relationships")} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    Cancel
                  </Button>
                  <Button onClick={handleNextSection}>Next Section</Button>
                </>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Health & Wellness</CardTitle>
                <CardDescription>Update your health information</CardDescription>
              </div>
              {!editMode["health"] && (
                <Button variant="outline" size="sm" onClick={() => toggleEditMode("health")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editMode["health"] ? (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="current_health_rating">Current Health Rating (0-10)</Label>
                    <Slider
                      defaultValue={[formData.current_health_rating || 5]}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleSliderChange("current_health_rating", value)}
                    />
                    <span className="text-center">{formData.current_health_rating || 5}</span>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="health_rating_reason">Reason for Rating</Label>
                    <Textarea
                      id="health_rating_reason"
                      name="health_rating_reason"
                      value={formData.health_rating_reason || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="health_goal">Health Goal</Label>
                    <Textarea
                      id="health_goal"
                      name="health_goal"
                      value={formData.health_goal || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="exercise_frequency">Exercise Frequency (days per week)</Label>
                    <Slider
                      defaultValue={[formData.exercise_frequency || 0]}
                      max={7}
                      step={1}
                      onValueChange={(value) => handleSliderChange("exercise_frequency", value)}
                    />
                    <span className="text-center">{formData.exercise_frequency || 0} days/week</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>
                    <strong>Health Rating:</strong>{" "}
                    {profile.current_health_rating !== null ? profile.current_health_rating : "Not rated"}/10
                  </p>
                  <p>
                    <strong>Reason:</strong> {profile.health_rating_reason || "Not provided"}
                  </p>
                  <p>
                    <strong>Health Goal:</strong> {profile.health_goal || "Not provided"}
                  </p>
                  <p>
                    <strong>Exercise Frequency:</strong>{" "}
                    {profile.exercise_frequency !== null ? `${profile.exercise_frequency} days/week` : "Not provided"}
                  </p>
                  <p>
                    <strong>Sleep Hours:</strong>{" "}
                    {profile.sleep_hours !== null ? `${profile.sleep_hours} hours` : "Not provided"}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {editMode["health"] ? (
                <>
                  <Button variant="outline" onClick={() => handleCancelEdit("health")}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={() => handleSaveSection("health")} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    Cancel
                  </Button>
                  <Button onClick={handleNextSection}>Next Section</Button>
                </>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Mindset Tab */}
        <TabsContent value="mindset">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Mindset & Stress</CardTitle>
                <CardDescription>Update your mindset and stress information</CardDescription>
              </div>
              {!editMode["mindset"] && (
                <Button variant="outline" size="sm" onClick={() => toggleEditMode("mindset")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editMode["mindset"] ? (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="current_stress_level">Current Stress Level (0-10)</Label>
                    <Slider
                      defaultValue={[formData.current_stress_level || 5]}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleSliderChange("current_stress_level", value)}
                    />
                    <span className="text-center">{formData.current_stress_level || 5}</span>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stress_rating_reason">Reason for Stress Rating</Label>
                    <Textarea
                      id="stress_rating_reason"
                      name="stress_rating_reason"
                      value={formData.stress_rating_reason || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="personal_goal">Personal Goal</Label>
                    <Textarea
                      id="personal_goal"
                      name="personal_goal"
                      value={formData.personal_goal || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Mindfulness Practices</Label>
                    <div className="space-y-2">
                      {["Meditation", "Yoga", "Journaling", "Deep Breathing", "Nature Walks"].map((practice) => (
                        <div key={practice} className="flex items-center space-x-2">
                          <Checkbox
                            id={`practice-${practice}`}
                            checked={
                              Array.isArray(formData.mindfulness_practices) &&
                              formData.mindfulness_practices.includes(practice)
                            }
                            onCheckedChange={(checked) =>
                              handleArrayChange("mindfulness_practices", practice, checked as boolean)
                            }
                          />
                          <Label htmlFor={`practice-${practice}`}>{practice}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>
                    <strong>Stress Level:</strong>{" "}
                    {profile.current_stress_level !== null ? profile.current_stress_level : "Not rated"}/10
                  </p>
                  <p>
                    <strong>Reason:</strong> {profile.stress_rating_reason || "Not provided"}
                  </p>
                  <p>
                    <strong>Personal Goal:</strong> {profile.personal_goal || "Not provided"}
                  </p>
                  <div>
                    <p>
                      <strong>Mindfulness Practices:</strong>
                    </p>
                    {Array.isArray(profile.mindfulness_practices) && profile.mindfulness_practices.length > 0 ? (
                      <ul className="list-disc pl-5 mt-1">
                        {profile.mindfulness_practices.map((practice: string) => (
                          <li key={practice}>{practice}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">No practices selected</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {editMode["mindset"] ? (
                <>
                  <Button variant="outline" onClick={() => handleCancelEdit("mindset")}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={() => handleSaveSection("mindset")} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    Cancel
                  </Button>
                  <Button onClick={handleNextSection}>Next Section</Button>
                </>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Routine Tab */}
        <TabsContent value="routine">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daily Routine</CardTitle>
                <CardDescription>Update your daily routine information</CardDescription>
              </div>
              {!editMode["routine"] && (
                <Button variant="outline" size="sm" onClick={() => toggleEditMode("routine")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editMode["routine"] ? (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="routine_description">Describe your daily routine</Label>
                    <Textarea
                      id="routine_description"
                      name="routine_description"
                      value={formData.routine_description || ""}
                      onChange={handleInputChange}
                      className="min-h-[150px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>
                    <strong>Daily Routine:</strong>
                  </p>
                  <p className="whitespace-pre-line">{profile.routine_description || "Not provided"}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {editMode["routine"] ? (
                <>
                  <Button variant="outline" onClick={() => handleCancelEdit("routine")}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={() => handleSaveSection("routine")} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    Cancel
                  </Button>
                  <Button onClick={handleNextSection}>Next Section</Button>
                </>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Future Goals</CardTitle>
                <CardDescription>Update your future goals</CardDescription>
              </div>
              {!editMode["goals"] && (
                <Button variant="outline" size="sm" onClick={() => toggleEditMode("goals")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editMode["goals"] ? (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="family_future_goal">Family Future Goal</Label>
                    <Textarea
                      id="family_future_goal"
                      name="family_future_goal"
                      value={formData.family_future_goal || ""}
                      onChange={handleInputChange}
                      className="min-h-[150px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>
                    <strong>Family Future Goal:</strong>
                  </p>
                  <p className="whitespace-pre-line">{profile.family_future_goal || "Not provided"}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {editMode["goals"] ? (
                <>
                  <Button variant="outline" onClick={() => handleCancelEdit("goals")}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={() => handleSaveSection("goals")} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    Cancel
                  </Button>
                  <Button onClick={handleNextSection}>Next Section</Button>
                </>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Values Tab */}
        <TabsContent value="values">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Family Values</CardTitle>
                <CardDescription>Update your family values</CardDescription>
              </div>
              {!editMode["values"] && (
                <Button variant="outline" size="sm" onClick={() => toggleEditMode("values")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editMode["values"] ? (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="family_value">Family Values</Label>
                    <Textarea
                      id="family_value"
                      name="family_value"
                      value={formData.family_value || ""}
                      onChange={handleInputChange}
                      className="min-h-[150px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>
                    <strong>Family Values:</strong>
                  </p>
                  <p className="whitespace-pre-line">{profile.family_value || "Not provided"}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {editMode["values"] ? (
                <>
                  <Button variant="outline" onClick={() => handleCancelEdit("values")}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={() => handleSaveSection("values")} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    Cancel
                  </Button>
                  <Button onClick={handleNextSection}>Next Section</Button>
                </>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Technology Tab */}
        <TabsContent value="technology">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Technology</CardTitle>
                <CardDescription>Update your technology preferences</CardDescription>
              </div>
              {!editMode["technology"] && (
                <Button variant="outline" size="sm" onClick={() => toggleEditMode("technology")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editMode["technology"] ? (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Wearable Technology</Label>
                    <div className="space-y-2">
                      {["Apple Watch", "Fitbit", "Garmin", "Oura Ring", "Whoop", "None"].map((device) => (
                        <div key={device} className="flex items-center space-x-2">
                          <Checkbox
                            id={`device-${device}`}
                            checked={Array.isArray(formData.wearable_usage) && formData.wearable_usage.includes(device)}
                            onCheckedChange={(checked) =>
                              handleArrayChange("wearable_usage", device, checked as boolean)
                            }
                          />
                          <Label htmlFor={`device-${device}`}>{device}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Sync Preferences</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="google_calendar_sync"
                          checked={formData.google_calendar_sync || false}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange("google_calendar_sync", checked as boolean)
                          }
                        />
                        <Label htmlFor="google_calendar_sync">Google Calendar Sync</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="apple_health_sync"
                          checked={formData.apple_health_sync || false}
                          onCheckedChange={(checked) => handleCheckboxChange("apple_health_sync", checked as boolean)}
                        />
                        <Label htmlFor="apple_health_sync">Apple Health Sync</Label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <p>
                      <strong>Wearable Technology:</strong>
                    </p>
                    {Array.isArray(profile.wearable_usage) && profile.wearable_usage.length > 0 ? (
                      <ul className="list-disc pl-5 mt-1">
                        {profile.wearable_usage.map((device: string) => (
                          <li key={device}>{device}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">No devices selected</p>
                    )}
                  </div>
                  <p>
                    <strong>Google Calendar Sync:</strong> {profile.google_calendar_sync ? "Enabled" : "Disabled"}
                  </p>
                  <p>
                    <strong>Apple Health Sync:</strong> {profile.apple_health_sync ? "Enabled" : "Disabled"}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {editMode["technology"] ? (
                <>
                  <Button variant="outline" onClick={() => handleCancelEdit("technology")}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={() => handleSaveSection("technology")} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    Cancel
                  </Button>
                  <Button onClick={handleNextSection}>Next Section</Button>
                </>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Update your notification preferences</CardDescription>
              </div>
              {!editMode["preferences"] && (
                <Button variant="outline" size="sm" onClick={() => toggleEditMode("preferences")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editMode["preferences"] ? (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="notification_channel">Notification Channel</Label>
                    <RadioGroup
                      value={formData.notification_channel || "email"}
                      onValueChange={(value) => setFormData({ ...formData, notification_channel: value })}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="notification-email" />
                        <Label htmlFor="notification-email">Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sms" id="notification-sms" />
                        <Label htmlFor="notification-sms">SMS</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="push" id="notification-push" />
                        <Label htmlFor="notification-push">Push Notification</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="quiet_hours_start">Quiet Hours Start</Label>
                    <Input
                      id="quiet_hours_start"
                      name="quiet_hours_start"
                      type="time"
                      value={formData.quiet_hours_start || "22:00"}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="quiet_hours_end">Quiet Hours End</Label>
                    <Input
                      id="quiet_hours_end"
                      name="quiet_hours_end"
                      type="time"
                      value={formData.quiet_hours_end || "07:00"}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="data_deletion_acknowledged"
                        checked={formData.data_deletion_acknowledged || false}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("data_deletion_acknowledged", checked as boolean)
                        }
                      />
                      <Label htmlFor="data_deletion_acknowledged">
                        I understand that I can request deletion of my data at any time
                      </Label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>
                    <strong>Notification Channel:</strong> {profile.notification_channel || "Email"}
                  </p>
                  <p>
                    <strong>Quiet Hours:</strong> {profile.quiet_hours_start || "22:00"} to{" "}
                    {profile.quiet_hours_end || "07:00"}
                  </p>
                  <p>
                    <strong>Data Deletion Acknowledged:</strong> {profile.data_deletion_acknowledged ? "Yes" : "No"}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {editMode["preferences"] ? (
                <>
                  <Button variant="outline" onClick={() => handleCancelEdit("preferences")}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={() => handleSaveSection("preferences")} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    Cancel
                  </Button>
                  <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
                </>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
