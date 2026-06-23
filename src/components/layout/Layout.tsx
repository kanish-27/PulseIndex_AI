import React from 'react';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  FolderLock, 
  Flame, 
  History, 
  LogOut, 
  Activity, 
  Server,
  AlertOctagon,
  ChevronRight,
  ShieldAlert,
  User
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    activeTab, 
    setActiveTab, 
    user, 
    logout, 
    breakGlassActive, 
    activeEmergencyDoctor,
    deactivateBreakGlass,
    providers,
    currentPatientProfile
  } = useApp();

  if (!user) return <>{children}</>;

  const currentProvider = user.role !== 'patient' && providers 
    ? providers.find(p => p.id === user.providerId || p.name === user.institution) 
    : null;
  
  const hasRead = currentProvider?.permissions.read || (breakGlassActive && user.role === 'doctor');
  const hasWrite = currentProvider?.permissions.write;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-primary-600' },
    { id: 'vault', label: 'Patient Health Vault', icon: FolderLock, color: 'text-primary-600' },
    ...(user.role === 'patient' ? [
      { id: 'consent', label: 'Consent Intelligence', icon: ShieldCheck, color: 'text-primary-600' }
    ] : []),
    ...(user.role === 'patient' || user.role === 'doctor' ? [
      { id: 'guardian', label: 'Clinical Safety Copilot', icon: ShieldAlert, color: 'text-warning' },
      { id: 'emergency', label: 'Emergency Access', icon: Flame, color: 'text-danger' }
    ] : []),
    { id: 'audit', label: 'Healthcare Trust Center', icon: History, color: 'text-primary-600' }
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800 font-sans relative">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-10">
        {/* Brand */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600 text-white shadow-sm">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900 leading-none">PulseIndex <span className="text-primary-600">AI</span></h2>
            <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase font-semibold">Health Intelligence</span>
          </div>
        </div>

        {/* Clinician / Lab Portal Banner */}
        {user.role !== 'patient' && (
          <div className="p-4 mx-4 mt-4 rounded-xl border border-primary-100 bg-primary-50/50 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary-700 font-mono">
                {user.role === 'doctor' ? 'Clinician Portal' : 'Laboratory Workspace'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
            </div>
            
            <div className="space-y-1">
              <div className="text-[11px] text-slate-800 font-semibold truncate">{user.institution}</div>
              <div className="text-[9px] text-slate-500 flex items-center gap-1 font-mono">
                <span>Active Patient:</span>
                <span className="text-slate-800 font-medium">{currentPatientProfile.name}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[9px] font-mono">
              <span className="text-slate-400">Read Access:</span>
              <span className={hasRead ? "text-emerald-600 font-bold" : "text-danger font-bold"}>
                {hasRead ? "GRANTED" : "BLOCKED"}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400">Write Access:</span>
              <span className={hasWrite ? "text-emerald-600 font-bold" : "text-danger font-bold"}>
                {hasWrite ? "GRANTED" : "BLOCKED"}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group
                  ${isActive 
                    ? 'bg-primary-50/70 text-primary-700 border border-primary-100/50 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className={`${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight size={12} className="text-primary-500" />}
              </button>
            );
          })}
        </nav>

        {/* Compliance status indicators */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-[10px] space-y-2 text-slate-500">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5"><ShieldCheck size={11} className="text-slate-400" /> HIPAA Security</span>
            <span className="text-emerald-600 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Verified
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5"><Server size={11} className="text-slate-400" /> Trust Ledger</span>
            <span className="text-slate-600 font-medium">Connected</span>
          </div>
        </div>

        {/* User profile section */}
        <div className="p-4 border-t border-slate-150 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-xs">
              {user.name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate w-32">
              <div className="text-xs font-semibold text-slate-950 truncate">{user.name}</div>
              <div className="text-[9px] text-slate-500 truncate">{user.email}</div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-danger transition-colors"
            title="Log Out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Global Warning Banner if break-glass active */}
        {breakGlassActive && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2 flex items-center justify-between text-xs text-red-800">
            <div className="flex items-center gap-2">
              <AlertOctagon size={14} className="text-danger" />
              <span>
                <strong>EMERGENCY ACCESS PROTOCOL ACTIVE:</strong> {activeEmergencyDoctor} has temporary emergency access keys. Access event logged for medical trust.
              </span>
            </div>
            <button 
              onClick={deactivateBreakGlass}
              className="px-2 py-0.5 bg-danger text-white rounded hover:bg-danger/90 font-semibold text-[10px] uppercase tracking-wider transition-colors"
            >
              Close Access
            </button>
          </div>
        )}

        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8">
          <div>
            <h1 className="text-md font-bold text-slate-950 m-0 tracking-tight">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-[10px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Sovereign Health Keys Verified
            </div>
          </div>
        </header>

        {/* Main scrollable body */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
};
