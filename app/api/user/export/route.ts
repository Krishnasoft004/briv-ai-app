import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { logAdminAction } from "@/lib/admin-logger"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user data
    const userResult = await query("SELECT id, name, email, created_at FROM users WHERE id = $1", [user.user_id])

    // Get reflections
    const reflectionsResult = await query(
      "SELECT id, topic, summary, reflection, ai_insights, created_at FROM reflections WHERE user_id = $1 ORDER BY created_at DESC",
      [user.user_id],
    )

    // Get assessments
    const assessmentsResult = await query(
      "SELECT id, reflection_id, questions, answers, score, ai_analysis, submitted_at FROM assessments WHERE user_id = $1 ORDER BY submitted_at DESC",
      [user.user_id],
    )

    const exportData = {
      user: userResult.rows[0],
      reflections: reflectionsResult.rows,
      assessments: assessmentsResult.rows,
      exported_at: new Date().toISOString(),
    }

    // Log export action
    await logAdminAction(user.user_id, "DATA_EXPORTED", { export_size: JSON.stringify(exportData).length }, request)

    const response = new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": "attachment; filename=briv-ai-data-export.json",
      },
    })

    return response
  } catch (error) {
    console.error("Export data error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
