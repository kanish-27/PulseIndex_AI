import React, { useState } from 'react';
import { 
  Flame, 
  ShieldAlert, 
  Plus, 
  Phone, 
  UserCheck, 
  QrCode, 
  Heart, 
  AlertTriangle,
  Lock,
  X,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

const formatBloodGroupLongName = (bg: string): string => {
  if (!bg) return 'O-POSITIVE (O+)';
  const clean = bg.trim().toUpperCase();
  const isPos = clean.endsWith('+') || clean.includes('POS');
  const type = clean.replace(/[^ABO]/g, '');
  const sign = isPos ? 'POSITIVE' : 'NEGATIVE';
  const symbol = isPos ? '+' : '-';
  return `${type}-${sign} (${type}${symbol})`;
};

export const EmergencyView: React.FC = () => {
  const { 
    breakGlassActive, 
    activeEmergencyDoctor,
    activeEmergencyReason,
    triggerBreakGlass, 
    deactivateBreakGlass, 
    emergencyContacts, 
    addEmergencyContact,
    deleteEmergencyContact,
    updatePatientProfile,
    records,
    user,
    providers,
    currentPatientProfile
  } = useApp();

  const currentProvider = user && user.role !== 'patient' && providers
    ? providers.find(p => p.id === user.providerId || p.name === user.institution)
    : null;

  const hasReadAccess = user?.role === 'patient' || (currentProvider?.permissions.read ?? false) || (breakGlassActive && user?.role === 'doctor');

  const patientAllergies = currentPatientProfile.allergies || 'None recorded';
  const patientMeds = currentPatientProfile.prescriptions || 'None active';
  const patientHistory = currentPatientProfile.conditions || 'None recorded';

  const [isBreakGlassModalOpen, setIsBreakGlassModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDocName, setEditDocName] = useState(currentPatientProfile.preferredDoctorName || '');
  const [editHospitalName, setEditHospitalName] = useState(currentPatientProfile.preferredHospitalName || '');
  const [editAadhaar, setEditAadhaar] = useState(currentPatientProfile.aadhaarId || '');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    setEditDocName(currentPatientProfile.preferredDoctorName || '');
    setEditHospitalName(currentPatientProfile.preferredHospitalName || '');
    setEditAadhaar(currentPatientProfile.aadhaarId || '');
  }, [currentPatientProfile.preferredDoctorName, currentPatientProfile.preferredHospitalName, currentPatientProfile.aadhaarId]);

  const handleSaveProfileDetails = async () => {
    setIsSaving(true);
    try {
      await updatePatientProfile(currentPatientProfile.name, {
        preferredDoctorName: editDocName,
        preferredHospitalName: editHospitalName,
        aadhaarId: editAadhaar
      });
      setIsEditOpen(false);
    } catch (err) {
      console.error('Failed saving emergency card details:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Form states for Break Glass Simulation
  const [docName, setDocName] = useState('');
  const [reason, setReason] = useState('');
  const [confirmSafety, setConfirmSafety] = useState(false);

  // Form states for contact addition
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Pop-up blocker is preventing PDF export. Please enable pop-ups for this site.');
      return;
    }

    const contactsListHtml = emergencyContacts.map(c => 
      `<div><strong>${c.name}</strong> (${c.relation}): ${c.phone}</div>`
    ).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>MediGuard - Emergency Medical ID Card</title>
          <style>
            body {
              background-color: #f8fafc;
              color: #1e293b;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              padding: 40px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .card-container {
              display: flex;
              gap: 40px;
              flex-wrap: wrap;
              justify-content: center;
              margin-bottom: 30px;
            }
            .wallet-card {
              width: 380px;
              height: 240px;
              background: #ffffff;
              border: 1.5px solid #e2e8f0;
              border-radius: 16px;
              padding: 20px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              position: relative;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              font-size: 11px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1.5px solid #f1f5f9;
              padding-bottom: 10px;
            }
            .title {
              font-size: 12px;
              font-weight: 800;
              letter-spacing: 0.5px;
              color: #ef4444;
            }
            .patient-name {
              font-size: 14px;
              font-weight: bold;
              color: #0f172a;
              margin-top: 10px;
            }
            .qr-placeholder {
              width: 50px;
              height: 50px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 3px;
              box-sizing: border-box;
            }
            .grid-details {
              display: grid;
              grid-cols: 2;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-top: 12px;
            }
            .detail-block strong {
              color: #64748b;
              font-size: 8px;
              text-transform: uppercase;
              display: block;
            }
            .detail-block span {
              font-weight: bold;
              color: #0f172a;
            }
            .detail-block .allergy {
              color: #dc2626;
            }
            .footer-card {
              font-size: 8px;
              color: #94a3b8;
              border-top: 1px solid #f1f5f9;
              padding-top: 8px;
              margin-top: auto;
              text-transform: uppercase;
              font-weight: bold;
            }
            .print-btn {
              background-color: #ef4444;
              color: white;
              border: none;
              padding: 10px 24px;
              border-radius: 8px;
              font-size: 12px;
              font-weight: bold;
              cursor: pointer;
              transition: background-color 0.2s;
              margin-top: 20px;
            }
            .print-btn:hover {
              background-color: #dc2626;
            }
            @media print {
              .print-btn {
                display: none;
              }
              body {
                background-color: #ffffff;
                color: #000000;
                padding: 0;
              }
              .wallet-card {
                border: 1.5px solid #94a3b8;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="card-container">
            <!-- Front Card -->
            <div class="wallet-card">
              <div class="header">
                <div>
                  <span class="title">EMERGENCY MEDICAL ID</span>
                  <div class="patient-name">${currentPatientProfile.name.toUpperCase()}</div>
                </div>
                <div class="qr-placeholder">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01"/>
                  </svg>
                </div>
              </div>
              <div class="grid-details">
                <div class="detail-block">
                  <strong>Blood Type</strong>
                  <span>${formatBloodGroupLongName(currentPatientProfile.bloodGroup || 'O+')}</span>
                </div>
                <div class="detail-block">
                  <strong>Patient UID</strong>
                  <span>${currentPatientProfile.patientUid || 'PX-XXXXXX'}</span>
                </div>
                <div class="detail-block">
                  <strong>Believed Doctor</strong>
                  <span>${currentPatientProfile.preferredDoctorName || 'Not Set'}</span>
                </div>
                <div class="detail-block">
                  <strong>Hospital / Clinic</strong>
                  <span>${currentPatientProfile.preferredHospitalName || 'Not Set'}</span>
                </div>
                <div class="detail-block" style="grid-column: span 2;">
                  <strong>Aadhaar ID (Masked)</strong>
                  <span>${currentPatientProfile.aadhaarId ? '••••-••••-' + currentPatientProfile.aadhaarId.slice(-4) : '••••-••••-XXXX'}</span>
                </div>
              </div>
              <div class="footer-card">
                PARAMEDIC ACCESS CARD • MEDIGUARD SECURED
              </div>
            </div>

            <!-- Back Card -->
            <div class="wallet-card">
              <div class="grid-details" style="margin-top: 0;">
                <div class="detail-block" style="grid-column: span 2;">
                  <strong>Drug Allergies</strong>
                  <span class="allergy">${patientAllergies}</span>
                </div>
                <div class="detail-block" style="grid-column: span 2;">
                  <strong>Active Medications</strong>
                  <span>${patientMeds}</span>
                </div>
                <div class="detail-block" style="grid-column: span 2;">
                  <strong>History / Diagnoses</strong>
                  <span>${patientHistory}</span>
                </div>
                <div class="detail-block" style="grid-column: span 2;">
                  <strong>Emergency Contact</strong>
                  <span style="font-size: 9px;">${contactsListHtml}</span>
                </div>
              </div>
              <div class="footer-card" style="margin-top: 10px;">
                HIPAA SECURITY REGISTERED
              </div>
            </div>
          </div>
          <button class="print-btn" onclick="window.print()">Print Card</button>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleBreakGlassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !reason || !confirmSafety) return;
    triggerBreakGlass(docName, reason);
    setIsBreakGlassModalOpen(false);
    setDocName('');
    setReason('');
    setConfirmSafety(false);
  };

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactRelation || !newContactPhone) return;
    addEmergencyContact(newContactName, newContactRelation, newContactPhone);
    setIsAddContactModalOpen(false);
    setNewContactName('');
    setNewContactRelation('');
    setNewContactPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Top Warning banner */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Flame className="text-rose-500" size={20} /> Emergency Medical Access
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Paramedics and clinical responders can request emergency access to critical health records (allergies, active regimens) during medical crises. Access overrides are fully logged and subject to HIPAA audits.
            </p>
          </div>
          <div className="text-[10px] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-slate-650 flex items-center gap-2 font-semibold">
            <Lock size={12} className="text-rose-500" />
            HIPAA COMPLIANT BYPASS LOCKS
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Break Glass Action Board */}
        <Card className={`lg:col-span-2 relative overflow-hidden flex flex-col justify-between
          ${breakGlassActive ? 'border-rose-300 bg-rose-50/20' : ''}`}>
          
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2 text-slate-900">
              <Flame className={breakGlassActive ? 'text-rose-500' : 'text-slate-400'} size={18} /> Emergency Console
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Manage and monitor emergency medical overrides for this patient profile
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 bg-white pt-4">
            {breakGlassActive ? (
              <div className="space-y-5 py-4 animate-fade-in">
                {/* Danger Box */}
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-3">
                  <div className="flex items-center gap-2 text-rose-900 font-bold">
                    <ShieldAlert size={18} className="text-rose-600 animate-pulse" />
                    <span>EMERGENCY ACCESS OVERRIDE ACTIVATED</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[10px] text-rose-800 pt-2 border-t border-rose-200">
                    <div>
                      <span className="text-rose-600 font-bold block">AUTHORIZED CLINICIAN</span>
                      <span className="text-rose-950 font-bold">{activeEmergencyDoctor}</span>
                    </div>
                    <div>
                      <span className="text-rose-600 font-bold block">OVERRIDE STATUS</span>
                      <span className="text-rose-950 font-bold">ACTIVE (AUDITED)</span>
                    </div>
                    <div>
                      <span className="text-rose-600 font-bold block">BELIEVED DOCTOR</span>
                      <span className="text-rose-950 font-bold">{currentPatientProfile.preferredDoctorName || 'Not Set'}</span>
                    </div>
                    <div>
                      <span className="text-rose-600 font-bold block">PRIMARY HOSPITAL / CLINIC</span>
                      <span className="text-rose-950 font-bold">{currentPatientProfile.preferredHospitalName || 'Not Set'}</span>
                    </div>
                    <div>
                      <span className="text-rose-600 font-bold block">PATIENT UID</span>
                      <span className="text-rose-950 font-bold">{currentPatientProfile.patientUid || 'PX-XXXXXX'}</span>
                    </div>
                    <div>
                      <span className="text-rose-600 font-bold block">PATIENT AADHAAR ID</span>
                      <span className="text-rose-950 font-bold">{currentPatientProfile.aadhaarId ? '••••-••••-' + currentPatientProfile.aadhaarId.slice(-4) : '••••-••••-XXXX'}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-rose-800">
                    <span className="text-rose-600 font-bold block">CLINICAL REASONING</span>
                    <p className="text-rose-950 font-semibold mt-0.5 leading-relaxed">
                      "{activeEmergencyReason}"
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-650 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-500" />
                  <span>Compliance log generated. Clinicians must log clinical summaries post-event.</span>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full text-xs font-semibold py-2.5"
                  onClick={deactivateBreakGlass}
                >
                  Terminate Emergency Override
                </Button>
              </div>
            ) : (
              <div className="space-y-5 py-4 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto shadow-sm animate-pulse-slow">
                  <Flame size={28} />
                </div>
                <div className="max-w-md mx-auto">
                  <h4 className="text-sm font-bold text-slate-900">Emergency Override Gateway</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Test the emergency response protocols. Simulates a clinician initiating a break-glass protocol to pull allergies and active prescriptions when the patient is unresponsive.
                  </p>
                </div>

                <Button
                  variant="emergency"
                  className="w-full max-w-sm text-xs font-semibold py-2.5 mx-auto"
                  onClick={() => setIsBreakGlassModalOpen(true)}
                >
                  Initiate Break-Glass Protocol
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Emergency Medical Card */}
        <Card className="bg-gradient-to-br from-white to-rose-50/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-900">
              <Heart className="text-rose-500" size={16} /> Emergency Medical ID Card
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Clinically critical parameters formatted for paramedics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2 bg-transparent">
            {user?.role === 'doctor' && !breakGlassActive ? (
              <div className="p-6 border border-rose-100 bg-rose-50/20 rounded-2xl text-center space-y-4 flex flex-col justify-center items-center min-h-[300px] shadow-inner">
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 shadow-sm animate-pulse">
                  <Lock size={20} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Emergency ID Card Encrypted</h4>
                  <p className="text-[10px] text-slate-500 max-w-xs leading-normal">
                    This emergency card contains critical clinical parameters (blood type, drug allergies, active regimens).
                  </p>
                  <p className="text-[10px] text-rose-600 font-semibold max-w-xs leading-normal bg-rose-50/50 p-2 rounded-lg border border-rose-100/50 mt-1">
                    To decrypt and view this medical card, please initiate the Break-Glass Protocol on the left. All emergency overrides are logged to the HIPAA ledger.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* The Printed Card look */}
                <div className="p-5 border border-slate-200 bg-white rounded-2xl relative overflow-hidden text-[10px] space-y-4 shadow-sm cursor-pointer hover:border-slate-350 transition-colors">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 tracking-tight">{currentPatientProfile.name.toUpperCase()}</h4>
                      <span className="text-[8px] text-slate-400 font-semibold block mt-1 uppercase">
                        ID: {currentPatientProfile.patientUid || 'PX-XXXXXX'} • Aadhaar: {currentPatientProfile.aadhaarId ? '••••-••••-' + currentPatientProfile.aadhaarId.slice(-4) : '••••-••••-XXXX'}
                      </span>
                    </div>
                    <div className="p-1 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <QrCode size={32} className="text-slate-800" />
                    </div>
                  </div>

                  {/* Parameters */}
                  <div className="grid grid-cols-2 gap-3.5 border-t border-slate-100 pt-3 text-slate-700">
                    <div>
                      <span className="text-slate-400 font-bold block text-[8px] uppercase tracking-wider">BLOOD TYPE</span>
                      <span className="text-slate-900 font-extrabold text-xs">
                        {formatBloodGroupLongName(currentPatientProfile.bloodGroup || 'O+')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[8px] uppercase tracking-wider">DRUG ALLERGIES</span>
                      <span className="text-rose-600 font-bold text-[9px] truncate block" title={patientAllergies}>
                        {patientAllergies}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[8px] uppercase tracking-wider">BELIEVED DOCTOR</span>
                      <span className="text-slate-900 font-semibold text-[9px] truncate block" title={currentPatientProfile.preferredDoctorName || 'Not Set'}>
                        {currentPatientProfile.preferredDoctorName || 'Not Set'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[8px] uppercase tracking-wider">PREFERRED CLINIC / HOSPITAL</span>
                      <span className="text-slate-900 font-semibold text-[9px] truncate block" title={currentPatientProfile.preferredHospitalName || 'Not Set'}>
                        {currentPatientProfile.preferredHospitalName || 'Not Set'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 font-bold block text-[8px] uppercase tracking-wider">ACTIVE MEDICATIONS</span>
                      <span className="text-slate-900 text-[9px] block truncate font-semibold" title={patientMeds}>
                        {patientMeds}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[8px] text-slate-450 pt-2 border-t border-slate-100 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>SECURED & REGISTERED HEALTH INFORMATION</span>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={handleExportPDF}
                  >
                    Export Medical ID Card
                  </Button>
                  {user?.role === 'patient' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setIsEditOpen(true)}
                    >
                      Edit Card Details
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Emergency Proxies list */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-md flex items-center gap-2 text-slate-900">
              <UserCheck className="text-primary-600" size={18} /> Authorized Emergency Proxies
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Designated family members or contacts permitted to authorize records access in critical scenarios
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setIsAddContactModalOpen(true)}
            leftIcon={<Plus size={12} />}
          >
            Add Proxy
          </Button>
        </CardHeader>
        <CardContent className="p-0 bg-white">
          <div className="divide-y divide-slate-100">
            {emergencyContacts.map((contact) => (
              <div key={contact.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-650">
                    <Phone size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{contact.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{contact.relation}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="font-semibold text-slate-600">{contact.phone}</span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] rounded-full font-bold">
                    {contact.status}
                  </span>
                  <button
                    onClick={() => deleteEmergencyContact(contact.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Proxy"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Break Glass Authorization Modal */}
      <Modal
        isOpen={isBreakGlassModalOpen}
        onClose={() => setIsBreakGlassModalOpen(false)}
        title="Emergency Break-Glass Override"
        description="Verify clinician credentials and input emergency justification to pull patient data."
      >
        <form onSubmit={handleBreakGlassSubmit} className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 space-y-1.5 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 text-rose-900"><AlertTriangle size={14} /> HEAVY AUDIT WARNING</p>
            <p className="text-[10px] text-rose-700 font-medium">
              Bypassing patient filters requires an immediate compliance audit. The patient's registered proxies will be notified immediately of this emergency access.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clinician Full Name</label>
            <input
              type="text"
              placeholder="e.g., Dr. Sarah Connor, MD"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clinical Override Rationale</label>
            <textarea
              placeholder="e.g., Patient is unresponsive with suspected medication overdose. Immediate allergy screening required."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-20 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 resize-none"
              required
            />
          </div>

          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="confirm"
              checked={confirmSafety}
              onChange={(e) => setConfirmSafety(e.target.checked)}
              className="w-4 h-4 bg-white border border-slate-200 rounded focus:ring-rose-500 focus:outline-none cursor-pointer accent-rose-600 mt-0.5"
              required
            />
            <label htmlFor="confirm" className="text-[10px] text-slate-500 select-none cursor-pointer leading-tight">
              I certify that this override is clinically necessary. Unauthorized triggers are subject to severe HIPAA legal penalties.
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBreakGlassModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="emergency"
              size="sm"
              disabled={!docName || !reason || !confirmSafety}
            >
              Authorize Emergency Bypass
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Proxy Modal */}
      <Modal
        isOpen={isAddContactModalOpen}
        onClose={() => setIsAddContactModalOpen(false)}
        title="Register Emergency Proxy"
        description="Designate a trusted family member or proxy permitted to authorize access."
      >
        <form onSubmit={handleAddContactSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              placeholder="e.g., John Vance"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Relationship</label>
              <input
                type="text"
                placeholder="e.g., Family Member"
                value={newContactRelation}
                onChange={(e) => setNewContactRelation(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact Number</label>
              <input
                type="tel"
                placeholder="+1 (555) 012-3456"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddContactModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!newContactName || !newContactRelation || !newContactPhone}
            >
              Save Proxy Details
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Card Details Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Emergency Card Details"
        description="Fill in your believed doctor, primary hospital/clinic, and Aadhaar ID to display on your Emergency Medical ID card."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Aadhaar ID</label>
            <input
              type="text"
              placeholder="e.g., 2034-8841-2940"
              value={editAadhaar}
              onChange={(e) => setEditAadhaar(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Believed Doctor Name</label>
            <input
              type="text"
              placeholder="e.g., Dr. S.P. MUDITY"
              value={editDocName}
              onChange={(e) => setEditDocName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Primary Hospital / Clinic Name</label>
            <input
              type="text"
              placeholder="e.g., JSS Hospital"
              value={editHospitalName}
              onChange={(e) => setEditHospitalName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveProfileDetails}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
