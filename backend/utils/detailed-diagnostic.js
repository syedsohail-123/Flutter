import AWS from "aws-sdk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

console.log("🔍 Detailed AWS Cost Explorer Diagnostic");
console.log("========================================");

// Check if .env file exists
const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log("❌ Error: .env file not found!");
  console.log("Please create a .env file with your AWS credentials.");
  process.exit(1);
}

// Display which credentials are set
console.log("\n📋 Environment Variables Check:");
console.log(`AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✅ SET' : '❌ NOT SET'}`);
console.log(`AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ SET' : '❌ NOT SET'}`);
console.log(`AWS_SESSION_TOKEN: ${process.env.AWS_SESSION_TOKEN ? '✅ SET' : '❌ NOT SET'}`);
console.log(`AWS_REGION: ${process.env.AWS_REGION || 'us-east-1'} (default: us-east-1)`);

// Configure AWS SDK
const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
};

// Add session token if present
if (process.env.AWS_SESSION_TOKEN) {
  awsConfig.sessionToken = process.env.AWS_SESSION_TOKEN;
}

AWS.config.update(awsConfig);

console.log("\n🧪 Testing AWS Credentials...");
const sts = new AWS.STS();

async function runDiagnostic() {
  try {
    const identity = await sts.getCallerIdentity().promise();
    console.log("✅ AWS Credentials are VALID!");
    console.log(`👤 ARN: ${identity.Arn}`);
    console.log(`🆔 Account: ${identity.Account}`);
    console.log(`#️⃣ UserId: ${identity.UserId}`);
    
    // Test Cost Explorer permissions
    console.log("\n💰 Testing Cost Explorer Access...");
    const ce = new AWS.CostExplorer();
    
    // Try to get cost data for multiple months
    const now = new Date();
    
    // Test for last month
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStart = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}-01`;
    const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1)
      .toISOString()
      .split("T")[0];
    
    console.log(`\n📅 Checking last month: ${lastMonthStart} to ${lastMonthEnd}`);
    
    const lastMonthParams = {
      TimePeriod: { 
        Start: lastMonthStart, 
        End: lastMonthEnd 
      },
      Granularity: "MONTHLY",
      Metrics: ["UnblendedCost"],
    };
    
    try {
      const lastMonthData = await ce.getCostAndUsage(lastMonthParams).promise();
      const lastMonthCost = parseFloat(lastMonthData.ResultsByTime[0].Total.UnblendedCost.Amount);
      console.log(`✅ Last month cost: $${lastMonthCost.toFixed(2)}`);
      console.log(`📝 Last month data details:`, JSON.stringify(lastMonthData, null, 2));
    } catch (error) {
      console.log(`❌ Error getting last month data: ${error.message}`);
    }
    
    // Test for current month
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthStart = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-01`;
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      .toISOString()
      .split("T")[0];
    
    console.log(`\n📅 Checking current month: ${currentMonthStart} to ${currentMonthEnd}`);
    
    const currentMonthParams = {
      TimePeriod: { 
        Start: currentMonthStart, 
        End: currentMonthEnd 
      },
      Granularity: "MONTHLY",
      Metrics: ["UnblendedCost"],
    };
    
    try {
      const currentMonthData = await ce.getCostAndUsage(currentMonthParams).promise();
      const currentMonthCost = parseFloat(currentMonthData.ResultsByTime[0].Total.UnblendedCost.Amount);
      console.log(`✅ Current month cost: $${currentMonthCost.toFixed(2)}`);
      console.log(`📝 Current month data details:`, JSON.stringify(currentMonthData, null, 2));
    } catch (error) {
      console.log(`❌ Error getting current month data: ${error.message}`);
    }
    
    // Try to get service breakdown for last month
    console.log("\n🧩 Testing Service Breakdown...");
    const serviceBreakdownParams = {
      TimePeriod: { 
        Start: lastMonthStart, 
        End: lastMonthEnd 
      },
      Granularity: "MONTHLY",
      Metrics: ["UnblendedCost"],
      GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
    };
    
    try {
      const serviceData = await ce.getCostAndUsage(serviceBreakdownParams).promise();
      console.log(`✅ Service breakdown retrieved successfully`);
      console.log(`📝 Service data details:`, JSON.stringify(serviceData, null, 2));
    } catch (error) {
      console.log(`❌ Error getting service breakdown: ${error.message}`);
    }
    
  } catch (error) {
    console.log("❌ AWS Credentials are INVALID!");
    console.log(`📝 Error: ${error.message}`);
    
    switch (error.code) {
      case 'InvalidClientTokenId':
        console.log("\n🔧 Troubleshooting Tips:");
        console.log("   1. Check that your AWS_ACCESS_KEY_ID is correct");
        console.log("   2. Verify that the IAM user has programmatic access enabled");
        break;
        
      case 'SignatureDoesNotMatch':
        console.log("\n🔧 Troubleshooting Tips:");
        console.log("   1. Your AWS_SECRET_ACCESS_KEY might be incorrect");
        console.log("   2. Check for any hidden characters in your credentials");
        break;
        
      case 'UnrecognizedClientException':
        console.log("\n🔧 Troubleshooting Tips:");
        console.log("   1. The security token is invalid - credentials may be expired");
        console.log("   2. If using temporary credentials, make sure AWS_SESSION_TOKEN is set");
        console.log("   3. Try regenerating your credentials");
        break;
        
      case 'AccessDenied':
        console.log("\n🔧 Troubleshooting Tips:");
        console.log("   1. Your IAM user/role doesn't have sufficient permissions");
        console.log("   2. You need the 'ce:GetCostAndUsage' permission");
        console.log("   3. Make sure billing access is enabled for IAM users in AWS console");
        break;
        
      default:
        console.log("\n❓ Unknown error. Please check your credentials and try again.");
    }
  }
}

runDiagnostic();