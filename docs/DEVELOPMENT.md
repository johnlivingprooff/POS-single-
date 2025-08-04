# Habicore POS System - Development Guide

## Overview

This document provides comprehensive instructions for setting up and developing the Habicore POS System.

## Project Structure

```
habicore-pos/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Shared UI components
│   │   ├── modules/         # Feature modules
│   │   │   ├── auth/        # Authentication module
│   │   │   ├── pos/         # Point of Sale module
│   │   │   ├── inventory/   # Inventory management
│   │   │   ├── sales/       # Sales records
│   │   │   ├── reports/     # Financial reports
│   │   │   ├── crm/         # Customer management
│   │   │   ├── users/       # User management
│   │   │   └── manufacturing/ # Production management
│   │   ├── stores/          # State management
│   │   ├── services/        # API services
│   │   └── types/           # TypeScript types
│   ├── public/
│   └── package.json
├── backend/                  # Node.js Express API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript types
│   └── package.json
├── database/                 # Database scripts and migrations
│   ├── schema.prisma        # Prisma schema
│   ├── migrations/          # Database migrations
│   └── seeds/               # Sample data
├── docker/                   # Docker configuration
│   ├── docker-compose.yml   # Multi-service setup
│   ├── frontend.Dockerfile  # Frontend container
│   └── backend.Dockerfile   # Backend container
└── docs/                     # Documentation
```

## Prerequisites

- **Node.js 18+** - JavaScript runtime
- **PostgreSQL 14+** - Database server
- **npm or yarn** - Package manager
- **Git** - Version control

## Quick Start

### 1. Install Dependencies

```bash
# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
npm install
```

### 2. Environment Setup

```bash
# Backend environment
cd backend
cp .env.example .env
# Edit .env with your database credentials and other settings

# Frontend environment (if needed)
cd ../frontend
cp .env.example .env
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb habicore_pos

# Run migrations (once Prisma is set up)
cd backend
npx prisma migrate dev
npx prisma generate
```

### 4. Start Development Servers

```bash
# Terminal 1 - Backend API
cd backend
npm run dev

# Terminal 2 - Frontend App
cd frontend
npm start
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

## Default Login Credentials

For development/testing:
- **Email**: manager@habicore.com
- **Password**: password123

## Module Development Guidelines

### 1. Modular Architecture

Each feature is developed as an independent module:

```typescript
// Module structure example: src/modules/pos/
├── components/          # Module-specific components
├── pages/              # Module pages
├── services/           # Module API services
├── types/              # Module TypeScript types
└── hooks/              # Module custom hooks
```

### 2. State Management

- **Global State**: Zustand stores for shared state
- **API State**: React Query for server state
- **Local State**: React useState for component state

### 3. API Integration

```typescript
// Service example
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const posService = {
  getProducts: () => apiClient.get('/products'),
  createSale: (sale) => apiClient.post('/sales', sale),
};
```

### 4. Component Guidelines

- Use TypeScript for all components
- Follow React functional component patterns
- Implement proper error boundaries
- Use shadcn/ui components for consistency

## Key Features Implemented

### 🔐 Role-Based Access Control
- **Employee**: Can only see their own sales records and off-site requisitions
- **Manager**: Can see all data and approve off-site requisitions
- **Admin**: Full system access including user management

### 📦 Off-Site Inventory Management
- Create requisitions for off-site inventory transfer
- Approval workflow for managers/admins
- Return tracking for inventory reconciliation
- Role-based filtering of requisition data

### 👥 Enhanced User Management
- Complete user onboarding system
- Role-based permission assignment
- CRUD operations for user accounts
- Default permissions based on user role

### 🔔 Custom Toast Notification System
- Unified notification system across all modules
- Success, error, warning, and info message types
- Consistent styling and behavior

### 📊 Employee Data Isolation
- Sales reports filtered by employee for non-admin users
- Off-site requisitions show only user's own requests for employees
- Financial reports respect role-based data access

## Backend Development

### API Routes Structure

```typescript
// Route example: routes/products.ts
import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getProducts);
router.post('/', authenticate, createProduct);
router.put('/:id', authenticate, updateProduct);
router.delete('/:id', authenticate, deleteProduct);

export default router;
```

### Database Operations

```typescript
// Using Prisma Client
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const productService = {
  async getAllProducts() {
    return prisma.product.findMany({
      include: { category: true, supplier: true }
    });
  },
  
  async createProduct(data) {
    return prisma.product.create({ data });
  }
};
```

## Testing Strategy

### Frontend Testing
```bash
cd frontend
npm test
```

### Backend Testing
```bash
cd backend
npm test
```

### Integration Testing
```bash
# Run both frontend and backend tests
npm run test:all
```

## Deployment

### Development Deployment
```bash
# Using Docker Compose
docker-compose -f docker/docker-compose.yml up -d
```

### Production Deployment
```bash
# Build and deploy
npm run build:all
npm run deploy:production
```

## Core Features Implementation Status

### ✅ Completed Features
- Project structure and configuration
- Authentication system foundation
- Basic UI layout with sidebar navigation
- POS terminal interface
- Inventory management interface
- User authentication and routing

### 🚧 In Progress
- Database integration with Prisma
- Complete API implementation
- Payment processing integration
- Real-time inventory updates

### 📋 Planned Features
- Advanced reporting and analytics
- Manufacturing module implementation
- Customer loyalty programs
- Multi-location support
- Third-party integrations
- Mobile-responsive improvements

## Development Best Practices

### Code Quality
- Use TypeScript strictly
- Follow ESLint and Prettier configurations
- Write comprehensive tests
- Document complex business logic

### Security
- Implement proper authentication
- Validate all inputs
- Use environment variables for secrets
- Regular security audits

### Performance
- Optimize database queries
- Implement caching strategies
- Use lazy loading for modules
- Monitor application performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## Support and Documentation

- **API Documentation**: Available at `/api/docs` when running
- **Component Storybook**: Run `npm run storybook`
- **Database Schema**: See `database/schema.prisma`

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check PostgreSQL service
   sudo service postgresql status
   
   # Verify connection string in .env
   DATABASE_URL="postgresql://user:password@localhost:5432/habicore_pos"
   ```

2. **Port Conflicts**
   ```bash
   # Check running processes
   lsof -i :3000
   lsof -i :3001
   ```

3. **Module Not Found Errors**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

## Performance Optimization

### Frontend Optimization
- Code splitting by modules
- Lazy loading of routes
- Image optimization
- Bundle size monitoring

### Backend Optimization
- Database query optimization
- Caching implementation
- Connection pooling
- Response compression

## Security Considerations

- JWT token management
- Input validation and sanitization
- Rate limiting implementation
- CORS configuration
- Environment variable security

For detailed module-specific documentation, see the individual README files in each module directory.
