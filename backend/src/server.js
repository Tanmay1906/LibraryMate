require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { PrismaClient } = require('@prisma/client');
const routes = require('./routes');
const swaggerDocument = require('./docs/swagger.json');
const { globalErrorHandler, AppError } = require('./middlewares/errorHandler');

const app = express();
const prisma = new PrismaClient();

// Trust proxy if behind a proxy (for production)
app.set('trust proxy', 1);

// Security middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Body parser middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Library Management Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api', routes);

// Reminder routes
const reminderRoutes = require('../routes/reminderRoutes');
app.use('/api/reminders', reminderRoutes);

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Library Management Backend Running',
    documentation: '/api-docs',
    version: '1.0.0'
  });
});

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

// Start cron jobs
require('../utils/cronJobs');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Promise Rejection:', err.message);
  console.log('Shutting down the server due to unhandled promise rejection');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err.message);
  console.log('Shutting down the server due to uncaught exception');
  process.exit(1);
});

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
});
