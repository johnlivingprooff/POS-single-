import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import categoriesRouter from './routes/categories';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import prisma from './lib/prisma';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import inventoryRoutes from './routes/inventory';
import salesRoutes from './routes/sales';
import customerRoutes from './routes/customers';
import reportRoutes from './routes/reports';
import manufacturingRoutes from './routes/manufacturing';
import salesSettingsRoutes from './routes/salesSettings';
import suppliersRoutes from './routes/suppliers';
import settingsRoutes from './routes/settings';
import purchaseOrdersRouter from './routes/purchaseOrders';
import offsiteRoutes from './routes/offsite';
import stocktakingRoutes from './routes/stocktaking';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { authenticate } from './middleware/auth';
import notificationsRouter from './routes/notifications';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Test database connection
prisma.$connect()
  .then(() => console.log('✅ Database connected successfully'))
  .catch((error: any) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });

// Ensure Prisma disconnects on server shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('🔌 Database connection closed');
  process.exit(0);
});

// Security middleware
app.use(helmet());

// Rate limiting - More permissive for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // limit each IP to 1000 requests per minute
  message: 'Too many requests from this IP, please try again later.',
  // Skip rate limiting in development
  skip: (req) => process.env.NODE_ENV === 'development'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api/categories', categoriesRouter);
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/products', authenticate, productRoutes);
app.use('/api/inventory', authenticate, inventoryRoutes);
app.use('/api/sales', authenticate, salesRoutes);
app.use('/api/customers', authenticate, customerRoutes);
app.use('/api/reports', authenticate, reportRoutes);
app.use('/api/manufacturing', authenticate, manufacturingRoutes);
app.use('/api/settings/sales', authenticate, salesSettingsRoutes);
app.use('/api/suppliers', authenticate, suppliersRoutes);
app.use('/api/settings', authenticate, settingsRoutes);
app.use('/api/notifications', authenticate, notificationsRouter);
app.use('/api/purchase-orders', authenticate, purchaseOrdersRouter);
app.use('/api/offsite', authenticate, offsiteRoutes);
app.use('/api/stocktaking', authenticate, stocktakingRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Habicore POS Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
