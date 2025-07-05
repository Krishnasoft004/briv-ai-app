"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Brain,
  Send,
  TrendingUp,
  Target,
  Sparkles,
  UserIcon,
  Settings,
  LogOut,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { VoiceRecorder } from "@/components/voice-recorder"
import { ReflectionHistory } from "@/components/reflection-history"
import { AIInsights } from "@/components/ai-insights"

interface User {
  id: string
  name: string
  email: string
  created_at: string
}

interface Reflection {
  id: string
  topic: string
  summary: string
  reflection: string
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [currentReflection, setCurrentReflection] = useState({
    topic: "",
    summary: "",
    reflection: "",
  })
  const [isRecording, setIsRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showAssessment, setShowAssessment] = useState(false)
  const [currentReflectionId, setCurrentReflectionId] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    const userData = localStorage.getItem("user_data")

    if (!token || !userData) {
      router.push("/auth/login")
      return
    }

    try {
      setUser(JSON.parse(userData))
      fetchReflections()
    } catch (err) {
      console.error("Error parsing user data:", err)
      router.push("/auth/login")
    }
  }, [router])

  const fetchReflections = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const response = await fetch("/api/reflections", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setReflections(data.reflections || [])
      } else if (response.status === 401) {
        router.push("/auth/login")
      }
    } catch (err) {
      console.error("Failed to fetch reflections:", err)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setCurrentReflection((prev) => ({ ...prev, [field]: value }))
  }

  const handleVoiceTranscription = (text: string) => {
    setCurrentReflection((prev) => ({
      ...prev,
      reflection: prev.reflection + " " + text,
    }))
  }

  const validateReflection = () => {
    if (!currentReflection.topic.trim()) return "Please enter a topic for your reflection"
    if (!currentReflection.summary.trim()) return "Please provide a brief summary"
    if (currentReflection.reflection.trim().split(" ").length < 20) {
      return "Reflection must be at least 20 words long"
    }
    return null
  }

  const handleSubmitReflection = async () => {
    setError("")
    setSuccess("")

    const validationError = validateReflection()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/auth/login")
        return
      }

      const response = await fetch("/api/reflections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(currentReflection),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Reflection saved successfully!")
        setCurrentReflectionId(data.reflection_id)
        setCurrentReflection({ topic: "", summary: "", reflection: "" })
        setShowAssessment(true)
        fetchReflections()
      } else {
        setError(data.error || "Failed to save reflection")
        if (response.status === 401) {
          router.push("/auth/login")
        }
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    router.push("/")
  }

  const handleAssessmentComplete = () => {
    setShowAssessment(false)
    setCurrentReflectionId(null)
    setSuccess("Assessment completed! Check your insights below.")
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const wordCount = currentReflection.reflection
    .trim()
    .split(" ")
    .filter((word) => word.length > 0).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-50">
      {/* Header */}
      <header className="border-b border-purple-100 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">Briv AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <UserIcon className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">{user.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/settings")}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.name.split(" ")[0]}! 👋</h1>
          <p className="text-gray-600">Ready for today's reflection? Let's capture your thoughts and insights.</p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Reflection Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Reflection Card */}
            <Card className="border-purple-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span>Today's Reflection</span>
                </CardTitle>
                <CardDescription>Share your thoughts, feelings, and experiences from today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic or Theme</Label>
                  <Input
                    id="topic"
                    placeholder="What's on your mind today?"
                    value={currentReflection.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    className="border-purple-200 focus:border-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Brief Summary</Label>
                  <Input
                    id="summary"
                    placeholder="Summarize your day in one sentence"
                    value={currentReflection.summary}
                    onChange={(e) => handleInputChange("summary", e.target.value)}
                    className="border-purple-200 focus:border-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reflection">Your Reflection</Label>
                    <Badge variant="outline" className="text-xs">
                      {wordCount} words
                    </Badge>
                  </div>
                  <Textarea
                    id="reflection"
                    placeholder="Dive deep into your thoughts, emotions, and experiences. What did you learn? How did you feel? What are you grateful for?"
                    value={currentReflection.reflection}
                    onChange={(e) => handleInputChange("reflection", e.target.value)}
                    className="min-h-[150px] border-purple-200 focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <VoiceRecorder
                    onTranscription={handleVoiceTranscription}
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                  />

                  <Button
                    onClick={handleSubmitReflection}
                    disabled={loading || isRecording}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                  >
                    {loading ? (
                      "Saving..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Save Reflection
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <AIInsights reflections={reflections} />

            {/* Reflection History */}
            <ReflectionHistory reflections={reflections} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="border-purple-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span>Your Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Reflections</span>
                  <Badge className="bg-purple-100 text-purple-700">{reflections.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">This Week</span>
                  <Badge className="bg-indigo-100 text-indigo-700">
                    {
                      reflections.filter((r) => {
                        const reflectionDate = new Date(r.created_at)
                        const weekAgo = new Date()
                        weekAgo.setDate(weekAgo.getDate() - 7)
                        return reflectionDate > weekAgo
                      }).length
                    }
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Streak</span>
                  <Badge className="bg-violet-100 text-violet-700">3 days</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Goals Card */}
            <Card className="border-purple-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span>Today's Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Complete daily reflection</span>
                  </div>
                  {/* Additional goals can be added here */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
