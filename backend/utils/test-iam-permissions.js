import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

console.log("🔍 Testing IAM Permissions for AWS Cost Explorer");
console.log("================================================");

// Configure AWS SDK
const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
};

AWS.config.update(awsConfig);

async function testPermissions() {
  try {
    // Test 1: Check identity
    console.log("\n1. Testing IAM Identity...");
    const sts = new AWS.STS();
    const identity = await sts.getCallerIdentity().promise();
    console.log(`✅ Authenticated as: ${identity.Arn}`);
    console.log(`✅ Account ID: ${identity.Account}`);

    // Test 2: Test Cost Explorer permissions
    console.log("\n2. Testing Cost Explorer Access...");
    const costExplorer = new AWS.CostExplorer();
    
    // Try to get a list of services to see if we have basic CE access
    try {
      const services = await costExplorer.getDimensionValues({
        Dimension: 'SERVICE',
        TimePeriod: {
          Start: '2025-09-01',
          End: '2025-09-30'
        }
      }).promise();
      console.log("✅ Cost Explorer Dimension Access: Available");
    } catch (error) {
      console.log("❌ Cost Explorer Dimension Access: Not available");
      console.log(`   Error: ${error.code} - ${error.message}`);
    }
    
    // Test 3: Try to get actual cost data
    console.log("\n3. Testing Cost Data Access...");
    try {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const start = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}-01`;
      const end = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1)
        .toISOString()
        .split("T")[0];
      
      console.log(`   Testing period: ${start} to ${end}`);
      
      const data = await costExplorer.getCostAndUsage({
        TimePeriod: { Start: start, End: end },
        Granularity: "MONTHLY",
        Metrics: ["UnblendedCost"],
      }).promise();
      
      const cost = parseFloat(data.ResultsByTime[0].Total.UnblendedCost.Amount);
      console.log(`✅ Cost Data Access: Available`);
      console.log(`   Cost for ${start}: $${cost.toFixed(2)}`);
      
      // Show raw data for debugging
      console.log("\n   Raw response data:");
      console.log(JSON.stringify(data.ResultsByTime[0].Total, null, 2));
      
    } catch (error) {
      console.log("❌ Cost Data Access: Not available");
      console.log(`   Error: ${error.code} - ${error.message}`);
      
      if (error.code === 'AccessDeniedException') {
        console.log("\n🔧 This indicates a permissions issue:");
        console.log("   - Your IAM user may not have the 'ce:GetCostAndUsage' permission");
        console.log("   - Your AWS account may not have IAM user access to billing information enabled");
        console.log("   - Check the IAM policy attached to your user");
      }
    }
    
    // Test 4: Check if billing access is enabled for IAM users
    console.log("\n4. Testing General Billing Access...");
    try {
      // Try to access account settings (requires billing access)
      const data = await costExplorer.getAccountSettings().promise();
      console.log("✅ General Billing Access: Available");
    } catch (error) {
      console.log("❌ General Billing Access: Not available");
      console.log(`   Error: ${error.code} - ${error.message}`);
      
      if (error.code === 'AccessDeniedException') {
        console.log("\n🔧 This indicates that billing access for IAM users may not be enabled:");
        console.log("   - Log in to the AWS console as root or administrator");
        console.log("   - Go to Billing Dashboard");
        console.log("   - Select 'Account' from the left navigation");
        console.log("   - Find 'IAM User and Role Access to Billing Information'");
        console.log("   - Make sure 'Activate IAM Access' is checked");
      }
    }
    
  } catch (error) {
    console.log("❌ Authentication failed");
    console.log(`   Error: ${error.message}`);
  }
  
  console.log("\n📋 Summary:");
  console.log("   If you're seeing $0.00 costs, it could be due to:");
  console.log("   1. Your AWS account genuinely has no costs");
  console.log("   2. Your IAM user lacks proper permissions");
  console.log("   3. Billing access for IAM users is not enabled in your AWS account");
  console.log("   4. Your account is a new account with minimal usage");
}

testPermissions();