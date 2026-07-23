// server/src/services/routeService.js
// ═══════════════════════════════════════════════════════════════════
// Route Planning & Geocoding Service (OSRM + Geocodio Fallback)
// ═══════════════════════════════════════════════════════════════════

/**
 * Plan a route using OSRM public demo server (or Mapbox).
 * Expects: { pickup: { lat, lng }, drop: { lat, lng }, departureTime }
 * Returns distance (meters), duration (seconds), and waypoints array.
 */
export async function planRoute({ pickup, drop, departureTime }) {
  const url = `http://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?overview=full&geometries=geojson`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OSRM routing failed: ${err}`);
  }
  const data = await resp.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('No route found');
  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry,
    waypoints: [pickup, drop],
    departureTime,
  };
}

/**
 * Geocode a location string into { lat, lng, city, state }.
 */
export async function geocode(locationStr) {
  if (!locationStr) return { lat: 32.7767, lng: -96.7970, city: 'Dallas', state: 'TX' };
  
  const apiKey = process.env.GEOCODIO_API_KEY;
  if (apiKey) {
    try {
      const url = `https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(locationStr)}&api_key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const result = data.results?.[0];
        if (result) {
          return {
            lat: result.location.lat,
            lng: result.location.lng,
            city: result.address_components.city || locationStr,
            state: result.address_components.state || '',
          };
        }
      }
    } catch (_) {
      // Fallback below
    }
  }

  // Fallback defaults for common cities or generic coords
  const lower = locationStr.toLowerCase();
  if (lower.includes('houston')) return { lat: 29.7604, lng: -95.3698, city: 'Houston', state: 'TX' };
  if (lower.includes('memphis')) return { lat: 35.1495, lng: -90.0490, city: 'Memphis', state: 'TN' };
  if (lower.includes('chicago')) return { lat: 41.8781, lng: -87.6298, city: 'Chicago', state: 'IL' };
  if (lower.includes('st. louis') || lower.includes('st louis')) return { lat: 38.6270, lng: -90.1994, city: 'St. Louis', state: 'MO' };
  
  return { lat: 32.7767, lng: -96.7970, city: locationStr, state: '' };
}

/**
 * Alias for planRoute / getRoute
 */
export async function getRoute(pickup, drop, departureTime) {
  return planRoute({ pickup, drop, departureTime });
}
