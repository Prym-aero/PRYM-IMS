const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
require('dotenv').config();

// Configure AWS SDK
const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Create S3 instance
// const s3 = new AWS.S3();

// S3 bucket configuration
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

/**
 * Upload file to S3 bucket
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name
 * @param {string} mimeType - File MIME type
 * @param {string} folder - Folder path in S3 (optional)
 * @returns {Promise<string>} - S3 file URL
 */
const uploadToS3 = async (fileBuffer, fileName, mimeType, folder = "") => {
  try {
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;
    const key = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      Metadata: {
        "uploaded-at": new Date().toISOString(),
        "original-name": fileName
      }
    });

    await s3.send(command);

    // Construct file URL manually
    return `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
};


/**
 * Delete file from S3 bucket
 * @param {string} fileUrl - S3 file URL
 * @returns {Promise<boolean>} - Success status
 */
const deleteFromS3 = async (fileUrl) => {
  try {
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1);

    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key
    });

    await s3.send(command);
    return true;
  } catch (error) {
    console.error("S3 delete error:", error);
    throw new Error(`Failed to delete from S3: ${error.message}`);
  }
};

/**
 * Get signed URL for private file access
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} - Signed URL
 */
const getSignedUrlForS3 = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key
    });

    return await getSignedUrl(s3, command, { expiresIn });
  } catch (error) {
    console.error("S3 signed URL error:", error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};


/**
 * Check if file exists in S3
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>} - File exists status
 */
const fileExists = async (key) => {
  try {
    const command = new HeadObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key
    });

    await s3.send(command);
    return true;
  } catch (error) {
    if (error.name === "NotFound") {
      return false;
    }
    throw error;
  }
};


/**
 * List files in S3 bucket folder
 * @param {string} folder - Folder path
 * @param {number} maxKeys - Maximum number of files to return
 * @returns {Promise<Array>} - Array of file objects
 */
const listFiles = async (folder = "", maxKeys = 1000) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      Prefix: folder,
      MaxKeys: maxKeys
    });

    const result = await s3.send(command);
    return result.Contents || [];
  } catch (error) {
    console.error("S3 list files error:", error);
    throw new Error(`Failed to list files: ${error.message}`);
  }
};


/**
 * Get file metadata from S3
 * @param {string} key - S3 object key
 * @returns {Promise<Object>} - File metadata
 */
const getFileMetadata = async (key) => {
  try {
    const command = new HeadObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key
    });

    const result = await s3.send(command);
    return {
      size: result.ContentLength,
      lastModified: result.LastModified,
      contentType: result.ContentType,
      metadata: result.Metadata
    };
  } catch (error) {
    console.error("S3 metadata error:", error);
    throw new Error(`Failed to get file metadata: ${error.message}`);
  }
};


module.exports = {
  s3,
  uploadToS3,
  deleteFromS3,
  getSignedUrlForS3,
  fileExists,
  listFiles,
  getFileMetadata,
  S3_BUCKET_NAME
};
