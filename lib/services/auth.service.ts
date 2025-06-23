import { db } from "./database.service"

interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest {
  email: string
  password: string
  name?: string
}

interface AuthResult {
  success: boolean
  user?: {
    id: string
    email: string
    name: string
  }
  token?: string
  refreshToken?: string
  error?: string
}

class AuthService {
  private sessions: Map<string, string> = new Map() // token -> userId

  async register(request: RegisterRequest): Promise<AuthResult> {
    try {
      const { email, password, name } = request

      const existingUser = await db.getUserByEmail(email)
      if (existingUser) {
        return {
          success: false,
          error: "User already exists with this email",
        }
      }

      // Simple password hashing (not secure, for demo only)
      const hashedPassword = this.simpleHash(password)

      const user = await db.createUser({
        email,
        password: hashedPassword,
        name,
      })

      const token = this.generateToken(user.id)
      const refreshToken = this.generateRefreshToken(user.id)

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
        refreshToken,
      }
    } catch (error) {
      console.error("Registration error:", error)
      return {
        success: false,
        error: "Registration failed",
      }
    }
  }

  async login(request: LoginRequest): Promise<AuthResult> {
    try {
      const { email, password } = request

      const user = await db.getUserByEmail(email)
      if (!user) {
        return {
          success: false,
          error: "Invalid email or password",
        }
      }

      const hashedPassword = this.simpleHash(password)
      if (user.password !== hashedPassword) {
        return {
          success: false,
          error: "Invalid email or password",
        }
      }

      const token = this.generateToken(user.id)
      const refreshToken = this.generateRefreshToken(user.id)

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
        refreshToken,
      }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        error: "Login failed",
      }
    }
  }

  async verifyToken(token: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
    try {
      const userId = this.sessions.get(token)
      if (!userId) {
        return {
          valid: false,
          error: "Invalid token",
        }
      }

      return {
        valid: true,
        userId,
      }
    } catch (error) {
      return {
        valid: false,
        error: "Invalid token",
      }
    }
  }

  async refreshToken(refreshToken: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const userId = this.sessions.get(refreshToken)
      if (!userId) {
        return {
          success: false,
          error: "Invalid refresh token",
        }
      }

      const newToken = this.generateToken(userId)

      return {
        success: true,
        token: newToken,
      }
    } catch (error) {
      return {
        success: false,
        error: "Invalid refresh token",
      }
    }
  }

  private generateToken(userId: string): string {
    const token = `token_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.sessions.set(token, userId)
    return token
  }

  private generateRefreshToken(userId: string): string {
    const token = `refresh_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.sessions.set(token, userId)
    return token
  }

  private simpleHash(password: string): string {
    // Simple hash function (not secure, for demo only)
    let hash = 0
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString()
  }

  async getCurrentUser(userId: string) {
    try {
      const user = await db.getUser(userId)
      if (!user) return null

      return {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    } catch (error) {
      console.error("Get current user error:", error)
      return null
    }
  }
}

export const authService = new AuthService()
export default authService
