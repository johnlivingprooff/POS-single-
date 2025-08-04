# Deployment Checklist

## Pre-Deployment Checklist

### 🔧 Code Preparation
- [ ] Multi-tenant code removed ✅
- [ ] Environment variables configured ✅
- [ ] API URLs use environment variables ✅
- [ ] Build scripts working ✅
- [ ] All dependencies listed in package.json ✅

### 📁 Files Created
- [ ] `render.yaml` - One-click deployment config ✅
- [ ] `RENDER_DEPLOYMENT_GUIDE.md` - Detailed instructions ✅
- [ ] `frontend/.env.example` - Frontend env template ✅
- [ ] `frontend/.env.production` - Production config ✅
- [ ] `deploy.ps1` & `deploy.sh` - Deployment scripts ✅
- [ ] Updated `.gitignore` ✅
- [ ] Updated `README.md` ✅

### 🧪 Local Testing
- [ ] Run `npm run install:all` to install dependencies
- [ ] Run `npm run build` to verify builds work
- [ ] Test backend API endpoints
- [ ] Test frontend connects to backend
- [ ] Verify database connections work

## Deployment Steps

### 1. GitHub Setup
- [ ] Create GitHub repository
- [ ] Push code to repository
```bash
git init
git add .
git commit -m "Initial deployment setup"
git remote add origin https://github.com/yourusername/habicore-pos.git
git push -u origin main
```

### 2. Render.com Deployment

#### Option A: Manual Deployment
- [ ] Create PostgreSQL database
- [ ] Deploy backend web service
- [ ] Deploy frontend static site
- [ ] Configure environment variables
- [ ] Update CORS settings

#### Option B: One-Click with render.yaml
- [ ] Go to Render Dashboard
- [ ] Click "New +" → "YAML"
- [ ] Connect repository
- [ ] Deploy all services

### 3. Post-Deployment
- [ ] Verify database migrations ran
- [ ] Create admin user
- [ ] Test login functionality
- [ ] Test API endpoints
- [ ] Verify frontend loads correctly
- [ ] Check CORS configuration

## Environment Variables Needed

### Backend
```
NODE_ENV=production
DATABASE_URL=[From Render PostgreSQL]
JWT_SECRET=[Generate secure random string]
JWT_EXPIRES_IN=24h
CORS_ORIGIN=[Your frontend URL]
PORT=3001
```

### Frontend
```
VITE_API_URL=[Your backend URL]
NODE_ENV=production
```

## Cost Estimate (Render Free Tier)

- **PostgreSQL**: Free (1GB, shared CPU)
- **Backend**: Free (750 hours/month, sleeps after 15min)  
- **Frontend**: Free (100GB bandwidth)
- **Total**: $0/month (with free tier limitations)

## Production Considerations

### Performance
- [ ] Consider upgrading to paid plans for production
- [ ] Enable database backups
- [ ] Set up monitoring and alerting

### Security
- [ ] Use strong JWT secrets
- [ ] Enable rate limiting
- [ ] Regular security updates
- [ ] HTTPS enabled (automatic on Render)

### Monitoring
- [ ] Check application logs
- [ ] Monitor health endpoints
- [ ] Set up error tracking
- [ ] Database performance monitoring

## Troubleshooting

### Common Issues
- **Build Failures**: Check build logs, verify package.json
- **Database Issues**: Verify DATABASE_URL, check migrations
- **CORS Errors**: Update CORS_ORIGIN in backend
- **Environment Variables**: Restart services after changes

### Getting Help
- Render Documentation: https://docs.render.com
- Check deployment logs in Render dashboard
- Verify environment variables are set correctly
- Test endpoints individually

---

**Ready to Deploy?** ✅
Run `.\deploy.ps1` (Windows) or `./deploy.sh` (Linux/Mac) to start!
