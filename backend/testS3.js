const { uploadToS3 } = require('./config/S3');
require('dotenv').config();

async function testS3Connection() {
  console.log('🧪 Testing S3 Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Not set'}`);
  console.log(`AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`AWS_REGION: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`S3_BUCKET_NAME: ${process.env.S3_BUCKET_NAME || '❌ Not set'}\n`);

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET_NAME) {
    console.log('❌ Missing required AWS environment variables!');
    console.log('\nPlease set the following in your .env file:');
    console.log('AWS_ACCESS_KEY_ID=your_access_key');
    console.log('AWS_SECRET_ACCESS_KEY=your_secret_key');
    console.log('AWS_REGION=your_region (optional, defaults to us-east-1)');
    console.log('S3_BUCKET_NAME=your_bucket_name');
    return;
  }

  try {
    // Test upload with a simple text file (this is the main functionality we need)
    console.log('📤 Testing file upload...');
    const testContent = `S3 Test File\nUploaded at: ${new Date().toISOString()}\nFrom: ERP System`;
    const testBuffer = Buffer.from(testContent, 'utf8');

    const uploadUrl = await uploadToS3(
      testBuffer,
      'test-file.txt',
      'text/plain',
      'test-uploads'
    );

    console.log('✅ Test file uploaded successfully!');
    console.log(`🔗 File URL: ${uploadUrl}\n`);

    // Test image upload simulation
    console.log('🖼️ Testing image upload simulation...');
    const imageTestContent = Buffer.from('fake-image-data-for-testing', 'utf8');

    const imageUrl = await uploadToS3(
      imageTestContent,
      'test-image.jpg',
      'image/jpeg',
      'part-images'
    );

    console.log('✅ Test image uploaded successfully!');
    console.log(`🔗 Image URL: ${imageUrl}\n`);

    console.log('🎉 S3 integration is working correctly!');
    console.log('\n📝 Next steps:');
    console.log('1. ✅ AWS credentials are working');
    console.log('2. ✅ S3 bucket is accessible');
    console.log('3. ✅ Upload functionality is working');
    console.log('4. 🔄 Test image uploads through the application');
    console.log('5. 🔧 Apply IAM policy for full bucket access (optional)');

  } catch (error) {
    console.error('❌ S3 test failed:', error.message);

    if (error.message.includes('AccessDenied')) {
      console.log('\n🔧 Permission Issue Detected:');
      console.log('The IAM user needs additional permissions.');
      console.log('Apply the IAM policy from: aws-iam-policy.json');
      console.log('\nSteps to fix:');
      console.log('1. Go to AWS IAM Console');
      console.log('2. Find user: IMS-user');
      console.log('3. Attach the policy from aws-iam-policy.json');
      console.log('4. Or create inline policy with S3 permissions');
    } else if (error.message.includes('NoSuchBucket')) {
      console.log('\n🔧 Bucket Issue:');
      console.log('The S3 bucket "ims-image-data" does not exist.');
      console.log('Create the bucket in AWS S3 Console.');
    } else {
      console.log('\n🔧 General Troubleshooting:');
      console.log('1. Verify AWS credentials are correct');
      console.log('2. Check if S3 bucket exists');
      console.log('3. Ensure bucket region matches AWS_REGION');
      console.log('4. Check network connectivity');
    }
  }
}

// Run the test
testS3Connection();
