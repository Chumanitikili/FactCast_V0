import { db } from "./database.service"

export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

class AuthService {
  private sessions: Map<string, string> = new Map()

  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    if (!data.email || !data.password || !data.name) {
      throw new Error("Email, password, and name are required")
    }

    if (data.password.length < 8) {
      throw new Error("Password must be at least 8 characters long")
    }

    const existingUser = await db.getUserByEmail(data.email)
    if (existingUser) {
      throw new Error("User already exists with this email")
    }

    const user = await db.createUser({
      email: data.email,
      name: data.name,
    })

    const tokens = this.generateTokens(user.id)

    return { user, tokens }
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await db.getUserByEmail(credentials.email)
    if (!user) {
      throw new Error("Invalid email or password")
    }

    const tokens = this.generateTokens(user.id)

    return { user, tokens }
  }

  async getCurrentUser(token: string): Promise<User | null> {
    const userId = this.sessions.get(token)
    if (!userId) {
      return null
    }

    return db.getUserById(userId)
  }

  private generateTokens(userId: string): AuthTokens {
    const accessToken = `access_${userId}_${Date.now()}`
    const refreshToken = `refresh_${userId}_${Date.now()}`

    this.sessions.set(accessToken, userId)
    this.sessions.set(refreshToken, userId)

    return { accessToken, refreshToken }
  }

  async verifyToken(token: string): Promise<string | null> {
    return this.sessions.get(token) || null
  }
}

export const authService = new AuthService()
