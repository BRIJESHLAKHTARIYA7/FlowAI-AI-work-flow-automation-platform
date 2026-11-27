import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase } from './db.js';
import engine from './engine.js';

import workflowsRouter from './routes/workflows.js';
import runsRouter from './routes/runs.js';
import aiRouter from './routes/ai.js';
import healthRouter from './routes/health.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Database & Tables
initDatabase();

// Start Persistent Workflow Engine & Crash Recovery
engine.start();

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// API Routes
app.use('/api', healthRouter);
app.use('/api/workflows', workflowsRouter);
app.use('/api/runs', runsRouter);
app.use('/api/ai', aiRouter);

// Serve frontend static build if present
const frontendDist = path.resolve(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

// SPA fallback for client-side routing (Express 5 compatible)
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'Endpoint not found' });
  }
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('FlowAI Backend API is running on port ' + PORT);
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ServerError]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 FlowAI Backend Server running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`⚡ Workflows API: http://localhost:${PORT}/api/workflows`);
  console.log(`===============================================`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[FlowAI] Gracefully shutting down engine...');
  engine.stop();
  server.close(() => {
    console.log('[FlowAI] Server stopped.');
    process.exit(0);
  });
});

export default app;
