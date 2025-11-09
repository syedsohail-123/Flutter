# Frontend Deployment Guide

This guide explains how to deploy the frontend to work with your Vercel backend.

## Environment Setup

When deploying the frontend, you need to make sure it can communicate with your backend. There are two main approaches:

### Option 1: Deploy frontend and backend to the same domain (Recommended)

If you deploy your frontend to the same domain as your backend (e.g., both on Vercel), the API calls will work automatically with relative paths.

### Option 2: Deploy frontend and backend separately

If you deploy your frontend and backend to different domains, you need to specify the backend URL.

## Environment Variables

Create a `.env.production` file in the frontend directory with:

```
REACT_APP_BACKEND_URL=https://your-vercel-backend-url.vercel.app
```

Replace `https://your-vercel-backend-url.vercel.app` with your actual Vercel backend URL.

## Build Process

1. Create the production build:
   ```bash
   cd frontend
   npm run build
   ```

2. The build output will be in the `build` directory, which can be deployed to any static hosting service.

## Deploying to Vercel

If you want to deploy the frontend to Vercel:

1. Push your code to a Git repository
2. Import the project to Vercel
3. Set the root directory to `backend/frontend`
4. Add environment variables if needed:
   - `REACT_APP_BACKEND_URL` - Your Vercel backend URL (if different domain)

## Deploying to Other Static Hosting Services

The build output can be deployed to any static hosting service like Netlify, GitHub Pages, or AWS S3:

1. Build the project:
   ```bash
   cd frontend
   npm run build
   ```

2. Upload the contents of the `build` directory to your hosting service

3. If using a separate domain for the frontend, make sure to set the `REACT_APP_BACKEND_URL` environment variable

## CORS Considerations

The backend already has CORS enabled, so cross-origin requests from your frontend should work correctly.

## Troubleshooting

If you're getting network errors:

1. Check that your backend URL is correct
2. Verify that your Vercel backend is deployed and working
3. Check the browser's network tab for detailed error information
4. Make sure your AWS credentials are properly configured in the Vercel backend environment variables