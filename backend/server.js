import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import AWS from "aws-sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// AWS SDK config
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1", // Cost Explorer API is global
});

const costExplorer = new AWS.CostExplorer();

// ✅ GET /api/costs?month=YYYY-MM
app.get("/api/costs", async (req, res) => {
  try {
    let { month } = req.query;

    // Handle default and validate month
    const now = new Date();
    const firstOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Declare startDate and endDate variables
    let startDate, endDate;
    
    // Default to current month if not provided
    if (!month) {
      month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      startDate = new Date(`${month}-01`);
    } else {
      // Validate the provided month format
      const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
      if (!monthRegex.test(month)) {
        return res.status(400).json({ 
          error: "Invalid month format",
          message: "Month must be in YYYY-MM format"
        });
      }
      startDate = new Date(`${month}-01`);
    }
    
    endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
    
    // Check if the requested month is in the future (beyond current month)
    const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    console.log("Debug information:");
    console.log("- Requested month:", month);
    console.log("- startDate:", startDate);
    console.log("- firstOfNextMonth:", firstOfNextMonth);
    console.log("- startDate >= firstOfNextMonth:", startDate >= firstOfNextMonth);
    console.log("- now:", now);
    
    // If future date or current month requested, use current month
    if (startDate >= firstOfCurrentMonth) {
      // Default to current month
      month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      // Update startDate and endDate
      startDate = new Date(`${month}-01`);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
      
      console.log(`Requested future or current month, using: ${month}`);
    }

    const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-01`;
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-01`;

    // 1️⃣ Total monthly cost
    const totalParams = {
      TimePeriod: { Start: start, End: end },
      Granularity: "MONTHLY",
      Metrics: ["UnblendedCost"],
    };
    
    console.log("Making request to AWS Cost Explorer for total cost:", totalParams);
    const totalData = await costExplorer.getCostAndUsage(totalParams).promise();
    const totalCost = parseFloat(totalData.ResultsByTime[0].Total.UnblendedCost.Amount);

    // 2️⃣ Service-wise breakdown
    const serviceParams = {
      TimePeriod: { Start: start, End: end },
      Granularity: "MONTHLY",
      Metrics: ["UnblendedCost"],
      GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
    };
    
    console.log("Making request to AWS Cost Explorer for service breakdown:", serviceParams);
    const serviceData = await costExplorer.getCostAndUsage(serviceParams).promise();

    const services = serviceData.ResultsByTime[0].Groups.map((g) => ({
      name: g.Keys[0],
      cost: parseFloat(g.Metrics.UnblendedCost.Amount).toFixed(2),
    }));

    res.json({
      month,
      totalCost: totalCost.toFixed(2),
      services,
    });
  } catch (err) {
    console.error("AWS Billing Error:", err.message);
    console.error("Error stack:", err.stack);
    
    // Provide more specific error messages
    if (err.code === 'UnrecognizedClientException') {
      res.status(401).json({ 
        error: "Authentication failed",
        message: "Invalid AWS credentials. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in the .env file."
      });
    } else if (err.code === 'AccessDeniedException') {
      res.status(403).json({ 
        error: "Access denied",
        message: "Insufficient permissions. Your AWS credentials don't have access to Cost Explorer API."
      });
    } else {
      res.status(500).json({ 
        error: "Failed to retrieve billing data",
        message: err.message 
      });
    }
  }
});

// 📈 GET /api/costs/trend?months=N
app.get("/api/costs/trend", async (req, res) => {
  try {
    let { months } = req.query;
    months = parseInt(months) || 6; // Default to 6 months
    
    // Limit to reasonable range
    if (months > 12) months = 12;
    if (months < 2) months = 2;

    const trendData = [];
    const now = new Date();
    
    // Generate date ranges for each month
    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
      
      const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-01`;
      const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-01`;
      
      const params = {
        TimePeriod: { Start: start, End: end },
        Granularity: "MONTHLY",
        Metrics: ["UnblendedCost"],
      };
      
      console.log("Making request to AWS Cost Explorer for trend data:", params);
      const data = await costExplorer.getCostAndUsage(params).promise();
      const totalCost = parseFloat(data.ResultsByTime[0].Total.UnblendedCost.Amount);
      
      trendData.push({
        month: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`,
        formattedMonth: startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        totalCost: totalCost.toFixed(2)
      });
    }

    res.json(trendData);
  } catch (err) {
    console.error("AWS Billing Error:", err.message);
    console.error("Error stack:", err.stack);
    
    // Provide more specific error messages
    if (err.code === 'UnrecognizedClientException') {
      res.status(401).json({ 
        error: "Authentication failed",
        message: "Invalid AWS credentials. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in the .env file."
      });
    } else if (err.code === 'AccessDeniedException') {
      res.status(403).json({ 
        error: "Access denied",
        message: "Insufficient permissions. Your AWS credentials don't have access to Cost Explorer API."
      });
    } else {
      res.status(500).json({ 
        error: "Failed to retrieve billing data",
        message: err.message 
      });
    }
  }
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "frontend/build")));
  
  // Handle React routing, return all requests to React app
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/build", "index.html"));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));