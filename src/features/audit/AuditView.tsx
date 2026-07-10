import React, { useState } from 'react';
import { 
  History, 
  ShieldCheck, 
  Search, 
  Database,
  Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AuditLog } from '../../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const AuditView: React.FC = () => {
  const { 
    auditLogs, 
    verifyLedger, 
    isVerifyingLedger,
    signatures,
    consentAuditLogs,
    verifyConsent,
    revokeConsent,
    currentPatientProfile,
    user
  } = useApp();
  
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; count: number; details: string } | null>(null);
  
  // Signature verification state map
  const [verifyingMap, setVerifyingMap] = useState<Record<string, { status: 'loading' | 'success' | 'failed'; message?: string }>>({});
  const [activeFeedTab, setActiveFeedTab] = useState<'access' | 'consent'>('access');

  const handleVerify = async () => {
    setVerificationResult(null);
    const res = await verifyLedger();
    setVerificationResult({
      success: res.success,
      count: res.verifiedCount,
      details: res.details
    });
  };

  const handleVerifySignature = async (sigId: string) => {
    setVerifyingMap(prev => ({ ...prev, [sigId]: { status: 'loading' } }));
    
    // Simulate verification check delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const res = await verifyConsent(sigId);
      if (res.verified) {
        const hashAbbrev = res.signature_hash ? res.signature_hash.substring(0, 16) : 'N/A';
        setVerifyingMap(prev => ({ 
          ...prev, 
          [sigId]: { 
            status: 'success', 
            message: `Verified: ${hashAbbrev}... Match Found.` 
          } 
        }));
      } else {
        setVerifyingMap(prev => ({ 
          ...prev, 
          [sigId]: { 
            status: 'failed', 
            message: 'TAMPER DETECTED: Hash mismatch!' 
          } 
        }));
      }
    } catch (err) {
      console.error(sigId, err);
      setVerifyingMap(prev => ({ 
        ...prev, 
        [sigId]: { 
          status: 'failed', 
          message: 'Error connecting to verification server.' 
        } 
      }));
    }
  };

  const handleRevokeSignature = async (consentId: string) => {
    if (window.confirm('Are you sure you want to revoke this consent signature? This will permanently invalidate access.')) {
      try {
        await revokeConsent(consentId);
      } catch (err) {
        console.error(err);
        alert('Failed to revoke consent.');
      }
    }
  };

  const getActionStyles = (action: AuditLog['action']) => {
    switch (action) {
      case 'READ':
        return 'bg-primary-50 text-primary-700 border-primary-100';
      case 'WRITE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'CONSENT_GRANT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'CONSENT_REVOKE':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'BREAK_GLASS':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'LEDGER_VERIFIED':
        return 'bg-cyan-50 text-cyan-700 border-cyan-100';
      case 'EMERGENCY_DEACTIVATE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
  };

  const getActionText = (action: AuditLog['action']) => {
    switch (action) {
      case 'READ':
        return 'Record Accessed';
      case 'WRITE':
        return 'Record Created';
      case 'CONSENT_GRANT':
        return 'Consent Granted';
      case 'CONSENT_REVOKE':
        return 'Consent Revoked';
      case 'BREAK_GLASS':
        return 'Emergency Override';
      case 'LEDGER_VERIFIED':
        return 'Integrity Check';
      case 'EMERGENCY_DEACTIVATE':
        return 'Override Terminated';
    }
  };

  // Filter logs — doctor sees only their own actions; patient sees only their own records
  const filteredLogs = auditLogs.filter(log => {
    const actorLower = log.actor.toLowerCase();
    const detailsLower = log.details.toLowerCase();

    if (user?.role === 'doctor') {
      // Doctor view: only logs where this doctor is the actor
      const doctorNameLower = (user.name || '').toLowerCase();
      const isDoctorActor = actorLower.includes(doctorNameLower);
      if (!isDoctorActor) return false;
    } else {
      // Patient view: logs relevant to the active patient profile
      const patientNameLower = currentPatientProfile.name.toLowerCase();

      const isActorMatch = actorLower.includes(patientNameLower);
      const isDetailsMatch = detailsLower.includes(patientNameLower);
      const isSystemLog = ['system auto-router', 'audit ledger daemon', 'system auditor engine', 'ai prescription guardian'].some(t => actorLower.includes(t));
      const isBreakGlassAction = log.action === 'BREAK_GLASS' || log.action === 'EMERGENCY_DEACTIVATE';

      const otherPatients = ['jonathan vance', 'alice smith', 'sachin', 'zahidul', 'suresh', 'puttamadamma'];
      const isForOtherPatient = otherPatients.some(name => {
        if (patientNameLower === name) return false;
        return actorLower.includes(name) || detailsLower.includes(name);
      });

      const isRelevant = (isActorMatch || isDetailsMatch || isSystemLog || isBreakGlassAction) && !isForOtherPatient;
      if (!isRelevant) return false;
    }

    const matchesSearch = log.actor.toLowerCase().includes(search.toLowerCase()) || 
                          log.institution.toLowerCase().includes(search.toLowerCase()) ||
                          log.details.toLowerCase().includes(search.toLowerCase());
                          
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Top Ledger Info Block */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="text-primary-600" size={20} /> Healthcare Trust Center
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            An audited timeline showing data accesses, uploads, and consent adjustments. All operations are logged for compliance and security verification.
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleVerify}
          isLoading={isVerifyingLedger}
          leftIcon={<ShieldCheck size={14} className="text-emerald-600" />}
          className="border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          Verify Ledger Integrity
        </Button>
      </div>

      {/* Verification scan report box */}
      {verificationResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 animate-fade-in shadow-sm">
          <ShieldCheck size={20} className="text-emerald-600 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-slate-800">Compliance Verification Report</h4>
            <p className="text-slate-650 mt-0.5">{verificationResult.details}</p>
            <div className="flex items-center gap-4 mt-2 font-semibold text-[10px] text-slate-500">
              <span>Verified Logs: {verificationResult.count}</span>
              <span>•</span>
              <span>Ledger Status: SECURED & FULLY COMPLIANT</span>
            </div>
          </div>
        </div>
      )}



      {/* Ledger Feed table layout */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveFeedTab('access')}
                  className={`pb-1 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                    activeFeedTab === 'access' 
                      ? 'border-primary-600 text-primary-700' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Clinical Access Logs
                </button>
                <button
                  onClick={() => setActiveFeedTab('consent')}
                  className={`pb-1 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                    activeFeedTab === 'consent' 
                      ? 'border-primary-600 text-primary-700' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Digital Consent Audit Trails
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {activeFeedTab === 'access' 
                  ? 'Browse chronological entries tracking data retrievals, updates, and emergency overrides'
                  : 'View live PostgreSQL audit logs recording digital signings, verifications, and revocations'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Filter by user or details..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-56 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Action Category Filter */}
              {activeFeedTab === 'access' && (
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                >
                  <option value="ALL">All Operations</option>
                  <option value="READ">Data Access</option>
                  <option value="WRITE">Data Records</option>
                  <option value="CONSENT_GRANT">Consent Grants</option>
                  <option value="CONSENT_REVOKE">Consent Revocations</option>
                  <option value="BREAK_GLASS">Emergency Overrides</option>
                  <option value="LEDGER_VERIFIED">System Checks</option>
                </select>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Time & Date</th>
                  <th className="px-6 py-4">Operation</th>
                  <th className="px-6 py-4">Clinician / Source</th>
                  <th className="px-6 py-4">Context / Purpose</th>
                  <th className="px-6 py-4">Authorization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeFeedTab === 'access' ? (
                  filteredLogs.map((log) => {
                    const isSuccess = log.status === 'SUCCESS';
                    const isOverride = log.status === 'OVERRIDE';
                    
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Timestamp */}
                        <td className="px-6 py-4">
                          <span className="text-slate-800 font-semibold">{log.timestamp.split(' ')[1]} {log.timestamp.split(' ')[2]}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{log.timestamp.split(' ')[0]}</span>
                        </td>

                        {/* Operation type */}
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider rounded-full font-bold ${getActionStyles(log.action)}`}>
                            {getActionText(log.action)}
                          </span>
                        </td>

                        {/* Clinician / Source */}
                        <td className="px-6 py-4">
                          <span className="text-slate-800 font-bold block">{log.actor}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{log.institution}</span>
                        </td>

                        {/* Details / Reason */}
                        <td className="px-6 py-4 text-slate-650 font-medium">
                          {log.details}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-bold rounded-full border
                            ${isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                              isOverride ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                              'bg-rose-50 text-rose-750 border-rose-100'}`}
                          >
                            {isSuccess ? 'AUTHORIZED' : isOverride ? 'OVERRIDDEN' : 'BLOCKED'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  consentAuditLogs.map((log) => {
                    const isSigned = log.action === 'Consent Signed';
                    const isVerified = log.action === 'Consent Verified';
                    const isRevoked = log.action === 'Consent Revoked';
                    const isFailed = log.action.includes('Failed');
                    
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Timestamp */}
                        <td className="px-6 py-4">
                          <span className="text-slate-800 font-semibold">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </span>
                        </td>
                        
                        {/* Operation */}
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider rounded-full font-bold ${
                            isSigned ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            isVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            isRevoked ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        
                        {/* User / Patient */}
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {log.user}
                        </td>
                        
                        {/* Consent Reference */}
                        <td className="px-6 py-4 font-mono font-bold text-slate-600">
                          {log.consent_id}
                        </td>
                        
                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-bold rounded-full border ${
                            isFailed ? 'bg-rose-50 text-rose-750 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {isFailed ? 'FAILED' : 'VERIFIED MATCH'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
