import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface User {
  id: string
  name: string
  email: string
  password_hash: string
  health_data_consent: boolean
  email_consent: boolean
  created_at: Date
  updated_at: Date
}

export interface Reflection {
  id: string
  user_id: string
  topic?: string
  summary?: string
  reflection: string
  created_at: Date
  updated_at: Date
}

export interface Assessment {
  id: string
  user_id: string
  reflection_id?: string
  questions: any
  answers: any
  score?: number
  created_at: Date
}

export interface Insight {
  id: string
  user_id: string
  insight_type: string
  title: string
  description: string
  confidence: number
  metadata: any
  created_at: Date
}

// Database utility functions
export async function createUser(userData: {
  name: string
  email: string
  password_hash: string
  health_data_consent?: boolean
  email_consent?: boolean
}): Promise<User> {
  const result = await sql`
    INSERT INTO users (name, email, password_hash, health_data_consent, email_consent)
    VALUES (${userData.name}, ${userData.email}, ${userData.password_hash}, 
            ${userData.health_data_consent || false}, ${userData.email_consent || true})
    RETURNING *
  `
  return result[0] as User
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email}
  `
  return (result[0] as User) || null
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE id = ${id}
  `
  return (result[0] as User) || null
}

export async function createReflection(reflectionData: {
  user_id: string
  topic?: string
  summary?: string
  reflection: string
}): Promise<Reflection> {
  const result = await sql`
    INSERT INTO reflections (user_id, topic, summary, reflection)
    VALUES (${reflectionData.user_id}, ${reflectionData.topic}, 
            ${reflectionData.summary}, ${reflectionData.reflection})
    RETURNING *
  `
  return result[0] as Reflection
}

export async function getReflectionsByUserId(userId: string, limit = 50): Promise<Reflection[]> {
  const result = await sql`
    SELECT * FROM reflections 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return result as Reflection[]
}

export async function createAssessment(assessmentData: {
  user_id: string
  reflection_id?: string
  questions: any
  answers: any
  score?: number
}): Promise<Assessment> {
  const result = await sql`
    INSERT INTO assessments (user_id, reflection_id, questions, answers, score)
    VALUES (${assessmentData.user_id}, ${assessmentData.reflection_id}, 
            ${JSON.stringify(assessmentData.questions)}, ${JSON.stringify(assessmentData.answers)}, 
            ${assessmentData.score})
    RETURNING *
  `
  return result[0] as Assessment
}

export async function getAssessmentsByUserId(userId: string): Promise<Assessment[]> {
  const result = await sql`
    SELECT * FROM assessments 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `
  return result as Assessment[]
}

export async function createInsight(insightData: {
  user_id: string
  insight_type: string
  title: string
  description: string
  confidence: number
  metadata?: any
}): Promise<Insight> {
  const result = await sql`
    INSERT INTO insights (user_id, insight_type, title, description, confidence, metadata)
    VALUES (${insightData.user_id}, ${insightData.insight_type}, ${insightData.title}, 
            ${insightData.description}, ${insightData.confidence}, ${JSON.stringify(insightData.metadata || {})})
    RETURNING *
  `
  return result[0] as Insight
}

export async function getInsightsByUserId(userId: string): Promise<Insight[]> {
  const result = await sql`
    SELECT * FROM insights 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `
  return result as Insight[]
}

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}

// Initialize database tables
export async function initializeTables(): Promise<void> {
  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        health_data_consent BOOLEAN DEFAULT FALSE,
        email_consent BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Reflections table
    await sql`
      CREATE TABLE IF NOT EXISTS reflections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        topic VARCHAR(500),
        summary TEXT,
        reflection TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Assessments table
    await sql`
      CREATE TABLE IF NOT EXISTS assessments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reflection_id INTEGER REFERENCES reflections(id) ON DELETE CASCADE,
        questions JSONB,
        answers JSONB,
        score INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Insights table
    await sql`
      CREATE TABLE IF NOT EXISTS insights (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        insight_type VARCHAR(50),
        title VARCHAR(500),
        description TEXT,
        confidence FLOAT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log("Database tables initialized successfully")
  } catch (error) {
    console.error("Failed to initialize database tables:", error)
    throw error
  }
}
