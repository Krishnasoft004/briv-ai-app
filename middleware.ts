import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { writeLog } from "./lib/logger"

export async function middleware(request: NextRequest) {
  const start = Date.now()

  // Log API requests
  if (request.nextUrl.pathname.startsWith("/api/")) {
    await writeLog("api", "info", `${request.method} ${request.nextUrl.pathname}`, {
      method: request.method,
      url: request.nextUrl.pathname,
      user_agent: request.headers.get("user-agent"),
      ip: request.ip || request.headers.get("x-forwarded-for"),
    })
  }

  const response = NextResponse.next()

  // Log response time for API calls
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const duration = Date.now() - start
    await writeLog("api", "info", `Response sent for ${request.method} ${request.nextUrl.pathname}`, {
      duration: `${duration}ms`,
      status: response.status,
    })
  }

  return response
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
}
