"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Brain, TrendingUp, Heart, Target, Lightbulb, RefreshCw, Smile, Meh, Frown } from "lucide-react"

interface Reflection {
  id: string
  topic: string
  summary: string
  reflection: string
  created_at: string
}

interface AIInsightsProps {
  reflections: Reflection[]
}

interface Insight {
  type: "mood" | "pattern" | "suggestion" | "growth"
  title: string
  description: string
  confidence: number
  trend?: "up" | "down" | "stable"
}

export function AIInsights({ reflections }: AIInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)
  const [moodScore, setMoodScore] = useState(75)
  const [focusScore, setFocusScore] = useState(68)
  const [wellnessScore, setWellnessScore] = useState(82)

  useEffect(() => {
    if (reflections.length > 0) {
      generateInsights()
    }
  }, [reflections])

  const generateInsights = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/insights/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reflections: reflections.slice(0, 5), // Send last 5 reflections
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights || [])
        if (data.scores) {
          setMoodScore(data.scores.mood || 75)
          setFocusScore(data.scores.focus || 68)
          setWellnessScore(data.scores.wellness || 82)
        }
      } else {
        console.error("Failed to generate insights")
      }
    } catch (error) {
      console.error("Failed to generate insights:", error)
    } finally {
      setLoading(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "mood":
        return Heart
      case "pattern":
        return TrendingUp
      case "suggestion":
        return Lightbulb
      case "growth":
        return Target
      default:
        return Brain
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case "mood":
        return "text-pink-600 bg-pink-100"
      case "pattern":
        return "text-blue-600 bg-blue-100"
      case "suggestion":
        return "text-yellow-600 bg-yellow-100"
      case "growth":
        return "text-green-600 bg-green-100"
      default:
        return "text-purple-600 bg-purple-100"
    }
  }

  const getMoodIcon = (score: number) => {
    if (score >= 70) return Smile
    if (score >= 40) return Meh
    return Frown
  }

  const getMoodColor = (score: number) => {
    if (score >= 70) return "text-green-600"
    if (score >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  if (reflections.length === 0) {
    return (
      <Card className="border-purple-100">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>AI Insights</span>
          </CardTitle>
          <CardDescription>AI-powered analysis of your reflection patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Complete a few reflections to unlock personalized AI insights!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-purple-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <span>AI Insights</span>
            </CardTitle>
            <CardDescription>Personalized analysis powered by AI</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateInsights}
            disabled={loading}
            className="border-purple-200 hover:bg-purple-50 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wellness Scores */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              {React.createElement(getMoodIcon(moodScore), {
                className: `w-6 h-6 ${getMoodColor(moodScore)}`,
              })}
            </div>
            <div className="text-2xl font-bold text-gray-900">{moodScore}%</div>
            <div className="text-sm text-gray-600">Mood</div>
            <Progress value={moodScore} className="mt-2 h-2" />
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className={`w-6 h-6 ${getMoodColor(focusScore)}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{focusScore}%</div>
            <div className="text-sm text-gray-600">Focus</div>
            <Progress value={focusScore} className="mt-2 h-2" />
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Heart className={`w-6 h-6 ${getMoodColor(wellnessScore)}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{wellnessScore}%</div>
            <div className="text-sm text-gray-600">Wellness</div>
            <Progress value={wellnessScore} className="mt-2 h-2" />
          </div>
        </div>

        {/* Insights */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
              <p className="text-sm text-gray-600">Analyzing your reflections with AI...</p>
            </div>
          ) : (
            insights.map((insight, index) => {
              const IconComponent = getInsightIcon(insight.type)
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        <div className="flex items-center space-x-2">
                          {insight.trend && (
                            <TrendingUp
                              className={`w-4 h-4 ${
                                insight.trend === "up"
                                  ? "text-green-500"
                                  : insight.trend === "down"
                                    ? "text-red-500"
                                    : "text-gray-500"
                              }`}
                            />
                          )}
                          <Badge variant="outline" className="text-xs">
                            {insight.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{insight.description}</p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
