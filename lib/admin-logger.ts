import fs from "fs/promises"
import path from "path"

interface LogEntry {
  timestamp: string
  level: "info" | "warning" | "error" | "debug"
  category: string
  message: string
  metadata?: Record<string, any>
  userId?: string
  sessionId?: string
}

class AdminLogger {
  private logDir: string

  constructor(logDir = "logs") {
    this.logDir = logDir
    this.ensureLogDirectory()
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true })
    } catch (error) {
      console.error("Failed to create log directory:", error)
    }
  }

  private async writeLogEntry(entry: LogEntry): Promise<void> {
    try {
      const logFile = path.join(this.logDir, `${entry.category}.log`)
      const logLine = JSON.stringify(entry) + "\n"

      await fs.appendFile(logFile, logLine, "utf8")
    } catch (error) {
      console.error("Failed to write log entry:", error)
    }
  }

  private createLogEntry(
    level: LogEntry["level"],
    category: string,
    message: string,
    metadata?: Record<string, any>,
    userId?: string,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata,
      userId,
      sessionId: this.generateSessionId(),
    }
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  // Public logging methods
  async logInfo(category: string, message: string, metadata?: Record<string, any>, userId?: string): Promise<void> {
    const entry = this.createLogEntry("info", category, message, metadata, userId)
    await this.writeLogEntry(entry)
    console.log(`[${category.toUpperCase()}] ${message}`, metadata || "")
  }

  async logWarning(category: string, message: string, metadata?: Record<string, any>, userId?: string): Promise<void> {
    const entry = this.createLogEntry("warning", category, message, metadata, userId)
    await this.writeLogEntry(entry)
    console.warn(`[${category.toUpperCase()}] ${message}`, metadata || "")
  }

  async logError(category: string, message: string, metadata?: Record<string, any>, userId?: string): Promise<void> {
    const entry = this.createLogEntry("error", category, message, metadata, userId)
    await this.writeLogEntry(entry)
    console.error(`[${category.toUpperCase()}] ${message}`, metadata || "")
  }

  async logDebug(category: string, message: string, metadata?: Record<string, any>, userId?: string): Promise<void> {
    const entry = this.createLogEntry("debug", category, message, metadata, userId)
    await this.writeLogEntry(entry)

    if (process.env.NODE_ENV === "development") {
      console.debug(`[${category.toUpperCase()}] ${message}`, metadata || "")
    }
  }

  // Specialized logging methods
  async logUserAction(userId: string, action: string, details?: Record<string, any>): Promise<void> {
    await this.logInfo("user_actions", `User ${userId} performed: ${action}`, details, userId)
  }

  async logApiRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    userId?: string,
  ): Promise<void> {
    await this.logInfo(
      "api_requests",
      `${method} ${endpoint} -> ${statusCode}`,
      {
        method,
        endpoint,
        statusCode,
        duration,
        timestamp: new Date().toISOString(),
      },
      userId,
    )
  }

  async logDatabaseOperation(
    operation: string,
    table: string,
    success: boolean,
    duration: number,
    error?: string,
  ): Promise<void> {
    const level = success ? "info" : "error"
    const message = `Database ${operation} on ${table} ${success ? "succeeded" : "failed"}`
    const metadata = {
      operation,
      table,
      success,
      duration,
      error,
    }

    if (success) {
      await this.logInfo("database", message, metadata)
    } else {
      await this.logError("database", message, metadata)
    }
  }

  async logAuthEvent(
    event: string,
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const level = success ? "info" : "warning"
    const message = `Authentication ${event} for ${email} ${success ? "succeeded" : "failed"}`
    const metadata = {
      event,
      email,
      success,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
    }

    if (success) {
      await this.logInfo("auth", message, metadata)
    } else {
      await this.logWarning("auth", message, metadata)
    }
  }

  async logSystemEvent(event: string, details?: Record<string, any>): Promise<void> {
    await this.logInfo("system", event, details)
  }

  async logSecurityEvent(
    event: string,
    severity: "low" | "medium" | "high",
    details?: Record<string, any>,
  ): Promise<void> {
    const level = severity === "high" ? "error" : severity === "medium" ? "warning" : "info"
    const message = `Security event (${severity}): ${event}`

    if (level === "error") {
      await this.logError("security", message, details)
    } else if (level === "warning") {
      await this.logWarning("security", message, details)
    } else {
      await this.logInfo("security", message, details)
    }
  }

  // Log reading methods
  async readLogs(category: string, limit = 100): Promise<LogEntry[]> {
    try {
      const logFile = path.join(this.logDir, `${category}.log`)
      const content = await fs.readFile(logFile, "utf8")
      const lines = content
        .trim()
        .split("\n")
        .filter((line) => line.length > 0)

      const entries = lines
        .slice(-limit)
        .map((line) => {
          try {
            return JSON.parse(line) as LogEntry
          } catch {
            return null
          }
        })
        .filter((entry): entry is LogEntry => entry !== null)

      return entries.reverse() // Most recent first
    } catch (error) {
      console.error(`Failed to read logs for category ${category}:`, error)
      return []
    }
  }

  async getLogCategories(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.logDir)
      return files.filter((file) => file.endsWith(".log")).map((file) => file.replace(".log", ""))
    } catch (error) {
      console.error("Failed to get log categories:", error)
      return []
    }
  }

  async clearLogs(category?: string): Promise<void> {
    try {
      if (category) {
        const logFile = path.join(this.logDir, `${category}.log`)
        await fs.writeFile(logFile, "", "utf8")
      } else {
        const files = await fs.readdir(this.logDir)
        const logFiles = files.filter((file) => file.endsWith(".log"))

        for (const file of logFiles) {
          await fs.writeFile(path.join(this.logDir, file), "", "utf8")
        }
      }
    } catch (error) {
      console.error("Failed to clear logs:", error)
    }
  }
}

// Create and export singleton instance
export const adminLogger = new AdminLogger()

// Export convenience functions
export const logInfo = adminLogger.logInfo.bind(adminLogger)
export const logWarning = adminLogger.logWarning.bind(adminLogger)
export const logError = adminLogger.logError.bind(adminLogger)
export const logDebug = adminLogger.logDebug.bind(adminLogger)
export const logUserAction = adminLogger.logUserAction.bind(adminLogger)
export const logApiRequest = adminLogger.logApiRequest.bind(adminLogger)
export const logDatabaseOperation = adminLogger.logDatabaseOperation.bind(adminLogger)
export const logAuthEvent = adminLogger.logAuthEvent.bind(adminLogger)
export const logSystemEvent = adminLogger.logSystemEvent.bind(adminLogger)
export const logSecurityEvent = adminLogger.logSecurityEvent.bind(adminLogger)

export default adminLogger
