import { getSyncedDate, formatDateISO } from '../services/timeService';

export default function LogHistory({ onSelectLog }) {
  const today = getSyncedDate();
  const getOffsetDateISO = (offsetDays) => {
    const d = new Date(today.getTime() + offsetDays * 86400000);
    return formatDateISO(d);
  };

  const pastLogs = [
    { date: getOffsetDateISO(0), title: 'Today — Dallas to Houston', drivingHrs: '8h 15m', onDutyHrs: '1h 30m', offDutyHrs: '14h 15m', status: 'Compliant' },
    { date: getOffsetDateISO(-1), title: 'Yesterday — Memphis to Dallas', drivingHrs: '10h 30m', onDutyHrs: '2h 00m', offDutyHrs: '11h 30m', status: 'Compliant' },
    { date: getOffsetDateISO(-2), title: '2 Days Ago — St. Louis to Memphis', drivingHrs: '6h 45m', onDutyHrs: '1h 15m', offDutyHrs: '16h 00m', status: 'Compliant' },
    { date: getOffsetDateISO(-3), title: '3 Days Ago — Chicago to St. Louis', drivingHrs: '9h 10m', onDutyHrs: '1h 45m', offDutyHrs: '13h 05m', status: 'Warning' },
    { date: getOffsetDateISO(-4), title: '4 Days Ago — 34-Hour Restart', drivingHrs: '0h 00m', onDutyHrs: '0h 00m', offDutyHrs: '24h 00m', status: 'Compliant' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Calendar size={22} />
          </div>
          <div>
            <h2 className="text-slate-100 font-extrabold text-lg">Official RODS Log History & Audit Vault</h2>
            <p className="text-slate-400 text-xs">Past 7 to 8 days required FMCSA driver log records</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pastLogs.map((log) => (
          <div key={log.date} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-mono">{log.date}</span>
              <span
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 ${
                  log.status === 'Compliant'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {log.status === 'Compliant' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                <span>{log.status}</span>
              </span>
            </div>

            <h3 className="text-slate-200 font-bold text-sm">{log.title}</h3>

            <div className="grid grid-cols-3 gap-2 py-1 text-center bg-slate-900/60 p-2 rounded-lg text-xs font-mono">
              <div>
                <div className="text-slate-500 text-[10px]">Driving</div>
                <div className="text-slate-200 font-bold">{log.drivingHrs}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px]">On Duty</div>
                <div className="text-slate-200 font-bold">{log.onDutyHrs}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px]">Off Duty</div>
                <div className="text-slate-200 font-bold">{log.offDutyHrs}</div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => onSelectLog(log)}
                className="flex-1 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Play size={14} />
                <span>Replay Log</span>
              </button>

              <button
                onClick={() => exportLogToPdf({ logDate: log.date, totals: { driving: 495, off_duty: 855, sleeper_berth: 0, on_duty_not_driving: 90 } })}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                title="Download PDF"
              >
                <Download size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
