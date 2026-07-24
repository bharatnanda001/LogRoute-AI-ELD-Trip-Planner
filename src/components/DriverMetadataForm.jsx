// src/components/DriverMetadataForm.jsx
import React from 'react';
import { User, Truck, Building2, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function DriverMetadataForm({ metadata = {}, onChangeMetadata }) {
  const handleChange = (key, val) => {
    if (onChangeMetadata) {
      onChangeMetadata({ ...metadata, [key]: val });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
          <FileText size={16} className="text-blue-600" />
          Driver & Daily Log Metadata (FMCSA §395.8)
        </h3>
        <span className="text-[10px] uppercase font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
          Active Log Sheet
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Driver Name</label>
          <input
            type="text"
            value={metadata.driver || ''}
            onChange={(e) => handleChange('driver', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600 font-semibold min-h-11"
            placeholder="John Smith"
          />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Co-Driver Name & License</label>
          <input
            type="text"
            value={metadata.coDriver || ''}
            onChange={(e) => handleChange('coDriver', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600 font-semibold min-h-11"
            placeholder="e.g. Robert Davis (DL-88210-TX)"
          />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Carrier</label>
          <input
            type="text"
            value={metadata.carrier || ''}
            onChange={(e) => handleChange('carrier', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600 font-semibold min-h-11"
          />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Vehicle / Trailer #</label>
          <input
            type="text"
            value={metadata.vehicle || ''}
            onChange={(e) => handleChange('vehicle', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600 font-semibold min-h-11"
          />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Shipping Doc / BOL #</label>
          <input
            type="text"
            value={metadata.shippingDoc || ''}
            onChange={(e) => handleChange('shippingDoc', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600 font-semibold min-h-11"
          />
        </div>
      </div>
    </div>
  );
}
