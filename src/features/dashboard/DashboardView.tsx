import React, { useState } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Flame, 
  FileText, 
  ShieldAlert, 
  ArrowUpRight, 
  Database,
  Lock,
  Sparkles,
  User,
  FolderLock,
  Check,
  Search
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { HealthRecord, AccessRequest } from '../../context/AppContext';
import { ConsentSignatureModal } from '../consent/ConsentSignatureModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export const DashboardView: React.FC = () => {
  const { 
    records, 
    providers, 
    auditLogs, 
    togglePermission, 
    breakGlassActive, 
    setActiveTab,
    user,
    pendingRequests,
    requestAccess,
    triggerBreakGlass,
    approveAccessRequest,
    rejectAccessRequest,
    activePatientName,
    setActivePatientName,
    registeredUsers,
    mongoPatients,
    currentPatientProfile,
    patientProfiles,
    updatePatientProfile
  } = useApp();

  const [activeRequestToSign, setActiveRequestToSign] = useState<AccessRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState('ALL');

  // Care Team state variables
  const [isEditCareTeamOpen, setIsEditCareTeamOpen] = useState(false);
  const [editDocName, setEditDocName] = useState(currentPatientProfile.preferredDoctorName || '');
  const [editHospitalName, setEditHospitalName] = useState(currentPatientProfile.preferredHospitalName || '');
  const [editAge, setEditAge] = useState(currentPatientProfile.age || 30);
  const [editGender, setEditGender] = useState(currentPatientProfile.gender || 'Female');
  const [editBloodGroup, setEditBloodGroup] = useState(currentPatientProfile.bloodGroup || 'O+');

  // Keep state synchronized with profile changes
  React.useEffect(() => {
    setEditDocName(currentPatientProfile.preferredDoctorName || '');
    setEditHospitalName(currentPatientProfile.preferredHospitalName || '');
    setEditAge(currentPatientProfile.age || 30);
    setEditGender(currentPatientProfile.gender || 'Female');
    setEditBloodGroup(currentPatientProfile.bloodGroup || 'O+');
  }, [currentPatientProfile.preferredDoctorName, currentPatientProfile.preferredHospitalName, currentPatientProfile.age, currentPatientProfile.gender, currentPatientProfile.bloodGroup]);

  const currentProvider = user && user.role !== 'patient' && providers
    ? providers.find(p => p.id === user.providerId || p.name === user.institution)
    : null;

  const hasReadAccess = user?.role === 'patient' || (currentProvider?.permissions.read ?? false) || (breakGlassActive && user?.role === 'doctor');
  const hasWriteAccess = user?.role === 'patient' || (currentProvider?.permissions.write ?? false);

  // Helper to check if data category access is authorized for the current user
  const isCategoryAllowed = (cat: string) => {
    if (user?.role === 'patient') return true;
    if (breakGlassActive && user?.role === 'doctor') return true;
    if (!currentProvider) return false;

    const cats = currentProvider.dataCategories;
    const cleanCat = cat.toLowerCase();

    if (cleanCat.includes('prescription')) return !!cats.prescriptions;
    if (cleanCat.includes('lab') || cleanCat.includes('blood') || cleanCat.includes('allergies') || cleanCat.includes('laboratory')) return !!cats.labResults;
    if (cleanCat.includes('scan') || cleanCat.includes('mri') || cleanCat.includes('ct') || cleanCat.includes('x-ray') || cleanCat.includes('ultrasound') || cleanCat.includes('ecg') || cleanCat.includes('imaging')) return !!cats.imaging;
    return !!cats.notes;
  };

  const filteredRecords = records.filter(r => 
    r.owner.toLowerCase() === currentPatientProfile.name.toLowerCase() &&
    isCategoryAllowed(r.category)
  );

  const displayedDoctorRecords = filteredRecords.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(docSearchQuery.toLowerCase()) || 
                          r.institution.toLowerCase().includes(docSearchQuery.toLowerCase());
    
    if (docCategoryFilter === 'ALL') return matchesSearch;
    
    const cat = r.category.toLowerCase();
    const filter = docCategoryFilter.toLowerCase();
    if (filter === 'prescriptions') return cat.includes('prescription') && matchesSearch;
    if (filter === 'reports') return (cat.includes('report') || cat.includes('lab') || cat.includes('blood') || cat.includes('laboratory')) && matchesSearch;
    if (filter === 'imaging') return (cat.includes('scan') || cat.includes('mri') || cat.includes('imaging') || cat.includes('x-ray') || cat.includes('ct')) && matchesSearch;
    if (filter === 'insurance') return (cat.includes('insurance') || cat.includes('policy')) && matchesSearch;
    
    return cat.includes(filter) && matchesSearch;
  });

  const isReadPending = pendingRequests.some(
    r => r.providerName === user?.institution && r.requestedPermission === 'read'
  );
  const isWritePending = pendingRequests.some(
    r => r.providerName === user?.institution && r.requestedPermission === 'write'
  );

  // Helper to render clean radial progress rings for health indices
  const renderRadialGauge = (value: number, label: string, color: 'emerald' | 'violet' | 'amber' | 'indigo') => {
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    const colors = {
      emerald: { stroke: 'stroke-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50/50' },
      violet: { stroke: 'stroke-violet-500', text: 'text-violet-600', bg: 'bg-violet-50/50' },
      amber: { stroke: 'stroke-amber-500', text: 'text-amber-600', bg: 'bg-amber-50/50' },
      indigo: { stroke: 'stroke-primary-600', text: 'text-primary-600', bg: 'bg-primary-50/50' }
    };

    const currentColors = colors[color];

    return (
      <div className="flex flex-col items-center p-5 rounded-2xl bg-white border border-slate-100 shadow-sm text-center flex-1 relative overflow-hidden group">
        <div className="relative flex items-center justify-center w-24 h-24 mb-4 z-10">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              className="stroke-slate-100"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Value circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              className={`${currentColors.stroke} transition-all duration-1000 ease-out`}
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          {/* Center value */}
          <div className="absolute flex flex-col items-center">
            <span className="text-xl font-extrabold text-slate-800 font-sans tracking-tight">{value}%</span>
            <span className="text-[8px] text-slate-400 font-sans uppercase tracking-widest font-semibold">Value</span>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-700 font-sans tracking-wide z-10">{label}</span>
      </div>
    );
  };

  // Get active permissions
  const activePermissionsCount = providers.filter(p => p.permissions.read || p.permissions.write).length;

  // Filter logs for Access Activity
  const recentActivities = auditLogs.slice(0, 4);

  const actionColors = {
    READ: 'bg-primary-600',
    WRITE: 'bg-emerald-600',
    CONSENT_GRANT: 'bg-emerald-600',
    CONSENT_REVOKE: 'bg-rose-600',
    BREAK_GLASS: 'bg-rose-600',
    LEDGER_VERIFIED: 'bg-cyan-600',
    EMERGENCY_DEACTIVATE: 'bg-emerald-600'
  };

  const actionText = {
    READ: 'Record Accessed',
    WRITE: 'Record Created',
    CONSENT_GRANT: 'Consent Key Issued',
    CONSENT_REVOKE: 'Consent Key Revoked',
    BREAK_GLASS: 'Emergency Clinical Override',
    LEDGER_VERIFIED: 'Integrity Verified',
    EMERGENCY_DEACTIVATE: 'Override Deactivated'
  };

  if (user && user.role !== 'patient') {
    const institutionTitle = user.role === 'doctor' ? 'Clinician Workspace' : 'Laboratory Workspace';
    const recentProviderLogs = auditLogs.filter(log => 
      log.institution === user.institution || 
      log.actor.includes(user.name) || 
      (breakGlassActive && user.role === 'doctor' && log.actor.includes(user.name))
    ).slice(0, 4);

    return (
      <div className="space-y-6">
        {/* Clinician Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {institutionTitle} <span className="text-primary-600 font-medium text-xs bg-primary-50 px-2 py-0.5 rounded-full">{user.institution}</span>
            </h2>
            <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-xs text-slate-500">
                Connected to HIPAA-compliant medical vault. Target Patient: <strong className="text-slate-800 font-semibold">{currentPatientProfile.name}</strong>.
              </p>
              
              <div className="flex flex-wrap items-start gap-3 mt-2">
                {/* Aadhaar / Name / UID Search */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">Find Patient:</span>
                  <input
                    type="text"
                    placeholder="Enter Aadhaar, UID or Name"
                    value={searchQuery}
                    onChange={(e) => {
                      const query = e.target.value;
                      setSearchQuery(query);
                      const cleanQuery = query.trim().toLowerCase();
                      if (cleanQuery) {
                        const matched = registeredUsers.find(u => {
                          if (u.role !== 'patient') return false;
                          const profile = patientProfiles[u.name];
                          const aadhaarMatch = u.aadhaarId?.replace(/[\s-]/g, '').includes(cleanQuery.replace(/[\s-]/g, ''));
                          const profileAadhaarMatch = profile?.aadhaarId?.replace(/[\s-]/g, '').includes(cleanQuery.replace(/[\s-]/g, ''));
                          return (
                            u.name.toLowerCase().includes(cleanQuery) ||
                            profile?.patientUid?.toLowerCase().includes(cleanQuery) ||
                            aadhaarMatch || profileAadhaarMatch
                          );
                        });
                        if (matched) setActivePatientName(matched.name);
                      }
                    }}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 font-sans w-56 placeholder-slate-400 transition-all"
                  />
                </div>

                {/* Patient result chip — shown when a match is found via search */}
                {searchQuery.trim() && (() => {
                  const cleanQ = searchQuery.trim().toLowerCase();
                  const found = registeredUsers.find(u => {
                    if (u.role !== 'patient') return false;
                    const profile = patientProfiles[u.name];
                    const aadhaarReg = u.aadhaarId?.replace(/[\s-]/g, '').includes(cleanQ.replace(/[\s-]/g, ''));
                    const aadhaarProf = profile?.aadhaarId?.replace(/[\s-]/g, '').includes(cleanQ.replace(/[\s-]/g, ''));
                    return u.name.toLowerCase().includes(cleanQ) || profile?.patientUid?.toLowerCase().includes(cleanQ) || aadhaarReg || aadhaarProf;
                  });
                  if (found) {
                    const profile = patientProfiles[found.name];
                    return (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-xs animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-bold text-emerald-800">{found.name}</span>
                        <span className="text-emerald-600 font-mono">{profile?.patientUid || ''}</span>
                        <span className="text-emerald-500">•</span>
                        <span className="text-emerald-600">Aadhaar ••••-{(found.aadhaarId || profile?.aadhaarId || '').slice(-4)}</span>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5 text-xs animate-fade-in">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span className="text-rose-700 font-semibold">No patient found matching that Aadhaar / UID</span>
                    </div>
                  );
                })()}

                {/* Quick select dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">Or Select:</span>
                  <select
                    value={activePatientName}
                    onChange={(e) => { setActivePatientName(e.target.value); setSearchQuery(''); }}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 font-sans cursor-pointer hover:border-slate-300 transition-colors max-w-[260px]"
                  >
                    {/* Only show patients stored in MongoDB — no default seeds */}
                    {mongoPatients.length === 0 ? (
                      <option value="" disabled>No patients registered yet</option>
                    ) : (
                      mongoPatients
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(p => (
                          <option key={p.email} value={p.name}>
                            {p.name}
                          </option>
                        ))
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setActiveTab('vault')}
              leftIcon={<Database size={14} />}
            >
              Patient Vault
            </Button>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => setActiveTab('audit')}
              leftIcon={<Activity size={14} />}
            >
              Audit Trail
            </Button>
          </div>
        </div>

        {/* Patient Context & Live Connection Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-900">
              <User size={16} className="text-primary-600" /> Patient Medical ID & Authorization
            </CardTitle>
            <div className="flex gap-2 text-[10px] font-semibold">
              <span className={`px-2 py-0.5 rounded-full border ${hasReadAccess ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                READ: {hasReadAccess ? 'AUTHORIZED' : 'BLOCKED'}
              </span>
              <span className={`px-2 py-0.5 rounded-full border ${hasWriteAccess ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                WRITE: {hasWriteAccess ? 'AUTHORIZED' : 'BLOCKED'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 relative min-h-[160px]">
            {/* Left: Patient Profile details */}
            <div className="space-y-4 text-xs relative">
              {!hasReadAccess && (
                <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center space-y-3 rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
                  <Lock className="text-slate-400" size={24} />
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">Patient Records Sealed</span>
                  <p className="text-xs text-slate-500 max-w-[280px] leading-relaxed">
                    Establishing a HIPAA connection requires patient-sovereign consent keys or emergency override activation.
                  </p>
                </div>
              )}
              <div className="flex items-center gap-3.5 p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center font-bold text-primary-700 text-sm flex-shrink-0">
                  {currentPatientProfile.name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-slate-900">{currentPatientProfile.name}</h4>
                    <button 
                      onClick={() => setIsEditCareTeamOpen(true)}
                      className="text-[10px] font-bold text-primary-600 hover:text-primary-800 hover:underline bg-primary-50 px-2 py-0.5 border border-primary-100 rounded-lg"
                    >
                      Edit Care Team
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ID: {currentPatientProfile.patientUid || 'PX-XXXXXX'} • Aadhaar: {currentPatientProfile.aadhaarId ? '••••-••••-' + currentPatientProfile.aadhaarId.slice(-4) : '••••-••••-XXXX'} • {currentPatientProfile.gender}, {currentPatientProfile.age} Years Old
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Believed Doctor</span>
                  <p 
                    onClick={() => setIsEditCareTeamOpen(true)}
                    className={`font-bold text-xs leading-relaxed cursor-pointer hover:underline
                      ${currentPatientProfile.preferredDoctorName ? 'text-slate-800' : 'text-slate-400 italic'}`}
                  >
                    {currentPatientProfile.preferredDoctorName || 'Not Set (Click to set)'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Primary Clinic / Hospital</span>
                  <p 
                    onClick={() => setIsEditCareTeamOpen(true)}
                    className={`font-bold text-xs leading-relaxed cursor-pointer hover:underline
                      ${currentPatientProfile.preferredHospitalName ? 'text-slate-800' : 'text-slate-400 italic'}`}
                  >
                    {currentPatientProfile.preferredHospitalName || 'Not Set (Click to set)'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Allergies & Sensitivities</span>
                  <span className="px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-xs font-semibold inline-block">
                    {currentPatientProfile.allergies}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Chronic Conditions</span>
                  <p className="text-slate-800 font-semibold text-xs leading-relaxed">
                    {currentPatientProfile.conditions}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Active Regimen Medications</span>
                <p className="text-slate-800 font-semibold text-xs leading-relaxed">
                  {currentPatientProfile.prescriptions}
                </p>
              </div>
            </div>

            {/* Right: Live Connection controls */}
            <div className="flex flex-col justify-center space-y-4 bg-slate-50/50 border border-slate-100 p-5 rounded-xl">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Access Consent Status</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {hasReadAccess 
                  ? "Your clinician profile has verified access to this patient's health records."
                  : "Patient records are sealed under personal sovereign keys. Request clinician access permission."
                }
              </p>
              <div className="flex flex-wrap gap-2.5">
                {!hasReadAccess && (
                  <Button
                    onClick={() => requestAccess('read')}
                    disabled={isReadPending}
                    variant={isReadPending ? "outline" : "primary"}
                    size="sm"
                    className="text-xs font-semibold animate-fade-in"
                  >
                    {isReadPending ? "Request Pending..." : "Request Read Access"}
                  </Button>
                )}
                {!hasWriteAccess && (
                  <Button
                    onClick={() => requestAccess('write')}
                    disabled={isWritePending}
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold animate-fade-in"
                  >
                    {isWritePending ? "Upload Pending..." : "Request Upload Access"}
                  </Button>
                )}
                {!hasReadAccess && user.role === 'doctor' && (
                  <Button
                    variant="emergency"
                    size="sm"
                    className="text-xs font-semibold animate-fade-in"
                    onClick={() => {
                      const reason = prompt(
                        "Specify the clinical reason for activating Emergency Break-Glass override:",
                        "Patient presenting in critical status. Immediate access to clinical history and allergen checklists required."
                      );
                      if (reason !== null) {
                        triggerBreakGlass(user.name, reason || "Emergency override activated.");
                      }
                    }}
                  >
                    Break-Glass Override
                  </Button>
                )}
                {hasReadAccess && (
                  <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1.5 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Verified Consent Session Active
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Gauges Grid */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-md flex items-center gap-2 text-slate-900">
                <Activity className="text-primary-600" size={16} /> Clinical Risk & Health Indices
              </CardTitle>
              <CardDescription className="text-xs">
                Automated preventive screening based on health records
              </CardDescription>
            </div>
            <span className="text-[10px] bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 rounded-full font-semibold">
              AI Screener Active
            </span>
          </CardHeader>
          <CardContent className="pt-4 relative min-h-[120px]">
            {/* Locked Overlay if no read access */}
            {!hasReadAccess && (
              <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center space-y-2 rounded-xl">
                <Lock className="text-slate-400" size={24} />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Clinical Analytics Sealed</span>
                <span className="text-[10px] text-slate-500 max-w-xs text-center">
                  Access keys are required to screen and view patient laboratory indices.
                </span>
              </div>
            )}
            <div className={`flex flex-col sm:flex-row gap-4 ${!hasReadAccess ? 'opacity-20 pointer-events-none' : ''}`}>
              {renderRadialGauge(currentPatientProfile.riskIndicators.overallIndex, 'Overall Wellness Index', 'indigo')}
              {renderRadialGauge(currentPatientProfile.riskIndicators.cardiovascular, 'Cardiovascular Health', 'emerald')}
              {renderRadialGauge(currentPatientProfile.riskIndicators.metabolic, 'Metabolic Biomarkers', 'violet')}
            </div>
          </CardContent>
        </Card>

        {/* Vault Summary & Audit Feeds */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Patient Records */}
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-md flex items-center gap-2 text-slate-900">
                  <FileText className="text-primary-600" size={16} /> Patient Record Vault Summary
                </CardTitle>
                <CardDescription className="text-xs">
                  Clinical records saved to the patient's personal health vault
                </CardDescription>
              </div>
              {hasReadAccess && (
                <button 
                  onClick={() => setActiveTab('vault')} 
                  className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-0.5"
                >
                  View all <ArrowUpRight size={14} />
                </button>
              )}
            </CardHeader>
            <CardContent className="pt-4 relative min-h-[180px] flex flex-col">
              {!hasReadAccess && (
                <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center space-y-2 rounded-xl">
                  <FolderLock className="text-slate-400" size={24} />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans">Vault Catalog Sealed</span>
                  <span className="text-[10px] text-slate-500 max-w-xs text-center font-sans">
                    Access permission is required to list verified records in this vault.
                  </span>
                </div>
              )}

              {hasReadAccess && (
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search vault documents..."
                      value={docSearchQuery}
                      onChange={(e) => setDocSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-medium"
                    />
                  </div>
                  <select
                    value={docCategoryFilter}
                    onChange={(e) => setDocCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer font-medium"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="prescriptions">Prescriptions</option>
                    <option value="reports">Laboratory Reports</option>
                    <option value="imaging">Imaging (MRI, CT)</option>
                    <option value="insurance">Insurance Documents</option>
                  </select>
                </div>
              )}
              
              <div className={`space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1 ${!hasReadAccess ? 'opacity-10 pointer-events-none' : ''}`}>
                {displayedDoctorRecords.length > 0 ? (
                  displayedDoctorRecords.map((rec: HealthRecord) => (
                    <div 
                      key={rec.id}
                      className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-slate-100/50 hover:border-slate-200 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-primary-50 text-primary-600">
                          <FileText size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{rec.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500">{rec.institution}</span>
                            <span className="text-slate-300 text-[10px] font-mono">•</span>
                            <span className="text-[10px] text-slate-500">{rec.size}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-semibold">
                          {rec.date}
                        </span>
                        <Lock size={12} className="text-slate-400" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <span className="text-xs">No records matching search filters.</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right: Institutional Audit Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-md flex items-center gap-2 text-slate-900">
                  <ShieldCheck className="text-emerald-600" size={16} /> Connection Access Audit
                </CardTitle>
                <CardDescription className="text-xs">
                  Access activity and data exchanges logged for your institution
                </CardDescription>
              </div>
              <button 
                onClick={() => setActiveTab('audit')} 
                className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-0.5"
              >
                Access history <ArrowUpRight size={14} />
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 min-h-[180px]">
              {recentProviderLogs.length === 0 ? (
                <div className="text-xs text-slate-400 py-8 text-center">
                  No connection events logged for {user.institution} in this session.
                </div>
              ) : (
                <div className="space-y-4">
                  {recentProviderLogs.map((act) => {
                    const isSuccess = act.status === 'SUCCESS';
                    const isOverride = act.status === 'OVERRIDE';

                    return (
                      <div key={act.id} className="relative text-xs pl-4 border-l border-slate-100 ml-1.5 pb-4 last:pb-0">
                        {/* Timeline dot */}
                        <span className={`absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full border border-white ${actionColors[act.action] || 'bg-slate-400'}`} />
                        
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{actionText[act.action]}</span>
                              <span className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full 
                                ${isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                                  isOverride ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse' : 
                                  'bg-rose-50 text-rose-700 border border-rose-100'}`}
                              >
                                {act.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">{act.details}</p>
                            <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-400">
                              <span>{act.actor}</span>
                              <span>•</span>
                              <span>{act.institution}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium">{act.timestamp.split(' ')[1]} {act.timestamp.split(' ')[2]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Patient Dashboard View
  return (
    <div className="space-y-6">
      {/* Patient Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Welcome back, {user?.name.split(' ')[0] || 'Jonathan'} <Sparkles size={16} className="text-primary-600" />
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            All services operational. Your personal health vault contains {filteredRecords.length} records secured under sovereign encryption keys.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveTab('vault')}
            leftIcon={<Database size={14} />}
          >
            Vault Directory
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setActiveTab('consent')}
            leftIcon={<ShieldCheck size={14} />}
          >
            Manage Consents
          </Button>
        </div>
      </div>

      {/* Pending Access Requests for Patient — only those addressed to this patient */}
      {pendingRequests.filter(r => !r.targetPatientName || r.targetPatientName === user?.name).length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 shadow-sm animate-fade-in">
          <CardHeader className="pb-3 border-b border-amber-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2 text-slate-950">
                <ShieldAlert className="text-amber-500" size={16} /> Pending Clinical Access Requests
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Review and authorize incoming data sharing requests from hospital triage and provider networks
              </CardDescription>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold animate-pulse">
              ACTION REQUIRED
            </span>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100 bg-white">
            {pendingRequests.filter(r => !r.targetPatientName || r.targetPatientName === user?.name).map((req) => (
              <div key={req.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                    {req.logoText}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{req.providerName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Requests <span className="text-primary-600 font-semibold uppercase">{req.requestedPermission}</span> permission to 
                      {req.requestedPermission === 'read' ? ' view clinical vault files' : ' upload new treatment records'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => rejectAccessRequest(req.id)}
                    className="px-3.5 py-1.5 border border-rose-200 hover:border-rose-300 text-rose-600 bg-rose-50/50 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Decline
                  </button>
                  <button 
                    onClick={() => setActiveRequestToSign(req)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Check size={12} /> Approve & Grant Access
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Grid of Gauges & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: AI Risk Indicators (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-md flex items-center gap-2 text-slate-900">
                <Activity className="text-primary-600" size={16} /> Clinical Risk & Health Indices
              </CardTitle>
              <CardDescription className="text-xs">
                Continuous preventive wellness screening based on health vault files
              </CardDescription>
            </div>
            <span className="text-[10px] bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 rounded-full font-semibold">
              AI Screener Active
            </span>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 pt-4">
            {renderRadialGauge(currentPatientProfile.riskIndicators.overallIndex, 'Overall Wellness Index', 'indigo')}
            {renderRadialGauge(currentPatientProfile.riskIndicators.cardiovascular, 'Cardiovascular Health', 'emerald')}
            {renderRadialGauge(currentPatientProfile.riskIndicators.metabolic, 'Metabolic Biomarkers', 'violet')}
          </CardContent>
        </Card>

        {/* Right: Security summary cards */}
        <div className="space-y-6">
          {/* Active Permissions Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-slate-900">
                <ShieldCheck className="text-emerald-600" size={16} /> Active Permitted Hubs
              </CardTitle>
              <CardDescription className="text-xs">
                Clinics and institutions currently holding valid vault keys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900 font-sans">{activePermissionsCount}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">OF {providers.length} PROVIDERS</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {providers.map((p) => {
                  const hasAccess = p.permissions.read || p.permissions.write;
                  if (!hasAccess) return null;
                  return (
                    <span 
                      key={p.id} 
                      className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs flex items-center gap-1.5 text-slate-700 font-medium whitespace-nowrap"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {p.name}
                    </span>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Emergency Alert Module */}
          <Card className={`${breakGlassActive ? 'border-rose-300 bg-rose-50/20' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-slate-900">
                <Flame className={breakGlassActive ? 'text-rose-500 animate-pulse' : 'text-slate-400'} size={16} /> Emergency Access Override
              </CardTitle>
              <CardDescription className="text-xs">
                Emergency Break-Glass bypass configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {breakGlassActive ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 flex items-start gap-2.5">
                    <ShieldAlert size={16} className="text-rose-600 mt-0.5" />
                    <div>
                      <p className="font-bold">Active Bypass Alert</p>
                      <p className="text-[10px] text-rose-700 mt-0.5">Bypass mode enabled. Real-time clinician logging active.</p>
                    </div>
                  </div>
                  <Button 
                    variant="emergency" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => setActiveTab('emergency')}
                  >
                    View Alert Console
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs text-slate-500">
                    <span>Override Status</span>
                    <span className="text-slate-400 font-bold uppercase">STANDBY (SECURED)</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => setActiveTab('emergency')}
                  >
                    Configure Emergency Access
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Vault Summary & Audit Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Health Records */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-md flex items-center gap-2 text-slate-900">
                <FileText className="text-primary-600" size={16} /> Secure Health Vault Summary
              </CardTitle>
              <CardDescription className="text-xs">
                Documents verified and protected inside your vault
              </CardDescription>
            </div>
            <button 
              onClick={() => setActiveTab('vault')} 
              className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-0.5"
            >
              View all <ArrowUpRight size={14} />
            </button>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {filteredRecords.slice(0, 3).map((rec: HealthRecord) => (
              <div 
                key={rec.id}
                className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-slate-100/50 hover:border-slate-200 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary-50 text-primary-600">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{rec.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500">{rec.institution}</span>
                      <span className="text-slate-300 text-[10px] font-mono">•</span>
                      <span className="text-[10px] text-slate-500">{rec.size}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-[10px] px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-semibold">
                    {rec.date}
                  </span>
                  <Lock size={12} className="text-slate-400" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right: Access Activity Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-md flex items-center gap-2 text-slate-900">
                <ShieldCheck className="text-emerald-600" size={16} /> Access Activity Log
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time activity logs tracking clinician and patient access events
              </CardDescription>
            </div>
            <button 
              onClick={() => setActiveTab('audit')} 
              className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-0.5"
            >
              Access explorer <ArrowUpRight size={14} />
            </button>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {recentActivities.map((act) => {
              const isSuccess = act.status === 'SUCCESS';
              const isOverride = act.status === 'OVERRIDE';

              return (
                <div key={act.id} className="relative text-xs pl-4 border-l border-slate-100 ml-1.5 pb-4 last:pb-0">
                  {/* Timeline dot */}
                  <span className={`absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full border border-white ${actionColors[act.action] || 'bg-slate-400'}`} />
                  
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{actionText[act.action]}</span>
                        <span className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full 
                          ${isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                            isOverride ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse' : 
                            'bg-rose-50 text-rose-700 border border-rose-100'}`}
                        >
                          {act.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">{act.details}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-400">
                        <span>{act.actor}</span>
                        <span>•</span>
                        <span>{act.institution}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium">{act.timestamp.split(' ')[1]} {act.timestamp.split(' ')[2]}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {activeRequestToSign && (
        <ConsentSignatureModal
          isOpen={activeRequestToSign !== null}
          onClose={() => setActiveRequestToSign(null)}
          request={activeRequestToSign}
        />
      )}

      {/* Edit Care Team Modal */}
      <Modal
        isOpen={isEditCareTeamOpen}
        onClose={() => setIsEditCareTeamOpen(false)}
        title="Edit Patient Profile & Care Team"
        description="Configure your age, gender, blood group, primary doctor, and preferred clinic or hospital."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Age</label>
              <input
                type="number"
                placeholder="e.g., 31"
                value={editAge}
                onChange={(e) => setEditAge(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-medium"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gender</label>
              <select
                value={editGender}
                onChange={(e) => setEditGender(e.target.value as 'Male' | 'Female')}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-medium cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Blood Group</label>
              <select
                value={editBloodGroup}
                onChange={(e) => setEditBloodGroup(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-medium cursor-pointer"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Believed Doctor Name</label>
            <input
              type="text"
              placeholder="e.g., Dr. B. Wasim Akram"
              value={editDocName}
              onChange={(e) => setEditDocName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Preferred Clinic / Hospital Name</label>
            <input
              type="text"
              placeholder="e.g., Nalam Surgical Clinic"
              value={editHospitalName}
              onChange={(e) => setEditHospitalName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditCareTeamOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                updatePatientProfile(currentPatientProfile.name, {
                  preferredDoctorName: editDocName,
                  preferredHospitalName: editHospitalName,
                  age: Number(editAge) || 30,
                  gender: editGender as 'Male' | 'Female',
                  bloodGroup: editBloodGroup
                });
                setIsEditCareTeamOpen(false);
              }}
            >
              Save Profile Details
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
