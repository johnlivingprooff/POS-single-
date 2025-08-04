# Vercel Environment Variables Setup

## Required Environment Variables for Vercel Deployment:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add the following:

### Production Environment Variable:
```
VITE_API_URL = https://habicore-pos-backend.onrender.com/api
```

### How to set it:
1. Variable Name: `VITE_API_URL`
2. Value: `https://habicore-pos-backend.onrender.com/api`
3. Environment: Production (and Preview if you want)

## Testing:
After setting the environment variable and redeploying:
1. Open browser console on your Vercel deployment
2. You should see: "🔗 API Base URL: https://habicore-pos-backend.onrender.com/api"
3. API calls should now go to your Render backend instead of relative paths

## Note:
- The proxy in vite.config.ts only works in development
- Environment variables in Vercel override the .env files
- Make sure your backend URL is correct and includes `/api` at the end
