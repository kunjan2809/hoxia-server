// ============================================================================
// IMPORTS
// ============================================================================

// Packages
import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import express from 'express';

// Routes
import authRoutes from './modules/auth/auth.routes.js';
import companyRoutes from './modules/companies/company.routes.js';
import projectRoutes from './modules/projects/project.routes.js';
import researchRoutes from './modules/research/research.routes.js';
import strategyRoutes from './modules/strategies/strategy.routes.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';

// Constants
import { ROUTES } from './utils/constants/routes.js';

// Utils
import { logger } from './utils/helpers/logger.js';
import { sendNotFound, sendSuccess } from './utils/helpers/response.js';

// ============================================================================
// ENV
// ============================================================================

dotenv.config();

// ============================================================================
// APP
// ============================================================================

const app = express();
const PORT = process.env['PORT'] || 3000;

app.set('trust proxy', 1);

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

const corsOrigins = (process.env['CORS_ORIGIN'] || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const allowedOrigins = corsOrigins.length ? corsOrigins : defaultOrigins;

const corsOptions: CorsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
  optionsSuccessStatus: 204,
};

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(req.method, req.originalUrl, res.statusCode, duration);
  });
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

app.use(ROUTES.AUTH.BASE, authRoutes);
app.use(ROUTES.PROJECTS.BASE, projectRoutes);
app.use(ROUTES.PROJECTS.SCOPED_MOUNT, companyRoutes);
app.use(ROUTES.PROJECTS.SCOPED_MOUNT, researchRoutes);
app.use(ROUTES.PROJECTS.SCOPED_MOUNT, strategyRoutes);

// ============================================================================
// HEALTH
// ============================================================================

app.get(ROUTES.BASE, (_req, res) => {
  sendSuccess(res, 'API is running', {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development',
  });
});

app.get(ROUTES.HEALTH, (_req, res) => {
  sendSuccess(res, 'Server is healthy', {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development',
  });
});

// ============================================================================
// 404
// ============================================================================

app.use((_req, res) => {
  sendNotFound(res, 'Route not found. Please check the API URL and Method.');
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use(errorHandler);

// ============================================================================
// SERVER
// ============================================================================

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}${ROUTES.HEALTH}`);
});

export default app;

