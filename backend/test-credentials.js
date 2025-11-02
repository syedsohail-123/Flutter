import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

console.log("Checking environment variables...");
console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "SET" : "NOT SET");
console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "SET" : "NOT SET");
console.log("AWS_SESSION_TOKEN:", process.env.AWS_SESSION_TOKEN ? "SET" : "NOT SET");
console.log("AWS_REGION:", process.env.AWS_REGION || "us-east-1");

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

// Add session token if present
if (process.env.AWS_SESSION_TOKEN) {
  AWS.config.update({
    sessionToken: process.env.AWS_SESSION_TOKEN
  });
}

const sts = new AWS.STS();

async function testCredentials() {
  try {
    console.log("\nTesting AWS credentials...");
    const data = await sts.getCallerIdentity().promise();
    console.log("✅ Credentials are valid!");
    console.log("User:", data.Arn);
    console.log("Account:", data.Account);
    console.log("UserId:", data.UserId);
  } catch (error) {
    console.log("❌ Credentials are invalid!");
    console.log("Error:", error.message);
    console.log("Error Code:", error.code);
    
    if (error.code === 'InvalidClientTokenId') {
      console.log("\n🔧 Troubleshooting tips:");
      console.log("1. Check that your AWS_ACCESS_KEY_ID is correct");
      console.log("2. Check that your AWS_SECRET_ACCESS_KEY is correct");
      console.log("3. Make sure the IAM user has programmatic access enabled");
    } else if (error.code === 'SignatureDoesNotMatch') {
      console.log("\n🔧 Troubleshooting tips:");
      console.log("1. Your secret access key might be incorrect");
      console.log("2. Check for any hidden characters in your credentials");
    } else if (error.code === 'UnrecognizedClientException') {
      console.log("\n🔧 Troubleshooting tips:");
      console.log("1. The security token is invalid - check if credentials are expired");
      console.log("2. If using temporary credentials, make sure to include AWS_SESSION_TOKEN");
      console.log("3. Try regenerating your credentials");
    } else if (error.code === 'AccessDenied') {
      console.log("\n🔧 Troubleshooting tips:");
      console.log("1. Your IAM user/role doesn't have sufficient permissions");
      console.log("2. You need the sts:GetCallerIdentity permission at minimum");
    }
  }
}

testCredentials();