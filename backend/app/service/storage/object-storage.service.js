const fs = require('node:fs/promises')

const {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} = require('@aws-sdk/client-s3')
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

const { env } = require('../../config')
const { ApiError } = require('../../util')

let client

const assertConfigured = () => {
  const config = env.objectStorage
  if (!config.bucket || !config.accessKeyId || !config.secretAccessKey) {
    throw new ApiError(503, 'Kho lưu trữ file chưa được cấu hình.', 'OBJECT_STORAGE_NOT_CONFIGURED')
  }
  return config
}

const getObjectStorageClient = () => {
  const config = assertConfigured()
  if (!client) {
    client = new S3Client({
      region: config.region,
      endpoint: config.endpoint || undefined,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }
  return client
}

const createUploadPolicy = async ({ key, contentType, maxBytes }) => {
  const config = assertConfigured()
  const upload = await createPresignedPost(getObjectStorageClient(), {
    Bucket: config.bucket,
    Key: key,
    Conditions: [
      ['content-length-range', 1, maxBytes],
      ['eq', '$Content-Type', contentType],
    ],
    Fields: { 'Content-Type': contentType },
    Expires: config.presignedExpiresSeconds,
  })
  return { upload, key, expiresIn: config.presignedExpiresSeconds }
}

const headObject = (key) => {
  const config = assertConfigured()
  return getObjectStorageClient().send(new HeadObjectCommand({ Bucket: config.bucket, Key: key }))
}

const createDownloadUrl = (key, filename) => {
  const config = assertConfigured()
  const disposition = filename
    ? `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
    : undefined
  return getSignedUrl(getObjectStorageClient(), new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ResponseContentDisposition: disposition,
  }), { expiresIn: config.presignedExpiresSeconds })
}

const downloadObjectToFile = async (key, targetPath) => {
  const config = assertConfigured()
  const response = await getObjectStorageClient().send(new GetObjectCommand({ Bucket: config.bucket, Key: key }))
  const bytes = await response.Body.transformToByteArray()
  await fs.writeFile(targetPath, bytes)
  return targetPath
}

const uploadFile = async ({ key, path, contentType }) => {
  const config = assertConfigured()
  const body = await fs.readFile(path)
  await getObjectStorageClient().send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
  return key
}

const deleteObject = async (key) => {
  const config = assertConfigured()
  await getObjectStorageClient().send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }))
}

module.exports = {
  createDownloadUrl,
  createUploadPolicy,
  deleteObject,
  downloadObjectToFile,
  headObject,
  uploadFile,
}
