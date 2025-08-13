# AWS S3 Migration Guide

## Overview
This guide explains the migration from Cloudinary to AWS S3 for image and file storage in the ERP system.

## What Changed

### 🔄 **Replaced Components:**
- **Cloudinary SDK** → **AWS SDK**
- **Cloudinary upload functions** → **S3 upload functions**
- **Cloudinary URLs** → **S3 URLs**

### 📁 **Files Modified:**
1. `backend/config/S3.js` - New S3 configuration
2. `backend/controllers/partController.js` - Updated upload functions
3. `backend/package.json` - Updated dependencies
4. `backend/.env` - New environment variables

### 🗑️ **Files Removed:**
- `backend/config/Cloudinary.js`

## Setup Instructions

### 1. AWS Account Setup
1. Create an AWS account if you don't have one
2. Create an IAM user with S3 permissions
3. Generate Access Key ID and Secret Access Key
4. Create an S3 bucket for your application

### 2. S3 Bucket Configuration
```bash
# Bucket Policy Example (replace YOUR_BUCKET_NAME)
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        }
    ]
}
```

### 3. Environment Variables
Update your `.env` file with AWS credentials:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_s3_bucket_name
```

### 4. Test Configuration
Run the test script to verify setup:
```bash
cd backend
node testS3.js
```

## API Changes

### Upload Endpoints (No Changes Required)
- `POST /api/ERP/part/upload` - Image upload (now uses S3)
- `POST /api/ERP/disptach/upload-pdf` - PDF upload (now uses S3)

### Response Format (Backward Compatible)
```json
{
  "message": "Image uploaded successfully",
  "imageUrl": "https://your-bucket.s3.amazonaws.com/part-images/123456-image.jpg",
  "url": "https://your-bucket.s3.amazonaws.com/part-images/123456-image.jpg",
  "fileName": "image.jpg"
}
```

## Frontend Compatibility

### ✅ **No Frontend Changes Required**
All frontend components continue to work without modification:
- `QRScannerComponent.jsx`
- `SinglePartPage.jsx`
- `SingleProductPage.jsx`
- `QCComponent.jsx`

### 🔗 **URL Format Change**
- **Before:** `https://res.cloudinary.com/...`
- **After:** `https://your-bucket.s3.amazonaws.com/...`

## Features Added

### 🛡️ **Enhanced Security**
- File type validation
- File size limits (10MB for images)
- Unique filename generation

### 📁 **Organized Storage**
- `part-images/` - Part and product images
- `dispatch-reports/` - PDF dispatch reports
- `test-uploads/` - Test files

### 🔧 **Additional Functions**
- `deleteFromS3()` - Delete files
- `getSignedUrl()` - Generate temporary URLs
- `fileExists()` - Check file existence
- `listFiles()` - List bucket contents
- `getFileMetadata()` - Get file information

## Migration Benefits

### 💰 **Cost Efficiency**
- Pay only for storage used
- No monthly subscription fees
- Scalable pricing model

### 🚀 **Performance**
- Global CDN through CloudFront (optional)
- High availability and durability
- Fast upload/download speeds

### 🔒 **Security**
- IAM-based access control
- Encryption at rest and in transit
- Fine-grained permissions

### 📈 **Scalability**
- Unlimited storage capacity
- Handle any file size
- Global accessibility

## Troubleshooting

### Common Issues:

1. **Access Denied Error**
   - Check AWS credentials
   - Verify IAM permissions
   - Ensure bucket exists

2. **Upload Fails**
   - Check file size limits
   - Verify file type restrictions
   - Check network connectivity

3. **Images Not Loading**
   - Verify bucket public read permissions
   - Check CORS configuration
   - Ensure correct URL format

### Debug Commands:
```bash
# Test S3 connection
node testS3.js

# Check AWS CLI configuration
aws s3 ls s3://your-bucket-name

# Verify credentials
aws sts get-caller-identity
```

## Rollback Plan

If needed, you can rollback to Cloudinary:

1. Restore `backend/config/Cloudinary.js`
2. Update `partController.js` imports
3. Restore Cloudinary environment variables
4. Reinstall Cloudinary packages:
   ```bash
   npm install cloudinary streamifier
   ```

## Support

For issues or questions:
1. Check AWS S3 documentation
2. Verify environment variables
3. Run test script for diagnostics
4. Check server logs for detailed errors

---

**Migration completed successfully! 🎉**
All image uploads now use AWS S3 with enhanced security and performance.
