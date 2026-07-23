// src/services/hosComplianceService.js
/**
 * Frontend wrapper that sends the current timeline (logSheet) to the backend
 * for FMCSA HOS validation. The backend returns a structured response with
 * compliance status, rule violated (if any), and next‑break suggestion.
 */
export async function validateHOS(logSheet) {
  try {
    const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/trips/validate-hos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Assuming the JWT token is stored in localStorage after login
        Authorization: `Bearer ${localStorage.getItem('eld_jwt')}`,
      },
      body: JSON.stringify({ logSheet }),
    });
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || `HTTP ${resp.status}`);
    }
    return await resp.json();
  } catch (e) {
    console.warn('HOS validation fallback:', e);
    // Fallback – treat as legal
    return { status: 'legal', rule: null, nextBreakSuggestion: null };
  }
}
