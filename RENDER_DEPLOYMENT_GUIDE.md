# Habicore POS Deployment Guide - Render

This guide walks you through deploying your Habicore POS system on Render with PostgreSQL database, Node.js backend, and React frontend.

## Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **GitHub Connection**: Connect your GitHub account to Render

## Deployment Steps

### Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - Single tenant POS system"

# Add your GitHub repository
git remote add origin https://github.com/yourusername/habicore-pos.git
git branch -M main
git push -u origin main
```

### Step 2: Create PostgreSQL Database

1. **Go to Render Dashboard** → Click "New +"
2. **Select "PostgreSQL"**
3. **Configure Database**:
   - **Name**: `habicore-pos-db`
   - **Database**: `habicore_pos`
   - **User**: `habicore_user`
   - **Plan**: Free (or paid for production)
   - **Region**: Oregon (or closest to your users)

4. **Click "Create Database"**
5. **Save the Connection Details** (you'll need the DATABASE_URL)

### Step 3: Deploy Backend API

1. **Go to Render Dashboard** → Click "New +"
2. **Select "Web Service"**
3. **Connect Repository**: Select your GitHub repo
4. **Configure Service**:
   - **Name**: `habicore-pos-backend`
   - **Environment**: `Node`
   - **Region**: `Oregon`
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm start`

5. **Environment Variables**:
   ```
   NODE_ENV=production
   DATABASE_URL=[Your PostgreSQL connection string from Step 2]
   JWT_SECRET=[Generate a secure random string]
   JWT_EXPIRES_IN=24h
   CORS_ORIGIN=https://habicore-pos-frontend.onrender.com
   PORT=3001
   ```

6. **Advanced Settings**:
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: `Yes`

7. **Click "Create Web Service"**

### Step 4: Deploy Frontend

1. **Go to Render Dashboard** → Click "New +"
2. **Select "Static Site"**
3. **Connect Repository**: Select your GitHub repo
4. **Configure Site**:
   - **Name**: `habicore-pos-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

5. **Environment Variables**:
   ```
   VITE_API_URL=https://habicore-pos-backend.onrender.com
   NODE_ENV=production
   ```

6. **Redirects and Rewrites** (for React Router):
   ```
   /*    /index.html   200
   ```

7. **Click "Create Static Site"**

### Step 5: Update CORS Configuration

After frontend is deployed, update your backend environment variables:

1. Go to your backend service in Render
2. Go to "Environment" tab
3. Update `CORS_ORIGIN` to your actual frontend URL:
   ```
   CORS_ORIGIN=https://your-frontend-name.onrender.com
   ```

## Alternative: One-Click Deployment with render.yaml

You can also use the included `render.yaml` file for automated deployment:

1. **Fork/Clone Repository**
2. **Update render.yaml** with your service names
3. **Go to Render Dashboard** → "YAML" tab
4. **Connect Repository** and deploy all services at once

## Post-Deployment Setup

### 1. Database Seeding (Optional)

If you want to seed the database with initial data:

```bash
# Connect to your backend service terminal in Render
npx prisma db seed
```

### 2. Create Admin User

Since you removed multi-tenant support, create an admin user directly:

```bash
# Option 1: Use Prisma Studio (if enabled)
npx prisma studio

# Option 2: Create via API call to /api/auth/register
curl -X POST https://your-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "securepassword",
    "name": "Admin User",
    "role": "admin"
  }'
```

### 3. Configure Domain (Optional)

- **Custom Domain**: Add your domain in Render settings
- **SSL**: Automatically provided by Render

## Environment Variables Reference

### Backend (.env)
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-super-secure-secret
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://your-frontend.onrender.com
PORT=3001
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
```

### Frontend (.env.production)
```bash
VITE_API_URL=https://your-backend.onrender.com
NODE_ENV=production
```

## Cost Estimation (Render Free Tier)

- **PostgreSQL Database**: Free (1GB storage, shared CPU)
- **Backend Web Service**: Free (750 hours/month, sleeps after 15min inactivity)
- **Frontend Static Site**: Free (100GB bandwidth)

**Total Monthly Cost**: $0 (Free tier limits apply)

For production use, consider upgrading to paid plans for:
- Dedicated resources
- No sleep mode
- More storage and bandwidth
- Better performance

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check build logs in Render dashboard
   - Verify package.json scripts
   - Ensure all dependencies are listed

2. **Database Connection Issues**:
   - Verify DATABASE_URL format
   - Check database is running
   - Ensure Prisma migrations ran

3. **CORS Errors**:
   - Update CORS_ORIGIN in backend
   - Verify frontend URL is correct

4. **Environment Variables**:
   - Check all required vars are set
   - Restart services after changes

### Logs and Monitoring

- **Backend Logs**: Available in Render service dashboard
- **Build Logs**: Check deployment history
- **Health Checks**: Monitor `/health` endpoint

## Production Considerations

### Security
- Use strong JWT secrets
- Enable rate limiting
- Consider adding API authentication middleware
- Regular security updates

### Performance
- Upgrade to paid plans for better performance
- Consider CDN for static assets
- Database indexing and optimization
- Monitoring and alerting

### Backup
- Regular database backups
- Environment variable backup
- Code repository backup

## Support

- **Render Documentation**: [docs.render.com](https://docs.render.com)
- **Community**: Render Community Forum
- **Support**: Render support team (for paid plans)

---

**Deployment Date**: August 4, 2025
**Last Updated**: After multi-tenant removal
**Status**: Ready for production deployment
