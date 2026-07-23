// src/App.jsx
// ═══════════════════════════════════════════════════════════════════
// ELD Trip Planner — Master App Container & State Orchestrator
// American SaaS Enterprise UI (Stripe / Linear / Vercel Aesthetic)
// ═══════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import DriverDashboard from './components/DriverDashboard';
import FleetManagerDashboard from './components/FleetManagerDashboard';
import AdminDashboard from './components/AdminDashboard';
import TripPlanner from './components/TripPlanner';
import SplitScreenLogView from './components/SplitScreenLogView';
import RouteMap from './components/RouteMap';
import LogHistory from './components/LogHistory';
import AICopilotModal from './components/AICopilotModal';
import RecapScreen from './components/hos/RecapScreen';
import DVIRForm from './components/reports/DVIRForm';
import EditHistoryPanel from './components/timeline/EditHistoryPanel';
import DriverCertification from './components/driver/DriverCertification';
import RoadsideInspectionMode from './features/inspection/RoadsideInspectionMode';
import useHosClock from './hooks/useHosClock';
import useGps from './hooks/useGps';
import { exportLogToPdf } from './utils/PdfExportService';
import { formatDateISO, formatDateLong } from './services/timeService';
import DevicePermissionsBar from './components/DevicePermissionsBar';
import { AlertTriangle, Compass, FileText, BarChart3, ClipboardCheck, ShieldCheck, MapPin, History, LayoutDashboard } from 'lucide-react';

import { useTimelineStore } from './stores/useTimelineStore';
import { useGpsStore } from './stores/useGpsStore';
import { useAuthStore } from './stores/useAuthStore';
import { useTripStore } from './stores/useTripStore';
import { useUiStore } from './stores/useUiStore';

function App() {
  const { activeRole, setActiveRole, activeCompany, setActiveCompany, companies } = useAuthStore();
  const { activeTab, setActiveTab, isAiCopilotOpen, setIsAiCopilotOpen } = useUiStore();

  const {
    blocks: timelineBlocks,
    setBlocks: setTimelineBlocks,
    activeMin,
    setActiveMin,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    eventLog,
    auditTrail,
    updateDutyStatus,
  } = useTimelineStore();

  const {
    simulatedSpeed,
    setSimulatedSpeed,
    showAutoDrivePrompt,
    setShowAutoDrivePrompt,
    setIdleTimeSeconds,
  } = useGpsStore();

  const {
    activeTrip,
    routeData,
    segments,
    dailyLogs,
    summary,
    warnings,
    setTripData,
  } = useTripStore();

  const activeBlock = timelineBlocks.find(b => b.startMin <= activeMin && b.endMin > activeMin) || timelineBlocks[timelineBlocks.length - 1];
  const currentDutyStatus = activeBlock?.dutyStatus || 'off_duty';

  // 1. Playback Timer Loop (Synchronized trip replay)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveMin(activeMin >= 1440 ? 1440 : activeMin + 15);
      if (activeMin >= 1440) setIsPlaying(false);
    }, 1000 / playbackSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, activeMin, setActiveMin, setIsPlaying]);

  // 2. Speed simulation & Automatic driving detection loop
  useEffect(() => {
    if (simulatedSpeed > 5 && currentDutyStatus !== 'driving') {
      const nowMin = activeMin > 0 ? activeMin : 480;
      updateDutyStatus('driving', nowMin, 'Automatic Driving Detection (Speed > 5 mph)');
    }

    if (simulatedSpeed === 0 && currentDutyStatus === 'driving') {
      const idleInterval = setInterval(() => {
        setIdleTimeSeconds((prev) => {
          if (prev >= 4) {
            setShowAutoDrivePrompt(true);
            clearInterval(idleInterval);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(idleInterval);
    } else {
      setIdleTimeSeconds(0);
    }
  }, [simulatedSpeed, currentDutyStatus, activeMin, updateDutyStatus, setIdleTimeSeconds, setShowAutoDrivePrompt]);

  const handleTripGenerated = (data) => {
    setTripData(data);
    const newBlocks = data.segments.map((s, idx) => ({
      id: 'blk_' + idx,
      dutyStatus: s.dutyStatus,
      startMin: s.startMin || 0,
      endMin: s.endMin || 60,
      annotation: s.annotation,
      location: s.location,
    }));
    setTimelineBlocks(newBlocks);
    setActiveTab('daily_log');
  };

  const handleAcceptAiBreak = () => {
    const breakBlock = {
      id: 'ai_break_' + Date.now(),
      dutyStatus: 'off_duty',
      startMin: 765,
      endMin: 795,
      annotation: '30-min AI Rest Break',
    };
    setTimelineBlocks([...timelineBlocks, breakBlock]);
    setActiveTab('daily_log');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 md:pb-12 selection:bg-blue-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        activeCompany={activeCompany}
        onCompanyChange={setActiveCompany}
        companies={companies}
        onOpenAiCopilot={() => setIsAiCopilotOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Desktop Navigation Tabs — Clean Stripe/Linear Aesthetic */}
        {activeRole === 'driver' && (
          <div className="hidden md:flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs">
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: 'dashboard', label: 'Driver Dashboard', icon: LayoutDashboard },
                { id: 'trip_planner', label: 'Trip Planner', icon: Compass },
                { id: 'daily_log', label: 'Timeline Editor', icon: FileText },
                { id: 'recap', label: 'HOS Recap', icon: BarChart3 },
                { id: 'dvir', label: 'DVIR Inspection', icon: ClipboardCheck },
                { id: 'inspection', label: 'Roadside Mode', icon: ShieldCheck },
                { id: 'map', label: 'Route Map', icon: MapPin },
                { id: 'history', label: 'Log Vault & Audit', icon: History },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pr-3 text-xs">
              <span className="text-slate-400 font-medium">Engine:</span>
              <span className="bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px] px-2.5 py-0.5 rounded-md font-mono">
                Zustand Shared HOS
              </span>
            </div>
          </div>
        )}

        {/* Manager & Admin Views */}
        {activeRole === 'manager' && (
          <FleetManagerDashboard
            activeCompany={activeCompany}
            onSelectDriverLog={() => {
              setActiveRole('driver');
              setActiveTab('daily_log');
            }}
          />
        )}

        {activeRole === 'admin' && (
          <AdminDashboard
            companies={companies}
            onAddCompany={() => {}}
          />
        )}

        {/* Driver Views */}
        {activeRole === 'driver' && (
          <DriverViewWithHOS
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentDutyStatus={currentDutyStatus}
            tripState={{ activeTrip, routeData, segments, dailyLogs, summary, warnings }}
            timelineBlocks={timelineBlocks}
            setTimelineBlocks={setTimelineBlocks}
            activeCompany={activeCompany}
            handleTripGenerated={handleTripGenerated}
            handleAcceptAiBreak={handleAcceptAiBreak}
            activeMin={activeMin}
            setActiveMin={setActiveMin}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            playbackSpeed={playbackSpeed}
            setPlaybackSpeed={setPlaybackSpeed}
            simulatedSpeed={simulatedSpeed}
            setSimulatedSpeed={setSimulatedSpeed}
            showAutoDrivePrompt={showAutoDrivePrompt}
            setShowAutoDrivePrompt={setShowAutoDrivePrompt}
            eventLog={eventLog}
            auditTrail={auditTrail}
            updateDutyStatus={updateDutyStatus}
          />
        )}
      </main>

      {/* AI Copilot Chatbot Modal */}
      <AICopilotModal
        isOpen={isAiCopilotOpen}
        onClose={() => setIsAiCopilotOpen(false)}
        activeTrip={activeTrip}
        dutyStatus={currentDutyStatus}
        timelineBlocks={timelineBlocks}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
}

// Internal wrapper linking live HOS clocks to active Tab View
function DriverViewWithHOS({
  activeTab,
  setActiveTab,
  currentDutyStatus,
  tripState,
  timelineBlocks,
  setTimelineBlocks,
  activeCompany,
  handleTripGenerated,
  handleAcceptAiBreak,
  activeMin,
  setActiveMin,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  simulatedSpeed,
  setSimulatedSpeed,
  showAutoDrivePrompt,
  setShowAutoDrivePrompt,
  eventLog,
  auditTrail,
  updateDutyStatus,
}) {
  const hos = useHosClock({
    segments: timelineBlocks,
    activeMin,
    currentDutyStatus,
    cycleRule: '70_8',
  });

  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Device Permissions Diagnostic Bar */}
      <DevicePermissionsBar />

      {/* Auto-Driving Idle Status Transition Dialog */}
      {showAutoDrivePrompt && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-amber-900">Vehicle Stopped (Speed = 0 mph)</h4>
              <p className="text-xs text-amber-700">Vehicle has been idle for 5 continuous minutes. Switch duty status to On Duty or Off Duty?</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                updateDutyStatus('on_duty_not_driving', activeMin, 'Auto-detected stopped (On Duty)');
                setShowAutoDrivePrompt(false);
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all"
            >
              Set On Duty
            </button>
            <button
              onClick={() => {
                updateDutyStatus('off_duty', activeMin, 'Auto-detected stopped (Off Duty)');
                setShowAutoDrivePrompt(false);
              }}
              className="px-4 py-2 bg-white border border-amber-300 text-amber-900 font-bold text-xs rounded-xl hover:bg-amber-100 transition-all"
            >
              Set Off Duty
            </button>
          </div>
        </div>
      )}

      {/* Active View Render */}
      {activeTab === 'dashboard' && (
        <DriverDashboard
          currentStatus={currentDutyStatus}
          onStatusChange={(st) => updateDutyStatus(st)}
          activeTrip={tripState.activeTrip}
          onNavigateTab={setActiveTab}
          onExportPdf={() => exportLogToPdf(timelineBlocks, { driver: 'John Smith', carrier: 'ABC Logistics LLC' })}
          onAcceptAiBreak={handleAcceptAiBreak}
          clocks={hos.clocks}
          violations={hos.violations}
          warnings={hos.warnings}
          complianceStatus={hos.complianceStatus}
          timelineBlocks={timelineBlocks}
        />
      )}

      {activeTab === 'trip_planner' && (
        <TripPlanner onTripGenerated={handleTripGenerated} />
      )}

      {activeTab === 'daily_log' && (
        <SplitScreenLogView
          blocks={timelineBlocks}
          onChangeBlocks={setTimelineBlocks}
          metadata={{
            driver: 'John Smith',
            carrier: activeCompany.name || 'ABC Logistics LLC',
            vehicle: 'Tractor #T-108 / Trailer #TR-402',
            totalMiles: tripState.summary?.distanceMiles || 842,
          }}
          complianceStatus={hos.complianceStatus}
          activeMin={activeMin}
          setActiveMin={setActiveMin}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          playbackSpeed={playbackSpeed}
          setPlaybackSpeed={setPlaybackSpeed}
        />
      )}

      {activeTab === 'recap' && (
        <RecapScreen
          timelineBlocks={timelineBlocks}
          cycleUsed={hos.clocks.cycleUsed}
          cycleRemaining={hos.clocks.cycleRemaining}
          recapData={hos.recap7Day}
        />
      )}

      {activeTab === 'dvir' && (
        <DVIRForm
          onSubmitDVIR={(dvir) => {
            alert('DVIR Inspection Submitted Successfully!');
            setActiveTab('dashboard');
          }}
        />
      )}

      {activeTab === 'inspection' && (
        <RoadsideInspectionMode
          driverName="John Smith"
          carrierName={activeCompany.name || "ABC Logistics LLC"}
          timelineBlocks={timelineBlocks}
          violations={hos.violations}
          warnings={hos.warnings}
          onExitModal={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'map' && (
        <RouteMap
          routeData={tripState.routeData}
          locations={tripState.routeData?.locations}
          simulatedSpeed={simulatedSpeed}
          onChangeSpeed={setSimulatedSpeed}
          currentDutyStatus={currentDutyStatus}
        />
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <LogHistory
            onSelectLogSheet={(sheet) => setActiveTab('daily_log')}
            onCertifyLog={() => setIsCertModalOpen(true)}
          />
          <EditHistoryPanel
            eventLog={eventLog}
            auditTrail={auditTrail}
          />
        </div>
      )}

      {/* Driver Certification Modal */}
      <DriverCertification
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        logDate={formatDateLong()}
        onCertified={() => {
          setIsCertModalOpen(false);
          alert('Daily RODS Log Certified & Locked!');
        }}
      />
    </div>
  );
}

export default App;
