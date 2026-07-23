// src/services/authService.js
// ═══════════════════════════════════════════════════════════════════
// Frontend Authentication & Token Management Service
// ═══════════════════════════════════════════════════════════════════

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const TOKEN_KEY = 'eld_access_token';
const USER_KEY = 'eld_user_data';

export function getStoredAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (_) {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Authenticated Fetch wrapper with automatic token injection and auto-refresh on 401.
 */
export async function authFetch(endpoint, options = {}) {
  let token = getStoredAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle Token Expiration auto-refresh attempt
  if (response.status === 401) {
    try {
      const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // sends HttpOnly refresh_token cookie
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setSession(data.token, data.user);

        // Retry original request
        headers['Authorization'] = `Bearer ${data.token}`;
        response = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
        });
      } else {
        clearSession();
      }
    } catch (_) {
      clearSession();
    }
  }

  return response;
}
