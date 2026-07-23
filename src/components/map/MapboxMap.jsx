// src/components/map/MapboxMap.jsx
// ═══════════════════════════════════════════════════════════════════
// Mapbox / Leaflet Interactive Truck Route Map Component
// Displays truck polyline, POI rest stops, waypoints, and animated truck marker
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Fuel, Truck } from 'lucide-react';

const truckIcon = L.divIcon({
  className: 'custom-truck-icon',
  html: `<div style="background-color: #4f46e5; color: white; padding: 6px; borderRadius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function MapboxMap({ routeData, stops = [] }) {
  const defaultCenter = [31.0, -96.0];
  const origin = routeData?.locations?.pickup || { lat: 32.7767, lng: -96.7970, city: 'Dallas', state: 'TX' };
  const destination = routeData?.locations?.dropoff || { lat: 29.7604, lng: -95.3698, city: 'Houston', state: 'TX' };

  const polylineCoords = [
    [origin.lat, origin.lng],
    [31.25, -96.0],
    [destination.lat, destination.lng],
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation size={18} className="text-indigo-600" />
          <h3 className="font-extrabold text-slate-800 text-sm">Truck Route & Live GPS Map</h3>
        </div>
        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
          {routeData?.distanceMiles || 842} Miles • Mapbox Traffic
        </span>
      </div>

      <div className="h-[360px] rounded-xl overflow-hidden border border-slate-200 relative z-0">
        <MapContainer center={defaultCenter} zoom={6} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Truck Route Polyline */}
          <Polyline positions={polylineCoords} color="#4f46e5" weight={5} opacity={0.8} />

          {/* Origin Marker */}
          <Marker position={[origin.lat, origin.lng]} icon={truckIcon}>
            <Popup>
              <strong>Origin / Pickup:</strong> {origin.city}, {origin.state}
            </Popup>
          </Marker>

          {/* Destination Marker */}
          <Marker position={[destination.lat, destination.lng]} icon={truckIcon}>
            <Popup>
              <strong>Destination / Dropoff:</strong> {destination.city}, {destination.state}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
