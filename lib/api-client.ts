// API client for communicating with the backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface User {
  id: string
  name: string
  email: string
  created_at?: string
}

export interface LoginResponse {
  token: string
  user: User
  message: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  health_data_consent?: boolean
  email_consent?: boolean
}

export interface LoginData {
  email: string
  password: string
}

export interface Reflection {
  id: string
  topic?: string
  summary?: string
  reflection: string
  created_at: string
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl

    // Load token from localStorage if available
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }

    // Add authorization header if token exists
    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      }
    }

    try {
      console.log(`API Request: ${options.method || "GET"} ${url}`)

      const response = await fetch(url, config)
      const data = await response.json()

      console.log(`API Response: ${response.status}`, data)

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        }
      }

      return {
        success: true,
        data,
      }
    } catch (error) {
      console.error("API Request failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  // Authentication methods
  async register(userData: RegisterData): Promise<ApiResponse<{ user: User; message: string }>> {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async login(credentials: LoginData): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })

    // Store token if login successful
    if (response.success && response.data?.token) {
      this.setToken(response.data.token)
    }

    return response
  }

  async logout(): Promise<void> {
    this.clearToken()
  }

  // Token management
  setToken(token: string): void {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  clearToken(): void {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  getToken(): string | null {
    return this.token
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  // Reflections methods
  async getReflections(): Promise<ApiResponse<{ reflections: Reflection[] }>> {
    return this.request("/api/reflections")
  }

  async createReflection(reflection: {
    topic?: string
    summary?: string
    reflection: string
  }): Promise<ApiResponse<{ reflection: Reflection; message: string }>> {
    return this.request("/api/reflections", {
      method: "POST",
      body: JSON.stringify(reflection),
    })
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request("/health")
  }

  // Assessment methods
  async getAssessmentQuestions(): Promise<ApiResponse<any>> {
    return this.request("/api/assessments/questions")
  }

  async submitAssessment(assessmentData: any): Promise<ApiResponse<any>> {
    return this.request("/api/assessments", {
      method: "POST",
      body: JSON.stringify(assessmentData),
    })
  }

  // Insights methods
  async generateInsights(reflectionId: string): Promise<ApiResponse<any>> {
    return this.request("/api/insights/generate", {
      method: "POST",
      body: JSON.stringify({ reflection_id: reflectionId }),
    })
  }

  // User management
  async exportUserData(): Promise<ApiResponse<any>> {
    return this.request("/api/user/export")
  }

  async deleteUser(): Promise<ApiResponse<any>> {
    return this.request("/api/user/delete", {
      method: "DELETE",
    })
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient()
export default apiClient
