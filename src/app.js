require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./modules/auth/auth.routes');
const categoryRoutes = require('./modules/categories/categories.routes');
const jobRoutes = require('./modules/jobs/jobs.routes');
const applicationRoutes = require('./modules/applications/applications.routes');
const contactRoutes = require('./modules/contacts/contacts.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');

const app = express();

// Security
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));

// Rate limiting
app.use('/api/v1/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/api/v1/applications', rateLimit({ windowMs: 60 * 1000, max: 30 }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Static file serving for uploaded photos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/contacts', contactRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use(errorHandler);

module.exports = app;
