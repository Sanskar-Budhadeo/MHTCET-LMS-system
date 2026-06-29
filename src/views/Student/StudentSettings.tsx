import React, { useState, useEffect } from 'react';
import { useLms } from '../../context/LmsContext';
import { User, ShieldAlert, Sliders, ToggleLeft, ToggleRight, Building2, LogOut, Trash2 } from 'lucide-react';

export const StudentSettings: React.FC = () => {
  const { activeUser, logout } = useLms();

  // Load Tailwind CDN dynamically to parse utility classes if not already globally configured
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  // Profile data
  const studentName = activeUser?.name || 'Rahul Sharma';
  const studentPrn = activeUser?.prn || 'MHT202684730';
  const studentEmail = activeUser?.email || 'rahul@cet.com';

  // State for toggles
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // State for institute code input
  const [instituteCode, setInstituteCode] = useState('');
  const [isLinked, setIsLinked] = useState(false);

  const handleLinkInstitute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instituteCode.trim()) {
      alert('Please enter a valid institute code.');
      return;
    }
    setIsLinked(true);
    alert(`Account linked successfully to institute: ${instituteCode}`);
  };

  return (
    <div className="w-full min-h-screen text-slate-100 flex flex-col gap-8 p-4 md:p-8 bg-[#09090b] font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col gap-1.5 border-b border-zinc-800 pb-5">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          <Sliders className="w-8 h-8 text-[#e2fc5c]" /> Account Settings
        </h1>
        <p className="text-sm text-slate-400 font-semibold leading-relaxed">
          Manage your personal details, synchronize target coaching classes, and toggle interface configurations.
        </p>
      </div>

      {/* Profile & Avatar Section */}
      <div className="bg-[#121214] border border-[#27272a] rounded-3xl p-6 shadow-lg flex flex-col md:flex-row items-center gap-6">
        <div className="relative">
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200" 
            alt="Profile Avatar" 
            className="w-24 h-24 rounded-full object-cover border-4 border-[#e2fc5c] shadow-inner"
          />
          <div className="absolute bottom-0 right-0 bg-[#09090b] border border-zinc-800 p-1.5 rounded-full cursor-pointer hover:border-zinc-700">
            <span className="text-[10px] px-1 font-bold text-slate-300">Edit</span>
          </div>
        </div>
        <div className="flex flex-col text-center md:text-left gap-1">
          <h2 className="text-xl font-extrabold text-white">{studentName}</h2>
          <span className="text-xs font-black text-[#e2fc5c] bg-[#e2fc5c]/10 px-3 py-1 rounded-full border border-[#e2fc5c]/20 self-center md:self-start mt-1">
            PRN: {studentPrn}
          </span>
          <p className="text-xs text-slate-500 font-semibold mt-1">Email: {studentEmail}</p>
        </div>
      </div>

      {/* Institute Connection (CRITICAL) */}
      <div className="bg-[#121214] border border-[#27272a] rounded-3xl p-6 shadow-lg">
        <div className="flex items-center gap-2 border-b border-zinc-850 pb-3.5 mb-5">
          <Building2 className="w-5 h-5 text-[#e2fc5c]" />
          <h2 className="text-sm font-bold text-white">Institute Link</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-semibold mb-4">
          Link your LMS portal account directly with your offline tutoring academy or coaching institute. This allows teachers to upload assignments, view your mock scores, and post manual feedback reports.
        </p>

        {isLinked ? (
          <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex justify-between items-center">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold">Successfully Connected</span>
              <span className="text-[10px] font-semibold text-slate-400">Linked to: {instituteCode}</span>
            </div>
            <button 
              onClick={() => { setIsLinked(false); setInstituteCode(''); }}
              className="text-xs text-slate-500 hover:text-red-400 font-bold transition"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <form onSubmit={handleLinkInstitute} className="flex flex-col sm:flex-row gap-3 max-w-lg">
            <input 
              type="text" 
              className="flex-1 bg-[#09090b] border border-zinc-800 text-xs rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-zinc-700 font-semibold placeholder:text-slate-600"
              value={instituteCode}
              onChange={(e) => setInstituteCode(e.target.value)}
              placeholder="Enter Institute Code (e.g., VIDYA-123)"
            />
            <button 
              type="submit"
              className="bg-[#e2fc5c] hover:bg-[#c4de32] text-[#09090b] px-6 py-3 rounded-xl text-xs font-black transition uppercase tracking-wider"
            >
              Link Account
            </button>
          </form>
        )}
      </div>

      {/* Preferences & Toggles */}
      <div className="bg-[#121214] border border-[#27272a] rounded-3xl p-6 shadow-lg flex flex-col gap-5">
        <h2 className="text-sm font-bold text-white border-b border-zinc-850 pb-3.5">
          Interface Preferences
        </h2>

        <div className="flex flex-col gap-4">
          {/* Push Notifications Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#09090b] border border-zinc-900 rounded-2xl">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-200">Push Notifications</span>
              <span className="text-[10px] text-slate-500 font-semibold">Get alerts when mock scores are processed.</span>
            </div>
            <button 
              onClick={() => setPushNotifications(!pushNotifications)}
              className="text-[#e2fc5c] transition"
            >
              {pushNotifications ? (
                <ToggleRight className="w-10 h-10 fill-[#e2fc5c]/10" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-600" />
              )}
            </button>
          </div>

          {/* Weekly Email Reports */}
          <div className="flex items-center justify-between p-3 bg-[#09090b] border border-zinc-900 rounded-2xl">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-200">Weekly Email Reports</span>
              <span className="text-[10px] text-slate-500 font-semibold">Receive syllabus analytics digest in your inbox.</span>
            </div>
            <button 
              onClick={() => setWeeklyReports(!weeklyReports)}
              className="text-[#e2fc5c] transition"
            >
              {weeklyReports ? (
                <ToggleRight className="w-10 h-10 fill-[#e2fc5c]/10" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-600" />
              )}
            </button>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between p-3 bg-[#09090b] border border-zinc-900 rounded-2xl">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-200">Dark Mode</span>
              <span className="text-[10px] text-slate-500 font-semibold">Enable high-contrast dark theme background.</span>
            </div>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="text-[#e2fc5c] transition"
            >
              {darkMode ? (
                <ToggleRight className="w-10 h-10 fill-[#e2fc5c]/10" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-950/10 border border-red-500/20 rounded-3xl p-6 shadow-lg flex flex-col gap-5">
        <div className="flex items-center gap-2 border-b border-red-500/10 pb-3.5 text-red-400">
          <ShieldAlert className="w-5 h-5" />
          <h2 className="text-sm font-bold">Danger Zone</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-semibold mb-2">
          Irreversible actions related to your student credentials. Proceed with caution.
        </p>

        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => logout()}
            className="flex items-center gap-2 bg-[#121214] border border-zinc-800 hover:bg-zinc-900 text-slate-300 font-bold rounded-2xl px-5 py-3 text-xs transition"
          >
            <LogOut className="w-4 h-4" /> Sign Out of Account
          </button>
          <button 
            onClick={() => alert('Account delete simulation triggered.')}
            className="flex items-center gap-2 bg-red-900/10 hover:bg-red-900/20 border border-red-500/30 text-red-400 font-bold rounded-2xl px-5 py-3 text-xs transition"
          >
            <Trash2 className="w-4 h-4" /> Delete Account Permanently
          </button>
        </div>
      </div>

    </div>
  );
};
