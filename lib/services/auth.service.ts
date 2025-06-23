import { db } from "./database.service"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

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
  private jwtSecret = process.env.JWT_SECRET || "fallback-secret-key"
  private jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret"

  async register(request: RegisterRequest): Promise<AuthResult> {
    try {
      const { email, password, name } = request

      // Check if user already exists
      const existingUser = await this.getUserByEmail(email)
      if (existingUser) {
        return {
          success: false,
          error: "User already exists with this email",
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create user
      const user = await db.createUser({
        email,
        password: hashedPassword,
        name,
      })

      // Generate tokens
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

      // Get user by email
      const user = await this.getUserByEmail(email)
      if (!user) {
        return {
          success: false,
          error: "Invalid email or password",
        }
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return {
          success: false,
          error: "Invalid email or password",
        }
      }

      // Generate tokens
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
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string }
      return {
        valid: true,
        userId: decoded.userId,
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
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret) as { userId: string }
      const newToken = this.generateToken(decoded.userId)

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
    return jwt.sign({ userId }, this.jwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN || "15m" })
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, this.jwtRefreshSecret, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" })
  }

  private async getUserByEmail(email: string) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [email])
      return result[0] || null
    } catch (error) {
      console.error("Get user by email error:", error)
      return null
    }
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

// Export singleton instance
export const authService = new AuthService()
export default authService
