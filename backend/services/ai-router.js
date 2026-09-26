/**
 * ============================================================================
 * Lexora — AI Router & Future RAG Architecture Layer
 * ============================================================================
 * 
 * ARCHITECTURAL ROLE:
 * An abstraction layer mediating between the frontend assistant interface,
 * the future Indian Law RAG (Retrieval-Augmented Generation) pipeline,
 * and the Google Gemini AI generation engine.
 * 
 * WORKFLOW:
 * 1. Receive User Query (+ Lexora model selection & plan metadata)
 * 2. Classify Query: General Inquiry vs. Legal/Business-Law Query
 * 3. Future RAG Stage:
 *    - If Legal: Queries the RAG Retriever for verified Indian statutes & precedents.
 *    - Currently: RAG is a clean placeholder (not connected).
 *    - CRITICAL RULE: When RAG is not connected, DO NOT fabricate citations
 *      or claim database grounding. Clearly indicate AI exploratory status.
 * 4. Configure Gemini Generation:
 *    - Apply tailored system instructions for "Lexora Standard" vs "Lexora Advanced"
 * 5. Return structured, transparent response to route controller.
 * ============================================================================
 */

const geminiService = require('./gemini');

// Legal keyword patterns for classification (Indian commercial & statutory context)
const LEGAL_INDICATORS = [
  /\b(contract|agreement|clause|liability|indemnity|breach|termination|severance)\b/i,
  /\b(section|sec\.|article|act|statute|statutory|bare act|gazette|rule|regulation)\b/i,
  /\b(companies act|contract act|arbitration|dpdp|sebi|mca|rbi|nclt|gst|pf|esic)\b/i,
  /\b(director|board resolution|special resolution|mgt-14|shareholder|vesting|esop)\b/i,
  /\b(patent|trademark|copyright|ip assignment|non-compete|nda|mou|msa|dpa)\b/i,
  /\b(high court|supreme court|judgment|precedent|litigation|advocate|counsel)\b/i,
  /\b(employment|workman|retrenchment|gratuity|posh|labour|labor)\b/i
];

/**
 * 1. Query Classifier: Determines whether a query is legal/business-law or general
 * 
 * @param {string} query 
 * @returns {{ isLegal: boolean, category: string, confidence: number }}
 */
function classifyQuery(query) {
  if (!query || typeof query !== 'string') {
    return { isLegal: false, category: 'General', confidence: 0 };
  }

  const text = query.trim();
  let matchCount = 0;
  let detectedCategory = 'General Commercial';

  for (const regex of LEGAL_INDICATORS) {
    if (regex.test(text)) {
      matchCount++;
    }
  }

  const isLegal = matchCount > 0;

  // Category heuristics
  if (/\b(contract|clause|liability|indemnity|nda|msa|mou)\b/i.test(text)) {
    detectedCategory = 'Commercial Contracts';
  } else if (/\b(company|director|share|borrow|mca|resolution|board)\b/i.test(text)) {
    detectedCategory = 'Corporate Governance';
  } else if (/\b(employ|severance|terminate|non-compete|workman|gratuity)\b/i.test(text)) {
    detectedCategory = 'Employment Law';
  } else if (/\b(dpdp|privacy|consent|data fiduciary|gdpr)\b/i.test(text)) {
    detectedCategory = 'Data Privacy & DPDP Act';
  } else if (/\b(patent|copyright|trademark|ip|software)\b/i.test(text)) {
    detectedCategory = 'Intellectual Property';
  }

  return {
    isLegal,
    category: detectedCategory,
    confidence: isLegal ? Math.min(1.0, 0.5 + matchCount * 0.15) : 0.2
  };
}

/**
 * 2. Future RAG Pipeline Placeholder
 * 
 * ARCHITECTURAL DESIGN FOR FUTURE INTEGRATION:
 * When connected, this service will:
 * 1. Embed user query using text-embedding models.
 * 2. Vector search against Indian Central Bare Acts, Supreme Court & High Court precedents.
 * 3. Rerank and return verified legal passages with precise paragraph citations.
 * 
 * CURRENT STATUS:
 * RAG is NOT yet connected. Adheres strictly to the safety mandate:
 * - Does NOT fabricate citations.
 * - Does NOT claim database-verified grounding.
 * 
 * @param {string} query 
 * @returns {Promise<Object>}
 */
async function retrieveLegalContext(query) {
  // Clean RAG placeholder ready for future vector database integration
  return {
    isRAGConnected: false,
    status: 'PENDING_INTEGRATION',
    retrievedPassages: [],
    corpusNotice: 'External Indian Law statutory vector corpus is not yet connected. Output is an exploratory AI synthesis by Google Gemini.'
  };
}

/**
 * 3. System Instructions Builder
 * 
 * Differentiates between "Lexora Standard" and "Lexora Advanced" modes
 * without exposing raw provider details.
 * 
 * @param {Object} options
 * @param {string} options.modelId - "lexora-standard" | "lexora-advanced"
 * @param {string} options.queryType - "legal" | "general"
 * @param {string} options.category - Legal category
 * @param {boolean} options.hasRAGContext - Whether verified RAG passages exist
 * @returns {string}
 */
function buildSystemInstruction({ modelId = 'lexora-standard', queryType = 'legal', category, hasRAGContext }) {
  const isAdvanced = modelId === 'lexora-advanced';

  if (queryType === 'general') {
    return `You are Lexora Assistant, an executive AI intelligence partner for modern businesses, founders, and legal operations in India.
Provide clear, structured, and professional assistance.
Do not invent legal mandates when answering general non-legal questions.
Maintain a crisp, modern, executive tone. Format using clean paragraphs, bold titles, and bullet points where helpful.`;
  }

  // Legal Query System Instructions
  const groundingDisclaimer = hasRAGContext
    ? `Verified statutory passages are provided below in the context.`
    : `IMPORTANT TRANSPARENCY NOTICE:
The external Indian Law RAG corpus is currently in sandbox mode (not connected).
You MUST NOT claim to have searched a live proprietary case-law database.
Provide exploratory legal analysis based on codified Indian statutory principles (e.g. Indian Contract Act 1872, Companies Act 2013, DPDP Act 2023, etc.).
Clearly distinguish that this is an AI-generated preliminary synthesis and recommend verification with qualified legal counsel.`;

  if (isAdvanced) {
    return `You are Lexora Advanced, an enterprise-grade AI Legal Intelligence Engine specialized in Indian commercial jurisprudence, statutory compliance, and corporate risk mitigation.
${groundingDisclaimer}

YOUR OPERATIONAL DIRECTIVES:
1. Provide deep, reasoned legal analysis tailored to commercial contracts, corporate governance, and regulatory requirements in India.
2. Structure your response into clean executive sections:
   - **Statutory Context & Core Principles** (Explain relevant codified Indian laws)
   - **Commercial Risk Analysis & Exposure** (Highlight liabilities, bilateral asymmetries, or compliance gaps)
   - **Recommended Next Steps & Redline Guidance** (Actionable commercial steps)
3. Maintain high analytical precision. Do not make false claims of precedent citations if not verified.
4. Conclude with a concise standard advisory notice that this output represents exploratory legal research and does not establish an attorney-client relationship.`;
  }

  // Lexora Standard default
  return `You are Lexora Standard, a fast and responsive AI Legal Intelligence assistant for founders, corporate operators, and legal teams in India.
${groundingDisclaimer}

YOUR OPERATIONAL DIRECTIVES:
1. Provide concise, clear, and legally sound overviews of commercial and statutory questions under Indian Law.
2. Keep explanations accessible to business stakeholders while maintaining statutory accuracy.
3. Structure your response clearly using bullet points and short thematic sections.
4. Conclude with a brief reminder that this is an AI preliminary brief for exploration.`;
}

/**
 * 4. Main Router Function
 * 
 * Orchestrates classification, RAG retrieval hook, model parameterization,
 * and Gemini generation.
 * 
 * @param {Object} params
 * @param {string} params.message - User prompt
 * @param {string} [params.modelId='lexora-standard'] - Lexora AI mode
 * @param {string} [params.userPlan='Professional'] - User membership plan
 * @param {Array}  [params.history=[]] - Optional previous chat history
 * @returns {Promise<Object>}
 */
async function routeQuery({ message, modelId = 'lexora-standard', userPlan = 'Professional', history = [] }) {
  if (!message || typeof message !== 'string' || !message.trim()) {
    const error = new Error('Message content is required.');
    error.status = 400;
    throw error;
  }

  const trimmedQuery = message.trim();

  // Step 1: Classify Query
  const classification = classifyQuery(trimmedQuery);
  const queryType = classification.isLegal ? 'legal' : 'general';

  // Step 2: Future RAG Retrieval Hook
  let ragResult = { isRAGConnected: false, retrievedPassages: [] };
  if (queryType === 'legal') {
    ragResult = await retrieveLegalContext(trimmedQuery);
  }

  // Step 3: Configure Generation Parameters
  // Advanced plan/model gets slightly higher token budget & lower temperature for precision
  const isAdvanced = modelId === 'lexora-advanced';
  const temperature = isAdvanced ? 0.25 : 0.35;
  const maxTokens = isAdvanced ? 2500 : 1500;

  const systemInstruction = buildSystemInstruction({
    modelId,
    queryType,
    category: classification.category,
    hasRAGContext: ragResult.isRAGConnected
  });

  // Step 4: Dispatch to Google Gemini Service
  const geminiResponse = await geminiService.generateResponse({
    prompt: trimmedQuery,
    systemInstruction,
    temperature,
    maxTokens,
    history
  });

  // Step 5: Format Response & Transparent Grounding Metadata
  // Title generation based on category or query
  let responseTitle = 'Lexora Preliminary Legal Memorandum';
  if (queryType === 'general') {
    responseTitle = 'Lexora Executive Advisory';
  } else if (classification.category) {
    responseTitle = `${classification.category}: Regulatory & Commercial Assessment`;
  }

  // Honest source metadata: No fabricated sources!
  let responseSources = [];
  if (ragResult.isRAGConnected && ragResult.retrievedPassages.length > 0) {
    responseSources = ragResult.retrievedPassages.map(p => p.citation);
  } else if (queryType === 'legal') {
    // Explicitly designate that this is AI exploratory guidance
    responseSources = [
      'Gemini AI Preliminary Synthesis',
      'Codified Indian Law Reference',
      'RAG Corpus: Pending Integration'
    ];
  } else {
    responseSources = ['Gemini AI Intelligence'];
  }

  return {
    title: responseTitle,
    body: geminiResponse.text,
    sources: responseSources,
    meta: {
      queryType,
      category: classification.category,
      modelMode: modelId === 'lexora-advanced' ? 'Lexora Advanced' : 'Lexora Standard',
      userPlan: userPlan || 'Professional',
      isSourceGrounded: ragResult.isRAGConnected,
      groundingStatus: ragResult.isRAGConnected ? 'verified_rag' : 'ai_exploratory',
      ragNotice: ragResult.corpusNotice || null,
      generatedAt: new Date().toISOString()
    }
  };
}

module.exports = {
  classifyQuery,
  retrieveLegalContext,
  routeQuery
};
