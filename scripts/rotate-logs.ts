import { rotateLogs } from "../lib/logger"
import { writeLog } from "../lib/logger"

async function main() {
  try {
    await writeLog("system", "info", "Starting log rotation")
    await rotateLogs()
    await writeLog("system", "info", "Log rotation completed successfully")
    console.log("✅ Log rotation completed")
  } catch (error) {
    await writeLog("system", "error", "Log rotation failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    })
    console.error("❌ Log rotation failed:", error)
    process.exit(1)
  }
}

main()
