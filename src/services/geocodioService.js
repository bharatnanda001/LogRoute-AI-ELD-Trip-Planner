// src/services/geocodioService.js
// Geocodio API Integration for US / Canada Geocoding & Address Parsing

const GEOCODIO_API_KEY = 'a72aca6e3af5f6070686c5e25af3e3072a171c1';

/**
 * Geocodes a location text string using Geocodio API.
 * Returns { lat, lng, city, state, formattedAddress }
 */
export async function geocodeWithGeocodio(query) {
  try {
    const url = `https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(query)}&api_key=${GEOCODIO_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Geocodio API returned status ${res.status}`);
    }
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      throw new Error(`No Geocodio results for "${query}"`);
    }

    const first = data.results[0];
    const loc = first.location;
    const comps = first.address_components || {};

    return {
      lat: loc.lat,
      lng: loc.lng,
      city: comps.city || comps.county || query.split(',')[0],
      state: comps.state || 'US',
      formattedAddress: first.formatted_address || query,
    };
  } catch (err) {
    console.warn(`Geocodio geocode failed for "${query}", falling back to Nominatim OSM:`, err.message);
    // Nominatim fallback
    const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const fallbackRes = await fetch(fallbackUrl, { headers: { 'User-Agent': 'LogRouteAI/1.0' } });
    const fallbackData = await fallbackRes.json();
    if (fallbackData.length > 0) {
      const r = fallbackData[0];
      const parts = r.display_name.split(',').map((s) => s.trim());
      return {
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        city: parts[0] || query,
        state: parts.length > 2 ? parts[2] : 'US',
        formattedAddress: r.display_name,
      };
    }
    throw err;
  }
}
