// Import required dependencies
const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const axios = require('axios');

// Initialize Express app
const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ]
});

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 10000, // Allow 10,000 requests for testing
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Mock service registry
const services = {
  'user-service': 'http://localhost:3001',
  'order-service': 'http://localhost:3002'
};

// Request validation middleware
const validateRequest = [
  body('userId').isInt().withMessage('userId must be an integer'),
  body('action').isIn(['create', 'read', 'update', 'delete']).withMessage('Invalid action')
];

// API Gateway routing with regex
app.all(/^\/api\/([^\/]+)(\/.*)?$/, validateRequest, async (req, res, next) => {
  const service = req.params[0]; // Service name (e.g., 'user-service')
  const targetPath = req.params[1] || '/'; // Remaining path (e.g., '/users/123') or '/'

  const target = services[service];
  if (!target) {
    logger.warn({ message: 'Service not found', service, path: req.path });
    return res.status(404).json({ error: 'Service not found' });
  }

  try {
    logger.info({
      message: 'Forwarding request',
      service,
      path: req.path,
      method: req.method,
      targetPath,
      headers: req.headers
    });

    // Construct the target URL
    const fullTarget = `${target}${targetPath}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;
    
    // Forward request using axios
    const response = await axios({
      method: req.method,
      url: fullTarget,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Content-Length': req.headers['content-length'],
        'User-Agent': req.headers['user-agent']
      },
      data: req.body,
      timeout: 5000 // 5-second timeout
    });

    // Send backend response to client
    res.status(response.status).json(response.data);
  } catch (error) {
    logger.error({
      message: 'Request forwarding error',
      error: error.message,
      service,
      path: req.path
    });
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Failed to connect to backend service' });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API Gateway is running' });
});

// Custom error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
    });
  }
});

// Start the server
app.listen(port, () => {
  logger.info(`API Gateway listening on port ${port}`);
});