import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { logAdminAction } from "@/lib/admin-logger"

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Log deletion before actually deleting
    await logAdminAction(user.user_id, "ACCOUNT_DELETION_REQUESTED", { email: user.email }, request)

    // Delete user (cascading deletes will handle related records)
    await query("DELETE FROM users WHERE id = $1", [user.user_id])

    // Log successful deletion
    await logAdminAction(null, "ACCOUNT_DELETED", { user_id: user.user_id, email: user.email }, request)

    return NextResponse.json({ message: "Account deleted successfully" })
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
