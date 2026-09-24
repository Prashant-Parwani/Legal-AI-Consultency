/**
 * Lexora — Central Client-side State & Entitlement Engine
 * Designed for pure frontend execution (HTML5 + Tailwind CSS + Vanilla JS)
 * Naturally integrates 5 HTML5 Browser APIs:
 *   1. File API (File metadata extraction & inspection)
 *   2. Drag and Drop API (Contract dropzones)
 *   3. Local Storage API (Session, Entitlements, Recent Searches, Saved Research)
 *   4. Clipboard API (One-click citation and response copying)
 *   5. Web Notifications API (Simulated asynchronous task alerts)
 */

// ============================================================================
// 1. DATA MODELS & ENTITLEMENT CONFIGURATION
// ============================================================================

const LEXORA_PLANS = {
  Free: {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Basic exploration for founders and solo practitioners.",
    queryLimit: 25,
    allowedModelIds: ["lexora-standard"],
    features: [
      "Access to Lexora Standard AI",
      "Statutory Indian Law bare acts lookup",
      "Up to 25 queries / month",
      "Basic contract clause scanning",
      "Community support"
    ]
  },
  Professional: {
    name: "Professional",
    price: "₹4,999",
    period: "/ month",
    description: "Full AI legal intelligence for growing startups and legal ops.",
    queryLimit: 500,
    allowedModelIds: ["lexora-standard", "lexora-advanced"],
    features: [
      "Access to Lexora Standard + Lexora Advanced",
      "Deep reasoning & precedent citations",
      "Up to 500 AI queries / month",
      "Full document risk & deviation auditing",
      "Dedicated saved research workspace",
      "Priority inference speed"
    ]
  },
  Enterprise: {
    name: "Enterprise",
    price: "Custom",
    period: "billed annually",
    description: "Bespoke compliance, multi-user seats & custom statutory indexes.",
    queryLimit: 5000,
    allowedModelIds: ["lexora-standard", "lexora-advanced", "lexora-specialist"],
    features: [
      "All AI Models including DPDP Specialist",
      "Unlimited contract diligence runs",
      "Role-based multi-user workspace",
      "Custom regulatory alerts (MCA, SEBI, RBI)",
      "99.9% SLA & Dedicated Account Counsel"
    ]
  }
};

const LEXORA_AI_MODELS = [
  {
    id: "lexora-standard",
    name: "Lexora Standard",
    badge: "Fast & General",
    description: "Fast answers for everyday commercial legal questions and statutory definitions.",
    plans: ["Free", "Professional", "Enterprise"],
    speed: "0.8s",
    corpus: "Indian Central Bare Acts & MCA Circulars",
    icon: "⚡",
    color: "blue"
  },
  {
    id: "lexora-advanced",
    name: "Lexora Advanced",
    badge: "Deep Reasoning",
    description: "Deeper reasoning for complex commercial contracts, risk scoring & precedent mapping.",
    plans: ["Professional", "Enterprise"],
    speed: "1.9s",
    corpus: "Supreme Court & High Court Precedents + Gazette Notifications",
    icon: "🧠",
    color: "emerald"
  }
];

const DEFAULT_USER = {
  name: "Prashant",
  email: "prashant@lexora.legal",
  role: "Legal Operations Lead",
  organization: "Apex Enterprise Ltd",
  plan: "Professional",
  queriesUsed: 420,
  queriesLimit: 500
};

// ============================================================================
// 2. SESSION & ENTITLEMENT API
// ============================================================================

/**
 * Get current authenticated user from LocalStorage (HTML5 API)
 */
function getCurrentUser() {
  try {
    const raw = localStorage.getItem("lexora_user");
    if (!raw) {
      setCurrentUser(DEFAULT_USER);
      return DEFAULT_USER;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn("LocalStorage access issue, fallback to default", err);
    return DEFAULT_USER;
  }
}

/**
 * Set and persist user session to LocalStorage (HTML5 API)
 */
function setCurrentUser(user) {
  try {
    localStorage.setItem("lexora_user", JSON.stringify(user));
    window.dispatchEvent(new CustomEvent("lexora:userChanged", { detail: user }));
  } catch (err) {
    console.error("Failed to save user to LocalStorage", err);
  }
}

/**
 * Switch plan dynamically (e.g. Free <-> Professional)
 * Allows instant live demonstration of model gating in the UI
 */
function switchUserPlan(newPlanName) {
  if (!LEXORA_PLANS[newPlanName]) return;
  const user = getCurrentUser();
  user.plan = newPlanName;
  user.queriesLimit = LEXORA_PLANS[newPlanName].queryLimit;
  if (user.queriesUsed > user.queriesLimit) {
    user.queriesUsed = user.queriesLimit;
  }
  setCurrentUser(user);
  showToast(`Active plan switched to ${newPlanName}`, "success");
}

/**
 * Dynamic Model Entitlement Engine:
 * Returns only the AI models permitted under the user's active membership plan.
 * Used across Dashboard and Assistant.
 */
function getUserAvailableModels(user = null) {
  const activeUser = user || getCurrentUser();
  const planInfo = LEXORA_PLANS[activeUser.plan] || LEXORA_PLANS.Free;
  return LEXORA_AI_MODELS.filter(model => planInfo.allowedModelIds.includes(model.id));
}

/**
 * Check if a specific model is unlocked for the current user
 */
function isModelUnlocked(modelId, user = null) {
  const activeUser = user || getCurrentUser();
  const planInfo = LEXORA_PLANS[activeUser.plan] || LEXORA_PLANS.Free;
  return planInfo.allowedModelIds.includes(modelId);
}

// ============================================================================
// 3. HTML5 BROWSER APIS IMPLEMENTATION
// ============================================================================

/**
 * HTML5 API #1: File API
 * Extracts metadata from a File object
 */
function getFileMetadata(file) {
  if (!file) return null;
  return {
    name: file.name,
    size: file.size,
    formattedSize: formatBytes(file.size),
    type: file.type || "application/octet-stream",
    lastModified: file.lastModified ? new Date(file.lastModified).toLocaleDateString() : "Recent",
    extension: file.name.split(".").pop().toUpperCase()
  };
}

function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * HTML5 API #2: Drag and Drop API
 * Configures an interactive drag-and-drop zone
 */
function setupDropzone(dropzoneEl, onFilesSelected) {
  if (!dropzoneEl) return;

  ["dragenter", "dragover"].forEach(eventName => {
    dropzoneEl.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneEl.classList.add("dropzone-active");
    });
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropzoneEl.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneEl.classList.remove("dropzone-active");
    });
  });

  dropzoneEl.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt ? dt.files : null;
    if (files && files.length > 0 && typeof onFilesSelected === "function") {
      onFilesSelected(files);
    }
  });
}

/**
 * HTML5 API #3: Local Storage API Helper methods
 */
const StorageHelper = {
  // Recent Searches
  getRecentSearches: () => {
    try {
      const data = localStorage.getItem("lexora_recent_searches");
      return data ? JSON.parse(data) : [
        "Section 27 non-compete enforceability Indian Contract Act",
        "MCA Form MGT-14 debt borrowing thresholds",
        "Data Fiduciary consent requirements DPDP Act 2023"
      ];
    } catch (e) {
      return [];
    }
  },
  addRecentSearch: (query) => {
    if (!query || !query.trim()) return;
    try {
      let list = StorageHelper.getRecentSearches();
      list = [query.trim(), ...list.filter(q => q.toLowerCase() !== query.trim().toLowerCase())].slice(0, 8);
      localStorage.setItem("lexora_recent_searches", JSON.stringify(list));
    } catch (e) {
      console.warn("Storage quota or disabled", e);
    }
  },

  // Saved Research
  getSavedResearch: () => {
    try {
      const data = localStorage.getItem("lexora_saved_research");
      return data ? JSON.parse(data) : [
        {
          id: "res-1",
          title: "Section 27 Indian Contract Act — Post-Termination Restrictive Covenants",
          category: "Commercial Contracts",
          date: "2026-09-18",
          summary: "Void ab initio under Supreme Court precedent Percept D'Mark (2006). In-term restrictions permissible.",
          act: "Indian Contract Act, 1872"
        },
        {
          id: "res-2",
          title: "Section 180(1)(c) Companies Act 2013 — Borrowing Powers",
          category: "Corporate Governance",
          date: "2026-09-15",
          summary: "Special resolution mandatory if debt exceeds paid-up capital + free reserves + securities premium.",
          act: "Companies Act, 2013"
        }
      ];
    } catch (e) {
      return [];
    }
  },
  saveResearchItem: (item) => {
    try {
      const list = StorageHelper.getSavedResearch();
      const existing = list.find(r => r.id === item.id);
      if (!existing) {
        list.unshift(item);
        localStorage.setItem("lexora_saved_research", JSON.stringify(list));
        showToast("Research saved to your workspace", "success");
      } else {
        showToast("Item is already in your saved research", "info");
      }
    } catch (e) {
      console.warn("Failed to save research", e);
    }
  },
  removeSavedResearch: (id) => {
    try {
      let list = StorageHelper.getSavedResearch();
      list = list.filter(item => item.id !== id);
      localStorage.setItem("lexora_saved_research", JSON.stringify(list));
      showToast("Item removed from saved research", "info");
    } catch (e) {
      console.warn("Failed to remove research", e);
    }
  }
};

/**
 * HTML5 API #4: Clipboard API
 * Copies text cleanly and displays visual confirmation
 */
async function copyToClipboard(text, triggerEl = null) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for non-https local file test
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    if (triggerEl) {
      const originalHTML = triggerEl.innerHTML;
      triggerEl.innerHTML = `<span class="text-emerald-400">✓ Copied</span>`;
      setTimeout(() => {
        triggerEl.innerHTML = originalHTML;
      }, 2000);
    }
    showToast("Copied to clipboard!", "success");
    return true;
  } catch (err) {
    console.error("Clipboard API error", err);
    showToast("Failed to copy to clipboard", "error");
    return false;
  }
}

/**
 * HTML5 API #5: Web Notifications API
 * Requests permission and fires native system notifications
 */
async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    showToast("This browser does not support Web Notifications", "warning");
    return "unsupported";
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      showToast("Web Notifications enabled!", "success");
    } else {
      showToast("Notification permission was " + permission, "warning");
    }
    return permission;
  } catch (err) {
    console.warn("Notification request error", err);
    return "denied";
  }
}

function sendAppNotification(title, body, icon = null) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body: body,
        icon: icon || "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233B82F6'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>"
      });
    } catch (e) {
      console.log("Web Notification sent (or blocked by browser settings)");
    }
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        sendAppNotification(title, body, icon);
      }
    });
  }
}

// ============================================================================
// 4. UI HELPERS & COMPONENT SYNCS
// ============================================================================

/**
 * Visual Toast Feedback System
 */
function showToast(message, type = "info") {
  let container = document.getElementById("lexora-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "lexora-toast-container";
    container.className = "fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  const bgMap = {
    success: "bg-slate-900/95 border-emerald-500/50 text-emerald-300",
    error: "bg-slate-900/95 border-rose-500/50 text-rose-300",
    warning: "bg-slate-900/95 border-amber-500/50 text-amber-300",
    info: "bg-slate-900/95 border-blue-500/50 text-blue-300"
  };

  const iconMap = {
    success: "✓",
    error: "✕",
    warning: "▲",
    info: "ℹ"
  };

  toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl text-xs font-semibold transform transition-all duration-300 translate-y-3 opacity-0 ${bgMap[type] || bgMap.info}`;
  toast.innerHTML = `
    <span class="text-sm font-bold">${iconMap[type] || "ℹ"}</span>
    <span class="text-slate-100">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-3", "opacity-0");
  });

  setTimeout(() => {
    toast.classList.add("translate-y-3", "opacity-0");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3200);
}

/**
 * Updates UI elements that display the current user profile & membership badge
 */
function updateGlobalUserUI() {
  const user = getCurrentUser();

  // User Name
  document.querySelectorAll(".js-user-name").forEach(el => {
    el.textContent = user.name;
  });

  // User Organization
  document.querySelectorAll(".js-user-org").forEach(el => {
    el.textContent = user.organization;
  });

  // User Email
  document.querySelectorAll(".js-user-email").forEach(el => {
    el.textContent = user.email;
  });

  // User Plan Badge
  document.querySelectorAll(".js-user-plan").forEach(el => {
    el.textContent = user.plan;
  });

  // User Plan Badge Styling
  document.querySelectorAll(".js-user-plan-badge").forEach(el => {
    el.textContent = user.plan;
    if (user.plan === "Professional") {
      el.className = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20";
    } else if (user.plan === "Enterprise") {
      el.className = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20";
    } else {
      el.className = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700";
    }
  });

  // Queries Meter
  document.querySelectorAll(".js-user-queries-used").forEach(el => {
    el.textContent = user.queriesUsed;
  });
  document.querySelectorAll(".js-user-queries-limit").forEach(el => {
    el.textContent = user.queriesLimit;
  });
  document.querySelectorAll(".js-user-queries-bar").forEach(el => {
    const pct = Math.min(100, Math.round((user.queriesUsed / user.queriesLimit) * 100));
    el.style.width = `${pct}%`;
  });
}

// Global initialization
document.addEventListener("DOMContentLoaded", () => {
  updateGlobalUserUI();

  window.addEventListener("lexora:userChanged", () => {
    updateGlobalUserUI();
  });
});
