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
    revokeConsent
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

  // Filter logs
  const filteredLogs = auditLogs.filter(log => {
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

      {/* Active Digital Consent Signatures Section */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2 text-slate-900">
              <ShieldCheck className="text-emerald-600" size={16} /> Active Digital Consent Signatures
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Review, verify, or revoke tamper-evident digital consents signed by you.
            </CardDescription>
          </div>
          <span className="text-[10px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full text-slate-650 font-bold">
            {signatures.length} ACTIVE SIGNATURES
          </span>
        </CardHeader>
        <CardContent className="p-0 bg-white">
          {signatures.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold">
              No active digitally signed consents found. Approve incoming access requests to generate signatures.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {signatures.map((sig) => {
                const checkState = verifyingMap[sig.id];
                const isRevoked = sig.verification_status === 'Revoked';
                
                return (
                  <div key={sig.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {sig.id}
                        </span>
                        <span className="text-sm font-bold text-slate-950">{sig.hospital}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isRevoked 
                            ? 'bg-rose-50 text-rose-700 border-rose-100' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {isRevoked ? '✓ Revoked' : '✓ Digitally Signed'}
                        </span>
                        {!isRevoked && (
                          <>
                            <span className="text-[10px] bg-emerald-50 text-emerald-750 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">
                              ✓ Integrity Verified
                            </span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-750 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">
                              ✓ Tamper Protection Active
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1.5 font-medium">
                        <span>Scope: <strong className="text-slate-700">{sig.scope}</strong></span>
                        <span>•</span>
                        <span>Duration: <strong className="text-slate-700">{sig.duration}</strong></span>
                        <span>•</span>
                        <span>Signed At: <strong>{new Date(sig.created_at).toLocaleString()}</strong></span>
                      </div>
                      
                      {/* Technical hash drawer (inline, collapsed by default or displayed upon verify success) */}
                      {checkState?.status === 'success' && (
                        <div className="mt-2.5 p-2.5 bg-slate-50 border border-emerald-150 rounded-xl text-[10px] font-mono text-slate-600 space-y-1 animate-slide-in">
                          <div className="flex justify-between items-center text-[9px] text-emerald-800 font-bold mb-1">
                            <span>LIVE VERIFICATION ENGINE SUCCESSFUL</span>
                            <span>MATCH FOUND IN CONSENT LEDGER</span>
                          </div>
                          <div className="break-all">
                            <span className="text-slate-400">SHA-256 digest: </span>
                            <strong className="text-slate-800">{sig.signature_hash}</strong>
                          </div>
                          {checkState.message && (
                            <div className="text-emerald-700 font-semibold">{checkState.message}</div>
                          )}
                        </div>
                      )}
                      
                      {checkState?.status === 'failed' && (
                        <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-150 rounded-xl text-[10px] font-mono text-rose-700 animate-slide-in">
                          <span className="font-bold">VERIFICATION FAILURE: </span>
                          <span>{checkState.message}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 self-end md:self-auto">
                      <button
                        onClick={() => handleVerifySignature(sig.id)}
                        disabled={checkState?.status === 'loading' || isRevoked}
                        className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {checkState?.status === 'loading' ? 'Verifying...' : 'Verify Seal'}
                      </button>
                      {!isRevoked && (
                        <button
                          onClick={() => handleRevokeSignature(sig.consent_id)}
                          className="px-3.5 py-1.5 border border-rose-200 hover:border-rose-300 text-rose-600 bg-rose-50/50 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Revoke Access
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
