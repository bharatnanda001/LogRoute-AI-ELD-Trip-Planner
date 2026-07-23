// src/services/mapboxService.js
// ═══════════════════════════════════════════════════════════════════
// Mapbox Directions & Truck Routing Service
// Provides truck-optimized routing with fallback to Leaflet/OSRM
// ═══════════════════════════════════════════════════════════════════

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

export async function fetchTruckRoute(waypoints = []) {
  if (!MAPBOX_TOKEN || waypoints.length < 2) {
    return null; // Fallback to OSRM / Leaflet
  }

  try {
    const coordsStr = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coordsStr}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const route = data.routes?.[0];
    if (!route) return null;

    return {
      distanceMiles: Math.round((route.distance / 1609.34) * 10) / 10,
      durationHours: Math.round((route.duration / 3600) * 10) / 10,
      coordinates: route.geometry.coordinates.map((c) => [c[1], c[0]]), // [lat, lng]
    };
  } catch (err) {
    console.warn('Mapbox route fetch failed, using fallback:', err.message);
    return null;
  }
}
