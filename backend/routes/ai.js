/**
 * ============================================================================
 * Lexora — AI Routes Layer
 * ============================================================================
 * 
 * Express router handling:
 * • POST /api/ai/chat    -> Routes user query through AI Router to Gemini
 * • GET  /api/ai/health  -> Health check & API key configuration status
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const aiRouter = require('../services/ai-router');
const geminiService = require('../services/gemini');

/**
 * Health check endpoint
 * Verifies backend availability and Gemini configuration status
 * (NEVER reveals the API key)
 */
router.get('/health', (e, res) => {
  const configured = geminiService.isConfigured();
  res.json({
    status: 'online',
    service: 'Lexora AI Backend Engine',
    geminiConfigured: configured,
    geminiModel: geminiService.DEFAULT_MODEL,
    ragStatus: 'PENDING_INTEGRATION',
    timestamp: new Date().toISOString()
  });
});

/**
 * Main Chat Endpoint
 * POST /api/ai/chat
 * 
 * Body parameters:
 * • message  (string, required): The user's query or prompt
 * • modelId  (string, optional): "lexora-standard" | "lexora-advanced"
 * • userPlan (string, optional): "Free" | "Professional" | "Enterprise"
 * • history  (array,  optional): Past conversation turns
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, modelId, userPlan, history } = req.body || {};

    // 1. Input Validation
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'A valid non-empty "message" string is required in the request body.'
        }
      });
    }

    // 2. Query execution through AI Router
    const result = await aiRouter.routeQuery({
      message: message.trim(),
      modelId: modelId || 'lexora-standard',
      userPlan: userPlan || 'Professional',
      history: Array.isArray(history) ? history : []
    });

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (err) {
    console.error('[AI Chat Route Error]', err);

    // Determine appropriate HTTP status code
    let statusCode = err.status || 500;
    if (err.code === 'CONFIG_MISSING') statusCode = 503;
    if (err.code === 'AUTH_ERROR') statusCode = 401;
    if (err.code === 'RATE_LIMIT') statusCode = 429;
    if (err.code === 'TIMEOUT') statusCode = 504;
    if (err.code === 'INVALID_PROMPT') statusCode = 400;

    return res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || 'SERVER_ERROR',
        message: err.message || 'An unexpected error occurred while processing your legal AI inquiry.'
      }
    });
  }
});

module.exports = router;
