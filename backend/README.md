# AWS Cost Dashboard - Backend

This is the backend service for the AWS Cost Dashboard application. It provides a REST API to access AWS Cost Explorer data.

## Prerequisites

1. Node.js (v14 or higher)
2. AWS Account with Cost Explorer permissions
3. AWS IAM User with programmatic access

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the backend directory with your AWS credentials:
   ```env
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   # AWS_SESSION_TOKEN=your_session_token # Only needed for temporary credentials
   AWS_REGION=us-east-1
   ```

3. Ensure your IAM user has the required permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ce:GetCostAndUsage"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

## Running the Application

1. Start the backend server:
   ```bash
   npm start
   ```

2. The server will start on port 5000 by default.

## Validating Credentials

To validate your AWS credentials, run:
```bash
npm run validate-credentials
```

This will check if your credentials are valid and have the necessary permissions to access the Cost Explorer API.

## Troubleshooting

### Common Issues

1. **"The security token included in the request is invalid"**
   - Your credentials may be incorrect or expired
   - If using temporary credentials, make sure AWS_SESSION_TOKEN is set
   - Run `npm run validate-credentials` to check your credentials

2. **"AccessDenied"**
   - Your IAM user doesn't have the required permissions
   - Make sure you've attached the Cost Explorer policy to your user

3. **"InvalidClientTokenId"**
   - Your AWS_ACCESS_KEY_ID is incorrect
   - Double-check for typos in your credentials

### Creating AWS Credentials

1. Sign in to the AWS Management Console
2. Navigate to the IAM service
3. Click on "Users" in the left sidebar
4. Select your user or create a new one
5. Go to the "Security credentials" tab
6. Under "Access keys", click "Create access key"
7. Save the Access Key ID and Secret Access Key in your `.env` file

### Required IAM Permissions

Your IAM user or role must have at least the following policy attached:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage"
      ],
      "Resource": "*"
    }
  ]
}
```

### Using Temporary Credentials

If you're using temporary credentials (from AWS SSO, assumeRole, etc.), you'll also need to provide the session token:

```env
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_SESSION_TOKEN=your_session_token
AWS_REGION=us-east-1
```

Temporary credentials typically expire after 1 hour, so you'll need to refresh them regularly.