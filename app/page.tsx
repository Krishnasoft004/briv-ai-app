"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Sparkles, TrendingUp, Users } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (token) {
      setIsAuthenticated(true)
      router.push("/dashboard")
    }
  }, [router])

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Get personalized insights from your daily reflections using advanced AI analysis",
    },
    {
      icon: Sparkles,
      title: "Voice & Text Journaling",
      description: "Record your thoughts through voice or text with real-time transcription",
    },
    {
      icon: TrendingUp,
      title: "Mood Analytics",
      description: "Track your emotional patterns and wellness trends over time",
    },
    {
      icon: Users,
      title: "Personalized Assessments",
      description: "Complete AI-generated assessments to better understand your mental state",
    },
  ]

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
          <div className="space-x-4">
            <Button variant="ghost" onClick={() => router.push("/auth/login")}>
              Sign In
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
              onClick={() => router.push("/auth/register")}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Build Your Daily{" "}
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
              Reflection Habit
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Enhance mental clarity, focus, and emotional wellness through AI-powered insights. Available on web and
            mobile with voice journaling and real-time analysis.
          </p>
          <div className="space-x-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-lg px-8 py-3"
              onClick={() => router.push("/auth/register")}
            >
              Start Your Journey
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-3 border-purple-200 hover:bg-purple-50 bg-transparent"
              onClick={() => router.push("/auth/login")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need for Mindful Reflection</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our comprehensive platform combines AI technology with wellness practices to help you build lasting habits.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-purple-100 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-500 to-indigo-500 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Daily Routine?</h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of knowledge workers who are building better mental wellness habits with Briv AI.
          </p>
          <Button
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-50 text-lg px-8 py-3"
            onClick={() => router.push("/auth/register")}
          >
            Start Free Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-purple-100 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 Briv AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
