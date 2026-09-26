/**
 * ============================================================================
 * Lexora — Gemini AI Service Layer
 * ============================================================================
 * 
 * Secure server-side wrapper for the official Google Gen AI SDK (@google/genai).
 * 
 * SECURITY:
 * • The GEMINI_API_KEY is loaded exclusively from backend process.env.
 * • NEVER exposed to frontend scripts, LocalStorage, or network payloads.
 * • Centralized configuration for the stable Gemini Flash model.
 * ============================================================================
 */

const { GoogleGenAI } = require('@google/genai');

// Central stable model configuration
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

/**
 * Check whether a valid Gemini API key is configured
 * @returns {boolean}
 */
function isConfigured() {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim() && key !== 'YOUR_GEMINI_API_KEY_HERE');
}

/**
 * Get or initialize the GoogleGenAI instance
 * @returns {GoogleGenAI}
 */
function getClient() {
  if (!isConfigured()) {
    const error = new Error('GEMINI_API_KEY is not configured in backend/.env. Please add a valid key from Google AI Studio.');
    error.code = 'CONFIG_MISSING';
    error.status = 503;
    throw error;
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY.trim()
  });
}

/**
 * Generate a text response using the central Gemini Flash model
 * 
 * @param {Object} params
 * @param {string} params.prompt - Current user question or query
 * @param {string} [params.systemInstruction] - System prompt defining role & tone
 * @param {number} [params.temperature=0.4] - Generation temperature
 * @param {number} [params.maxTokens=2048] - Max response tokens
 * @param {Array}  [params.history=[]] - Optional conversation history [{ role: 'user'|'model', content: '...' }]
 * @param {string} [params.model] - Optional model override
 * @returns {Promise<{ text: string, model: string, usage?: Object }>}
 */
async function generateResponse({
  prompt,
  systemInstruction = '',
  temperature = 0.4,
  maxTokens = 2048,
  history = [],
  model = DEFAULT_MODEL
}) {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    const error = new Error('Empty prompt provided to Gemini service.');
    error.code = 'INVALID_PROMPT';
    error.status = 400;
    throw error;
  }

  const ai = getClient();

  // Prepare contents array supporting conversation history
  let contents = [];

  if (Array.isArray(history) && history.length > 0) {
    history.forEach(item => {
      if (item && item.content) {
        contents.push({
          role: item.role === 'model' || item.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: item.content }]
        });
      }
    });
  }

  // Append current user message
  contents.push({
    role: 'user',
    parts: [{ text: prompt.trim() }]
  });

  // Build configuration options
  const config = {
    temperature: typeof temperature === 'number' ? temperature : 0.4,
    maxOutputTokens: typeof maxTokens === 'number' ? maxTokens : 2048
  };

  if (systemInstruction && typeof systemInstruction === 'string' && systemInstruction.trim()) {
    config.systemInstruction = systemInstruction.trim();
  }

  // Automatic retry loop for transient Google API demand spikes (e.g. 503 / 429)
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: config
      });

      const outputText = response.text || '';

      if (!outputText.trim()) {
        const error = new Error('The Gemini model returned an empty response. The query may have triggered safety filters.');
        error.code = 'EMPTY_RESPONSE';
        error.status = 502;
        throw error;
      }

      return {
        text: outputText,
        model: model,
        usage: response.usageMetadata || null
      };

    } catch (err) {
      lastError = err;

      // Extract error message
      let errStr = String(err.message || '');
      try {
        const parsed = JSON.parse(errStr);
        if (parsed && parsed.error && parsed.error.message) {
          errStr = parsed.error.message;
        }
      } catch (_) {}

      const isTransient = errStr.includes('503') || errStr.includes('high demand') || errStr.includes('UNAVAILABLE') || errStr.includes('RESOURCE_EXHAUSTED');

      if (isTransient && attempt < maxRetries) {
        const delayMs = attempt * 1500;
        console.warn(`[Lexora Gemini] Transient API load spike (attempt ${attempt}/${maxRetries}). Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }

      break;
    }
  }

  // Handle final error
  const err = lastError;
  if (err.code === 'CONFIG_MISSING' || err.code === 'INVALID_PROMPT' || err.code === 'EMPTY_RESPONSE') {
    throw err;
  }

    console.error('[Lexora Gemini Service Error]', err.message || err);

    // Parse JSON error message if Google returned a serialized error object
    let cleanMessage = String(err.message || '');
    try {
      const parsed = JSON.parse(cleanMessage);
      if (parsed && parsed.error && parsed.error.message) {
        cleanMessage = parsed.error.message;
      }
    } catch (_) {}

    if (cleanMessage.includes('API_KEY_INVALID') || cleanMessage.includes('403') || cleanMessage.includes('401')) {
      const keyErr = new Error('Invalid Gemini API Key. Please verify the GEMINI_API_KEY in your .env file.');
      keyErr.code = 'AUTH_ERROR';
      keyErr.status = 401;
      throw keyErr;
    }

    if (cleanMessage.includes('RESOURCE_EXHAUSTED') || cleanMessage.includes('429')) {
      const quotaErr = new Error('Gemini API rate limit or quota exceeded. Please wait a few seconds before retrying.');
      quotaErr.code = 'RATE_LIMIT';
      quotaErr.status = 429;
      throw quotaErr;
    }

    if (cleanMessage.includes('DEADLINE_EXCEEDED') || cleanMessage.includes('timeout')) {
      const timeoutErr = new Error('Request to Gemini API timed out. Please try again.');
      timeoutErr.code = 'TIMEOUT';
      timeoutErr.status = 504;
      throw timeoutErr;
    }

    if (cleanMessage.includes('503') || cleanMessage.includes('high demand') || cleanMessage.includes('UNAVAILABLE')) {
      const demandErr = new Error('Google Gemini API is currently experiencing a temporary high-demand spike. Please click Retry in a few seconds.');
      demandErr.code = 'HIGH_DEMAND';
      demandErr.status = 503;
      throw demandErr;
    }

    const genericErr = new Error(cleanMessage || 'Gemini AI generation service encountered an unexpected error.');
    genericErr.code = 'UPSTREAM_ERROR';
    genericErr.status = 502;
    throw genericErr;
}

module.exports = {
  isConfigured,
  generateResponse,
  DEFAULT_MODEL
};
