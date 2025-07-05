"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { X, Trophy, Sparkles, CheckCircle } from "lucide-react"

// Remove this line:
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface AssessmentQuizProps {
  reflectionId: string
  onComplete: () => void
  onClose: () => void
}

interface Question {
  id: string
  question: string
  options: { value: string; label: string; score: number }[]
}

export function AssessmentQuiz({ reflectionId, onComplete, onClose }: AssessmentQuizProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  useEffect(() => {
    fetchQuestions()
  }, [reflectionId])

  // Update the fetchQuestions function:
  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/assessments/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reflection_id: reflectionId }),
      })

      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions)
      } else {
        console.error("Failed to fetch questions")
        onClose()
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const calculateScore = () => {
    let totalScore = 0
    let maxScore = 0

    questions.forEach((question) => {
      const answer = answers[question.id]
      if (answer) {
        const option = question.options.find((opt) => opt.value === answer)
        if (option) {
          totalScore += option.score
        }
      }
      maxScore += 5 // Maximum score per question
    })

    return Math.round((totalScore / maxScore) * 100)
  }

  // Update the handleSubmit function:
  const handleSubmit = async () => {
    setSubmitting(true)

    try {
      const score = calculateScore()
      const token = localStorage.getItem("auth_token")

      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reflection_id: reflectionId,
          questions: questions,
          answers: answers,
          score: score,
        }),
      })

      if (response.ok) {
        setFinalScore(score)
        setShowResults(true)
      } else {
        console.error("Failed to submit assessment")
        setFinalScore(score)
        setShowResults(true)
      }
    } catch (error) {
      console.error("Assessment submission error:", error)
      setFinalScore(calculateScore())
      setShowResults(true)
    } finally {
      setSubmitting(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100"
    if (score >= 60) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  const getScoreMessage = (score: number) => {
    if (score >= 80) return "Excellent! You're doing great today! 🌟"
    if (score >= 60) return "Good job! You're managing well today! 👍"
    return "Take care of yourself. Tomorrow is a new day! 💙"
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md border-purple-100">
          <CardContent className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Generating personalized questions...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showResults) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md border-purple-100">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Assessment Complete!</CardTitle>
            <CardDescription>Here's your wellness score for today</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-4">
              <div
                className={`inline-flex items-center px-6 py-3 rounded-full text-2xl font-bold ${getScoreColor(finalScore)}`}
              >
                <Sparkles className="w-6 h-6 mr-2" />
                {finalScore}/100
              </div>
              <p className="text-lg text-gray-700">{getScoreMessage(finalScore)}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Sparkles key={i} className="w-5 h-5 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
              <p className="text-sm text-gray-600">Your insights have been updated based on this assessment!</p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={onComplete}
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                View Insights
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md border-purple-100">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">No questions available. Please try again.</p>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl border-purple-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>Daily Assessment</span>
              </CardTitle>
              <CardDescription>AI-generated questions based on your reflection</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <Badge variant="outline">{Math.round(progress)}% complete</Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">{currentQ.question}</h3>
            <RadioGroup
              value={answers[currentQ.id] || ""}
              onValueChange={(value) => handleAnswerChange(currentQ.id, value)}
            >
              {currentQ.options.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={!answers[currentQ.id] || submitting}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
            >
              {submitting ? "Submitting..." : currentQuestion === questions.length - 1 ? "Complete Assessment" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
