import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

// Configure AWS SDK
const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
};

AWS.config.update(awsConfig);

console.log("🔍 Checking AWS Billing Access for IAM Users");
console.log("=============================================");

async function checkBillingAccess() {
  try {
    // Try to access billing information
    const sts = new AWS.STS();
    const identity = await sts.getCallerIdentity().promise();
    console.log(`✅ Authenticated as: ${identity.Arn}`);
    
    // Try to get account settings to check if billing access is enabled
    const iam = new AWS.IAM();
    
    try {
      // Try to list account aliases to see if we have general account access
      await iam.listAccountAliases().promise();
      console.log("✅ Basic IAM access: Available");
    } catch (error) {
      console.log("❌ Basic IAM access: Not available");
      console.log(`   Error: ${error.message}`);
    }
    
    // Try to access billing information directly
    const costExplorer = new AWS.CostExplorer();
    
    // Get current date
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const start = `${startOfLastMonth.getFullYear()}-${String(startOfLastMonth.getMonth() + 1).padStart(2, "0")}-01`;
    const end = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, "0")}-01`;
    
    try {
      const params = {
        TimePeriod: { Start: start, End: end },
        Granularity: "MONTHLY",
        Metrics: ["UnblendedCost"],
      };
      
      const data = await costExplorer.getCostAndUsage(params).promise();
      const cost = parseFloat(data.ResultsByTime[0].Total.UnblendedCost.Amount);
      console.log(`✅ Cost Explorer access: Available`);
      console.log(`   Last month's cost: $${cost.toFixed(2)}`);
    } catch (error) {
      console.log("❌ Cost Explorer access: Not available");
      console.log(`   Error: ${error.message}`);
      
      if (error.code === 'AccessDeniedException') {
        console.log("\n🔧 Troubleshooting Tips:");
        console.log("   1. Make sure 'IAM User and Role Access to Billing Information' is enabled in AWS Billing Console");
        console.log("   2. Verify your IAM user has the 'ce:GetCostAndUsage' permission");
        console.log("   3. Check if your account has any billing data");
      }
    }
    
  } catch (error) {
    console.log("❌ Authentication failed");
    console.log(`   Error: ${error.message}`);
  }
}

checkBillingAccess();