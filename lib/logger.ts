import fs from "fs/promises"
import path from "path"

interface LogEntry {
  timestamp: string
  level: "info" | "warning" | "error" | "debug"
  category: string
  message: string
  metadata?: Record<string, any>
}

class Logger {
  private logDir: string

  constructor(logDir = "logs") {
    this.logDir = logDir
    this.ensureLogDirectory()
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, ignore error
    }
  }

  private async writeToFile(filename: string, content: string): Promise<void> {
    try {
      const filePath = path.join(this.logDir, filename)
      await fs.appendFile(filePath, content + "\n", "utf8")
    } catch (error) {
      console.error("Failed to write to log file:", error)
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const metadataStr = entry.metadata ? ` | ${JSON.stringify(entry.metadata)}` : ""
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}${metadataStr}`
  }

  async writeLog(
    category: string,
    level: "info" | "warning" | "error" | "debug",
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata,
    }

    const formattedEntry = this.formatLogEntry(entry)

    // Write to category-specific log file
    await this.writeToFile(`${category}.log`, formattedEntry)

    // Also write to main app log
    await this.writeToFile("app.log", formattedEntry)

    // Console output for development
    if (process.env.NODE_ENV === "development") {
      const consoleMethod = level === "error" ? "error" : level === "warning" ? "warn" : "log"
      console[consoleMethod](`[${category.toUpperCase()}] ${message}`, metadata || "")
    }
  }

  async readLogs(category: string, lines = 100): Promise<string[]> {
    try {
      const filePath = path.join(this.logDir, `${category}.log`)
      const content = await fs.readFile(filePath, "utf8")
      const allLines = content
        .trim()
        .split("\n")
        .filter((line) => line.length > 0)
      return allLines.slice(-lines)
    } catch (error) {
      console.error(`Failed to read logs for ${category}:`, error)
      return []
    }
  }

  async clearLogs(category?: string): Promise<void> {
    try {
      if (category) {
        const filePath = path.join(this.logDir, `${category}.log`)
        await fs.writeFile(filePath, "", "utf8")
      } else {
        // Clear all logs
        const files = await fs.readdir(this.logDir)
        for (const file of files) {
          if (file.endsWith(".log")) {
            await fs.writeFile(path.join(this.logDir, file), "", "utf8")
          }
        }
      }
    } catch (error) {
      console.error("Failed to clear logs:", error)
    }
  }
}

// Create singleton instance
const logger = new Logger()

// Export the writeLog function and logger instance
export const writeLog = logger.writeLog.bind(logger)
export const readLogs = logger.readLogs.bind(logger)
export const clearLogs = logger.clearLogs.bind(logger)
export default logger
