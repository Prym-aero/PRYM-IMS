// Quick S3 test after permissions are applied
const { uploadToS3 } = require('./config/S3');
require('dotenv').config();

async function quickTest() {
  console.log('🚀 Quick S3 Upload Test...\n');
  
  try {
    const testBuffer = Buffer.from('Hello S3!', 'utf8');
    const url = await uploadToS3(testBuffer, 'quick-test.txt', 'text/plain', 'test');
    
    console.log('✅ SUCCESS! S3 upload working!');
    console.log(`🔗 URL: ${url}`);
    console.log('\n🎉 Your ERP system is ready to use S3!');
    
  } catch (error) {
    console.log('❌ Still having issues:');
    console.log(error.message);
    console.log('\n💡 Make sure you applied the IAM permissions!');
  }
}

quickTest();
