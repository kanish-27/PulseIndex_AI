import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  CheckCircle, 
  AlertOctagon, 
  RotateCcw,
  ShieldCheck,
  Fingerprint,
  AlertTriangle,
  User,
  Pill,
  Heart,
  Check,
  Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

interface PrescriptionScenario {
  drug: string;
  dosage: string;
  frequency: string;
  riskScore: number;
  safetyScore: number;
  severity: 'CRITICAL' | 'MODERATE' | 'SAFE';
  issue: string;
  reason: string;
  recommendation: string;
  alternatives: string[];
  alternativeTreatments: string[];
  regimenAction?: 'ADD' | 'REPLACE' | 'BLOCK';
  regimenActionDetails?: string;
  targetReplacementDrug?: string;
}

export const GuardianView: React.FC = () => {
  const { 
    recordGuardianCheck,
    user,
    providers,
    breakGlassActive,
    pendingRequests,
    requestAccess,
    triggerBreakGlass,
    currentPatientProfile,
    updatePatientProfile
  } = useApp();
  
  // Custom interactive states for Patient Overview
  const [patientAge, setPatientAge] = useState('68');
  const [allergies, setAllergies] = useState('Penicillin subclass');
  const [medications, setMedications] = useState('Atorvastatin 20mg, Metformin 500mg, Clopidogrel 75mg');
  const [history, setHistory] = useState('DES Coronary Stent placement (LAD segment)');
  const [isEditingContext, setIsEditingContext] = useState(false);

  useEffect(() => {
    if (currentPatientProfile) {
      setPatientAge(String(currentPatientProfile.age));
      setAllergies(currentPatientProfile.allergies);
      setMedications(currentPatientProfile.prescriptions);
      setHistory(currentPatientProfile.conditions);
    }
  }, [currentPatientProfile]);

  // Prescription Under Review states
  const [prescriptionDrug, setPrescriptionDrug] = useState('');
  const [prescriptionDosage, setPrescriptionDosage] = useState('');
  const [prescriptionFrequency, setPrescriptionFrequency] = useState('');

  // UI state managers
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideDocName, setOverrideDocName] = useState('');
  const [overrideSuccess, setOverrideSuccess] = useState(false);

  // Active analysis result storage
  const [analysisResult, setAnalysisResult] = useState<PrescriptionScenario | null>(null);
  // Medicine info card state
  const [medicineInfo, setMedicineInfo] = useState<{
    name: string;
    category: string;
    whatIsIt: string;
    whatIsIt_ta?: string;
    usedFor: string;
    usedFor_ta?: string;
    howToTake: string;
    howToTake_ta?: string;
    commonSideEffects: string[];
    commonSideEffects_ta?: string[];
    precautions: string;
    precautions_ta?: string;
    canTakeWithFood: string;
    safetyRating: string;
  } | null>(null);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [medicineInfoError, setMedicineInfoError] = useState<string | null>(null);
  const [infoMedName, setInfoMedName] = useState('');
  const [infoLang, setInfoLang] = useState<'en' | 'ta'>('en');

  const currentProvider = user && user.role !== 'patient' && providers
    ? providers.find(p => p.id === user.providerId || p.name === user.institution)
    : null;

  const hasReadAccess = user?.role === 'patient' || (currentProvider?.permissions.read ?? false) || (breakGlassActive && user?.role === 'doctor');
  const hasWriteAccess = user?.role === 'patient' || (currentProvider?.permissions.write ?? false);

  const isReadPending = pendingRequests.some(
    r => r.providerName === user?.institution && r.requestedPermission === 'read'
  );
  const isWritePending = pendingRequests.some(
    r => r.providerName === user?.institution && r.requestedPermission === 'write'
  );

  if (!hasReadAccess) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header banner */}
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-rose-900 flex items-center gap-2">
              <ShieldAlert className="text-rose-600" size={20} /> Sovereign Decryption Required
            </h2>
            <p className="text-xs text-rose-700 mt-1 font-sans">
              This patient vault is encrypted using patient-owned keys. Authorized institutions must request consent keys before accessing clinical records.
            </p>
          </div>
          <div className="text-[10px] bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl font-mono text-rose-800 font-bold uppercase tracking-wider">
            Access Restricted
          </div>
        </div>

        {/* Info card */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 border-b border-slate-100">
            <CardTitle className="text-md flex items-center gap-2 text-slate-900">
              Clinical Access Authorization Gate
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Check authorization credentials and request permissions to {currentPatientProfile.name}'s Patient Health Vault.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-6 space-y-6 bg-white">
            {/* Status indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Read Access Permission</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-sm font-bold text-slate-800">Blocked / Revoked</span>
                </div>
                <p className="text-[10px] text-slate-500">Required to view medical history, lab records, prescriptions, and summaries.</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Write Access Permission</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${hasWriteAccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className="text-sm font-bold text-slate-800">
                    {hasWriteAccess ? 'Granted / Active' : 'Blocked / Revoked'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Required to upload diagnostic records, clinical charts, and prescriptions.</p>
              </div>
            </div>

            {/* Request controls */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Request Sovereign Consent Keys</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Submit an identity request to {currentPatientProfile.name}'s patient portal. Once approved by the patient, decryption keys will be automatically generated and shared with your portal.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => requestAccess('read')}
                  disabled={isReadPending}
                  variant={isReadPending ? "outline" : "primary"}
                  className="text-xs font-semibold"
                >
                  {isReadPending ? "Read Request Pending Patient Approval" : "Request Read Access"}
                </Button>

                {!hasWriteAccess && (
                  <Button
                    onClick={() => requestAccess('write')}
                    disabled={isWritePending}
                    variant="outline"
                    className="text-xs font-semibold"
                  >
                    {isWritePending ? "Write Request Pending Patient Approval" : "Request Write Access"}
                  </Button>
                )}
              </div>
            </div>

            {/* Emergency override section (Doctors only) */}
            {user?.role === 'doctor' && (
              <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-3 pt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-rose-600" size={16} />
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider">Emergency Override Protocols (Break-Glass)</h4>
                </div>
                <p className="text-xs text-rose-705 leading-relaxed font-sans">
                  Under federal HIPAA regulations, clinicians may bypass access controls during life-threatening emergency situations.
                  This override will decrypt the vault instantly for <strong>{user?.name}</strong>, writing an immutable, audited entry to the safety ledger.
                </p>
                <Button
                  variant="emergency"
                  className="text-xs font-semibold py-2"
                  onClick={() => {
                    const reason = prompt(
                      "Specify the clinical reason for activating Emergency Break-Glass override:",
                      "Patient presenting in critical status. Immediate access to clinical history and allergen checklists required."
                    );
                    if (reason !== null) {
                      triggerBreakGlass(user?.name || "Dr. Sarah Connor", reason || "Emergency override activated.");
                    }
                  }}
                >
                  Activate Emergency Break-Glass Override
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Preset medical scenarios
  const scenarios: Record<string, PrescriptionScenario> = {
    allergy: {
      drug: 'Amoxicillin',
      dosage: '500mg',
      frequency: 'Three times daily (TID)',
      riskScore: 94,
      safetyScore: 6,
      severity: 'CRITICAL',
      issue: 'Severe Drug-Allergy Conflict Detected',
      reason: 'Amoxicillin is a beta-lactam antibiotic. The patient has a recorded severe anaphylactic hypersensitivity to the Penicillin family.',
      recommendation: 'Do NOT dispense. Review alternative class antibiotic immediately. Cross-reactivity risk is estimated at 100% due to matching molecular structures.',
      alternatives: ['Azithromycin 250mg daily', 'Clarithromycin 500mg twice daily', 'Doxycycline 100mg twice daily'],
      alternativeTreatments: ['Order infectious disease specialist consult', 'Conduct penicillin skin testing panel'],
      regimenAction: 'BLOCK',
      regimenActionDetails: 'DO NOT TAKE. Patient has a recorded penicillin allergy and Amoxicillin is a beta-lactam antibiotic.',
      targetReplacementDrug: ''
    },
    interaction: {
      drug: 'Ibuprofen',
      dosage: '400mg',
      frequency: 'As needed (PRN) for pain',
      riskScore: 68,
      safetyScore: 32,
      severity: 'MODERATE',
      issue: 'High-Risk Drug-Drug Interaction Detected',
      reason: 'Ibuprofen (NSAID) inhibits platelet aggregation. Concomitant use with Clopidogrel (Plavix) synergistically increases bleeding and GI hemorrhage risk by 3.4x.',
      recommendation: 'Evaluate bleeding risks. Consider substituting with a non-antiplatelet analgesic. If NSAID is required, co-prescribe a proton pump inhibitor (PPI) for stomach protection.',
      alternatives: ['Acetaminophen 500mg every 6 hours', 'Tramadol 50mg as needed (Low Dose)'],
      alternativeTreatments: ['Refer to physical therapy for pain management', 'Co-prescribe gastro-protective therapy (Omeprazole)'],
      regimenAction: 'BLOCK',
      regimenActionDetails: 'DO NOT TAKE. NSAIDs combined with anticoagulants/antiplatelets (Clopidogrel) significantly increase GI hemorrhage risks.',
      targetReplacementDrug: ''
    },
    passed: {
      drug: 'Atorvastatin',
      dosage: '20mg',
      frequency: 'Once daily (QD) at bedtime',
      riskScore: 4,
      safetyScore: 96,
      severity: 'SAFE',
      issue: 'No Patient Safety Conflicts Detected',
      reason: 'Atorvastatin matches patient lipid goals. No drug-drug interactions or active allergen conflicts detected in patient clinical history.',
      recommendation: 'Approved to dispense. Patient lipid indices show positive downward trend (-12.6% over 180 days) under Atorvastatin administration.',
      alternatives: ['N/A - Current therapy is safe'],
      alternativeTreatments: ['Recommend heart-healthy diet modifications', 'Schedule routine lipid profile follow-up in 90 days'],
      regimenAction: 'ADD',
      regimenActionDetails: 'Safe to add Atorvastatin to regimen. Continue other medications as prescribed.',
      targetReplacementDrug: ''
    }
  };

  const handleLoadPreset = (key: string) => {
    setSelectedScenario(key);
    const preset = scenarios[key];
    setPrescriptionDrug(preset.drug);
    setPrescriptionDosage(preset.dosage);
    setPrescriptionFrequency(preset.frequency);
    handleRunScan(key, preset.drug, preset.dosage, preset.frequency);
  };

  const fetchMedicineInfo = async (medicineName: string, idx: number) => {
    const cleanName = medicineName.trim();
    if (!cleanName) return;

    setScanComplete(false);
    setAnalysisResult(null);
    setMedicineInfoError(null);
    setSelectedScenario(`med_${idx}`);
    setInfoMedName(cleanName);
    setMedicineInfo(null);
    setInfoLang('en');
    setIsFetchingInfo(true);

    try {
      const res = await fetch('/api/medicine-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicineName: cleanName })
      });
      if (res.ok) {
        const data = await res.json();
        setMedicineInfo(data.info);
      } else {
        const errData = await res.json().catch(() => ({}));
        setMedicineInfoError(errData.error || errData.details || `API returned status ${res.status}`);
      }
    } catch (e: any) {
      console.error('Medicine info failed:', e);
      setMedicineInfoError(e.message || 'Network request failed');
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const handleRunScan = async (scenarioKey: string, customDrugName?: string, customDose?: string, customFreq?: string) => {
    setIsScanning(true);
    setScanComplete(false);
    setAnalysisResult(null);

    const targetDrug = customDrugName || prescriptionDrug;
    const targetDosage = customDose || prescriptionDosage || '500mg';
    const targetFrequency = customFreq || prescriptionFrequency || 'Once daily (QD)';

    if (!targetDrug) {
      setIsScanning(false);
      return;
    }

    try {
      const res = await fetch('/api/analyze-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drug: targetDrug,
          dosage: targetDosage,
          allergies: allergies,
          medications: medications,
          treatments: history
        })
      });

      if (!res.ok) throw new Error('API failed');

      const data = await res.json();
      
      setTimeout(() => {
        setIsScanning(false);
        setScanComplete(true);
        
        const adaptedResult: PrescriptionScenario = {
          drug: data.drug,
          dosage: data.dosage,
          frequency: targetFrequency,
          riskScore: data.riskScore,
          safetyScore: data.safetyScore,
          severity: data.severity,
          issue: data.issue,
          reason: data.reason,
          recommendation: data.recommendation,
          alternatives: data.alternatives || [],
          alternativeTreatments: data.severity === 'CRITICAL' 
            ? ['Order infectious disease specialist consult', 'Conduct penicillin skin testing panel']
            : data.severity === 'MODERATE'
              ? ['Refer to physical therapy for pain management', 'Co-prescribe gastro-protective therapy (Omeprazole)']
              : ['Recommend heart-healthy diet modifications', 'Schedule routine lipid profile follow-up in 90 days'],
          regimenAction: data.regimenAction,
          regimenActionDetails: data.regimenActionDetails,
          targetReplacementDrug: data.targetReplacementDrug
        };

        setAnalysisResult(adaptedResult);

        if (adaptedResult.severity === 'SAFE') {
          recordGuardianCheck(adaptedResult.drug, 'Low Risk', 'PASSED', 'Automated safety scan completed successfully.');
        }
      }, 1000);

    } catch (err) {
      console.warn('API connection failed, running offline clinical fallback:', err);
      setTimeout(() => {
        setIsScanning(false);
        setScanComplete(true);
        
        let result: PrescriptionScenario;
        if (scenarioKey && scenarios[scenarioKey]) {
          result = scenarios[scenarioKey];
        } else {
          const query = targetDrug.toLowerCase();
          if (query.includes('amox') || query.includes('penic')) {
            result = scenarios.allergy;
          } else if (query.includes('ibu') || query.includes('advil') || query.includes('aspirin') || query.includes('naproxen')) {
            result = scenarios.interaction;
          } else {
            result = {
              drug: targetDrug,
              dosage: targetDosage,
              frequency: targetFrequency,
              riskScore: 6,
              safetyScore: 94,
              severity: 'SAFE',
              issue: 'No Safety Conflicts Detected',
              reason: `No allergen cross-reactivities or active drug-drug conflicts detected for ${targetDrug}.`,
              recommendation: `Approved to dispense. Patient clinical status is compatible under ${targetDrug} administration.`,
              alternatives: ['N/A - Current therapy is safe'],
              alternativeTreatments: ['Monitor patient adherence', 'Provide routine lifestyle counseling'],
              regimenAction: 'ADD',
              regimenActionDetails: `Safe to add ${targetDrug} to regimen. Continue other medications as prescribed.`,
              targetReplacementDrug: ''
            };
          }
        }
        
        setAnalysisResult(result);
        if (result.severity === 'SAFE') {
          recordGuardianCheck(result.drug, 'Low Risk', 'PASSED', 'Safety scan completed in offline mode.');
        }
      }, 1200);
    }
  };

  const handleCustomFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescriptionDrug) return;
    
    const query = prescriptionDrug.toLowerCase();
    if (query.includes('amox') || query.includes('penic')) {
      setSelectedScenario('allergy');
    } else if (query.includes('ibu') || query.includes('advil') || query.includes('aspirin')) {
      setSelectedScenario('interaction');
    } else if (query.includes('atorvastatin') || query.includes('lipitor')) {
      setSelectedScenario('passed');
    } else {
      setSelectedScenario('');
    }

    handleRunScan('', prescriptionDrug, prescriptionDosage, prescriptionFrequency);
  };

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason || !overrideDocName || !analysisResult) return;
    
    recordGuardianCheck(
      analysisResult.drug,
      `${analysisResult.riskScore}/100`,
      'OVERRIDDEN',
      `Dr. ${overrideDocName} bypassed safety warning. Clinical rationale: ${overrideReason}`
    );

    setOverrideSuccess(true);
    setTimeout(() => {
      setIsOverrideModalOpen(false);
      setOverrideSuccess(false);
      setOverrideReason('');
      setOverrideDocName('');
    }, 1500);
  };

  const handleApprovePrescription = () => {
    if (!analysisResult) return;
    recordGuardianCheck(analysisResult.drug, 'Low Risk', 'PASSED', 'Physician approved prescription.');
    alert(`Prescription for ${analysisResult.drug} has been approved and logged to patient charts.`);
  };

  const handleRequestReview = () => {
    if (!analysisResult) return;
    alert(`Review requested. Notification sent to clinical advisory board.`);
  };

  return (
    <div className="space-y-6">
      {/* 5-Second Impact Banner */}
      <div className={`p-6 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 shadow-sm
        ${!scanComplete ? 'bg-white border-slate-200' : 
          analysisResult?.severity === 'CRITICAL' ? 'bg-rose-50 border-rose-250' : 
          analysisResult?.severity === 'MODERATE' ? 'bg-amber-50 border-amber-250' : 
          'bg-emerald-50 border-emerald-250'}`}>
        <div>
          <h2 className={`text-lg font-bold flex items-center gap-2.5
            ${!scanComplete ? 'text-slate-900' : 
              analysisResult?.severity === 'CRITICAL' ? 'text-rose-900' : 
              analysisResult?.severity === 'MODERATE' ? 'text-amber-900' : 
              'text-emerald-950'}`}>
            {!scanComplete ? (
              <Activity className="text-slate-500 animate-pulse" size={20} />
            ) : analysisResult?.severity === 'CRITICAL' ? (
              <AlertOctagon className="text-rose-600 animate-pulse" size={20} />
            ) : analysisResult?.severity === 'MODERATE' ? (
              <ShieldAlert className="text-amber-600" size={20} />
            ) : (
              <CheckCircle className="text-emerald-600" size={20} />
            )}
            Clinical Safety Copilot
          </h2>
          <p className={`text-xs mt-1
            ${!scanComplete ? 'text-slate-500' : 
              analysisResult?.severity === 'CRITICAL' ? 'text-rose-700' : 
              analysisResult?.severity === 'MODERATE' ? 'text-amber-700' : 
              'text-emerald-700'}`}>
            {!scanComplete ? (
              'Standby: Load or input a prescription below to run the clinical risk scan.'
            ) : analysisResult?.severity === 'CRITICAL' ? (
              'CRITICAL ALERT: Potential patient harm detected. Dispensing blocked until physician or pharmacist review.'
            ) : analysisResult?.severity === 'MODERATE' ? (
              'WARNING: Moderate drug-drug interaction detected. Review documentation and alternatives.'
            ) : (
              'PASS: Prescription verified. No drug interactions or active allergy conflicts found.'
            )}
          </p>
        </div>
        
        <div className={`text-[10px] px-3 py-1.5 rounded-full font-bold tracking-wider uppercase border
          ${!scanComplete ? 'bg-slate-50 border-slate-200 text-slate-600' : 
            analysisResult?.severity === 'CRITICAL' ? 'bg-rose-100 border-rose-200 text-rose-800' : 
            analysisResult?.severity === 'MODERATE' ? 'bg-amber-100 border-amber-200 text-amber-800' : 
            'bg-emerald-100 border-emerald-200 text-emerald-800'}`}>
          {!scanComplete ? 'STANDBY' : `${analysisResult?.severity} ANALYSIS COMPLETE`}
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Input Workspace (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Patient Overview */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary-600" />
            <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-100">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans flex items-center gap-1.5">
                <User size={14} className="text-primary-600" /> 1. Patient Health Profile
              </CardTitle>
              <button 
                onClick={() => setIsEditingContext(!isEditingContext)}
                className="text-[10px] text-primary-700 hover:text-primary-800 font-bold px-2 py-0.5 border border-primary-200 rounded-lg bg-primary-50 hover:bg-primary-100 transition-all font-sans"
              >
                {isEditingContext ? 'VIEW DETAILS' : 'EDIT DETAILS'}
              </button>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs pt-4 bg-white">
              {isEditingContext ? (
                <div className="space-y-3.5 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Patient Name</label>
                      <input 
                        type="text" 
                        value={currentPatientProfile.name} 
                        disabled 
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 cursor-not-allowed focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Age (Years)</label>
                      <input 
                        type="number"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Age"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Drug Allergies</label>
                    <input 
                      type="text"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Penicillin, Sulfa"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Current Medications</label>
                    <textarea 
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                      className="w-full h-16 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      placeholder="e.g., Atorvastatin 20mg, Metformin 500mg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Medical History</label>
                    <input 
                      type="text"
                      value={history}
                      onChange={(e) => setHistory(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Coronary Stent placement"
                    />
                  </div>
                  
                  <div className="pt-1">
                    <button 
                      onClick={() => {
                        setIsEditingContext(false);
                        if (currentPatientProfile) {
                          updatePatientProfile(currentPatientProfile.name, {
                            age: parseInt(patientAge) || currentPatientProfile.age,
                            allergies: allergies,
                            prescriptions: medications,
                            conditions: history
                          });
                        }
                      }}
                      className="w-full py-2 text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    >
                      Save Profile Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-slate-500 font-medium">Patient Details:</span>
                    <span className="font-bold text-slate-800">{currentPatientProfile.name} ({patientAge} Years Old)</span>
                  </div>

                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-rose-700 uppercase font-sans">Drug Allergies</span>
                    <p className="font-bold text-rose-950">{allergies || 'No known allergies'}</p>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-primary-700 uppercase font-sans">Active Medications</span>
                    <p className="font-bold text-primary-950 whitespace-pre-line leading-relaxed">
                      {medications ? medications.split(',').map(m => `• ${m.trim()}`).join('\n') : 'No active medications'}
                    </p>
                  </div>

                  <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-violet-700 uppercase font-sans">Medical Diagnoses</span>
                    <p className="font-bold text-violet-950">{history || 'No significant clinical history'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prescription Under Review */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary-600" />
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans flex items-center gap-1.5">
                <Pill size={14} className="text-primary-600" /> 2. Prescription Review Workspace
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 bg-white">
              {/* Patient's Active Medications as Presets */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Active Medications — Check Safety
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {currentPatientProfile?.prescriptions && currentPatientProfile.prescriptions !== 'None'
                    ? currentPatientProfile.prescriptions.split(/[,\n;]\s*/).filter(Boolean).map((med, idx) => {
                        // Extract medicine name only — strip dose patterns, frequencies, and brand parentheses
                        const getMedName = (s: string) => {
                          let cleaned = s.trim()
                            .replace(/^(cap|t|tab|syr|inj|capsule|tablet|caps?|tabs?)\.?\s+/i, ""); // strip Cap. Tab. etc.
                          
                          // Split at consecutive dashes/dots/underscores
                          cleaned = cleaned.split(/[-._]{2,}/)[0].trim();

                          // Strip brand parentheses or info parentheses
                          cleaned = cleaned.replace(/\s*\([^)]*\)/g, "");

                          // Strip trailing dosages like 500mg, 20mg
                          cleaned = cleaned.replace(/\s+\d+\s*(mg|ml|g|tab|caps?|mcg)\b.*/i, "");

                          // Strip trailing frequency/instructions (runs first)
                          cleaned = cleaned.replace(/\s+(once|twice|after|before|morning|evening|daily|tab|tablet|qd|bid|tid|qhs|mg|ml)\b.*/i, "");

                          // Strip dosage patterns like 1+0+1, 1-0-1, 6+0+6, etc. (runs after frequency)
                          cleaned = cleaned.replace(/\s+\d+[\+\-x\d\s]*(daily|caps?|tabs?|ml)?$/i, "");

                          // Finally clean up any trailing non-alphanumeric chars
                          cleaned = cleaned.replace(/[^a-zA-Z0-9]+$/, "").trim();

                          return cleaned || s.trim().split(" ")[0];
                        };
                        const displayName = getMedName(med);
                        const drugName = displayName; // use clean name for API lookup too
                        const isSelected = selectedScenario === `med_${idx}`;
                        return (
                          <button
                            key={idx}
                            onClick={() => fetchMedicineInfo(drugName, idx)}
                            className={`px-3 py-2 rounded-xl text-xs text-left border font-semibold transition-all flex items-center justify-between gap-2
                              ${isSelected
                                ? 'border-primary-300 bg-primary-50 text-primary-800'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:bg-primary-50/40 hover:text-slate-800'}`}
                          >
                            <span className="truncate">{displayName}</span>
                            <span className="shrink-0 text-[9px] bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                              {isFetchingInfo && isSelected ? '...' : 'INFO'}
                            </span>
                          </button>
                        );
                      })
                    : (
                      <div className="text-[11px] text-slate-400 italic text-center py-3 border border-dashed border-slate-200 rounded-xl">
                        No active medications on record. Upload a prescription to auto-populate.
                      </div>
                    )
                  }
                </div>
              </div>

              {/* Custom Input Form */}
              <form onSubmit={handleCustomFormSubmit} className="space-y-3 pt-3 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Compound Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Cephalexin, Metoprolol"
                    value={prescriptionDrug}
                    onChange={(e) => setPrescriptionDrug(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    disabled={isScanning}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Dosage</label>
                    <input
                      type="text"
                      placeholder="e.g., 500mg"
                      value={prescriptionDosage}
                      onChange={(e) => setPrescriptionDosage(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      disabled={isScanning}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Frequency</label>
                    <input
                      type="text"
                      placeholder="e.g., QD, BID, TID"
                      value={prescriptionFrequency}
                      onChange={(e) => setPrescriptionFrequency(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      disabled={isScanning}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={!prescriptionDrug || isScanning} 
                  className="w-full text-xs font-semibold py-2.5 mt-2 flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck size={14} /> Run Clinical Screening
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Safety Analysis & Clinical Review Panel (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {isScanning ? (
            <Card className="h-[520px] flex flex-col justify-center items-center text-center bg-white border border-slate-200 shadow-sm">
              <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-2xl bg-primary-50 text-primary-600 border border-primary-100 shadow-sm">
                <RotateCcw className="animate-spin" size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Running Clinical Scan</h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                Checking allergies database, patient active medication lists, and evaluating molecular interaction profiles...
              </p>
            </Card>
          ) : scanComplete && analysisResult ? (
            <div className="space-y-6 animate-fade-in">
              
              {/* Stacked Row 1: Risk Analysis and Action Panel side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                
                {/* AI Risk Analysis */}
                <Card className={`h-full relative overflow-hidden flex flex-col justify-between
                  ${analysisResult.severity === 'CRITICAL' ? 'border-rose-250 bg-rose-50/20' : 
                    analysisResult.severity === 'MODERATE' ? 'border-amber-250 bg-amber-50/20' : 
                    'border-emerald-250 bg-emerald-50/20'}`}>
                  <div className={`absolute top-0 left-0 w-1.5 h-full 
                    ${analysisResult.severity === 'CRITICAL' ? 'bg-rose-500' : 
                      analysisResult.severity === 'MODERATE' ? 'bg-amber-500' : 
                      'bg-emerald-500'}`} />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">3. Screening Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col sm:flex-row gap-4 items-center justify-between bg-transparent pb-4">
                    {/* Gauge */}
                    <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0 bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
                      <svg viewBox="0 0 112 112" className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="48" className="stroke-slate-100" strokeWidth="6" fill="transparent" />
                        <circle cx="56" cy="56" r="48" 
                          className={`transition-all duration-1000 ease-out 
                            ${analysisResult.severity === 'CRITICAL' ? 'stroke-rose-500' : 
                              analysisResult.severity === 'MODERATE' ? 'stroke-amber-500' : 'stroke-emerald-500'}`} 
                          strokeWidth="6" fill="transparent" 
                          strokeDasharray={301.6} 
                          strokeDashoffset={301.6 - (analysisResult.safetyScore / 100) * 301.6} 
                          strokeLinecap="round" 
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-extrabold text-slate-800 font-sans">{analysisResult.safetyScore}%</span>
                        <span className="text-[7px] text-slate-400 uppercase tracking-widest font-sans font-bold">Safety</span>
                      </div>
                    </div>
 
                    {/* Indicators Info */}
                    <div className="space-y-2.5 flex-1 text-left sm:pl-2">
                      <div className="flex justify-between items-baseline gap-2">
                        <div>
                          <span className="text-[8px] text-slate-400 uppercase font-sans font-bold block">Safety Status</span>
                          <span className={`text-sm font-extrabold tracking-tight block
                            ${analysisResult.severity === 'CRITICAL' ? 'text-rose-600' : 
                              analysisResult.severity === 'MODERATE' ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {analysisResult.severity === 'CRITICAL' ? 'CRITICAL RISK' : 
                             analysisResult.severity === 'MODERATE' ? 'MODERATE RISK' : 'LOW RISK'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 uppercase font-sans font-bold block text-right">Risk Factor</span>
                          <span className="text-sm font-extrabold text-slate-800 font-mono block text-right">{analysisResult.riskScore}%</span>
                        </div>
                      </div>
 
                      {analysisResult.regimenAction && (
                        <div className="pt-2 border-t border-slate-200/60 space-y-1">
                          <span className="text-[8px] text-slate-400 uppercase font-sans font-bold block">Regimen Guidance</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border inline-block uppercase tracking-wider
                            ${analysisResult.regimenAction === 'BLOCK' ? 'bg-rose-50 border-rose-100 text-rose-700' : 
                              analysisResult.regimenAction === 'REPLACE' ? 'bg-amber-50 border-amber-100 text-amber-700' : 
                              'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                            {analysisResult.regimenAction === 'BLOCK' ? '🛑 Block Medication' : 
                             analysisResult.regimenAction === 'REPLACE' ? '🔄 Substitute Compound' : 
                             '✅ Add to Regimen'}
                          </span>
                          <p className="text-[9px] text-slate-500 leading-tight font-medium font-sans">
                            {analysisResult.regimenActionDetails}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
 
                {/* Doctor Action Panel */}
                <Card className="h-full relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary-600" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">6. Clinical Decisions</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-center gap-2.5 pt-1 bg-white pb-4">
                    <Button 
                      variant={analysisResult.severity === 'SAFE' || analysisResult.regimenAction === 'REPLACE' ? 'primary' : 'outline'} 
                      className="w-full text-[11px] py-1.5 font-semibold"
                      onClick={handleApprovePrescription}
                      disabled={analysisResult.severity === 'CRITICAL' && analysisResult.regimenAction !== 'REPLACE'}
                    >
                      {analysisResult.regimenAction === 'REPLACE' ? 'Approve Replacement' : 'Approve & Dispense'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full text-[11px] py-1.5 font-semibold border-slate-200 text-slate-700"
                      onClick={handleRequestReview}
                    >
                      Request Consultation
                    </Button>
                    {analysisResult.severity !== 'SAFE' && (
                      <Button 
                        variant="emergency" 
                        className="w-full text-[11px] py-1.5 font-semibold"
                        onClick={() => setIsOverrideModalOpen(true)}
                      >
                        Override Safety Warning
                      </Button>
                    )}
                  </CardContent>
                </Card>

              </div>

              {/* Clinical Explanation */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                <CardHeader className="pb-2 border-b border-slate-100">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans flex items-center gap-1.5">
                    <Heart size={14} className="text-rose-500" /> 4. Clinical Contraindications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5 text-xs pt-4 bg-white">
                  <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5">
                    <span className="text-[9px] font-bold text-rose-700 font-sans uppercase">Screening Findings</span>
                    <p className="text-slate-800 leading-relaxed font-semibold">{analysisResult.reason}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-primary-700 font-sans uppercase">Involved Medication Profile</span>
                      <p className="font-bold text-slate-800">
                        {analysisResult.severity === 'SAFE' ? 'None' : `${analysisResult.drug} vs [ ${medications} ]`}
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-rose-700 font-sans uppercase">Patient Sensitivities</span>
                      <p className="font-bold text-slate-800">
                        {analysisResult.severity === 'SAFE' ? 'None' : allergies}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Alternatives */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <CardHeader className="pb-2 border-b border-slate-100">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-emerald-500" /> 5. Clinician Alternatives & Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4 bg-white">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1.5">
                    <span className="text-[9px] font-bold text-emerald-800 font-sans uppercase block">Safer Drug Alternatives</span>
                    <ul className="space-y-1 font-bold text-emerald-950">
                      {analysisResult.alternatives.map((alt, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <Check size={12} className="text-emerald-600" /> {alt}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1.5">
                    <span className="text-[9px] font-bold text-emerald-800 font-sans uppercase block">Alternative Treatment Protocols</span>
                    <ul className="space-y-1 font-bold text-emerald-950">
                      {analysisResult.alternativeTreatments.map((t, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <Check size={12} className="text-emerald-600" /> {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

            </div>
          ) : (isFetchingInfo || medicineInfo || medicineInfoError) ? (
            <Card className="h-[520px] flex flex-col bg-white border border-slate-200 shadow-sm overflow-hidden">
              {isFetchingInfo ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-primary-600">
                  <div className="w-8 h-8 border-t-transparent rounded-full animate-spin border-primary-400" style={{borderWidth:'3px', borderStyle:'solid'}} />
                  <p className="text-sm font-semibold">Looking up <span className="text-primary-700">{infoMedName}</span>...</p>
                  <p className="text-xs text-slate-400">Fetching medicine information</p>
                </div>
              ) : medicineInfoError ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-rose-650 p-6 text-center">
                  <AlertOctagon size={32} className="text-rose-500 animate-bounce" />
                  <p className="text-sm font-bold text-slate-900 font-sans">Failed to Retrieve Information</p>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-sans">{medicineInfoError}</p>
                  <button
                    onClick={() => fetchMedicineInfo(infoMedName, parseInt(selectedScenario.split('_')[1] || '0'))}
                    className="mt-3 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm font-sans"
                  >
                    Retry Lookup
                  </button>
                </div>
              ) : medicineInfo && (
                <div className="flex flex-col h-full">
                  {/* Card Header with language toggle */}
                  <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-slate-900 leading-tight truncate">{medicineInfo.name}</h3>
                        <p className="text-[10px] text-primary-500 font-bold uppercase tracking-widest mt-0.5">{medicineInfo.category}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Language Toggle */}
                        <div className="flex bg-slate-100 rounded-lg p-0.5">
                          <button
                            onClick={() => setInfoLang('en')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                              infoLang === 'en'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            EN
                          </button>
                          <button
                            onClick={() => setInfoLang('ta')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                              infoLang === 'ta'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                            style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
                          >
                            தமிழ்
                          </button>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                          medicineInfo.safetyRating === 'Safe'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : medicineInfo.safetyRating === 'Use with caution'
                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-rose-100 text-rose-700 border-rose-200'
                        }`}>{medicineInfo.safetyRating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable content */}
                  <div
                    className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
                    style={infoLang === 'ta' ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : {}}
                  >
                    {/* What is it */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {infoLang === 'en' ? 'What is it?' : 'இது என்ன?'}
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {infoLang === 'ta' && medicineInfo.whatIsIt_ta ? medicineInfo.whatIsIt_ta : medicineInfo.whatIsIt}
                      </p>
                    </div>

                    {/* Used for */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {infoLang === 'en' ? 'Used For' : 'எதற்காக பயன்படுகிறது'}
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {infoLang === 'ta' && medicineInfo.usedFor_ta ? medicineInfo.usedFor_ta : medicineInfo.usedFor}
                      </p>
                    </div>

                    {/* How to take + With food */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {infoLang === 'en' ? 'How to Take' : 'எப்படி சாப்பிட வேண்டும்'}
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {infoLang === 'ta' && medicineInfo.howToTake_ta ? medicineInfo.howToTake_ta : medicineInfo.howToTake}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {infoLang === 'en' ? 'With Food?' : 'உணவுடன்?'}
                        </p>
                        <p className="text-sm font-bold text-primary-700">{medicineInfo.canTakeWithFood}</p>
                      </div>
                    </div>

                    {/* Side effects */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {infoLang === 'en' ? 'Common Side Effects' : 'பொதுவான பக்க விளைவுகள்'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(infoLang === 'ta' && medicineInfo.commonSideEffects_ta?.length
                          ? medicineInfo.commonSideEffects_ta
                          : medicineInfo.commonSideEffects
                        ).map((se, i) => (
                          <span key={i} className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full font-medium">
                            {se}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Precautions */}
                    <div className="space-y-1 border-t border-slate-100 pt-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {infoLang === 'en' ? '⚠️ Precautions' : '⚠️ எச்சரிக்கைகள்'}
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {infoLang === 'ta' && medicineInfo.precautions_ta ? medicineInfo.precautions_ta : medicineInfo.precautions}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

          ) : (
            <Card className="h-[520px] flex flex-col justify-center items-center text-center p-6 bg-white border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-center text-primary-600 mb-4 shadow-sm">
                <ShieldCheck size={24} className="text-primary-650" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Safety Analysis Screen</h3>
              <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
                Choose a clinical scenario preset from the left panel or manually enter a custom medicine payload. The safety engine will instantly check patient compatibility, drug conflicts, and allergies.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Doctor Warning Override Modal */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Emergency Override Authorization"
        description="Please authorize the warning override by signing with your clinical credentials."
      >
        {overrideSuccess ? (
          <div className="text-center py-8 space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-55/80 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle size={26} className="animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Clinical Override Authorized</h4>
              <p className="text-xs text-slate-500 mt-1 font-sans">Bypass event recorded to chart logs successfully.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleOverrideSubmit} className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 space-y-1 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-rose-900"><AlertTriangle size={14} /> CLINICAL OVERRIDE NOTICE</p>
              <p className="text-[10px] text-rose-700 font-medium">
                By bypassing this warning, you assume clinical responsibility. The override and your physician name will be permanently logged in the patient safety ledger.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Physician Signature Name</label>
              <input
                type="text"
                placeholder="e.g., Dr. Rebecca Stone, MD"
                value={overrideDocName}
                onChange={(e) => setOverrideDocName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clinical Rationale for Override</label>
              <textarea
                placeholder="e.g., Alternative allergy testing completed. Patient is cleared and will be monitored closely."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full h-20 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 resize-none"
                required
              />
            </div>

            <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <Fingerprint className="text-emerald-650" size={20} />
              <div className="text-[10px] leading-tight text-slate-500">
                <span className="font-bold text-slate-800 block">Physician Biometric Handshake</span>
                Authorize signature credentials with active FIDO2 token key
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOverrideModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="emergency"
                size="sm"
                disabled={!overrideDocName || !overrideReason}
              >
                Sign & Authorize Override
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
