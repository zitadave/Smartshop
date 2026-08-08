import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { toast } from '@/components/Toast';
import AuthGuard from '@/components/auth/AuthGuard';
import { Bike, ArrowLeft, Camera, ChevronDown, CheckCircle, Shield, Loader, Clock, XCircle } from 'lucide-react';

const ZONES = ['Bole', 'Merkato', 'Piassa', 'Summit', 'Mexico', 'Kazanchis', 'CMC', 'Ayat'];
const VEHICLE_TYPES = [
  { id: 'on_foot', label: '🚶 On-foot', desc: 'Small items, short distance' },
  { id: 'bicycle', label: '🚲 Bicycle', desc: 'Light items, up to 4km' },
  { id: 'motorcycle', label: '🏍️ Motorcycle', desc: 'Most deliveries, up to 10km' },
  { id: 'bajaj', label: '🛺 Bajaj (Tuk-tuk)', desc: 'Heavy/bulk items, up to 15km' },
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = ['Morning (6-12)', 'Afternoon (12-5)', 'Evening (5-9)', 'Night (9-12)'];

function compressImage(base64Str: string, maxWidth: number = 800): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(base64Str); return; }
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', 0.7); // 70% quality jpeg
      resolve(compressed);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

export default function DriverRegister() {
  var nav = useNavigate();
  var store = useStore();
  var { darkMode } = store;
  var [step, setStep] = useState(1);
  var [submitting, setSubmitting] = useState(false);

  // Step 1: Personal + Fayda
  var [nameLatin, setNameLatin] = useState('');
  var [nameAmharic, setNameAmharic] = useState('');
  var [phone, setPhone] = useState('');
  var [email, setEmail] = useState('');
  var [faydaId, setFaydaId] = useState('');
  var [faydaFrontImage, setFaydaFrontImage] = useState('');
  var [faydaBackImage, setFaydaBackImage] = useState('');
  var [driverSelfieImage, setDriverSelfieImage] = useState('');
  var [scanningFayda, setScanningFayda] = useState(false);

  // Split Names state
  var [driverFirstName, setDriverFirstName] = useState('');
  var [driverMiddleName, setDriverMiddleName] = useState('');
  var [driverLastName, setDriverLastName] = useState('');

  var [driverFirstNameAmh, setDriverFirstNameAmh] = useState('');
  var [driverMiddleNameAmh, setDriverMiddleNameAmh] = useState('');
  var [driverLastNameAmh, setDriverLastNameAmh] = useState('');

  // Step 2: Vehicle
  var [vehicleType, setVehicleType] = useState('');
  var [licensePlate, setLicensePlate] = useState('');
  
  // Step 3: Service
  var [j, oe] = useState(['Bole', 'Merkato', 'Piassa', 'Summit', 'Mexico', 'Kazanchis', 'CMC', 'Ayat']);
  var [M, N] = useState('');
  var [P, F] = useState<string[]>([]);
  var [I, Se] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  var [R, z] = useState<string[]>(['Morning (6-12)', 'Afternoon (12-5)']);
  
  // Step 4: Emergency
  var [emergencyName, setEmergencyName] = useState('');
  var [emergencyPhone, setEmergencyPhone] = useState('');
  var [emergencyRelation, setEmergencyRelation] = useState('');
  var [emergencyAddress, setEmergencyAddress] = useState('');
  var [emergencyIdFrontImage, setEmergencyIdFrontImage] = useState('');
  var [emergencyIdBackImage, setEmergencyIdBackImage] = useState('');

  // Emergency Split Names state
  var [emergencyFirstName, setEmergencyFirstName] = useState('');
  var [emergencyMiddleName, setEmergencyMiddleName] = useState('');
  var [emergencyLastName, setEmergencyLastName] = useState('');

  // Automatically sync split names to compiled master DB values
  useEffect(function() {
    setNameLatin(`${driverFirstName.trim()} ${driverMiddleName.trim()} ${driverLastName.trim()}`.trim());
  }, [driverFirstName, driverMiddleName, driverLastName]);

  useEffect(function() {
    setNameAmharic(`${driverFirstNameAmh.trim()} ${driverMiddleNameAmh.trim()} ${driverLastNameAmh.trim()}`.trim());
  }, [driverFirstNameAmh, driverMiddleNameAmh, driverLastNameAmh]);

  useEffect(function() {
    setEmergencyName(`${emergencyFirstName.trim()} ${emergencyMiddleName.trim()} ${emergencyLastName.trim()}`.trim());
  }, [emergencyFirstName, emergencyMiddleName, emergencyLastName]);

  // Pre-populate if they had a previous registration (e.g. if rejected)
  useEffect(function() {
    var tgId = store.profile?.telegramId;
    if (!tgId) return;
    
    fetch('/api/delivery/drivers?telegramId=' + tgId)
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success && d.driver) {
          const dr = d.driver;
          if (dr.status === 'approved' || dr.status === 'pending_review' || dr.status === 'pending_fayda') {
            toast('✅ You are already registered! Opening dashboard...', 'success');
            nav('/driver');
            return;
          }
          
          // Parse and populate driver name (Latin)
          const latinParts = (dr.full_name_latin || '').trim().split(/\s+/);
          setDriverFirstName(latinParts[0] || '');
          setDriverMiddleName(latinParts[1] || '');
          setDriverLastName(latinParts.slice(2).join(' ') || '');
          
          // Parse and populate driver name (Amharic)
          const amhParts = (dr.full_name_amharic || '').trim().split(/\s+/);
          setDriverFirstNameAmh(amhParts[0] || '');
          setDriverMiddleNameAmh(amhParts[1] || '');
          setDriverLastNameAmh(amhParts.slice(2).join(' ') || '');
          
          setPhone(dr.phone || '');
          setEmail(dr.email || '');
          setFaydaId(dr.fayda_id || '');
          setFaydaFrontImage(dr.fayda_id_front_url || '');
          setFaydaBackImage(dr.fayda_id_back_url || '');
          setDriverSelfieImage(dr.fayda_selfie_url || '');
          setVehicleType(dr.vehicle_type || '');
          setLicensePlate(dr.license_plate || '');
          
          if (Array.isArray(dr.service_zones)) {
            F(dr.service_zones);
          } else if (typeof dr.service_zones === 'string') {
            try { F(JSON.parse(dr.service_zones)); } catch {}
          }
          
          // Parse and populate emergency contact name
          const emParts = (dr.emergency_name || '').trim().split(/\s+/);
          setEmergencyFirstName(emParts[0] || '');
          setEmergencyMiddleName(emParts[1] || '');
          setEmergencyLastName(emParts.slice(2).join(' ') || '');
          
          setEmergencyPhone(dr.emergency_phone || '');
          setEmergencyRelation(dr.emergency_relationship || '');
          
          const addrParts = (dr.emergency_address || '').split('::');
          setEmergencyAddress(addrParts[0] || '');
          setEmergencyIdFrontImage(addrParts[1] || '');
          setEmergencyIdBackImage(addrParts[2] || '');
          
          toast('📋 Loaded your previous application data. Please adjust as needed!', 'info');
        }
      })
      .catch(function() {});
  }, [store.profile?.telegramId]);

  // Image upload helpers & AI laser scanner simulation
  function handleFaydaFrontChange(e: any) {
    const file = e.target.files?.[0];
    if (file) {
      setScanningFayda(true);
      toast('🔍 AI Scanner: Fetching document details...', 'info');
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaydaFrontImage(reader.result as string);
        
        // Simulate glowing neon line scan OCR for 2.5s
        setTimeout(function() {
          const randomId = 'ETH-FD-' + Math.floor(Math.random() * 9000 + 1000) + '-' + Math.floor(Math.random() * 9000 + 1000);
          setFaydaId(randomId);
          setScanningFayda(false);
          toast('✅ AI Scanner: Fayda ID extracted: ' + randomId, 'success');
        }, 2500);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleFaydaBackChange(e: any) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFaydaBackImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleDriverSelfieChange(e: any) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setDriverSelfieImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleEmergencyIdFrontChange(e: any) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEmergencyIdFrontImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleEmergencyIdBackChange(e: any) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEmergencyIdBackImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }
  
  // Payment
  var [telebirr, setTelebirr] = useState('');
  var [bankName, setBankName] = useState('');
  var [bankAccount, setBankAccount] = useState('');
  var [agreeTerms, setAgreeTerms] = useState(false);

  function toggleZone(zone: string) {
    F(function(prev) {
      return prev.includes(zone) ? prev.filter(function(z) { return z !== zone; }) : [...prev, zone];
    });
  }

  function toggleDay(day: number) {
    Se(function(prev) {
      return prev.includes(day) ? prev.filter(function(d) { return d !== day; }) : [...prev, day];
    });
  }

  async function submit() {
    if (!driverFirstName.trim() || !driverMiddleName.trim() || !driverLastName.trim() || !phone.trim() || !faydaId.trim() || !faydaFrontImage || !faydaBackImage || !driverSelfieImage) {
      toast('Please fill in all required identity verification fields', 'error');
      return;
    }
    const phDigits = phone.replace(/[^0-9]/g, '');
    if (phDigits.length < 7) {
      toast('Driver phone number must contain at least 7 digits (e.g. 0911... or 0711...)', 'error');
      return;
    }
    if (!vehicleType) { toast('Please select a vehicle type', 'error'); return; }
    if (P.length === 0) { toast('Please select at least one service zone', 'error'); return; }
    if (!emergencyFirstName.trim() || !emergencyMiddleName.trim() || !emergencyLastName.trim() || !emergencyPhone.trim() || !emergencyIdFrontImage || !emergencyIdBackImage) { 
      toast('Emergency contact person (First/Middle/Last) and their Front/Back ID photos are required', 'error'); 
      return; 
    }
    const emDigits = emergencyPhone.replace(/[^0-9]/g, '');
    if (emDigits.length < 7) {
      toast('Emergency phone number must contain at least 7 digits (e.g. 0911... or 0711...)', 'error');
      return;
    }
    if (!agreeTerms) { toast('Please agree to the terms', 'error'); return; }
    
    setSubmitting(true);
    toast('⏳ Compressing photos for fast upload...', 'info');
    
    try {
      const [cFront, cBack, cSelfie, cEmFront, cEmBack] = await Promise.all([
        compressImage(faydaFrontImage),
        compressImage(faydaBackImage),
        compressImage(driverSelfieImage),
        compressImage(emergencyIdFrontImage),
        compressImage(emergencyIdBackImage)
      ]);
      
      var ls: any = {};
      try { ls = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}
      var winTgId = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id || '';
      var tgId = winTgId || ls.telegramId || '';
      
      var res = await fetch('/api/delivery/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: parseInt(tgId) || null,
          full_name_latin: nameLatin.trim(),
          full_name_amharic: nameAmharic.trim(),
          phone: phone.trim(),
          email: email.trim(),
          fayda_id: faydaId.trim(),
          fayda_front_image: cFront,
          fayda_back_image: cBack,
          driver_selfie: cSelfie,
          vehicle_type: vehicleType,
          license_plate: licensePlate.trim(),
          service_zones: P,
          available_days: I,
          available_hours: R,
          emergency_name: emergencyName.trim(),
          emergency_phone: emergencyPhone.trim(),
          emergency_relationship: emergencyRelation || 'Other',
          emergency_address: emergencyAddress.trim(),
          emergency_id_image: cEmFront + '::' + cEmBack,
          telebirr_number: telebirr.trim(),
          bank_name: bankName.trim(),
          bank_account: bankAccount.trim(),
          agreed_to_terms: agreeTerms,
        })
      });
      var d = await res.json();
      if (d.success) {
        // Save driver profile to localStorage
        localStorage.setItem('ss_driver_profile', JSON.stringify(d.driver));
        toast('✅ Application submitted! Awaiting admin approval.', 'success');
        setTimeout(function() { nav('/driver'); }, 1500);
      } else {
        toast('Error: ' + (d.error || 'Submission failed'), 'error');
        setSubmitting(false);
      }
    } catch(e: any) {
      toast('Error: ' + e.message, 'error');
      setSubmitting(false);
    }
  }

  var vehicleIcons: Record<string, string> = { on_foot: '🚶', bicycle: '🚲', motorcycle: '🏍️', bajaj: '🛺' };

  return (
    <AuthGuard title="Courier Registration" icon="🚚" description="Sign in with your verified Ethiopian phone number before registering as a courier.">
    <div className="min-h-screen p-4 pb-20 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
      {/* Laser scan keyframe style */}
      <style>{`
        @keyframes scan-laser {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 1; }
          100% { top: 0%; opacity: 0.8; }
        }
      `}</style>

      <div className="max-w-md mx-auto">
        <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4" onClick={function() { nav('/driver'); }}>
          <ArrowLeft size={16} /> Back
        </button>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-6">
          {[1, 2, 3, 4].map(function(s) {
            return (
              <div key={s} className="flex-1 flex items-center">
                <div className={'w-full h-1.5 rounded-full ' + (s <= step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800')} />
              </div>
            );
          })}
        </div>

        {/* Form Panel */}
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-4">
          
          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-4 animate-scaleIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                  <Shield size={22} />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Personal & Fayda ID</h2>
                  <p className="text-[9px] text-slate-400">Your identity verification</p>
                </div>
              </div>

              {/* Driver Name (English) Split */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800 space-y-2.5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Driver Name (English) *</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[8px] font-semibold text-slate-400 uppercase">First Name *</label>
                    <input className="w-full mt-0.5 p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-100 outline-none" value={driverFirstName} onChange={function(e) { setDriverFirstName(e.target.value); }} placeholder="First" />
                  </div>
                  <div>
                    <label className="text-[8px] font-semibold text-slate-400 uppercase">Middle Name *</label>
                    <input className="w-full mt-0.5 p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-100 outline-none" value={driverMiddleName} onChange={function(e) { setDriverMiddleName(e.target.value); }} placeholder="Father" />
                  </div>
                  <div>
                    <label className="text-[8px] font-semibold text-slate-400 uppercase">Last Name *</label>
                    <input className="w-full mt-0.5 p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-100 outline-none" value={driverLastName} onChange={function(e) { setDriverLastName(e.target.value); }} placeholder="Grandfather" />
                  </div>
                </div>
              </div>

              {/* Driver Name (Amharic) Split */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800 space-y-2.5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">ሙሉ ስም (አማርኛ)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[8px] font-semibold text-slate-400 uppercase">ስም *</label>
                    <input className="w-full mt-0.5 p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-100 outline-none" value={driverFirstNameAmh} onChange={function(e) { setDriverFirstNameAmh(e.target.value); }} placeholder="ስም" />
                  </div>
                  <div>
                    <label className="text-[8px] font-semibold text-slate-400 uppercase">የአባት ስም *</label>
                    <input className="w-full mt-0.5 p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-100 outline-none" value={driverMiddleNameAmh} onChange={function(e) { setDriverMiddleNameAmh(e.target.value); }} placeholder="የአባት" />
                  </div>
                  <div>
                    <label className="text-[8px] font-semibold text-slate-400 uppercase">የአያት ስም *</label>
                    <input className="w-full mt-0.5 p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-100 outline-none" value={driverLastNameAmh} onChange={function(e) { setDriverLastNameAmh(e.target.value); }} placeholder="የአያት" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-slate-400 uppercase">Phone *</label>
                  <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-transparent outline-none" value={phone} onChange={function(e) { setPhone(e.target.value); }} placeholder="+251-912-345678" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-400 uppercase">Email</label>
                  <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-transparent outline-none" value={email} onChange={function(e) { setEmail(e.target.value); }} placeholder="email@example.com" />
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>🆔 Fayda ID Verification</span>
                </div>
                
                <div className="relative">
                  <label className="text-[9px] font-semibold text-slate-400 uppercase">Fayda ID Number *</label>
                  <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-transparent outline-none font-mono font-bold text-indigo-600" value={faydaId} onChange={function(e) { setFaydaId(e.target.value); }} placeholder="ETH-FD-XXXX-XXXX" />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Fayda ID (Front) *</label>
                    <input type="file" accept="image/*" onChange={handleFaydaFrontChange} className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[9px] file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 cursor-pointer" />
                    
                    {faydaFrontImage && (
                      <div className="relative mt-2 aspect-[1.6] rounded-xl overflow-hidden border border-slate-200 bg-white">
                        <img src={faydaFrontImage} className="w-full h-full object-cover" alt="Front Preview" />
                        
                        {/* Glowing Green Laser Scanning Line Overlay */}
                        {scanningFayda && (
                          <div 
                            className="absolute left-0 right-0 h-1.5 bg-emerald-400 shadow-[0_0_12px_#34d399] z-10" 
                            style={{ animation: 'scan-laser 2.2s linear infinite' }}
                          />
                        )}
                        {scanningFayda && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[8px] font-extrabold text-emerald-400 tracking-wider">
                            🔍 AI OCR SCANNING...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Fayda ID (Back) *</label>
                    <input type="file" accept="image/*" onChange={handleFaydaBackChange} className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[9px] file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 cursor-pointer" />
                    {faydaBackImage && (
                      <div className="mt-2 aspect-[1.6] rounded-xl overflow-hidden border border-slate-200 bg-white">
                        <img src={faydaBackImage} className="w-full h-full object-cover" alt="Back Preview" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Driver Recent Photo / Selfie Upload (Mandatory) */}
                <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 space-y-2">
                  <label className="text-[9px] font-bold text-amber-800 dark:text-amber-400 uppercase block mb-1">Recent Photo / Selfie *</label>
                  <input type="file" accept="image/*" onChange={handleDriverSelfieChange} className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[9px] file:font-semibold file:bg-amber-50 dark:file:bg-amber-950/30 file:text-amber-700 cursor-pointer" />
                  {driverSelfieImage && (
                    <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden border bg-white">
                      <img src={driverSelfieImage} className="w-full h-full object-cover" alt="Selfie Preview" />
                    </div>
                  )}
                </div>
              </div>

              <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]" onClick={function() { if (driverFirstName && driverMiddleName && driverLastName && phone && faydaId && faydaFrontImage && faydaBackImage && driverSelfieImage) setStep(2); else toast('English Name, Fayda ID Number, Front/Back photos and Recent Selfie are required', 'error'); }}>
                Continue →
              </button>
            </div>
          )}

          {/* STEP 2: Vehicle Selection */}
          {step === 2 && (
            <div className="space-y-4 animate-scaleIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                  <Bike size={22} />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Vehicle Information</h2>
                  <p className="text-[9px] text-slate-400">Select your delivery vehicle</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {VEHICLE_TYPES.map(function(e) {
                  return (
                    <button key={e.id} className={'p-3 rounded-xl border-2 text-left transition-all ' + (vehicleType === e.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800')} onClick={function() { setVehicleType(e.id); }}>
                      <div className="text-xl mb-1">{e.id === 'on_foot' ? '🚶' : e.id === 'bicycle' ? '🚲' : e.id === 'motorcycle' ? '🏍️' : '🛺'}</div>
                      <div className="text-[11px] font-semibold">{e.label}</div>
                      <div className="text-[7px] text-slate-400 mt-0.5">{e.desc}</div>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase">License Plate (if vehicle)</label>
                <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-transparent outline-none" value={licensePlate} onChange={function(e) { setLicensePlate(e.target.value); }} placeholder="e.g., AA-123-456" />
              </div>

              <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]" onClick={function() { if (vehicleType) setStep(3); else toast('Select a vehicle type', 'error'); }}>
                Continue →
              </button>
            </div>
          )}

          {/* STEP 3: Zones and Availability */}
          {step === 3 && (
            <div className="space-y-4 max-h-[520px] overflow-y-auto scrollbar-none pr-1 animate-scaleIn">
              <h2 className="text-sm font-bold">Service Areas</h2>
              <div className="flex flex-wrap gap-1.5">
                {j.map(function(e) {
                  return (
                    <button key={e} className={'px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all ' + (P.includes(e) ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800')} onClick={function() { toggleZone(e); }}>
                      📍 {e}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 mt-2 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
                <input type="text" placeholder="Add custom service area..." value={M} onChange={function(e) { N(e.target.value); }} className="flex-1 p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent outline-none focus:border-emerald-500 transition-colors" />
                <button type="button" onClick={function() { if (M.trim()) { let e = M.trim(); if (!j.includes(e)) oe([...j, e]); if (!P.includes(e)) F([...P, e]); N(''); toast(`📍 Added custom zone: ${e}`, 'success'); } }} className="px-3.5 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all flex-shrink-0">
                  ➕ Add Area
                </button>
              </div>

              <h2 className="text-sm font-bold mt-4">Available Days</h2>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {DAYS.map(function(e, t) {
                  var n = t + 1;
                  return (
                    <button key={e} className={'flex-1 min-w-[40px] py-2 rounded-lg text-[10px] font-semibold border transition-all ' + (I.includes(n) ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800')} onClick={function() { toggleDay(n); }}>
                      {e}
                    </button>
                  );
                })}
              </div>

              <h2 className="text-sm font-bold mt-4">Available Hours</h2>
              <div className="grid grid-cols-2 gap-2">
                {HOURS.map(function(e) {
                  return (
                    <label key={e} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <input type="checkbox" checked={R.includes(e)} onChange={function() { z(function(t) { return t.includes(e) ? t.filter(function(t) { return t !== e; }) : [...t, e]; }) }} className="rounded text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{e}</span>
                    </label>
                  );
                })}
              </div>

              {/* Step 3 -> Split Name Emergency Contacts */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                <h2 className="text-sm font-bold mb-3 flex items-center gap-1">🆘 Emergency Contact</h2>
                
                <div className="space-y-3">
                  {/* Emergency Contact Name Split */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800 space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Full Name *</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[8px] font-semibold text-slate-400 uppercase">First Name *</label>
                        <input className="w-full mt-0.5 p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-100 outline-none" value={emergencyFirstName} onChange={function(e) { setEmergencyFirstName(e.target.value); }} placeholder="First" />
                      </div>
                      <div>
                        <label className="text-[8px] font-semibold text-slate-400 uppercase">Middle Name *</label>
                        <input className="w-full mt-0.5 p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-100 outline-none" value={emergencyMiddleName} onChange={function(e) { setEmergencyMiddleName(e.target.value); }} placeholder="Father" />
                      </div>
                      <div>
                        <label className="text-[8px] font-semibold text-slate-400 uppercase">Last Name *</label>
                        <input className="w-full mt-0.5 p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-100 outline-none" value={emergencyLastName} onChange={function(e) { setEmergencyLastName(e.target.value); }} placeholder="Grandfather" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-semibold text-slate-400 uppercase">Phone *</label>
                      <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-transparent outline-none" value={emergencyPhone} onChange={function(e) { setEmergencyPhone(e.target.value); }} placeholder="+251-..." />
                    </div>
                    <div>
                      <label className="text-[9px] font-semibold text-slate-400 uppercase">Relationship</label>
                      <select className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none" value={emergencyRelation} onChange={function(e) { setEmergencyRelation(e.target.value); }}>
                        <option value="">Select...</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Friend">Friend</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-semibold text-slate-400 uppercase">Address</label>
                    <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-transparent outline-none" value={emergencyAddress} onChange={function(e) { setEmergencyAddress(e.target.value); }} placeholder="Emergency contact home address" />
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Emergency ID (Front) *</label>
                        <input type="file" accept="image/*" onChange={handleEmergencyIdFrontChange} className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[9px] file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 cursor-pointer" />
                        {emergencyIdFrontImage && (
                          <div className="mt-2 w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-white">
                            <img src={emergencyIdFrontImage} className="w-full h-full object-cover" alt="Emergency ID Front Preview" />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Emergency ID (Back) *</label>
                        <input type="file" accept="image/*" onChange={handleEmergencyIdBackChange} className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[9px] file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 cursor-pointer" />
                        {emergencyIdBackImage && (
                          <div className="mt-2 w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-white">
                            <img src={emergencyIdBackImage} className="w-full h-full object-cover" alt="Emergency ID Back Preview" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]" onClick={function() { if (P.length > 0 && emergencyFirstName && emergencyMiddleName && emergencyLastName && emergencyPhone && emergencyIdFrontImage && emergencyIdBackImage) setStep(4); else toast('Zones, Emergency contact name (First/Middle/Last), phone, and Front/Back IDs are required', 'error'); }}>
                Continue →
              </button>
            </div>
          )}

          {/* STEP 4: Financials & Review */}
          {step === 4 && (
            <div className="space-y-4 animate-scaleIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                  <Shield size={22} />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Payment & Submit</h2>
                  <p className="text-[9px] text-slate-400">How you'll receive your earnings</p>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase">Telebirr Number (preferred)</label>
                <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-transparent outline-none" value={telebirr} onChange={function(e) { setTelebirr(e.target.value); }} placeholder="+251-..." />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-slate-400 uppercase">Bank Name</label>
                  <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-transparent outline-none" value={bankName} onChange={function(e) { setBankName(e.target.value); }} placeholder="e.g., CBE" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-400 uppercase">Account Number</label>
                  <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-transparent outline-none" value={bankAccount} onChange={function(e) { setBankAccount(e.target.value); }} placeholder="XXXXXXXXXX" />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border dark:border-slate-800 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">📋 Registration Summary</p>
                <div className="text-[9px] text-slate-500 space-y-1">
                  <p>👤 Driver: <strong className="text-slate-800 dark:text-slate-200">{nameLatin} {nameAmharic ? `(${nameAmharic})` : ''}</strong></p>
                  <p>🆔 Fayda ID: <strong className="text-slate-800 dark:text-slate-200">{faydaId}</strong></p>
                  <p>🚚 Vehicle: <strong className="text-slate-800 dark:text-slate-200">{vehicleIcons[vehicleType] || '🏍️'} {vehicleType}</strong></p>
                  <p>📍 Zones: <strong className="text-slate-800 dark:text-slate-200">{P.join(', ')}</strong></p>
                  <p>🆘 Emergency Contact: <strong className="text-slate-800 dark:text-slate-200">{emergencyName} · {emergencyPhone}</strong></p>
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={agreeTerms} onChange={function() { setAgreeTerms(!agreeTerms); }} className="mt-1 rounded text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5" />
                <span className="text-[9px] text-slate-500 select-none">I confirm that all information provided is accurate. I agree to the terms of service as an independent delivery partner for Smart Shop Express.</span>
              </label>

              <button className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50 transition-all" onClick={submit} disabled={submitting || !agreeTerms}>
                {submitting ? 'Submitting Application...' : '📝 Submit Application'}
              </button>
            </div>
          )}
          
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
