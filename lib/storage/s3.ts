import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME!

export async function uploadToS3(file: File, key: string): Promise<string> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    })

    await s3Client.send(command)

    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  } catch (error) {
    console.error("S3 upload error:", error)
    throw new Error("File upload failed")
  }
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    return await getSignedUrl(s3Client, command, { expiresIn })
  } catch (error) {
    console.error("S3 signed URL error:", error)
    throw new Error("Failed to generate download URL")
  }
}

export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
  } catch (error) {
    console.error("S3 delete error:", error)
    throw new Error("File deletion failed")
  }
}
