// src/components/DriverMetadataForm.jsx
// ═══════════════════════════════════════════════════════════════════
// Driver & Vehicle Metadata Form — Includes Co-Driver Entry Field
// ═══════════════════════════════════════════════════════════════════
import React from 'react';

export default function DriverMetadataForm({ metadata = {}, onUpdate }) {
  const handleChange = (key, value) => {
    onUpdate && onUpdate({ ...metadata, [key]: value });
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Driver Name</label>
          <input
            type="text"
            value={metadata.driver || ''}
            onChange={(e) => handleChange('driver', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600 font-semibold min-h-[44px]"
            placeholder="John Smith"
          />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Co-Driver Name & License</label>
          <input
            type="text"
            value={metadata.coDriver || ''}
            onChange={(e) => handleChange('coDriver', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600 font-semibold min-h-[44px]"
            placeholder="e.g. Robert Davis (DL-88210-TX)"
          />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Carrier</label>
          <input
            type="text"
            value={metadata.carrier || ''}
            onChange={(e) => handleChange('carrier', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600 font-semibold min-h-[44px]"
          />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Vehicle / Trailer #</label>
          <input
            type="text"
            value={metadata.vehicle || ''}
            onChange={(e) => handleChange('vehicle', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600 font-semibold min-h-[44px]"
          />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Shipping Doc / BOL #</label>
          <input
            type="text"
            value={metadata.shippingDoc || ''}
            onChange={(e) => handleChange('shippingDoc', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600 font-semibold min-h-[44px]"
          />
        </div>
      </div>
    </div>
  );
}
