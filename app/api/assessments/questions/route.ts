import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { writeLog } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reflection_id } = body

    if (!reflection_id) {
      return NextResponse.json({ error: "Reflection ID is required" }, { status: 400 })
    }

    // Generate mock assessment questions
    const questions = [
      {
        id: "q1",
        question: "How would you rate your overall mood today?",
        options: [
          { value: "excellent", label: "Excellent", score: 5 },
          { value: "good", label: "Good", score: 4 },
          { value: "neutral", label: "Neutral", score: 3 },
          { value: "poor", label: "Poor", score: 2 },
          { value: "very_poor", label: "Very Poor", score: 1 },
        ],
      },
      {
        id: "q2",
        question: "How well did you handle stress today?",
        options: [
          { value: "very_well", label: "Very well", score: 5 },
          { value: "well", label: "Well", score: 4 },
          { value: "okay", label: "Okay", score: 3 },
          { value: "poorly", label: "Poorly", score: 2 },
          { value: "very_poorly", label: "Very poorly", score: 1 },
        ],
      },
      {
        id: "q3",
        question: "How satisfied are you with your productivity today?",
        options: [
          { value: "very_satisfied", label: "Very satisfied", score: 5 },
          { value: "satisfied", label: "Satisfied", score: 4 },
          { value: "neutral", label: "Neutral", score: 3 },
          { value: "dissatisfied", label: "Dissatisfied", score: 2 },
          { value: "very_dissatisfied", label: "Very dissatisfied", score: 1 },
        ],
      },
    ]

    await writeLog("api", "info", "Assessment questions generated", {
      user_id: user.user_id,
      reflection_id,
    })

    return NextResponse.json({ questions })
  } catch (error) {
    await writeLog("api", "error", "Error generating assessment questions", {
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 })
  }
}
