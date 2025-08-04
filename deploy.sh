#!/bin/bash

# Habicore POS Deployment Script
echo "🚀 Starting Habicore POS deployment preparation..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Build projects to verify everything works
echo "🔨 Building projects..."
npm run build

# Check if everything built successfully
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Push your code to GitHub:"
    echo "   git add ."
    echo "   git commit -m 'Ready for deployment'"
    echo "   git remote add origin https://github.com/yourusername/habicore-pos.git"
    echo "   git push -u origin main"
    echo ""
    echo "2. Go to Render.com and deploy:"
    echo "   - Create PostgreSQL database"
    echo "   - Deploy backend web service"
    echo "   - Deploy frontend static site"
    echo ""
    echo "3. Or use the render.yaml for one-click deployment"
    echo ""
    echo "📚 See RENDER_DEPLOYMENT_GUIDE.md for detailed instructions"
else
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi
