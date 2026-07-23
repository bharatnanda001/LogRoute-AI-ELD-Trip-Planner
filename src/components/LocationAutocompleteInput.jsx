// src/components/LocationAutocompleteInput.jsx
// ═══════════════════════════════════════════════════════════════════
// Smart Location Autocomplete — Stripe / Linear American SaaS Design
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MapPin, Building2, Truck } from 'lucide-react';

const COMMON_TRUCKING_LOCATIONS = [
  { city: 'Dallas', state: 'TX', zip: '75201', label: 'Dallas, TX', type: 'Major Freight Hub', lat: 32.7767, lng: -96.7970 },
  { city: 'Houston', state: 'TX', zip: '77001', label: 'Houston, TX', type: 'Port & Logistics Hub', lat: 29.7604, lng: -95.3698 },
  { city: 'Chicago', state: 'IL', zip: '60601', label: 'Chicago, IL', type: 'Midwest Intermodal Rail Hub', lat: 41.8781, lng: -87.6298 },
  { city: 'Atlanta', state: 'GA', zip: '30301', label: 'Atlanta, GA', type: 'Southeast Distribution Hub', lat: 33.7490, lng: -84.3880 },
  { city: 'Los Angeles', state: 'CA', zip: '90001', label: 'Los Angeles, CA', type: 'Port & Freight Terminal', lat: 34.0522, lng: -118.2437 },
  { city: 'New York', state: 'NY', zip: '10001', label: 'New York, NY', type: 'Metro Freight Hub', lat: 40.7128, lng: -74.0060 },
  { city: 'Memphis', state: 'TN', zip: '38101', label: 'Memphis, TN', type: 'National Cargo & Airport Hub', lat: 35.1495, lng: -90.0490 },
  { city: 'Indianapolis', state: 'IN', zip: '46201', label: 'Indianapolis, IN', type: 'Crossroads Trucking Terminal', lat: 39.7684, lng: -86.1581 },
  { city: 'Phoenix', state: 'AZ', zip: '85001', label: 'Phoenix, AZ', type: 'Southwest Freight Hub', lat: 33.4484, lng: -112.0740 },
  { city: 'Denver', state: 'CO', zip: '80201', label: 'Denver, CO', type: 'Mountain Region Freight Corridor', lat: 39.7392, lng: -104.9903 },
  { city: 'Seattle', state: 'WA', zip: '98101', label: 'Seattle, WA', type: 'Pacific Northwest Port', lat: 47.6062, lng: -122.3321 },
  { city: 'Miami', state: 'FL', zip: '33101', label: 'Miami, FL', type: 'Port & International Cargo Terminal', lat: 25.7617, lng: -80.1918 },
  { city: 'Kansas City', state: 'MO', zip: '64101', label: 'Kansas City, MO', type: 'Central Intermodal Freight Hub', lat: 39.0997, lng: -94.5786 },
  { city: 'Columbus', state: 'OH', zip: '43201', label: 'Columbus, OH', type: 'Logistics Belt Terminal', lat: 39.9612, lng: -82.9988 },
  { city: 'Nashville', state: 'TN', zip: '37201', label: 'Nashville, TN', type: 'Freight Transit Hub', lat: 36.1627, lng: -86.7816 },
  { city: 'Salt Lake City', state: 'UT', zip: '84101', label: 'Salt Lake City, UT', type: 'Intermountain Freight Corridor', lat: 40.7608, lng: -111.8910 },
  { city: 'St. Louis', state: 'MO', zip: '63101', label: 'St. Louis, MO', type: 'Mississippi River & Rail Hub', lat: 38.6270, lng: -90.1994 },
  { city: 'Detroit', state: 'MI', zip: '48201', label: 'Detroit, MI', type: 'Automotive & Freight Corridor', lat: 42.3314, lng: -83.0458 },
  { city: 'Minneapolis', state: 'MN', zip: '55401', label: 'Minneapolis, MN', type: 'Upper Midwest Cargo Hub', lat: 44.9778, lng: -93.2650 },
  { city: 'Charlotte', state: 'NC', zip: '28201', label: 'Charlotte, NC', type: 'East Coast Distribution Center', lat: 35.2271, lng: -80.8431 },
  { city: 'Laredo', state: 'TX', zip: '78040', label: 'Laredo, TX', type: 'Border Commercial Crossing', lat: 27.5306, lng: -99.4803 },
  { city: 'El Paso', state: 'TX', zip: '79901', label: 'El Paso, TX', type: 'Border Freight Hub', lat: 31.7619, lng: -106.4850 },
  { city: 'San Antonio', state: 'TX', zip: '78201', label: 'San Antonio, TX', type: 'Texas Triangle Transit Hub', lat: 29.4241, lng: -98.4936 },
  { city: 'Oklahoma City', state: 'OK', zip: '73101', label: 'Oklahoma City, OK', type: 'I-40 / I-35 Freight Junction', lat: 35.4676, lng: -97.5164 },
  { city: 'Baltimore', state: 'MD', zip: '21201', label: 'Baltimore, MD', type: 'Mid-Atlantic Port Terminal', lat: 39.2904, lng: -76.6122 },
];

export default function LocationAutocompleteInput({
  value,
  onChange,
  placeholder = 'e.g. Dallas, TX',
  iconColor = 'text-slate-400',
  className = '',
  required = false,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    onChange(text);

    if (text.trim().length > 0) {
      const query = text.toLowerCase();
      const filtered = COMMON_TRUCKING_LOCATIONS.filter(
        (loc) =>
          loc.city.toLowerCase().includes(query) ||
          loc.state.toLowerCase().includes(query) ||
          loc.label.toLowerCase().includes(query) ||
          loc.type.toLowerCase().includes(query)
      );
      setSuggestions(filtered);
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions(COMMON_TRUCKING_LOCATIONS.slice(0, 6));
      setIsOpen(true);
    }
  };

  const handleSelectSuggestion = (loc) => {
    onChange(loc.label);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && suggestions[selectedIndex]) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleFocus = () => {
    const text = value || '';
    if (text.trim().length > 0) {
      const query = text.toLowerCase();
      const filtered = COMMON_TRUCKING_LOCATIONS.filter(
        (loc) =>
          loc.city.toLowerCase().includes(query) ||
          loc.state.toLowerCase().includes(query) ||
          loc.label.toLowerCase().includes(query)
      );
      setSuggestions(filtered);
    } else {
      setSuggestions(COMMON_TRUCKING_LOCATIONS.slice(0, 6));
    }
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin size={18} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${iconColor}`} />
        <input
          type="text"
          required={required}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10 transition-all ${className}`}
        />
      </div>

      {/* Recommendations Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in duration-150">
          <div className="px-3.5 py-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
            <span>Recommended Freight Locations</span>
            <span className="text-blue-600 font-semibold">Click to Select</span>
          </div>

          {suggestions.map((loc, idx) => (
            <div
              key={`${loc.city}-${loc.state}-${idx}`}
              onClick={() => handleSelectSuggestion(loc)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                selectedIndex === idx ? 'bg-blue-50 text-blue-900 border-l-4 border-blue-600' : 'hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-100 rounded-lg text-blue-600 shrink-0">
                  <Building2 size={16} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{loc.label}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Truck size={10} className="text-slate-400" />
                    <span>{loc.type}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {loc.lat.toFixed(2)}, {loc.lng.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

LocationAutocompleteInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  iconColor: PropTypes.string,
  className: PropTypes.string,
  required: PropTypes.bool,
};
