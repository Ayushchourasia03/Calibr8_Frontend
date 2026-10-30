/**
 * Authentication APIs (/api/auth)
 * Conforms strictly to API details.md Section 5.
 */
import { request, tokenStorage } from "../../services/apiClient";

export const authApi = {
  /**
   * Register a new user account.
   * POST /api/auth/register
   * Body: { email, password, name }
   */
  register: async ({ name, email, password }) => {
    // Client-side security sanitization & validation
    const cleanEmail = (email || "").toLowerCase().trim();
    const cleanName = (name || "").trim();

    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      throw new Error("Invalid email format.");
    }
    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }
    if (password.length > 72) {
      throw new Error("Password cannot exceed 72 bytes.");
    }
    if (password.toLowerCase() === cleanEmail.toLowerCase()) {
      throw new Error("Password must differ from the email address.");
    }

    const res = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: cleanName, email: cleanEmail, password }),
    });

    if (res?.token) {
      tokenStorage.set(res.token);
    }
    return res;
  },

  /**
   * Log in an existing user.
   * POST /api/auth/login
   * Body: { email, password }
   */
  login: async ({ email, password }) => {
    const cleanEmail = (email || "").toLowerCase().trim();
    if (!cleanEmail || !password) {
      throw new Error("Email and password are required.");
    }

    const res = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    if (res?.token) {
      tokenStorage.set(res.token);
    }
    return res;
  },

  /**
   * Verify session & get authenticated user.
   * GET /api/auth/me (Protected: Bearer <token>)
   */
  getMe: async () => {
    return await request("/auth/me", { method: "GET" });
  },

  /**
   * Refresh JWT token.
   * POST /api/auth/refresh (Protected: Bearer <token>)
   */
  refresh: async () => {
    const res = await request("/auth/refresh", { method: "POST" });
    if (res?.token) {
      tokenStorage.set(res.token);
    }
    return res;
  },

  /**
   * Change current account password.
   * POST /api/auth/change-password (Protected: Bearer <token>)
   */
  changePassword: async ({ currentPassword, newPassword, oldPassword }) => {
    const finalCurrent = currentPassword || oldPassword;
    if (!finalCurrent || !newPassword) {
      throw new Error("Current and new password are required.");
    }
    if (newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long.");
    }

    return await request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword: finalCurrent,
        newPassword,
      }),
    });
  },

  /**
   * Log out user and revoke token.
   * POST /api/auth/logout (Protected: Bearer <token>)
   */
  logout: async () => {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("Logout warning:", err.message);
    } finally {
      tokenStorage.remove();
    }
    return { success: true, message: "Logged out successfully." };
  },
};

export default authApi;
