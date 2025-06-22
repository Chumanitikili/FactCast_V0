import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { auth } from "@/lib/config/production"
import { db } from "./database.service"

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  subscriptionTier: string
  emailVerified: boolean
  createdAt: Date
  lastLogin?: Date
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

class AuthService {
  private static instance: AuthService

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  generateTokens(userId: string): AuthTokens {
    const payload = { userId, type: "access" }
    const refreshPayload = { userId, type: "refresh" }

    const accessToken = jwt.sign(payload, auth.jwtSecret, {
      expiresIn: auth.jwtExpiresIn,
    })

    const refreshToken = jwt.sign(refreshPayload, auth.jwtRefreshSecret, {
      expiresIn: auth.jwtRefreshExpiresIn,
    })

    return {
      accessToken,
      refreshToken,
      expiresIn: auth.jwtExpiresIn,
    }
  }

  async verifyAccessToken(token: string): Promise<{ userId: string } | null> {
    try {
      const decoded = jwt.verify(token, auth.jwtSecret) as any
      if (decoded.type !== "access") {
        return null
      }
      return { userId: decoded.userId }
    } catch {
      return null
    }
  }

  async verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
    try {
      const decoded = jwt.verify(token, auth.jwtRefreshSecret) as any
      if (decoded.type !== "refresh") {
        return null
      }
      return { userId: decoded.userId }
    } catch {
      return null
    }
  }

  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password, firstName, lastName } = data

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email)
    if (existingUser) {
      throw new Error("User already exists with this email")
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long")
    }

    // Hash password
    const passwordHash = await this.hashPassword(password)

    // Create user
    const userData = await db.createUser({
      email,
      passwordHash,
      firstName,
      lastName,
    })

    // Generate tokens
    const tokens = this.generateTokens(userData.id)

    // Log audit event
    await db.logAuditEvent({
      userId: userData.id,
      action: "user_registered",
      resourceType: "user",
      resourceId: userData.id,
      newValues: { email, firstName, lastName },
    })

    const user: User = {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      subscriptionTier: "free",
      emailVerified: userData.email_verified,
      createdAt: userData.created_at,
    }

    return { user, tokens }
  }

  async login(credentials: LoginCredentials, ipAddress?: string): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password } = credentials

    // Get user by email
    const userData = await db.getUserByEmail(email)
    if (!userData) {
      throw new Error("Invalid email or password")
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, userData.password_hash)
    if (!isValidPassword) {
      throw new Error("Invalid email or password")
    }

    // Update last login
    await db.updateUserLastLogin(userData.id)

    // Generate tokens
    const tokens = this.generateTokens(userData.id)

    // Log audit event
    await db.logAuditEvent({
      userId: userData.id,
      action: "user_login",
      resourceType: "user",
      resourceId: userData.id,
      ipAddress,
    })

    const user: User = {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      avatarUrl: userData.avatar_url,
      subscriptionTier: userData.subscription_tier,
      emailVerified: userData.email_verified,
      createdAt: userData.created_at,
      lastLogin: userData.last_login,
    }

    return { user, tokens }
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const decoded = await this.verifyRefreshToken(refreshToken)
    if (!decoded) {
      throw new Error("Invalid refresh token")
    }

    // Verify user still exists
    const user = await db.getUserById(decoded.userId)
    if (!user) {
      throw new Error("User not found")
    }

    // Generate new tokens
    return this.generateTokens(decoded.userId)
  }

  async getCurrentUser(userId: string): Promise<User | null> {
    const userData = await db.getUserById(userId)
    if (!userData) {
      return null
    }

    return {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      avatarUrl: userData.avatar_url,
      subscriptionTier: userData.subscription_tier,
      emailVerified: userData.email_verified,
      createdAt: userData.created_at,
      lastLogin: userData.last_login,
    }
  }

  async validateApiKey(apiKey: string): Promise<User | null> {
    const result = await db.query("SELECT * FROM users WHERE api_key = $1 AND is_active = true", [apiKey])

    if (!result.length) {
      return null
    }

    const userData = result[0]
    return {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      avatarUrl: userData.avatar_url,
      subscriptionTier: userData.subscription_tier,
      emailVerified: userData.email_verified,
      createdAt: userData.created_at,
      lastLogin: userData.last_login,
    }
  }
}

export const authService = AuthService.getInstance()
export default AuthService
