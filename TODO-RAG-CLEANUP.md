# Lexora — RAG Integration TODO

## When RAG Model is Connected, Remove These Hardcoded Items:

### 1. Static Sample Conversation in `assistant.html`
- **Location**: `assistant.html` lines ~166–243
- **What**: Pre-loaded demo messages (employment termination Q&A) shown on first page load
- **Action**: Replace with empty chat stream or dynamic "Welcome" card, then let real RAG-grounded responses populate

### 2. Simulated Legal Responses in `js/main.js`
- **Location**: `js/main.js` lines ~7–38 (`LEGAL_SIMULATION_RESPONSES` object)
- **What**: Hardcoded response templates for the "Ask Lexora" preview on `index.html`
- **Action**: Either connect to live backend API or replace with a clean CTA directing users to `assistant.html`

### 3. AI Router RAG Placeholder
- **Location**: `backend/services/ai-router.js` → `retrieveLegalContext()` function
- **What**: Currently returns `{ isRAGConnected: false, status: 'PENDING_INTEGRATION' }`
- **Action**: Connect to the Indian Law vector database and return verified statutory passages with citations
