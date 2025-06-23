const crypto = require("crypto")
const fs = require("fs")

console.log("🔧 TruthCast Environment Setup")
console.log("==============================\n")

// Generate all required keys
const keys = {
  JWT_SECRET: crypto.randomBytes(64).toString("hex"),
  JWT_REFRESH_SECRET: crypto.randomBytes(64).toString("hex"),
  CUSTOM_KEY: "production-" + crypto.randomBytes(16).toString("hex"),
  SESSION_SECRET: crypto.randomBytes(32).toString("hex"),
  ENCRYPTION_KEY: crypto.randomBytes(32).toString("hex"),
  API_KEY_SALT: crypto.randomBytes(16).toString("hex"),
}

console.log("🔐 Generated Security Keys:")
Object.entries(keys).forEach(([key, value]) => {
  console.log(`${key}=${value}`)
})

// Create comprehensive .env template
const envTemplate = `# TruthCast Environment Configuration
# Generated on ${new Date().toISOString()}
# 
# 🔐 SECURITY KEYS (Generated)
JWT_SECRET=${keys.JWT_SECRET}
JWT_REFRESH_SECRET=${keys.JWT_REFRESH_SECRET}
CUSTOM_KEY=${keys.CUSTOM_KEY}
SESSION_SECRET=${keys.SESSION_SECRET}
ENCRYPTION_KEY=${keys.ENCRYPTION_KEY}
API_KEY_SALT=${keys.API_KEY_SALT}

# 🌐 APPLICATION SETTINGS
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000

# 🗄️ DATABASE CONFIGURATION
# Get from: https://console.neon.tech/
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
DATABASE_POOL_MAX=20
DATABASE_POOL_MIN=5

# 🤖 AI SERVICES
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-key-here

# 📰 NEWS APIS (Optional)
# Get from: https://newsapi.org/
NEWS_API_KEY=your-news-api-key-here
# Get from: https://open-platform.theguardian.com/
GUARDIAN_API_KEY=your-guardian-key-here
# Get from: https://console.cloud.google.com/
GOOGLE_CLOUD_API_KEY=your-google-key-here

# ☁️ CLOUD STORAGE (Optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=truthcast-storage

# 🔄 REDIS (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# 📧 EMAIL (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# 📊 MONITORING (Optional)
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info

# ⚡ PERFORMANCE
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
MAX_FILE_SIZE=524288000
ALLOWED_FILE_TYPES=audio/mpeg,audio/wav,audio/mp4,audio/webm
`

console.log("\n📝 Environment Template Created")
console.log("Copy the above configuration to your .env file")

console.log("\n🚀 Next Steps:")
console.log("1. Copy the generated keys to your .env file")
console.log("2. Set up Neon database and add DATABASE_URL")
console.log("3. Get OpenAI API key and add OPENAI_API_KEY")
console.log("4. Configure optional services as needed")
console.log("5. Run database setup scripts")
console.log("6. Start the application with npm run dev")

console.log("\n✅ Environment setup complete!")
