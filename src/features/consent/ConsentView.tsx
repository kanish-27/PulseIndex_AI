import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Settings, 
  Lock,
  Filter,
  Check,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ProviderConsent, AccessRequest } from '../../context/AppContext';
import { ConsentSignatureModal } from './ConsentSignatureModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const ConsentView: React.FC = () => {
  const { 
    providers, 
    togglePermission, 
    toggleDataCategory, 
    updateConsentExpiry,
    pendingRequests,
    approveAccessRequest,
    rejectAccessRequest
  } = useApp();

  const [activeSettingsProvider, setActiveSettingsProvider] = useState<string | null>(null);
  const [activeRequestToSign, setActiveRequestToSign] = useState<AccessRequest | null>(null);

  const getProviderTypeColor = (type: ProviderConsent['type']) => {
    switch (type) {
      case 'Hospital': return 'text-primary-750 bg-primary-50 border-primary-100';
      case 'Laboratory': return 'text-violet-750 bg-violet-50 border-violet-100';
      case 'Pharmacy': return 'text-emerald-750 bg-emerald-50 border-emerald-100';
      case 'Insurance': return 'text-cyan-750 bg-cyan-50 border-cyan-100';
    }
  };

  const getMockExpiryTimestamp = (expiry: string) => {
    const now = new Date();
    if (expiry === '24 Hours') {
      now.setHours(now.getHours() + 24);
    } else if (expiry === '7 Days') {
      now.setDate(now.getDate() + 7);
    } else if (expiry === '30 Days') {
      now.setDate(now.getDate() + 30);
    } else {
      return 'NEVER EXPIRES';
    }
    return 'EXPIRY: ' + now.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
  };

  return (
    <div className="space-y-6">
      {/* Information Header card */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-emerald-600" size={20} /> Consent Intelligence Center
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Manage clinical consent and data sharing settings. Control which institutions can access, read, or append clinical documents in your health vault.
          </p>
        </div>
        <div className="text-[10px] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-slate-600 flex items-center gap-2 font-semibold">
          <Lock size={12} className="text-emerald-600" />
          SECURED VIA FIDO2 PASSKEYS
        </div>
      </div>

      {/* SECTION: Pending Access Requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 shadow-sm animate-fade-in">
          <CardHeader className="pb-3 border-b border-amber-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2 text-slate-950">
                <ShieldAlert className="text-amber-500" size={16} /> Pending Clinical Access Requests
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Review and authorize incoming data sharing requests from hospital triage and pharmacy networks
              </CardDescription>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold animate-pulse">
              ACTION REQUIRED
            </span>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100 bg-white">
            {pendingRequests.map((req) => (
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

      {/* Grid of Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providers.map((p) => {
          const isSettingsOpen = activeSettingsProvider === p.id;
          const hasAnyAccess = p.permissions.read || p.permissions.write;

          return (
            <Card 
              key={p.id} 
              className={`relative transition-all duration-350 bg-white border border-slate-200 shadow-sm rounded-2xl
                ${hasAnyAccess ? 'border-emerald-250 ring-1 ring-emerald-100/50' : 'opacity-90'}`}
            >
              {/* Card Header */}
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                    {p.logoText}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border mt-1 inline-block font-semibold ${getProviderTypeColor(p.type)}`}>
                      {p.type}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-sans font-semibold">Last Access</span>
                  <p className="text-[10px] text-slate-700 font-semibold mt-0.5">{p.lastAccess}</p>
                </div>
              </CardHeader>

              <CardContent className="py-4 space-y-5 bg-white">
                {/* Granular Permission Toggles */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Access Rights</h4>
                  
                  {/* Read Access Toggle */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Read Record Details</p>
                      <p className="text-[10px] text-slate-500">Decrypt and view clinical documents</p>
                    </div>
                    <button
                      onClick={() => togglePermission(p.id, 'read')}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${p.permissions.read ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${p.permissions.read ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Write Access Toggle */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Upload Records</p>
                      <p className="text-[10px] text-slate-500">Append new diagnostic results to vault</p>
                    </div>
                    <button
                      onClick={() => togglePermission(p.id, 'write')}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${p.permissions.write ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${p.permissions.write ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Emergency Access Toggle */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Emergency Bypass Permission</p>
                      <p className="text-[10px] text-slate-500">Allow instant override in life-critical events</p>
                    </div>
                    <button
                      onClick={() => togglePermission(p.id, 'emergency')}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${p.permissions.emergency ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${p.permissions.emergency ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {/* Settings Toggle button */}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setActiveSettingsProvider(isSettingsOpen ? null : p.id)}
                    leftIcon={<Settings size={12} />}
                  >
                    {isSettingsOpen ? 'Hide Preferences' : 'Configure Custom Filters & Expirations'}
                  </Button>
                </div>

                {/* Expiry and category filters drawer */}
                {isSettingsOpen && (
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-4 animate-fade-in">
                    {/* Expiration Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={10} /> Consent Expiry Settings
                      </label>
                      <select
                        value={p.expiry}
                        onChange={(e) => updateConsentExpiry(p.id, e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                      >
                        <option value="24 Hours">24 Hours (Temporary Access)</option>
                        <option value="7 Days">7 Days (Short-term Access)</option>
                        <option value="30 Days">30 Days (Clinical Cycle)</option>
                        <option value="Indefinite">Indefinite (Manual Revocation)</option>
                      </select>
                      <div className="flex justify-between items-center mt-2 text-[9px] font-semibold text-slate-400">
                        <span>HANDSHAKE EXPIRY STATUS:</span>
                        <span className="text-emerald-700 font-bold">{getMockExpiryTimestamp(p.expiry)}</span>
                      </div>
                    </div>

                    {/* Data category filters */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Filter size={10} /> Authorized Data Categories
                      </label>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { key: 'labResults', label: 'Lab Reports' },
                          { key: 'imaging', label: 'Imaging Scans' },
                          { key: 'prescriptions', label: 'Prescriptions' },
                          { key: 'notes', label: 'Clinical Notes' }
                        ] as const).map((cat) => {
                          const isEnabled = p.dataCategories[cat.key];
                          return (
                            <button
                              key={cat.key}
                              type="button"
                              onClick={() => toggleDataCategory(p.id, cat.key)}
                              className={`p-2 border rounded-lg text-left text-xs transition-all flex items-center justify-between
                                ${isEnabled 
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold shadow-sm' 
                                  : 'border-slate-200 bg-white text-slate-400'}`}
                            >
                              <span>{cat.label}</span>
                              {isEnabled && <Check size={12} className="text-emerald-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {activeRequestToSign && (
        <ConsentSignatureModal
          isOpen={activeRequestToSign !== null}
          onClose={() => setActiveRequestToSign(null)}
          request={activeRequestToSign}
        />
      )}
    </div>
  );
};
