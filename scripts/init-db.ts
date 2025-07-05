import { initializeDatabase } from "../lib/db"
import { writeLog } from "../lib/logger"

async function main() {
  try {
    await writeLog("system", "info", "Starting database initialization")
    await initializeDatabase()
    await writeLog("system", "info", "Database initialization completed successfully")
    console.log("✅ Database initialized successfully")
  } catch (error) {
    await writeLog("system", "error", "Database initialization failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    })
    console.error("❌ Database initialization failed:", error)
    process.exit(1)
  }
}

main()
