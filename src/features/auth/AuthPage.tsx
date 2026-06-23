import React, { useState } from 'react';
import { Shield, Key, Fingerprint, Lock, Mail, ArrowRight, RefreshCw, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useApp } from '../../context/AppContext';

export const AuthPage: React.FC = () => {
  const { login, registerUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [mfaCode, setMfaCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  
  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regInstitution, setRegInstitution] = useState('');
  const [regLogoText, setRegLogoText] = useState('');
  const [regRole, setRegRole] = useState<'patient' | 'doctor' | 'laboratory'>('doctor');
  const [regType, setRegType] = useState<'Hospital' | 'Laboratory' | 'Pharmacy' | 'Insurance'>('Hospital');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid institutional or personal email address.');
      return;
    }
    if (!password) {
      setError('Please enter your passphrase/password.');
      return;
    }
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('mfa');
    }, 800);
  };

  const handlePasskeySignIn = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      setEmail('biometric.key@mediguard.ai');
      setPassword('hardware_bound_key');
      setIsLoading(false);
      setStep('mfa');
    }, 700);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || (regRole !== 'patient' && (!regInstitution || !regLogoText))) {
      setError('Please fill in all registration fields.');
      return;
    }
    if (!regEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    setTimeout(() => {
      registerUser({
        name: regName,
        email: regEmail,
        role: regRole,
        ...(regRole !== 'patient' ? {
          institution: regInstitution,
          providerId: `prov_custom_${Date.now()}`,
          logoText: regLogoText.toUpperCase(),
          providerType: regRole === 'laboratory' ? 'Laboratory' : regType
        } : {})
      });
      
      setIsLoading(false);
      setSuccessMessage('Registration successful! You can now sign in using your credentials.');
      
      setEmail(regEmail);
      setPassword(regPassword);
      setAuthTab('login');
      
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegInstitution('');
      setRegLogoText('');
    }, 800);
  };

  const handleMfaSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const codeString = mfaCode.join('');
    if (codeString.length < 6) {
      setError('Please enter the full 6-digit authenticator code.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      login(email);
    }, 1000);
  };

  const handleMfaChange = (index: number, val: string) => {
    if (isNaN(Number(val))) return;
    const newCode = [...mfaCode];
    newCode[index] = val.substring(val.length - 1);
    setMfaCode(newCode);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`mfa-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !mfaCode[index] && index > 0) {
      const prevInput = document.getElementById(`mfa-${index - 1}`);
      prevInput?.focus();
    }
  };

  const fillDemoCode = () => {
    const demo = ['5', '8', '2', '0', '9', '4'];
    setMfaCode(demo);
    setTimeout(() => {
      document.getElementById('mfa-5')?.focus();
    }, 50);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden font-sans">
      {/* Left Panel: Introduction (Stripe-like) */}
      <div className="hidden lg:flex lg:w-1/2 bg-white border-r border-slate-200 p-16 flex-col justify-between relative overflow-hidden">
        {/* Decorative Grid and Background Gradient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-50/40 rounded-full blur-3xl pointer-events-none" />
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 z-10">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-600 text-white shadow-sm">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900 leading-none">MediGuard <span className="text-primary-600">AI</span></h2>
            <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase font-semibold">Health Access Portal</span>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="my-auto max-w-lg z-10 space-y-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700">
              <Sparkles size={12} /> Patient Ownership & Transparency
            </span>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Sovereign Health Vaults, Designed for Trust
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              MediGuard AI bridges the gap between clinicians and patient consent. Your medical history is encrypted, verified, and shared only with your explicit approval.
            </p>
          </div>

          {/* Core Benefit Items */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-start gap-3 text-xs">
              <CheckCircle className="text-emerald-500 mt-0.5" size={16} />
              <div>
                <h4 className="font-semibold text-slate-950">Patient-Sovereign Access</h4>
                <p className="text-slate-500 mt-0.5">Patients control who retrieves, views, or appends clinical records.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-xs">
              <CheckCircle className="text-emerald-500 mt-0.5" size={16} />
              <div>
                <h4 className="font-semibold text-slate-950">Clinical Safety Checks</h4>
                <p className="text-slate-500 mt-0.5">Automated screening prevents medication conflicts, drug allergies, and dosing errors.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-xs">
              <CheckCircle className="text-emerald-500 mt-0.5" size={16} />
              <div>
                <h4 className="font-semibold text-slate-950">Audited Trust Ledger</h4>
                <p className="text-slate-500 mt-0.5">A clean, transparent access history detailing exactly who accessed your medical files and why.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-100 pt-6 font-medium">
          <span>HIPAA COMPLIANT</span>
          <span>•</span>
          <span>CLINICALLY VALIDATED</span>
          <span>•</span>
          <span>SECURED SESSION KEYS</span>
        </div>
      </div>

      {/* Right Panel: Onboarding Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 z-10 relative bg-slate-50 overflow-y-auto min-h-screen">
        <div className="w-full max-w-[400px]">
          {/* Brand Header (Only visible on mobile layout) */}
          <div className="flex flex-col items-center mb-8 text-center lg:hidden">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary-600 text-white shadow-md mb-3">
              <Shield size={20} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">MediGuard <span className="text-primary-600">AI</span></h1>
            <p className="text-xs text-slate-500 mt-1 font-sans">Patient-Sovereign Healthcare Intelligence</p>
          </div>

          {/* Form Card */}
          <Card className="border border-slate-200 bg-white shadow-md p-8">
            <CardContent className="p-0">
              {/* Tab Selector */}
              {step === 'credentials' && (
                <div className="flex border-b border-slate-100 pb-4 mb-6">
                  <button
                    type="button"
                    onClick={() => { setAuthTab('login'); setError(''); setSuccessMessage(''); }}
                    className={`flex-1 text-center py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 border-b-2
                      ${authTab === 'login' 
                        ? 'text-primary-600 border-primary-600 font-bold' 
                        : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab('register'); setError(''); setSuccessMessage(''); }}
                    className={`flex-1 text-center py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 border-b-2
                      ${authTab === 'register' 
                        ? 'text-primary-600 border-primary-600 font-bold' 
                        : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {successMessage && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl font-medium mb-5 animate-fade-in">
                  {successMessage}
                </p>
              )}

              {step === 'credentials' && authTab === 'register' ? (
                <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Onboard Profile</h2>
                    <p className="text-xs text-slate-500">Register your healthcare or patient account on the network</p>
                  </div>

                  <div className="space-y-3.5">
                    {/* Role Selector Buttons */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">I am a...</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setRegRole('patient')}
                          className={`py-2 rounded-xl text-center border transition-all text-xs font-semibold
                            ${regRole === 'patient'
                              ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'}`}
                        >
                          Patient
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegRole('doctor')}
                          className={`py-2 rounded-xl text-center border transition-all text-xs font-semibold
                            ${regRole === 'doctor'
                              ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'}`}
                        >
                          Clinician
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegRole('laboratory')}
                          className={`py-2 rounded-xl text-center border transition-all text-xs font-semibold
                            ${regRole === 'laboratory'
                              ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'}`}
                        >
                          Lab Tech
                        </button>
                      </div>
                    </div>

                    <div className={regRole === 'patient' ? "space-y-1.5" : "grid grid-cols-2 gap-3"}>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {regRole === 'patient' ? 'Full Name' : 'Professional Name'}
                        </label>
                        <input
                          type="text"
                          placeholder={regRole === 'patient' ? 'Jonathan Vance' : 'Dr. Sarah Connor, MD'}
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      {regRole !== 'patient' && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Institution Name</label>
                          <input
                            type="text"
                            placeholder="Mayo Clinic"
                            value={regInstitution}
                            onChange={(e) => setRegInstitution(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      )}
                    </div>

                    {regRole !== 'patient' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Initials Logo Text</label>
                          <input
                            type="text"
                            placeholder="MC"
                            maxLength={3}
                            value={regLogoText}
                            onChange={(e) => setRegLogoText(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all uppercase"
                            required
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Provider Type</label>
                          {regRole === 'laboratory' ? (
                            <input
                              type="text"
                              value="Laboratory"
                              className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-slate-500 text-xs"
                              disabled
                            />
                          ) : (
                            <select
                              value={regType}
                              onChange={(e) => setRegType(e.target.value as any)}
                              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
                              disabled={isLoading}
                            >
                              <option value="Hospital">Hospital</option>
                              <option value="Pharmacy">Pharmacy</option>
                              <option value="Insurance">Insurance Partner</option>
                            </select>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                      <input
                        type="email"
                        placeholder="yourname@domain.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Password</label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {error && <p className="text-xs text-danger bg-red-50 border border-red-200 p-2.5 rounded-xl font-medium">{error}</p>}

                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full text-xs font-semibold py-2.5 mt-2"
                  >
                    Create Account
                  </Button>
                </form>
              ) : step === 'credentials' ? (
                <form onSubmit={handleSendCode} className="space-y-5 animate-fade-in">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Access Portal</h2>
                    <p className="text-xs text-slate-500">Sign in with your email or biometrics key</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input
                          type="email"
                          placeholder="patient@mediguard.ai"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input
                          type="password"
                          placeholder="••••••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Biometrics Option */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-700">Hardware Access Key</label>
                        <span className="text-[10px] text-primary-600 flex items-center gap-1 font-medium">
                          <Fingerprint size={11} /> Biometrics Supported
                        </span>
                      </div>
                      <div 
                        onClick={handlePasskeySignIn}
                        className="p-3 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Key className="text-slate-400 group-hover:text-primary-600 transition-colors" size={15} />
                          <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">Sign in with Face ID / Passkey</span>
                        </div>
                        <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium">FIDO2</span>
                      </div>
                    </div>
                  </div>

                  {error && <p className="text-xs text-danger bg-red-50 border border-red-200 p-2.5 rounded-xl font-medium">{error}</p>}

                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full text-xs font-semibold py-2.5"
                    rightIcon={<ArrowRight size={14} />}
                  >
                    Initiate Security Handshake
                  </Button>

                  {/* Demo Quick Access Section */}
                  <div className="pt-5 mt-5 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Quick Access Role Presets</span>
                      <span className="text-[9px] bg-primary-50 text-primary-600 border border-primary-100 px-2 py-0.5 rounded-full font-bold">1-CLICK LOGIN</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEmail('patient@mediguard.ai');
                          setPassword('patient_passphrase_demo');
                          setStep('mfa');
                          setMfaCode(['5', '8', '2', '0', '9', '4']);
                        }}
                        className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center transition-all group"
                      >
                        <span className="text-xs font-bold text-slate-800 block">Patient</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5 group-hover:text-primary-600">J. Vance</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setEmail('doctor@sutterhealth.org');
                          setPassword('doctor_passphrase_demo');
                          setStep('mfa');
                          setMfaCode(['5', '8', '2', '0', '9', '4']);
                        }}
                        className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center transition-all group"
                      >
                        <span className="text-xs font-bold text-slate-800 block">Doctor</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5 group-hover:text-primary-600 font-mono">Sutter</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEmail('lab@questdiagnostics.com');
                          setPassword('lab_passphrase_demo');
                          setStep('mfa');
                          setMfaCode(['5', '8', '2', '0', '9', '4']);
                        }}
                        className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center transition-all group"
                      >
                        <span className="text-xs font-bold text-slate-800 block">Lab Tech</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5 group-hover:text-primary-600 font-mono">Quest</span>
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-5 animate-fade-in">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <Lock className="text-primary-600" size={18} /> Two-Factor Verification
                    </h2>
                    <p className="text-xs text-slate-500">Enter the 6-digit code sent to your registered device</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between gap-2">
                      {mfaCode.map((digit, index) => (
                        <input
                          key={index}
                          id={`mfa-${index}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleMfaChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className="w-12 h-12 border border-slate-200 bg-white rounded-xl text-center text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-mono"
                          disabled={isLoading}
                        />
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Security check active</span>
                      <button 
                        type="button" 
                        onClick={fillDemoCode}
                        className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <RefreshCw size={12} /> Auto-fill Demo Code
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-xs text-danger bg-red-50 border border-red-200 p-2.5 rounded-xl font-medium">{error}</p>}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => { setStep('credentials'); setError(''); }}
                      disabled={isLoading}
                      className="flex-1 text-xs py-2"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => handleMfaSubmit()}
                      isLoading={isLoading}
                      className="flex-[2] text-xs font-semibold py-2"
                    >
                      Verify Access
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
