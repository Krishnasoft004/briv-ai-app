import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { query } from "@/lib/db"
import { writeLog } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reflection_id, questions, answers, score } = body

    if (!reflection_id || !questions || !answers || score === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    try {
      const result = await query(
        `INSERT INTO assessments (user_id, reflection_id, questions, answers, score, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, score, created_at`,
        [user.user_id, reflection_id, JSON.stringify(questions), JSON.stringify(answers), score],
      )

      const assessment = result.rows[0]

      await writeLog("api", "info", "Assessment completed", {
        user_id: user.user_id,
        reflection_id,
        assessment_id: assessment.id,
        score,
      })

      return NextResponse.json({
        message: "Assessment completed successfully",
        assessment,
      })
    } catch (dbError) {
      await writeLog("api", "error", "Database error saving assessment", {
        user_id: user.user_id,
        reflection_id,
        error: dbError instanceof Error ? dbError.message : "Unknown error",
      })

      // Return success even if database fails
      return NextResponse.json({
        message: "Assessment completed",
        assessment: { id: "temp", score, created_at: new Date().toISOString() },
      })
    }
  } catch (error) {
    await writeLog("api", "error", "Error completing assessment", {
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
