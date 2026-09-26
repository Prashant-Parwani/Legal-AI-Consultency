/**
 * Lexora — Google Authentication Module
 * Uses Google Identity Services (GIS) renderButton approach
 * 
 * SETUP:
 *   1. Go to https://console.cloud.google.com/
 *   2. Create OAuth 2.0 Client ID (Web Application)
 *   3. Add authorized JS origins: http://localhost:5501, http://127.0.0.1:5501
 *   4. Authorized redirect URIs can be left empty (popup flow)
 */

const GOOGLE_CLIENT_ID = "612410041359-rlblvl0efh83lo7t920bl8npve0j5dh9.apps.googleusercontent.com";

/**
 * Handle the credential response from Google
 * Called after the user successfully signs in via the Google popup
 */
function handleGoogleCredential(response) {
  if (!response || !response.credential) {
    showToast("Google authentication failed. Please try again.", "error");
    return;
  }

  try {
    // Decode the JWT ID token (base64 payload)
    // NOTE: In production, send this token to your backend for verification
    const payload = decodeGoogleJwtPayload(response.credential);

    if (!payload || !payload.email) {
      showToast("Could not read Google account info. Try again.", "error");
      return;
    }

    console.log("[Lexora] Google user authenticated:", payload.email);

    // Check if user already exists in localStorage
    const existingUser = findExistingGoogleUser(payload.email);

    // Determine plan — for new users default to Free, existing users keep their plan
    const plan = existingUser ? existingUser.plan : "Free";
    const limitMap = { Free: 25, Professional: 500, Enterprise: 5000 };

    const user = existingUser || {
      name: payload.name || payload.email.split("@")[0],
      email: payload.email,
      avatar: payload.picture || null,
      role: "Member",
      organization: payload.hd || "—", // Google Workspace domain if available
      plan: plan,
      queriesUsed: 0,
      queriesLimit: limitMap[plan] || 25,
      authProvider: "google",
      googleSub: payload.sub
    };

    // Store the raw Google ID token for later backend verification
    try {
      localStorage.setItem("lexora_google_id_token", response.credential);
    } catch (e) {
      console.warn("[Lexora] Could not store Google token:", e);
    }

    // Save user to Lexora session
    setCurrentUser(user);

    // Show success feedback
    const isNewUser = !existingUser;
    const greeting = isNewUser
      ? `Welcome to Lexora, ${user.name}!`
      : `Welcome back, ${user.name}!`;

    showToast(greeting, "success");

    // Navigate to dashboard
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 800);

  } catch (err) {
    console.error("[Lexora] Error processing Google credential:", err);
    showToast("Something went wrong with Google Sign-In. Please try again.", "error");
  }
}

/**
 * Decode JWT payload without verification (client-side only)
 * WARNING: In production, always verify the token on your backend
 */
function decodeGoogleJwtPayload(token) {
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
}

/**
 * Check if a user with this email already exists in localStorage
 */
function findExistingGoogleUser(email) {
  try {
    const raw = localStorage.getItem("lexora_user");
    if (raw) {
      const user = JSON.parse(raw);
      if (user.email === email) return user;
    }
  } catch (e) { /* ignore */ }
  return null;
}

/**
 * Sign out from Google (and Lexora)
 */
function googleSignOut() {
  try {
    if (typeof google !== "undefined" && google.accounts) {
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

// ============================================================================
// Initialize Google Identity Services and render the button
// ============================================================================
window.addEventListener("load", () => {
  // Wait for GIS library to be ready
  function initGIS() {
    if (typeof google === "undefined" || !google.accounts) return;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      ux_mode: "popup"
    });

    // Render the Google button into the container if it exists
    const googleBtnContainer = document.getElementById("google-signin-rendered");
    if (googleBtnContainer) {
      google.accounts.id.renderButton(googleBtnContainer, {
        theme: "filled_black",
        size: "large",
        width: 380,
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left"
      });
    }

    console.log("%c[Lexora] ✓ Google Identity Services initialized", "color: #34D399;");
  }

  // GIS library loads async, may need a brief retry
  if (typeof google !== "undefined" && google.accounts) {
    initGIS();
  } else {
    setTimeout(initGIS, 500);
  }
});
