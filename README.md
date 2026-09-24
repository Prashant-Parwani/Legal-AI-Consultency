# Lexora — AI-Powered Legal Intelligence & SaaS Platform

> **Modern Dark LegalTech & AI SaaS Frontend Application** designed for startups, corporations, and business teams navigating Indian Law (Companies Act 2013, Indian Contract Act 1872, DPDP Act 2023, Arbitration Act 1996).

---

## 🚀 Architectural Overview

Lexora is structured according to a strict public-to-application pipeline:

```
                    LEXORA PLATFORM
                           │
              ┌────────────┴────────────┐
              │                         │
         PUBLIC WEBSITE            APPLICATION
              │                         │
         Landing Page (index.html) Login / Signup (login.html)
         Features                       │
         Pricing                        ↓
         About                    User Authentication (Mock / LocalStorage)
                                        │
                                        ↓
                                Identify User + Plan
                                        │
                             ┌──────────┴──────────┐
                             │                     │
                        Free Plan              Professional Plan
                             │                     │
                      Lexora Standard       Lexora Standard + Advanced
                             │                     │
                             └──────────┬──────────┘
                                        ↓
                                  AI Workspace
                                        │
                            ┌───────────┼───────────┐
                            ↓           ↓           ↓
                        AI Chat    Legal Research  Documents
                      (assistant)    (research)    (documents)
                            │
                            ↓
                     RAG / Legal Engine (Deterministic Simulation)
                            │
                            ↓
                  Relevant Indian Legal Sources (Bare Acts + Precedents)
                            │
                            ↓
                    AI Generated Answer + Sources + Copy to Clipboard
```

---

## 🛠️ Technology Stack

- **Markup:** Semantic HTML5
- **Styling:** Tailwind CSS (via CDN) + Custom Dark LegalTech Utilities (`css/custom.css`)
- **Scripting:** Pure Vanilla JavaScript (`js/app.js`)
- **Client State & Entitlements:** Dynamic model gating via `localStorage`
- **Zero Backend Dependencies:** No Node.js, no React, no external server required. Runs directly in Google Chrome or via VS Code Live Server (`port 5501`).

---

## 💻 Application Pages

| Page | File | Description |
| :--- | :--- | :--- |
| **Landing Page** | [`index.html`](file:///f:/Projects/Legal%20AI/index.html) | Public website with hero animated conversation, solutions, how it works, startup vs corporation tiers, pricing, and footer. |
| **Login / Signup** | [`login.html`](file:///f:/Projects/Legal%20AI/login.html) | Authentication with 1-click quick sign-in switchers (Professional vs Free Plan). |
| **Dashboard** | [`dashboard.html`](file:///f:/Projects/Legal%20AI/dashboard.html) | Authenticated SaaS workspace with large legal query bar and dynamic "Choose your AI" cards gated by user plan. |
| **AI Assistant** | [`assistant.html`](file:///f:/Projects/Legal%20AI/assistant.html) | Dedicated chat stream, session history, dynamic engine dropdown, and source citations. |
| **Documents** | [`documents.html`](file:///f:/Projects/Legal%20AI/documents.html) | Contract diligence with drag-and-drop file upload, file metadata inspection, progress simulation, and redline suggestions. |
| **Legal Research** | [`research.html`](file:///f:/Projects/Legal%20AI/research.html) | Indian Central Acts lookup (Contract Act, Companies Act, DPDP Act 2023, Arbitration Act) with saved research drawer. |
| **Membership** | [`membership.html`](file:///f:/Projects/Legal%20AI/membership.html) | Subscription management, query usage tracking, and interactive plan switcher. |
| **Settings & APIs**| [`settings.html`](file:///f:/Projects/Legal%20AI/settings.html) | Profile settings and academic 5 HTML5 Browser APIs diagnostic center. |

---

## 🎓 5 Native HTML5 Browser APIs Integration Matrix

This platform naturally integrates and visibly demonstrates **5 native HTML5 browser APIs** for academic examination/viva:

| API | Implementation File | Feature Demonstrated |
| :--- | :--- | :--- |
| **1. File API** | [`documents.html`](file:///f:/Projects/Legal%20AI/documents.html) | Reads and displays `file.name`, `file.size`, `file.type`, and `file.lastModified` on contract selection without uploading to a server. |
| **2. Drag & Drop API** | [`documents.html`](file:///f:/Projects/Legal%20AI/documents.html) | Interactive dropzone handling `dragenter`, `dragover`, `dragleave`, and `drop` with dynamic illuminated CSS feedback. |
| **3. Local Storage API** | [`js/app.js`](file:///f:/Projects/Legal%20AI/js/app.js) | Persists user profile session (`lexora_user`), search history (`lexora_recent_searches`), and saved research (`lexora_saved_research`). |
| **4. Clipboard API** | [`assistant.html`](file:///f:/Projects/Legal%20AI/assistant.html), [`research.html`](file:///f:/Projects/Legal%20AI/research.html) | `navigator.clipboard.writeText` copying legal responses, statutory citations, and suggested redlines with visual confirmation toast. |
| **5. Web Notifications API** | [`documents.html`](file:///f:/Projects/Legal%20AI/documents.html), [`settings.html`](file:///f:/Projects/Legal%20AI/settings.html) | Requests browser permission (`Notification.requestPermission`) and delivers native OS system desktop notifications upon contract analysis completion. |

---

## 🏃 How to Run

1. **Option A (Direct in Chrome):** Open `index.html` directly in Google Chrome or any modern browser.
2. **Option B (VS Code Live Server):** Right click `index.html` and select **"Open with Live Server"** (configured to port `5501` in `.vscode/settings.json`).
