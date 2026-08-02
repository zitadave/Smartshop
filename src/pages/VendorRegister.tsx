import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { toast } from '@/components/Toast';
import { haptic } from '@/lib/confetti';
import { cn } from '@/lib/utils';
import { sendAdminTelegram } from '@/lib/adminNotifier';
import { sendEmailNotification } from '@/lib/emailNotifier';
import {
  ArrowLeft, Store, Save, Smartphone, Mail, FileText, Store as StoreIcon,
  Loader, Camera, Shield, CheckCircle, FileSpreadsheet, MapPin, Upload, X,
  FileCheck, Check
} from 'lucide-react';

function compressImage(base64Str: string, maxWidth: number = 800): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }
    const img = new window.Image();
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
      const compressed = canvas.toDataURL('image/jpeg', 0.75);
      resolve(compressed);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

function VendorStepBar({ step, setStep }: { step: number; setStep: (s: number) => void }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative px-6">
        {/* Connecting Line */}
        <div className="absolute top-5 left-12 right-12 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0">
          <div
            className="h-full bg-amber-400 transition-all duration-300"
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
          />
        </div>

        {/* Step 1: Profile */}
        <button
          type="button"
          onClick={() => setStep(1)}
          className="flex flex-col items-center gap-1.5 z-10 cursor-pointer group"
        >
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all',
              step === 1
                ? 'bg-amber-400 text-white ring-4 ring-amber-400/20 scale-110'
                : 'bg-amber-400 text-white'
            )}
          >
            <span>i</span>
          </div>
          <span
            className={cn(
              'text-xs font-semibold capitalize transition-colors',
              step === 1 ? 'text-amber-500 font-bold' : 'text-slate-400'
            )}
          >
            Profile
          </span>
        </button>

        {/* Step 2: documents */}
        <button
          type="button"
          onClick={() => setStep(2)}
          className="flex flex-col items-center gap-1.5 z-10 cursor-pointer group"
        >
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all',
              step === 2
                ? 'bg-teal-600 text-white ring-4 ring-teal-600/20 scale-110'
                : step > 2
                ? 'bg-teal-600 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            )}
          >
            <FileText size={16} />
          </div>
          <span
            className={cn(
              'text-xs font-semibold capitalize transition-colors',
              step === 2 ? 'text-teal-600 font-bold' : 'text-slate-400'
            )}
          >
            documents
          </span>
        </button>

        {/* Step 3: Address */}
        <button
          type="button"
          onClick={() => setStep(3)}
          className="flex flex-col items-center gap-1.5 z-10 cursor-pointer group"
        >
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all',
              step === 3
                ? 'bg-teal-600 text-white ring-4 ring-teal-600/20 scale-110'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            )}
          >
            <MapPin size={16} />
          </div>
          <span
            className={cn(
              'text-xs font-semibold capitalize transition-colors',
              step === 3 ? 'text-teal-600 font-bold' : 'text-slate-400'
            )}
          >
            Address
          </span>
        </button>
      </div>
    </div>
  );
}

export default function VendorRegister() {
  const nav = useNavigate();
  const store = useStore();
  const { darkMode } = store;
  const [step, setStep] = useState(1); // 1: Profile, 2: Documents, 3: Address
  const [submitting, setSubmitting] = useState(false);
  const [vendorStatus, setVendorStatus] = useState<string>('loading');

  useEffect(() => {
    let status = 'none';
    try { status = localStorage.getItem('ss_vendor_status') || 'none'; } catch(e) {}
    if (status === 'approved' || status === 'pending') {
      setVendorStatus(status);
      return;
    }
    let storedTgId = store.profile.telegramId || '';
    try { const p = JSON.parse(localStorage.getItem('ss_profile') || '{}'); if (p.telegramId) storedTgId = p.telegramId; } catch(e) {}
    let storedPhone = store.profile.phone || '';
    try { storedPhone = localStorage.getItem('ss_user_phone') || ''; } catch(e) {}
    if (storedTgId || storedPhone) {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: storedTgId, phone: storedPhone || '' })
      }).then(r => r.json()).then(d => {
        if (d && d.vendor_status) {
          localStorage.setItem('ss_vendor_status', d.vendor_status);
          setVendorStatus(d.vendor_status);
        } else {
          setVendorStatus('none');
        }
      }).catch(() => { setVendorStatus('none'); });
    } else {
      setVendorStatus('none');
    }
  }, [store.profile]);

  // Step 1: Profile (Store Details & Owner Identity)
  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('Male');
  const [faydaId, setFaydaId] = useState('');

  // Step 2: Documents (Logo, Background Image, Business Reg, Trade License, TIN)
  const [logo, setLogo] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [businessReg, setBusinessReg] = useState('');
  const [businessRegNumber, setBusinessRegNumber] = useState('');
  const [tradeLicense, setTradeLicense] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [tinDoc, setTinDoc] = useState('');
  const [tinNumber, setTinNumber] = useState('');

  // Step 3: Address (Location & GPS Coordinates)
  const [storeAddress, setStoreAddress] = useState('Addis Ababa');
  const [storeLat, setStoreLat] = useState<number | null>(null);
  const [storeLng, setStoreLng] = useState<number | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('ss_profile') || '{}');
      const phone = p.phone || localStorage.getItem('ss_user_phone') || '';
      if (phone) setStorePhone(phone);
    } catch {}
  }, []);

  const handleDocumentUpload = (e: any, setter: (val: string) => void, labelName: string, isImage = true) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast(`⏳ Uploading ${labelName}...`, 'info');
    const reader = new FileReader();
    reader.onloadend = async () => {
      let res = reader.result as string;
      if (isImage && res.startsWith('data:image')) {
        res = await compressImage(res, 600);
      }
      setter(res);
      toast(`✅ ${labelName} uploaded successfully!`, 'success');
      haptic('light');
    };
    reader.readAsDataURL(file);
  };

  const detectStoreLocation = () => {
    if (!navigator.geolocation) {
      toast('❌ GPS Location not supported on this browser.', 'error');
      return;
    }
    setDetectingLocation(true);
    toast('🔍 Capturing exact storefront/pickup GPS coordinates...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStoreLat(pos.coords.latitude);
        setStoreLng(pos.coords.longitude);
        setDetectingLocation(false);
        toast(`✅ Location mapped successfully! (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`, 'success');
      },
      () => {
        setDetectingLocation(false);
        toast('❌ GPS Error: Please allow location permissions to register.', 'error');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmitApplication = async () => {
    if (!storeName.trim()) {
      toast('Please enter your Store Name in Profile step', 'error');
      setStep(1);
      return;
    }
    if (!storePhone.trim()) {
      toast('Please enter your Store Phone Number in Profile step', 'error');
      setStep(1);
      return;
    }
    if (!businessRegNumber.trim() && !businessReg) {
      toast('Please upload your Business Registration or enter Registration number in Documents step', 'error');
      setStep(2);
      return;
    }
    if (!licenseNumber.trim() && !tradeLicense) {
      toast('Please upload your Trade Licence or enter Licence number in Documents step', 'error');
      setStep(2);
      return;
    }
    if (!tinNumber.trim() && !tinDoc) {
      toast('Please upload your TIN or enter TIN number in Documents step', 'error');
      setStep(2);
      return;
    }

    setSubmitting(true);
    toast('🚀 Submitting your vendor application & documents...', 'info');

    const application = {
      storeName: storeName.trim(),
      storePhone: storePhone.trim(),
      storeEmail: storeEmail.trim(),
      storeDesc: storeDesc.trim(),
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      gender,
      faydaId: faydaId.trim(),
      logo,
      backgroundImage,
      businessRegNumber: businessRegNumber.trim(),
      businessReg,
      licenseNumber: licenseNumber.trim(),
      tradeLicense,
      tinNumber: tinNumber.trim(),
      tinDoc,
      storeAddress: storeAddress.trim(),
      storeLat,
      storeLng,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    try {
      localStorage.setItem('ss_vendor_application', JSON.stringify(application));
      localStorage.setItem('ss_vendor_status', 'pending');

      // Save logo, backgroundImage, and store info to ss_vendor_settings & ss_vendor_store
      // so their store logo and background image appear immediately across their shop!
      const currentVendorSettings = {
        storeName: storeName.trim(),
        phone: storePhone.trim(),
        email: storeEmail.trim(),
        description: storeDesc.trim(),
        address: storeAddress.trim(),
        logo: logo || '',
        backgroundImage: backgroundImage || '',
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('ss_vendor_settings', JSON.stringify(currentVendorSettings));
      localStorage.setItem('ss_vendor_store', JSON.stringify({
        name: storeName.trim(),
        phone: storePhone.trim(),
        email: storeEmail.trim(),
        description: storeDesc.trim(),
        address: storeAddress.trim(),
        logo: logo || '',
        banner: backgroundImage || '',
        tagline: storeDesc.trim() || 'Official Store'
      }));

      // Send instant Telegram notification to Platform Admins
      sendAdminTelegram(
        `🏪 <b>New Vendor Application Submitted</b>\n\n` +
        `<b>Store Name:</b> ${storeName}\n` +
        `<b>Phone:</b> ${storePhone}\n` +
        `<b>Owner:</b> ${firstName} ${lastName}\n` +
        `<b>TIN Number:</b> ${tinNumber || 'Uploaded'}\n` +
        `<b>Trade License:</b> ${licenseNumber || 'Uploaded'}\n` +
        `<b>Business Reg:</b> ${businessRegNumber || 'Uploaded'}\n` +
        `<b>District/Address:</b> ${storeAddress || 'Addis Ababa'}\n` +
        `<b>Logo / Banner:</b> ${logo ? 'Yes' : 'No'} / ${backgroundImage ? 'Yes' : 'No'}\n\n` +
        `Review in Admin Control Panel: https://smartshop-steel.vercel.app/admin-panel`
      );

      if (storeEmail && storeEmail.includes('@')) {
        sendEmailNotification({
          to: storeEmail,
          subject: `🏪 Welcome to Smart Shop Vendor Network (${storeName})`,
          templateType: 'vendor_welcome',
          data: { vendor: { storeName, storePhone, tinNumber, licenseNumber, storeAddress, logo, backgroundImage } }
        });
      }

      try {
        await fetch('/api/vendors/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(application)
        });
      } catch {}

      toast('🎉 Vendor Application submitted! Your store logo & banner are configured.', 'success');
      haptic('success');
      setTimeout(() => {
        nav('/profile');
      }, 1500);
    } catch (err: any) {
      toast('Error submitting application: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (vendorStatus === 'approved') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="bg-card text-card-foreground rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-border animate-scaleIn">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">🏪</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Active Vendor
          </span>
          <h1 className="text-lg font-extrabold mt-3 text-foreground">You are an Approved Vendor!</h1>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Your store is active and verified. Head over to your Vendor Dashboard to upload products and manage your storefront.
          </p>
          <div className="space-y-2 mt-6">
            <button
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all"
              onClick={() => nav('/vendor')}
            >
              Go to Vendor Dashboard ➔
            </button>
            <button
              className="w-full py-3 border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
              onClick={() => nav('/profile')}
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (vendorStatus === 'pending') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="bg-card text-card-foreground rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-border animate-scaleIn">
          <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">⏳</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Under Review
          </span>
          <h1 className="text-lg font-extrabold mt-3 text-foreground">Application Under Review</h1>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Your vendor application has already been submitted and is currently under review by our administrators.
          </p>
          <div className="space-y-2 mt-6">
            <button
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-xs font-extrabold shadow-md hover:opacity-95 transition-all"
              onClick={() => nav('/profile')}
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={'min-h-screen p-4 pb-12 ' + (darkMode ? 'dark bg-slate-900 text-white' : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900')}>
      <div className="max-w-md mx-auto space-y-4">
        <button
          className={'flex items-center gap-2 text-sm ' + (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}
          onClick={() => {
            if (step > 1) setStep(step - 1);
            else nav('/profile');
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className={'rounded-3xl border p-6 shadow-md transition-all ' + (darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200')}>
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold tracking-tight">Documents</h1>
          </div>

          {/* 3-Step Bar matching pictures */}
          <VendorStepBar step={step} setStep={setStep} />

          <div className="space-y-6">
            {/* STEP 1: PROFILE */}
            {step === 1 && (
              <div className="space-y-4 animate-scaleIn">
                <div className="text-xs font-bold text-amber-500 border-b pb-1 flex items-center gap-1.5">
                  <span>👤</span> Store Details & Owner Identity
                </div>

                {/* Store Name */}
                <div>
                  <label className="text-[9px] font-bold uppercase text-slate-400">Store Name *</label>
                  <input
                    className={'w-full mt-1 p-3 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40 ' + (darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900')}
                    placeholder="e.g. Selam Electronics"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </div>

                {/* Store Phone */}
                <div>
                  <label className="text-[9px] font-bold uppercase text-slate-400">Phone Number *</label>
                  <input
                    className={'w-full mt-1 p-3 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 ' + (darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900')}
                    placeholder="09XXXXXXXX"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                  />
                </div>

                {/* Store Email */}
                <div>
                  <label className="text-[9px] font-bold uppercase text-slate-400">Email Address (Optional)</label>
                  <input
                    className={'w-full mt-1 p-3 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 ' + (darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900')}
                    placeholder="store@email.com"
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                  />
                </div>

                {/* Store Desc */}
                <div>
                  <label className="text-[9px] font-bold uppercase text-slate-400">Store Tagline / Description</label>
                  <input
                    className={'w-full mt-1 p-3 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 ' + (darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900')}
                    placeholder="What does your store sell?"
                    value={storeDesc}
                    onChange={(e) => setStoreDesc(e.target.value)}
                  />
                </div>

                {/* Legal Names */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40">
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400">First *</label>
                    <input
                      className={'w-full mt-1 p-2.5 border rounded-xl text-xs ' + (darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200')}
                      placeholder="Abebe"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400">Middle *</label>
                    <input
                      className={'w-full mt-1 p-2.5 border rounded-xl text-xs ' + (darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200')}
                      placeholder="Kebede"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400">Last *</label>
                    <input
                      className={'w-full mt-1 p-2.5 border rounded-xl text-xs ' + (darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200')}
                      placeholder="Tessema"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Fayda KYC (Optional) */}
                <div>
                  <label className="text-[9px] font-bold uppercase text-slate-400">Fayda ID / National ID (Optional)</label>
                  <input
                    className={'w-full mt-1 p-2.5 border rounded-xl text-xs font-mono ' + (darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200')}
                    placeholder="e.g. ETH-FD-12345"
                    value={faydaId}
                    onChange={(e) => setFaydaId(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full mt-4 py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl text-xs font-extrabold shadow-lg hover:opacity-95 transition-all"
                >
                  Continue to Documents ➔
                </button>
              </div>
            )}

            {/* STEP 2: DOCUMENTS (Matching user screenshots exactly) */}
            {step === 2 && (
              <div className="space-y-6 animate-scaleIn">
                {/* Logo */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Logo</label>
                    {logo && (
                      <button type="button" onClick={() => setLogo('')} className="text-[10px] text-red-500 font-semibold hover:underline">
                        Remove
                      </button>
                    )}
                  </div>
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center block cursor-pointer hover:border-teal-500 transition-colors bg-slate-50/50 dark:bg-slate-800/40">
                    <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={(e) => handleDocumentUpload(e, setLogo, 'Logo', true)} />
                    {logo ? (
                      <div className="space-y-2">
                        <img src={logo} alt="Logo" className="w-16 h-16 rounded-xl object-cover mx-auto shadow-md border" />
                        <span className="text-[10px] text-teal-600 font-bold block">✓ Logo Selected (Tap to change)</span>
                      </div>
                    ) : (
                      <div>
                        <Upload size={28} className="mx-auto mb-2 text-slate-400" />
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Drop your image here, <span className="text-teal-600 font-bold underline">Choose file</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Supported format: JPG, PNG</p>
                      </div>
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder="Or paste Logo URL (https://...)"
                    className="w-full mt-1.5 p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] bg-transparent text-foreground"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                  />
                </div>

                {/* Background Image */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Background Image</label>
                    {backgroundImage && (
                      <button type="button" onClick={() => setBackgroundImage('')} className="text-[10px] text-red-500 font-semibold hover:underline">
                        Remove
                      </button>
                    )}
                  </div>
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center block cursor-pointer hover:border-teal-500 transition-colors bg-slate-50/50 dark:bg-slate-800/40">
                    <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={(e) => handleDocumentUpload(e, setBackgroundImage, 'Background Image', true)} />
                    {backgroundImage ? (
                      <div className="space-y-2">
                        <img src={backgroundImage} alt="Background" className="w-full h-24 rounded-xl object-cover mx-auto shadow-md border" />
                        <span className="text-[10px] text-teal-600 font-bold block">✓ Banner Selected (Tap to change)</span>
                      </div>
                    ) : (
                      <div>
                        <Upload size={28} className="mx-auto mb-2 text-slate-400" />
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Drop your image here, <span className="text-teal-600 font-bold underline">Choose file</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Supported format: JPG, PNG</p>
                      </div>
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder="Or paste Banner URL (https://...)"
                    className="w-full mt-1.5 p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] bg-transparent text-foreground"
                    value={backgroundImage}
                    onChange={(e) => setBackgroundImage(e.target.value)}
                  />
                </div>

                {/* Business Registration * */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Business Registration <span className="text-red-500">*</span>
                    </label>
                    {businessReg && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <Check size={12} /> Uploaded
                      </span>
                    )}
                  </div>
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center block cursor-pointer hover:border-amber-500 transition-colors bg-slate-50/50 dark:bg-slate-800/40">
                    <input type="file" accept="image/png, image/jpeg, application/pdf" className="hidden" onChange={(e) => handleDocumentUpload(e, setBusinessReg, 'Business Registration', false)} />
                    <div>
                      <Upload size={28} className="mx-auto mb-2 text-amber-500" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Upload Business Registration</p>
                      <p className="text-[10px] text-slate-400 mt-1">Supported formats: pdf, jpg</p>
                    </div>
                  </label>
                  <input
                    type="text"
                    placeholder="Business Registration Number (e.g. BR-2026-991)"
                    className="w-full mt-1.5 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono bg-transparent text-foreground"
                    value={businessRegNumber}
                    onChange={(e) => setBusinessRegNumber(e.target.value)}
                  />
                </div>

                {/* Trade Licence * */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Trade Licence <span className="text-red-500">*</span>
                    </label>
                    {tradeLicense && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <Check size={12} /> Uploaded
                      </span>
                    )}
                  </div>
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center block cursor-pointer hover:border-amber-500 transition-colors bg-slate-50/50 dark:bg-slate-800/40">
                    <input type="file" accept="image/png, image/jpeg, application/pdf" className="hidden" onChange={(e) => handleDocumentUpload(e, setTradeLicense, 'Trade Licence', false)} />
                    <div>
                      <Upload size={28} className="mx-auto mb-2 text-amber-500" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Upload Trade Licence</p>
                      <p className="text-[10px] text-slate-400 mt-1">Supported formats: pdf, jpg</p>
                    </div>
                  </label>
                  <input
                    type="text"
                    placeholder="Trade Licence Number (e.g. TL-8591)"
                    className="w-full mt-1.5 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono bg-transparent text-foreground"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                </div>

                {/* TIN */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">TIN</label>
                    {tinDoc && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <Check size={12} /> Uploaded
                      </span>
                    )}
                  </div>
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center block cursor-pointer hover:border-amber-500 transition-colors bg-slate-50/50 dark:bg-slate-800/40">
                    <input type="file" accept="image/png, image/jpeg, application/pdf" className="hidden" onChange={(e) => handleDocumentUpload(e, setTinDoc, 'TIN Document', false)} />
                    <div>
                      <Upload size={28} className="mx-auto mb-2 text-amber-500" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Upload TIN</p>
                      <p className="text-[10px] text-slate-400 mt-1">Supported formats: pdf, jpg</p>
                    </div>
                  </label>
                  <input
                    type="text"
                    placeholder="TIN Number (e.g. 0012345678)"
                    className="w-full mt-1.5 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono bg-transparent text-foreground"
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3.5 border border-border rounded-xl text-xs font-bold hover:bg-muted transition-colors"
                  >
                    ← Back to Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl text-xs font-extrabold shadow-lg hover:opacity-95 transition-all"
                  >
                    Continue to Address ➔
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: ADDRESS */}
            {step === 3 && (
              <div className="space-y-4 animate-scaleIn">
                <div className="text-xs font-bold text-teal-600 border-b pb-1 flex items-center gap-1.5">
                  <span>📍</span> Store Location & Pickup Base
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase text-slate-400">Addis Ababa District / City *</label>
                  <select
                    className={'w-full mt-1 p-3 border rounded-xl text-xs font-bold ' + (darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900')}
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                  >
                    <option value="Bole">Bole District</option>
                    <option value="Kazanchis">Kazanchis District</option>
                    <option value="Piassa">Piassa District</option>
                    <option value="Megenagna">Megenagna District</option>
                    <option value="Sarbet">Sarbet District</option>
                    <option value="Gerji">Gerji District</option>
                    <option value="Kirkos">Kirkos District</option>
                    <option value="Arada">Arada District</option>
                    <option value="Kality">Kality District</option>
                    <option value="Hayat">Hayat District</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase text-slate-400">GPS Storefront Coordinates *</label>
                  <button
                    type="button"
                    onClick={detectStoreLocation}
                    disabled={detectingLocation}
                    className="w-full mt-1.5 p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    {detectingLocation ? <Loader size={16} className="animate-spin" /> : <MapPin size={16} />}
                    {storeLat && storeLng
                      ? `📍 GPS Recorded (${storeLat.toFixed(4)}, ${storeLng.toFixed(4)})`
                      : '📍 Capture Exact Storefront GPS Coordinates'}
                  </button>
                  <p className="text-[9px] text-slate-400 mt-1">
                    Required for courier pickup and distance calculation in Smart Express.
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-3.5 border border-border rounded-xl text-xs font-bold hover:bg-muted transition-colors"
                  >
                    ← Back to Documents
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitApplication}
                    disabled={submitting}
                    className="flex-[1.5] py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-extrabold shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    🚀 Submit Application
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
