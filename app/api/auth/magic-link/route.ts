import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    // Here you would typically:
    // 1. Generate a secure token
    // 2. Store it in database with expiration
    // 3. Send email with magic link

    // For demo purposes, we'll just return success
    console.log(`Magic link would be sent to: ${email}`)

    return NextResponse.json({
      message: "Magic link sent successfully",
      email,
    })
  } catch (error) {
    console.error("Magic link error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
