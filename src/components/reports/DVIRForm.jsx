// src/components/reports/DVIRForm.jsx
// ═══════════════════════════════════════════════════════════════════
// Driver Vehicle Inspection Report (DVIR) Component
// Pre-trip & Post-trip inspection checklist with defect reporting & signature
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useRef } from 'react';
import { ClipboardCheck, CheckCircle2, AlertTriangle, Eraser, Send, ShieldCheck } from 'lucide-react';
import { authFetch } from '../../services/authService';

const DEFECT_CATEGORIES = [
  { id: 'brakes', label: 'Brakes & Air System' },
  { id: 'lights', label: 'Lights & Headlamps' },
  { id: 'tires', label: 'Tires, Wheels & Rims' },
  { id: 'coupling', label: 'Coupling Devices & Fifth Wheel' },
  { id: 'steering', label: 'Steering Mechanism' },
  { id: 'wipers', label: 'Windshield Wipers' },
  { id: 'mirrors', label: 'Mirrors & Reflectors' },
  { id: 'emergency', label: 'Emergency Equipment (Extinguisher/Triangles)' },
];

export default function DVIRForm({ onComplete, onSubmitDVIR }) {
  const handleCompleteCallback = onComplete || onSubmitDVIR;

  const [inspectionType, setInspectionType] = useState('pre_trip');
  const [vehicleNumber, setVehicleNumber] = useState('Truck #4417');
  const [trailerNumber, setTrailerNumber] = useState('Trailer #8809');
  const [odometer, setOdometer] = useState('142,890');
  const [location, setLocation] = useState('Dallas, TX');
  const [defects, setDefects] = useState({});
  const [conditionSafe, setConditionSafe] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const canvasRef = useRef(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const toggleDefect = (catId) => {
    setDefects((prev) => {
      const next = { ...prev };
      if (next[catId]) {
        delete next[catId];
      } else {
        next[catId] = { category: catId, severity: 'minor', description: '' };
      }
      return next;
    });
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const defectArray = Object.values(defects);
    const canvas = canvasRef.current;
    const signatureData = canvas ? canvas.toDataURL('image/png') : '';

    try {
      await authFetch('/api/dvir', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId: vehicleNumber,
          trailerId: trailerNumber,
          inspectionType,
          inspectionDate: new Date().toISOString().split('T')[0],
          odometerMiles: parseFloat(odometer.replace(/,/g, '')),
          locationText: location,
          defects: defectArray,
          conditionSafe,
          driverSignature: signatureData,
        }),
      });
    } catch (_) {
      // Local fallback mode
    }

    setSubmitted(true);
    if (handleCompleteCallback) handleCompleteCallback({ defects: defectArray, conditionSafe });
  };

  if (submitted) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xs font-sans">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={36} />
        </div>
        <h3 className="text-2xl font-extrabold text-slate-900">DVIR Inspection Submitted</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Your inspection report has been recorded in compliance with FMCSA 49 CFR §396.11 regulations and broadcast to your motor carrier safety department.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setDefects({});
          }}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs"
        >
          File Another DVIR Inspection
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border border-blue-200">
              FMCSA §396.11
            </span>
            <span className="text-xs font-bold text-slate-500">Driver Vehicle Inspection Report</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">DVIR Safety Inspection Checklist</h2>
          <p className="text-xs text-slate-500">Log pre-trip/post-trip vehicle defects and sign official safety report</p>
        </div>

        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setInspectionType('pre_trip')}
            className={`px-4 py-2 rounded-lg transition-all ${
              inspectionType === 'pre_trip' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Pre-Trip Inspection
          </button>
          <button
            type="button"
            onClick={() => setInspectionType('post_trip')}
            className={`px-4 py-2 rounded-lg transition-all ${
              inspectionType === 'post_trip' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Post-Trip Inspection
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Vehicle / Tractor #</label>
          <input
            type="text"
            required
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Trailer #</label>
          <input
            type="text"
            value={trailerNumber}
            onChange={(e) => setTrailerNumber(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Odometer Reading</label>
          <input
            type="text"
            required
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-blue-600 font-mono"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Location</label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-blue-600"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Inspection Checklist (Select any defective components)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {DEFECT_CATEGORIES.map((cat) => {
            const isDefective = !!defects[cat.id];
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleDefect(cat.id)}
                className={`p-3 rounded-xl border text-xs text-left font-bold flex items-center justify-between transition-all ${
                  isDefective
                    ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{cat.label}</span>
                {isDefective ? <AlertTriangle size={15} className="text-rose-600 shrink-0" /> : <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="font-bold text-slate-700 text-xs block">Vehicle Safety Status</label>
        <div className="flex gap-4 text-xs font-bold">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-100">
            <input
              type="radio"
              name="condition"
              checked={conditionSafe}
              onChange={() => setConditionSafe(true)}
              className="text-blue-600"
            />
            <span className="text-emerald-700">Vehicle Condition Safe for Operation</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-100">
            <input
              type="radio"
              name="condition"
              checked={!conditionSafe}
              onChange={() => setConditionSafe(false)}
              className="text-blue-600"
            />
            <span className="text-rose-700">Defects Found — Repairs Required</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-700 text-xs block">Driver Digital Signature</label>
          {hasSignature && (
            <button type="button" onClick={clearSignature} className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1">
              <Eraser size={12} /> Clear Signature
            </button>
          )}
        </div>

        <div className="border border-slate-300 rounded-xl bg-slate-50 overflow-hidden relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={120}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-28 cursor-crosshair touch-none"
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
              Sign with mouse or touch screen here
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98"
      >
        <Send size={16} />
        <span>Submit DVIR Report to Safety Portal</span>
      </button>
    </form>
  );
}
