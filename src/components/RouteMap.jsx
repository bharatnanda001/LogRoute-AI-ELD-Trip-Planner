// src/components/RouteMap.jsx
// ═══════════════════════════════════════════════════════════════════
// Interactive Leaflet & Mapbox Truck Route Map
// Safe against undefined stop types, handles tab switches cleanly
// ═══════════════════════════════════════════════════════════════════

import React, { useEffect, useRef } from 'react';
import { Navigation } from 'lucide-react';

export default function RouteMap({ routeData, stops = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const startLoc = routeData?.locations?.current || routeData?.locations?.pickup || { lat: 32.7767, lng: -96.7970, city: 'Dallas', state: 'TX' };
  const pickupLoc = routeData?.locations?.pickup || { lat: 32.7767, lng: -96.7970, city: 'Dallas', state: 'TX' };
  const dropoffLoc = routeData?.locations?.dropoff || { lat: 29.7604, lng: -95.3698, city: 'Houston', state: 'TX' };

  useEffect(() => {
    let isMounted = true;

    function initLeafletMap() {
      if (!mapContainerRef.current || !isMounted) return;
      const L = window.L;
      if (!L) return;

      // Clean up previous map instance if element re-mounted
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize Leaflet map
      const map = L.map(mapContainerRef.current).setView([pickupLoc.lat, pickupLoc.lng], 6);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      const polylinePoints = [
        [startLoc.lat, startLoc.lng],
        [pickupLoc.lat, pickupLoc.lng],
        [dropoffLoc.lat, dropoffLoc.lng],
      ];

      // Draw route polyline
      L.polyline(polylinePoints, {
        color: '#6366f1',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);

      // Start / Pickup Marker
      L.circleMarker([pickupLoc.lat, pickupLoc.lng], {
        radius: 9,
        color: '#10b981',
        fillColor: '#34d399',
        fillOpacity: 1,
      }).addTo(map).bindPopup(`<b>Pickup Location 📍</b><br>${pickupLoc.city}, ${pickupLoc.state}`);

      // Dropoff Destination Marker
      L.circleMarker([dropoffLoc.lat, dropoffLoc.lng], {
        radius: 9,
        color: '#ef4444',
        fillColor: '#f87171',
        fillOpacity: 1,
      }).addTo(map).bindPopup(`<b>Dropoff Destination 📦</b><br>${dropoffLoc.city}, ${dropoffLoc.state}`);

      // Render intermediate stops safely
      stops.forEach((stop, idx) => {
        if (!stop) return;
        const typeStr = String(stop.type || stop.annotation || stop.dutyStatus || '');

        if (stop.dutyStatus !== 'driving') {
          const ratio = (idx + 1) / (stops.length + 1);
          const stopLat = pickupLoc.lat + (dropoffLoc.lat - pickupLoc.lat) * ratio;
          const stopLng = pickupLoc.lng + (dropoffLoc.lng - pickupLoc.lng) * ratio;

          let color = '#f59e0b';
          if (typeStr.toLowerCase().includes('fuel')) color = '#10b981';
          if (typeStr.toLowerCase().includes('sleeper') || typeStr.toLowerCase().includes('reset')) color = '#8b5cf6';

          L.circleMarker([stopLat, stopLng], {
            radius: 7,
            color: color,
            fillColor: color,
            fillOpacity: 0.9,
          }).addTo(map).bindPopup(`<b>${typeStr || 'En-route Stop'}</b><br>Duration: ${stop.durationHours || 0.5}h`);
        }
      });

      // Fit bounds safely
      try {
        const bounds = L.latLngBounds(polylinePoints);
        map.fitBounds(bounds, { padding: [40, 40] });
        setTimeout(() => map.invalidateSize(), 200);
      } catch (_) { /* ignore bounds error */ }
    }

    if (typeof window !== 'undefined') {
      if (!window.L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => { if (isMounted) initLeafletMap(); };
        document.body.appendChild(script);
      } else {
        initLeafletMap();
      }
    }

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [routeData, stops]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4 font-sans">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg">
            <Navigation size={20} />
          </div>
          <div>
            <h3 className="text-slate-100 font-bold text-base">Route Map & Stop Locations</h3>
            <p className="text-slate-400 text-xs">FMCSA Enforced Stop Sequence & Mileage Polyline</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="flex items-center gap-1 text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/> Pickup/Fuel</span>
          <span className="flex items-center gap-1 text-amber-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"/> Rest Break</span>
          <span className="flex items-center gap-1 text-purple-400"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"/> Sleep Reset</span>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-slate-800 h-95 bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full z-10" />
      </div>

      {/* Stop Sequence Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {stops.slice(0, 4).map((s, idx) => (
          <div key={idx} className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 text-xs space-y-1">
            <div className="text-indigo-400 font-bold flex items-center justify-between">
              <span>Stop #{idx + 1}</span>
              <span className="text-[10px] text-slate-400">{s.durationHours || 0.5}h</span>
            </div>
            <div className="text-slate-200 font-semibold truncate">{s.type || s.annotation || 'Stop'}</div>
            <div className="text-slate-500 text-[10px] uppercase font-mono">{s.dutyStatus || 'on_duty'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
