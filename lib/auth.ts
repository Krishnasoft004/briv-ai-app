import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { getUserByEmail, getUserById } from "./db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"

export interface TokenPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

export interface AuthUser {
  id: string
  name: string
  email: string
  created_at: Date
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// JWT utilities
export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

// Authentication functions
export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  try {
    const user = await getUserByEmail(email.toLowerCase())

    if (!user) {
      return null
    }

    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      return null
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  try {
    const payload = verifyToken(token)

    if (!payload) {
      return null
    }

    const user = await getUserById(payload.userId)

    if (!user) {
      return null
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    }
  } catch (error) {
    console.error("Get user from token error:", error)
    return null
  }
}

// Middleware helper for API routes
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  return authHeader.substring(7) // Remove 'Bearer ' prefix
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateRegistrationData(data: {
  name: string
  email: string
  password: string
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.name || data.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long")
  }

  if (!validateEmail(data.email)) {
    errors.push("Please enter a valid email address")
  }

  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
