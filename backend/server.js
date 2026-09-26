/**
 * ============================================================================
 * Lexora — Node.js & Express AI Backend Server
 * ============================================================================
 * 
 * Central API server powering Lexora LegalTech intelligence.
 * • Integrates Google Gemini API via official @google/genai SDK
 * • Protects API keys strictly server-side
 * • Supports cross-origin requests (CORS) for local frontend dev & static serving
 * ============================================================================
 */

// Load environment variables from .env in project root
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const aiRoutes = require('./routes/ai');
const geminiService = require('./services/gemini');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Enable Cross-Origin Resource Sharing (CORS)
// Allows frontend requests from VS Code Live Server (port 5500), Vite (port 5173), etc.
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 2. Request body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Simple development request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[Lexora API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// 4. Mount API Routes
app.use('/api/ai', aiRoutes);

// 5. Serve frontend static assets from project root
// Allows the entire platform to be optionally accessed at http://localhost:5000
const projectRoot = path.join(__dirname, '..');
app.use(express.static(projectRoot));

// Root route fallback: deliver index.html if navigating via browser
app.get('/', (req, res) => {
  res.sendFile(path.join(projectRoot, 'index.html'));
});

// 6. Central 404 Handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `API route '${req.originalUrl}' not found on Lexora server.`
    }
  });
});

// 7. Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Lexora Server Uncaught Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An internal server error occurred.'
    }
  });
});

// 8. Start HTTP Server
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`⚖️  Lexora Legal Intelligence AI Backend Server`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`🔌 API Chat Endpoint: POST http://localhost:${PORT}/api/ai/chat`);
  console.log(`🩺 Health Endpoint:   GET  http://localhost:${PORT}/api/ai/health`);
  console.log(`🔑 Gemini Configured: ${geminiService.isConfigured() ? 'YES (Key Loaded)' : 'NO (Check .env)'}`);
  console.log(`🧠 AI Model Engine:   ${geminiService.DEFAULT_MODEL}`);
  console.log('====================================================');
});

module.exports = app;
