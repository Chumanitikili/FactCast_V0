const crypto = require("crypto")

console.log("# Generated Security Keys for TruthCast")
console.log("# Copy these to your .env file")
console.log("")

// Generate JWT secrets
const jwtSecret = crypto.randomBytes(64).toString("hex")
const jwtRefreshSecret = crypto.randomBytes(64).toString("hex")
const customKey = "production-" + crypto.randomBytes(16).toString("hex")

console.log("JWT_SECRET=" + jwtSecret)
console.log("JWT_REFRESH_SECRET=" + jwtRefreshSecret)
console.log("CUSTOM_KEY=" + customKey)
console.log("")

// Generate additional secure keys
console.log("# Additional Configuration")
console.log("JWT_EXPIRES_IN=15m")
console.log("JWT_REFRESH_EXPIRES_IN=7d")
console.log("PORT=3000")
console.log("DATABASE_POOL_MAX=20")
console.log("DATABASE_POOL_MIN=5")
console.log("")

console.log("✅ Security keys generated successfully!")
console.log("📋 Copy the above environment variables to your .env file")
