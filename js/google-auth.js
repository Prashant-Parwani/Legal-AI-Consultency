/**
 * Lexora — Google Authentication Module
 * Handles Google Identity Services (GIS) integration
 * 
 * SETUP:
 *   1. Go to https://console.cloud.google.com/
 *   2. Create OAuth 2.0 Client ID (Web Application)
 *   3. Add your authorized origins (e.g. http://localhost:5500, http://127.0.0.1:5500)
 *   4. Paste your Client ID in the GOOGLE_CLIENT_ID variable below
 */

const GOOGLE_CLIENT_ID = "612410041359-rlblvl0efh83lo7t920bl8npve0j5dh9.apps.googleusercontent.com";

const GoogleAuth = {
  initialized: false,
  pendingAction: null, // "signin" or "signup"

  /**
   * Initialize Google Identity Services
   * Called once when the page loads and the GIS library is ready
   */
  init() {
    if (this.initialized) return;

    if (GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID_HERE") {
      console.warn(
        "%c[Lexora Google Auth] ⚠️ Client ID not configured!\n" +
        "Open js/google-auth.js and replace YOUR_GOOGLE_CLIENT_ID_HERE with your actual Google Client ID.",
        "color: #FBBF24; font-weight: bold; font-size: 13px;"
      );
      return;
    }

    try {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: this.handleCredentialResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true,
        context: "signin",
        ux_mode: "popup",
        itp_support: true
      });
      this.initialized = true;
      console.log("%c[Lexora] ✓ Google Identity Services initialized", "color: #34D399;");
    } catch (err) {
      console.error("[Lexora] Failed to initialize Google Identity Services:", err);
    }
  },

  /**
   * Trigger Google Sign-In popup
   * @param {"signin"|"signup"} action - Whether this is a sign-in or sign-up flow
   */
  prompt(action = "signin") {
    if (!this.initialized) {
      if (GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID_HERE") {
        showToast("Google Client ID not configured. Check js/google-auth.js", "warning");
        return;
      }
      this.init();
    }

    this.pendingAction = action;

    // Use Google's One Tap prompt
    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        // Fallback: render a popup-style button click
        console.log("[Lexora] One Tap not displayed, reason:", notification.getNotDisplayedReason());
        // Use the code client for popup flow as fallback
        this.fallbackPopup();
      } else if (notification.isSkippedMoment()) {
        console.log("[Lexora] One Tap skipped, reason:", notification.getSkippedReason());
      }
    });
  },

  /**
   * Fallback: Use google.accounts.id.renderButton approach  
   * Creates a hidden Google button and clicks it programmatically
   */
  fallbackPopup() {
    // Create a temporary container for Google's rendered button
    let tempContainer = document.getElementById("google-fallback-btn");
    if (!tempContainer) {
      tempContainer = document.createElement("div");
      tempContainer.id = "google-fallback-btn";
      tempContainer.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;";
      document.body.appendChild(tempContainer);
    }

    google.accounts.id.renderButton(tempContainer, {
      type: "standard",
      theme: "filled_black",
      size: "large",
      width: 300
    });

    // Click the rendered button after a brief delay
    setTimeout(() => {
      const btn = tempContainer.querySelector('[role="button"]') ||
        tempContainer.querySelector('div[class]');
      if (btn) btn.click();
    }, 100);
  },

  /**
   * Handle the credential response from Google
   * This is called after the user successfully signs in with Google
   * @param {Object} response - Google credential response containing the JWT ID token
   */
  handleCredentialResponse(response) {
    if (!response || !response.credential) {
      showToast("Google authentication failed. Please try again.", "error");
      return;
    }

    try {
      // Decode the JWT ID token (base64 payload)
      // NOTE: In production, ALWAYS verify this token on your backend server
      const payload = this.decodeJwtPayload(response.credential);

      if (!payload || !payload.email) {
        showToast("Could not read Google account info. Try again.", "error");
        return;
      }

      console.log("[Lexora] Google user authenticated:", payload.email);

      // Determine the plan based on whether this is sign-in or sign-up
      const isSignup = this.pendingAction === "signup";
      const selectedPlan = isSignup
        ? (document.getElementById("signup-plan")?.value || "Free")
        : (document.getElementById("plan-select")?.value || "Professional");

      const limitMap = { Free: 25, Professional: 500, Enterprise: 5000 };
      const usedMap = { Free: 0, Professional: 0, Enterprise: 0 };

      // Check if user already exists in localStorage
      const existingUser = this.findExistingUser(payload.email);

      const user = existingUser || {
        name: payload.name || payload.email.split("@")[0],
        email: payload.email,
        avatar: payload.picture || null,
        role: isSignup ? "New Member" : "Corporate Counsel",
        organization: payload.hd || "—", // Google Workspace domain if available
        plan: selectedPlan,
        queriesUsed: existingUser ? existingUser.queriesUsed : (usedMap[selectedPlan] || 0),
        queriesLimit: limitMap[selectedPlan] || 500,
        authProvider: "google",
        googleSub: payload.sub // Google unique user ID
      };

      // Store the raw Google ID token for later backend verification
      // In production, send this to your Node.js/Express server instead
      try {
        localStorage.setItem("lexora_google_id_token", response.credential);
      } catch (e) {
        console.warn("[Lexora] Could not store Google token:", e);
      }

      // Save user to Lexora session
      setCurrentUser(user);

      // Show success feedback
      const greeting = isSignup
        ? `Welcome to Lexora, ${user.name}! Account created via Google.`
        : `Signed in as ${user.name} via Google`;

      showToast(greeting, "success");

      // Navigate to dashboard
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 800);

    } catch (err) {
      console.error("[Lexora] Error processing Google credential:", err);
      showToast("Something went wrong with Google Sign-In. Please try again.", "error");
    }
  },

  /**
   * Decode JWT payload without verification (client-side only)
   * WARNING: In production, always verify the token on your backend
   */
  decodeJwtPayload(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("[Lexora] JWT decode error:", e);
      return null;
    }
  },

  /**
   * Check if a user with this email already exists in localStorage
   */
  findExistingUser(email) {
    try {
      const raw = localStorage.getItem("lexora_user");
      if (raw) {
        const user = JSON.parse(raw);
        if (user.email === email) return user;
      }
    } catch (e) { /* ignore */ }
    return null;
  },

  /**
   * Sign out from Google (and Lexora)
   */
  signOut() {
    try {
      if (this.initialized) {
        google.accounts.id.disableAutoSelect();
      }
      localStorage.removeItem("lexora_google_id_token");
      localStorage.removeItem("lexora_user");
      showToast("Signed out successfully", "info");
      window.location.href = "login.html";
    } catch (err) {
      console.error("[Lexora] Sign out error:", err);
      localStorage.removeItem("lexora_user");
      window.location.href = "login.html";
    }
  }
};


// ============================================================================
// AUTO-INITIALIZE when Google Identity Services library loads
// ============================================================================
window.addEventListener("load", () => {
  // Wait a tick for the GIS library to be ready
  if (typeof google !== "undefined" && google.accounts) {
    GoogleAuth.init();
  } else {
    // GIS library may still be loading (async/defer), retry after a short delay
    setTimeout(() => {
      if (typeof google !== "undefined" && google.accounts) {
        GoogleAuth.init();
      }
    }, 500);
  }
});
