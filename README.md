# AWS Cost Dashboard

A dashboard to visualize AWS cost data using the Cost Explorer API.

## Features
- View monthly AWS costs
- See costs by service
- View cost trends over time
- Export data to PDF and Excel

## Prerequisites
- Node.js (v14 or higher)
- AWS credentials with Cost Explorer permissions

## Setup

1. Clone the repository
2. Create a `.env` file in the `backend` directory with your AWS credentials:
   ```
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_REGION=us-east-1
   ```
3. Install backend dependencies:
   ```
   cd backend
   npm install
   ```
4. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

## Running the Application

1. Start the backend server:
   ```
   cd backend
   npm start
   ```
   The backend will run on http://localhost:5000

2. In a new terminal, start the frontend:
   ```
   cd backend/frontend
   npm start
   ```
   The frontend will run on http://localhost:3000

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Select a month to view costs for that period
3. Use the export buttons to download PDF or Excel reports

## API Endpoints

- `GET /api/costs?month=YYYY-MM` - Get costs for a specific month
- `GET /api/costs/trend?months=N` - Get cost trend for N months