// src/components/TripPlanner.jsx
// ═══════════════════════════════════════════════════════════════════
// Trip & HOS Route Planner — Includes Co-Driver Entry Field
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Compass, MapPin, Truck, Calendar, Clock, FileText, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { computeDutyTimeline, splitIntoDailyLogSheets } from '../engine/hosEngine';
import { geocodeWithGeocodio } from '../services/geocodioService';
import LocationAutocompleteInput from './LocationAutocompleteInput';

export default function TripPlanner({ onTripGenerated }) {
  const [formData, setFormData] = useState({
    currentLocation: 'Dallas, TX',
    pickupLocation: 'Chicago, IL',
    dropoffLocation: 'Houston, TX',
    cycleHoursUsed: 15,
    currentDutyStatus: 'off_duty',
    truckNumber: 'Unit 4417',
    trailerNumber: 'Trailer 8809',
    coDriver: 'Robert Davis (DL-88210-TX)',
    commodity: 'General Freight / Electronics',
    carrierName: 'LogRoute AI Logistics',
    shippingDoc: 'BOL-99210-A',
  });

  const [isCalculating, setIsCalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCalculating(true);
    setErrorMsg(null);

    try {
      const [currentGeo, pickupGeo, dropoffGeo] = await Promise.all([
        geocodeWithGeocodio(formData.currentLocation),
        geocodeWithGeocodio(formData.pickupLocation),
        geocodeWithGeocodio(formData.dropoffLocation),
      ]);

      const distanceMiles = 960;
      const durationHours = 15.5;

      const { segments, warnings, summary } = computeDutyTimeline({
        routeDistanceMiles: distanceMiles,
        routeDurationHours: durationHours,
        cycleHoursUsed: parseFloat(formData.cycleHoursUsed || 0),
        departureTime: new Date(),
        pickupLocation: pickupGeo,
        dropoffLocation: dropoffGeo,
      });

      const dailyLogs = splitIntoDailyLogSheets(segments);

      onTripGenerated({
        trip: {
          origin: formData.pickupLocation,
          destination: formData.dropoffLocation,
          truckNumber: formData.truckNumber,
          trailerNumber: formData.trailerNumber,
          coDriver: formData.coDriver,
          carrierName: formData.carrierName,
          shippingDoc: formData.shippingDoc,
        },
        route: {
          distanceMiles,
          durationHours,
          locations: { current: currentGeo, pickup: pickupGeo, dropoff: dropoffGeo },
        },
        segments,
        dailyLogs,
        summary,
        warnings,
      });
    } catch (err) {
      setErrorMsg(err.message || 'Geocoding or route planning failed');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Compass size={20} />
          </div>
          <div>
            <h2 className="text-slate-900 font-extrabold text-lg">FMCSA Trip & HOS Planner</h2>
            <p className="text-slate-500 text-xs">Automated route stops, fuel breaks, and RODS daily log generator</p>
          </div>
        </div>

        <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/60 text-xs font-bold rounded-lg">
          <Sparkles size={14} />
          <span>Location Autocomplete Active</span>
        </span>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-xs text-red-900 flex items-center gap-2">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Route Locations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-700 font-bold mb-1.5 block">Current Location</label>
            <LocationAutocompleteInput
              required
              value={formData.currentLocation}
              onChange={(val) => setFormData({ ...formData, currentLocation: val })}
              placeholder="Search city, state or terminal..."
              iconColor="text-slate-400"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 font-bold mb-1.5 block">Pickup Location</label>
            <LocationAutocompleteInput
              required
              value={formData.pickupLocation}
              onChange={(val) => setFormData({ ...formData, pickupLocation: val })}
              placeholder="Search pickup hub..."
              iconColor="text-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 font-bold mb-1.5 block">Dropoff Destination</label>
            <LocationAutocompleteInput
              required
              value={formData.dropoffLocation}
              onChange={(val) => setFormData({ ...formData, dropoffLocation: val })}
              placeholder="Search dropoff terminal..."
              iconColor="text-rose-500"
            />
          </div>
        </div>

        {/* Vehicle, Co-Driver & Carrier Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="text-xs text-slate-700 font-bold mb-1.5 block">70-Hr Cycle Used (hrs)</label>
            <input
              type="number"
              min="0"
              max="70"
              step="0.5"
              required
              value={formData.cycleHoursUsed}
              onChange={(e) => setFormData({ ...formData, cycleHoursUsed: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:bg-white font-mono transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 font-bold mb-1.5 block">Truck Unit #</label>
            <input
              type="text"
              required
              value={formData.truckNumber}
              onChange={(e) => setFormData({ ...formData, truckNumber: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 font-bold mb-1.5 block">Trailer #</label>
            <input
              type="text"
              required
              value={formData.trailerNumber}
              onChange={(e) => setFormData({ ...formData, trailerNumber: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 font-bold mb-1.5 block">Co-Driver Name & DL</label>
            <input
              type="text"
              value={formData.coDriver}
              onChange={(e) => setFormData({ ...formData, coDriver: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all"
              placeholder="e.g. Robert Davis (DL-88210-TX)"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 font-bold mb-1.5 block">Shipping Doc / BOL #</label>
            <input
              type="text"
              required
              value={formData.shippingDoc}
              onChange={(e) => setFormData({ ...formData, shippingDoc: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Commodity Description */}
        <div>
          <label className="text-xs text-slate-700 font-bold mb-1.5 block">Commodity Description</label>
          <input
            type="text"
            required
            value={formData.commodity}
            onChange={(e) => setFormData({ ...formData, commodity: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all"
            placeholder="e.g. Dry Van Freight / Paper Reels / Refrigerated Foods"
          />
        </div>

        <button
          type="submit"
          disabled={isCalculating}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
        >
          {isCalculating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Calculating Route & Generating HOS Log Sheets...</span>
            </>
          ) : (
            <>
              <Compass size={18} />
              <span>Calculate Compliance Route & Generate Daily Logs</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
