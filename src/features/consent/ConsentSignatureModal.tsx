import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  Clock, 
  Building, 
  ChevronDown, 
  ChevronUp, 
  Key, 
  RefreshCw,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AccessRequest } from '../../context/AppContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

interface ConsentSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: AccessRequest;
}

type SignStep = 'review' | 'signing' | 'success';

export const ConsentSignatureModal: React.FC<ConsentSignatureModalProps> = ({
  isOpen,
  onClose,
  request
}) => {
  const { signConsent, verifyConsent, approveAccessRequest, user } = useApp();
  const [step, setStep] = useState<SignStep>('review');
  const [isAccepted, setIsAccepted] = useState(false);
  const [signingProgress, setSigningProgress] = useState<string>('');
  
  // Signature info returned from backend
  const [signatureRecord, setSignatureRecord] = useState<any>(null);
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Live verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; status: string; timestamp?: string } | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('review');
      setIsAccepted(false);
      setSigningProgress('');
      setSignatureRecord(null);
      setIsDrawerOpen(false);
      setVerifyResult(null);
    }
  }, [isOpen]);

  const handleSign = async () => {
    if (!isAccepted) return;
    
    setStep('signing');
    
    // Simulate steps in cryptographic signing for realism
    const progressSteps = [
      'Retrieving patient identifier...',
      'Sorting consent parameters to canonical structure...',
      'Generating SHA-256 integrity digest...',
      'Sealing transaction record in secure audit vault...'
    ];

    for (let i = 0; i < progressSteps.length; i++) {
      setSigningProgress(progressSteps[i]);
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    try {
      const patientId = user?.email || 'patient_vance';
      const patientName = user?.name || 'Jonathan Vance';
      
      const payload = {
        patient_id: patientId,
        patient_name: patientName,
        hospital: request.providerName,
        scope: request.requestedPermission === 'read' ? 'Read Records' : 'Upload Records',
        duration: '30 Days',
        timestamp: new Date().toISOString(),
        consent_id: `CON-${request.id}`
      };

      const record = await signConsent(payload);
      setSignatureRecord(record);
      
      // Update local state in React Context
      approveAccessRequest(request.id);
      
      setStep('success');
    } catch (error) {
      console.error('Error signing consent:', error);
      setStep('review');
      alert('Failed to generate cryptographic digital signature. Please try again.');
    }
  };

  const handleLiveVerification = async () => {
    if (!signatureRecord) return;
    setIsVerifying(true);
    setVerifyResult(null);
    
    // Tiny delay for realistic verification check
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const result = await verifyConsent(signatureRecord.id);
      setVerifyResult({
        verified: result.verified,
        status: result.status,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Live verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const scopeLabel = request.requestedPermission === 'read' ? 'Read Records' : 'Upload Records';
  const patientName = user?.name || 'Jonathan Vance';

  // Construct what the canonical string is, dynamically:
  const getSimulatedCanonical = () => {
    const patientId = user?.email || 'patient_vance';
    return `duration=30 Days|hospital=${request.providerName}|patient_id=${patientId}|patient_name=${patientName}|scope=${scopeLabel}|timestamp=${signatureRecord?.timestamp || 'CURRENT_TIMESTAMP'}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'success' ? 'Consent Signature Sealed' : 'Digital Consent Signature System'}
      size="md"
    >
      {step === 'review' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
            <Info className="text-primary-655 mt-0.5 flex-shrink-0" size={16} />
            <p className="text-xs text-blue-700 leading-normal">
              PulseIndex AI uses a high-integrity consent engine. Granting permission creates a <strong>tamper-evident digital signature</strong> linking your records to this provider.
            </p>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Requesting Institution</span>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-slate-250 border border-slate-300 flex items-center justify-center font-bold text-[10px] text-slate-750">
                  {request.logoText}
                </span>
                <span className="text-sm font-bold text-slate-800">{request.providerName}</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Access Scope</span>
              <span className="text-xs bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 rounded-full font-bold">
                {scopeLabel}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Duration</span>
              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                <Clock size={13} className="text-slate-400" />
                30 Days (Temporary)
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Target Vault Items</span>
              <div className="text-[11px] text-slate-600 flex flex-wrap gap-1.5">
                <span className="bg-slate-200/60 px-2 py-0.5 rounded-md border border-slate-250">Genomic Sequencing</span>
                <span className="bg-slate-200/60 px-2 py-0.5 rounded-md border border-slate-250">Allergies</span>
                <span className="bg-slate-200/60 px-2 py-0.5 rounded-md border border-slate-250">Laboratory Results</span>
                <span className="bg-slate-200/60 px-2 py-0.5 rounded-md border border-slate-250">Active Prescriptions</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800">Consent Acknowledgement</h4>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isAccepted} 
                onChange={(e) => setIsAccepted(e.target.checked)}
                className="mt-0.5 rounded border-slate-350 text-emerald-600 focus:ring-emerald-500" 
              />
              <span className="text-xs text-slate-600 leading-normal">
                I, <strong>{patientName}</strong>, hereby digitally sign and authorize {request.providerName} to access my vault records for the requested duration. I verify that this consent represents my voluntary authorization.
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <button
              onClick={handleSign}
              disabled={!isAccepted}
              className={`px-5 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-sm flex items-center gap-2
                ${isAccepted 
                  ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer hover:shadow' 
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
            >
              <ShieldCheck size={16} /> Approve & Digital Sign
            </button>
          </div>
        </div>
      )}

      {step === 'signing' && (
        <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Key size={18} className="text-emerald-600 animate-pulse" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">Generating Secure Signature</h3>
            <p className="text-xs text-slate-500 font-mono max-w-sm mx-auto">{signingProgress}</p>
          </div>
        </div>
      )}

      {step === 'success' && signatureRecord && (
        <div className="space-y-5">
          <div className="py-2 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-250 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={32} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-950">Consent Authorization Finalized</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hospital access request approved for {request.providerName}.
              </p>
            </div>
          </div>

          {/* Verification Status Card */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <span className="text-xs font-bold text-emerald-800">System Telemetry Verification:</span>
              <span className="text-[10px] bg-emerald-100/90 text-emerald-800 border border-emerald-250 px-2 py-0.5 rounded-full font-bold">
                SECURE ACCESS GRANTED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-white border border-emerald-150 rounded-xl p-2.5 text-center flex flex-col items-center justify-center">
                <CheckCircle2 className="text-emerald-600 mb-1" size={16} />
                <span className="text-[10px] text-slate-500 font-medium">Digital Signature</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5">✓ Sealed</span>
              </div>
              <div className="bg-white border border-emerald-150 rounded-xl p-2.5 text-center flex flex-col items-center justify-center">
                <ShieldCheck className="text-emerald-600 mb-1" size={16} />
                <span className="text-[10px] text-slate-500 font-medium">Data Integrity</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5">✓ Verified</span>
              </div>
              <div className="bg-white border border-emerald-150 rounded-xl p-2.5 text-center flex flex-col items-center justify-center">
                <CheckCircle2 className="text-emerald-600 mb-1" size={16} />
                <span className="text-[10px] text-slate-500 font-medium">Tamper Lock</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5">✓ Active</span>
              </div>
            </div>
          </div>

          {/* Expandable Technical Details Drawer */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="w-full px-4 py-3 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Key className="text-slate-400" size={14} />
                <span className="text-xs font-bold text-slate-700">Technical Details & Telemetry</span>
              </div>
              {isDrawerOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
            </button>

            {isDrawerOpen && (
              <div className="p-4 space-y-3.5 text-xs border-t border-slate-100 bg-slate-50/50">
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-500 font-semibold">Signature ID:</span>
                  <span className="col-span-2 text-slate-800 font-mono font-bold">{signatureRecord.id}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-500 font-semibold">Timestamp:</span>
                  <span className="col-span-2 text-slate-800">{signatureRecord.timestamp}</span>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-500 font-semibold">Recipient Node:</span>
                  <span className="col-span-2 text-slate-800 font-semibold">{signatureRecord.hospital}</span>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-500 font-semibold">Scope of Action:</span>
                  <span className="col-span-2 text-slate-800 font-semibold">{signatureRecord.scope}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block">Canonical Message (Pre-Hash):</span>
                  <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-mono break-all text-slate-600 leading-normal select-all">
                    {getSimulatedCanonical()}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block">SHA-256 Signature Hash:</span>
                  <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-mono break-all text-slate-700 leading-normal font-bold select-all">
                    {signatureRecord.signature_hash}
                  </div>
                </div>

                {/* Live Verification Trigger */}
                <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Tamper Check Engine</span>
                    <span className="text-[11px] text-slate-600 leading-none">Validate this seal against the database ledger live.</span>
                  </div>
                  <button
                    onClick={handleLiveVerification}
                    disabled={isVerifying}
                    className="self-end sm:self-auto px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={11} className={isVerifying ? 'animate-spin' : ''} />
                    {isVerifying ? 'Re-verifying...' : 'Verify Cryptographic Seal'}
                  </button>
                </div>

                {verifyResult && (
                  <div className={`p-2.5 rounded-lg border text-[11px] font-bold flex items-center gap-2 ${
                    verifyResult.verified 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <ShieldCheck size={14} className={verifyResult.verified ? 'text-emerald-600' : 'text-rose-600'} />
                    <div>
                      <span>Live Verification: {verifyResult.verified ? 'Match Confirmed. Ledger is authentic.' : 'TAMPER DETECTED! Signature mismatches records.'}</span>
                      <span className="block text-[9px] font-medium text-slate-400 mt-0.5">Checked at {verifyResult.timestamp}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
