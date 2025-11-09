# Deploying AWS Cost Dashboard Backend to Vercel

This document explains how to deploy the backend of the AWS Cost Dashboard to Vercel as a serverless function.

## Prerequisites

1. A Vercel account
2. AWS credentials with Cost Explorer permissions
3. This repository

## Deployment Steps

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Import the project to Vercel:
   - Go to your Vercel dashboard
   - Click "New Project"
   - Import your Git repository
   - Set the root directory to `backend`

3. Configure environment variables in Vercel:
   - Go to your project settings in Vercel
   - Navigate to the "Environment Variables" section
   - Add the following variables:
     - `AWS_ACCESS_KEY_ID` - Your AWS access key ID
     - `AWS_SECRET_ACCESS_KEY` - Your AWS secret access key
     - `AWS_REGION` - (Optional) Your preferred AWS region (defaults to us-east-1)

4. Deploy the project

## Technical Details

The backend is configured to work with Vercel through:

- `vercel-server.js` - A serverless version of the main server that exports a handler for Vercel
- `vercel.json` - Configuration file that tells Vercel how to build and route requests
- Environment variables for AWS credentials (never hardcode credentials)

## API Endpoints

After deployment, your API will be available at:

- `GET /api/costs` - Get costs for a specific month
- `GET /api/costs/trend` - Get cost trend data for multiple months

Example usage:
```
GET https://your-vercel-url/api/costs?month=2023-01
GET https://your-vercel-url/api/costs/trend?months=6
```

## Notes

- Vercel's serverless functions have execution time limits, which should be sufficient for AWS Cost Explorer API calls
- Make sure your AWS credentials have the necessary permissions for Cost Explorer API (`ce:GetCostAndUsage`)
- The frontend will need to be configured to point to your new backend URL on Vercel
- The serverless function properly exports a default handler as required by Vercel