import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { toast } from '@/components/Toast';
import { Bike, ArrowLeft, Camera, ChevronDown, CheckCircle, Shield } from 'lucide-react';

const ZONES = ['Bole', 'Merkato', 'Piassa', 'Summit', 'Mexico', 'Kazanchis', 'CMC', 'Ayat'];
const VEHICLE_TYPES = [
  { id: 'on_foot', label: '🚶 On-foot', desc: 'Small items, short distance' },
  { id: 'bicycle', label: '🚲 Bicycle', desc: 'Light items, up to 4km' },
  { id: 'motorcycle', label: '🏍️ Motorcycle', desc: 'Most deliveries, up to 10km' },
  { id: 'bajaj', label: '🛺 Bajaj (Tuk-tuk)', desc: 'Heavy/bulk items, up to 15km' },
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = ['Morning (6-12)', 'Afternoon (12-5)', 'Evening (5-9)', 'Night (9-12)'];

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
  
  // Step 2: Vehicle
  var [vehicleType, setVehicleType] = useState('');
  var [licensePlate, setLicensePlate] = useState('');
  
  // Step 3: Service
  var [allZones, setAllZones] = useState(['Bole', 'Merkato', 'Piassa', 'Summit', 'Mexico', 'Kazanchis', 'CMC', 'Ayat']);
  var [customZoneInput, setCustomZoneInput] = useState('');
  var [zones, setZones] = useState<string[]>([]);
  var [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  var [hours, setHours] = useState<string[]>(['Morning (6-12)', 'Afternoon (12-5)']);
  
  // Step 4: Emergency
  var [emergencyName, setEmergencyName] = useState('');
  var [emergencyPhone, setEmergencyPhone] = useState('');
  var [emergencyRelation, setEmergencyRelation] = useState('');
  var [emergencyAddress, setEmergencyAddress] = useState('');
  var [emergencyIdImage, setEmergencyIdImage] = useState('');

  // Image upload helpers
  function handleFaydaFrontChange(e: any) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFaydaFrontImage(reader.result as string);
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

  function handleEmergencyIdChange(e: any) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEmergencyIdImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }
  
  // Payment
  var [telebirr, setTelebirr] = useState('');
  var [bankName, setBankName] = useState('');
  var [bankAccount, setBankAccount] = useState('');
  var [agreeTerms, setAgreeTerms] = useState(false);
  var [otpSent, setOtpSent] = useState(false);
  var [otpCode, setOtpCode] = useState('');

  function toggleZone(zone: string) {
    setZones(function(prev) {
      return prev.includes(zone) ? prev.filter(function(z) { return z !== zone; }) : [...prev, zone];
    });
  }

  function toggleDay(day: number) {
    setDays(function(prev) {
      return prev.includes(day) ? prev.filter(function(d) { return d !== day; }) : [...prev, day];
    });
  }

  async function submit() {
    if (!nameLatin.trim() || !phone.trim() || !faydaId.trim() || !faydaFrontImage || !faydaBackImage) {
      toast('Please fill in all required identity verification fields', 'error');
      return;
    }
    if (!vehicleType) { toast('Please select a vehicle type', 'error'); return; }
    if (zones.length === 0) { toast('Please select at least one service zone', 'error'); return; }
    if (!emergencyName.trim() || !emergencyPhone.trim() || !emergencyIdImage) { 
      toast('Emergency contact person and their ID are required', 'error'); 
      return; 
    }
    if (!agreeTerms) { toast('Please agree to the terms', 'error'); return; }
    
    setSubmitting(true);
    
    var ls: any = {};
    try { ls = JSON.parse(localStorage.getItem('ss_profile') || '{}'); } catch(e) {}
    var tgId = ls.telegramId || '';
    
    try {
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
          fayda_front_image: faydaFrontImage,
          fayda_back_image: faydaBackImage,
          vehicle_type: vehicleType,
          license_plate: licensePlate.trim(),
          service_zones: zones,
          available_days: days,
          available_hours: hours,
          emergency_name: emergencyName.trim(),
          emergency_phone: emergencyPhone.trim(),
          emergency_relationship: emergencyRelation || 'Other',
          emergency_address: emergencyAddress.trim(),
          emergency_id_image: emergencyIdImage,
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
    } catch(e) {
      toast('Error: ' + e.message, 'error');
      setSubmitting(false);
    }
  }

  var vehicleIcons: Record<string, string> = { on_foot: '🚶', bicycle: '🚲', motorcycle: '🏍️', bajaj: '🛺' };

  return (
    <div className="min-h-screen p-4 pb-20" style={{ background: darkMode ? '#0f172a' : 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
      <div className="max-w-md mx-auto">
        <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4" onClick={function() { nav('/driver'); }}>
          <ArrowLeft size={16} /> Back
        </button>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-6">
          {[1, 2, 3, 4].map(function(s) {
            return (
              <div key={s} className="flex-1 flex items-center">
                <div className={'w-full h-1.5 rounded-full ' + (s <= step ? 'bg-emerald-500' : 'bg-slate-200')} />
              </div>
            );
          })}
        </div>
        <p className="text-[9px] text-slate-400 text-center mb-6">Step {step} of 4</p>

        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          {/* Step 1: Personal + Fayda */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                  <Shield size={22} />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Personal & Fayda ID</h2>
                  <p className="text-[9px] text-slate-400">Your identity verification</p>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase">Full Name (English) *</label>
                <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-transparent" value={nameLatin} onChange={function(e) { setNameLatin(e.target.value); }} placeholder="e.g. Abebe Kebede" />
              </div>
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase">ሙሉ ስም (አማርኛ)</label>
                <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-transparent" value={nameAmharic} onChange={function(e) { setNameAmharic(e.target.value); }} placeholder="ለምሳሌ፡ አበበ ከበደ" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-slate-400 uppercase">Phone *</label>
                  <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-transparent" value={phone} onChange={function(e) { setPhone(e.target.value); }} placeholder="+251-912-345678" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-400 uppercase">Email</label>
                  <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-transparent" value={email} onChange={function(e) { setEmail(e.target.value); }} placeholder="email@example.com" />
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800/30 space-y-3">
                <div>
                  <label className="text-[9px] font-semibold text-amber-700 dark:text-amber-400 uppercase">Fayda ID Number *</label>
                  <input className="w-full mt-1 p-2.5 border border-amber-200 dark:border-amber-700 rounded-xl text-sm bg-transparent text-amber-900 dark:text-amber-200" value={faydaId} onChange={function(e) { setFaydaId(e.target.value); }} placeholder="ETH-FD-XXXX-XXXX" />
                </div>
                
                {/* Fayda ID Front Upload */}
                <div>
                  <label className="text-[9px] font-bold text-amber-800 dark:text-amber-400 uppercase block mb-1">Fayda ID Photo (Front) *</label>
                  <input type="file" accept="image/*" onChange={handleFaydaFrontChange} className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[9px] file:font-semibold file:bg-amber-100 file:text-amber-700 cursor-pointer" />
                  {faydaFrontImage && (
                    <div className="mt-2 w-14 h-14 rounded-lg overflow-hidden border border-amber-200 shadow-sm">
                      <img src={faydaFrontImage} className="w-full h-full object-cover" alt="Front Preview" />
                    </div>
                  )}
                </div>

                {/* Fayda ID Back Upload */}
                <div>
                  <label className="text-[9px] font-bold text-amber-800 dark:text-amber-400 uppercase block mb-1">Fayda ID Photo (Back) *</label>
                  <input type="file" accept="image/*" onChange={handleFaydaBackChange} className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[9px] file:font-semibold file:bg-amber-100 file:text-amber-700 cursor-pointer" />
                  {faydaBackImage && (
                    <div className="mt-2 w-14 h-14 rounded-lg overflow-hidden border border-amber-200 shadow-sm">
                      <img src={faydaBackImage} className="w-full h-full object-cover" alt="Back Preview" />
                    </div>
                  )}
                </div>
              </div>
              
              <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold" onClick={function() { if (nameLatin && phone && faydaId && faydaFrontImage && faydaBackImage) setStep(2); else toast('Fayda ID and Front/Back photos are required', 'error'); }}>Continue →</button>
            </div>
          )}

          {/* Step 2: Vehicle */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white">
                  <Bike size={22} />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Vehicle Information</h2>
                  <p className="text-[9px] text-slate-400">Select your delivery vehicle</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {VEHICLE_TYPES.map(function(v) {
                  return (
                    <button key={v.id} className={'p-3 rounded-xl border-2 text-left transition-all ' + (vehicleType === v.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-700')} onClick={function() { setVehicleType(v.id); }}>
                      <div className="text-xl mb-1">{v.id === 'on_foot' ? '🚶' : v.id === 'bicycle' ? '🚲' : v.id === 'motorcycle' ? '🏍️' : '🛺'}</div>
                      <div className="text-[11px] font-semibold">{v.label}</div>
                      <div className="text-[7px] text-slate-400">{v.desc}</div>
                    </button>
                  );
                })}
              </div>
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase">License Plate (if vehicle)</label>
                <input className="w-full mt-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-transparent" value={licensePlate} onChange={function(e) { setLicensePlate(e.target.value); }} placeholder="e.g., AA-123-456" />
              </div>
              <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold" onClick={function() { if (vehicleType) setStep(3); else toast('Select a vehicle', 'error'); }}>Continue →</button>
            </div>
          )}

          {/* Step 3: Service + Emergency */}
          {step === 3 && (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              <h2 className="text-sm font-bold">Service Areas</h2>
              <div className="flex flex-wrap gap-1.5">
                {allZones.map(function(z) {
                  return (
                    <button key={z} className={'px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all ' + (zones.includes(z) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-500 border-slate-200')} onClick={function() { toggleZone(z); }}>
                      📍 {z}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Zone input field */}
              <div className="flex gap-2 mt-2 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <input 
                  type="text" 
                  placeholder="Add custom service area..." 
                  value={customZoneInput} 
                  onChange={function(e) { setCustomZoneInput(e.target.value); }}
                  className="flex-1 p-2 border border-slate-200 dark:border-slate-600 rounded-xl text-xs bg-transparent outline-none focus:border-emerald-500 transition-colors" 
                />
                <button 
                  type="button"
                  onClick={function() {
                    if (customZoneInput.trim()) {
                      const newZone = customZoneInput.trim();
                      if (!allZones.includes(newZone)) {
                        setAllZones([...allZones, newZone]);
                      }
                      if (!zones.includes(newZone)) {
                        setZones([...zones, newZone]);
                      }
                      setCustomZoneInput('');
                      toast(`📍 Added zone: ${newZone}`, 'success');
                    }
                  }}
                  className="px-3.5 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all">
                  ➕ Add Area
                </button>
              </div>

              <h2 className="text-sm font-bold mt-4">Available Days</h2>
              <div className="flex gap-1.5">
                {DAYS.map(function(d, i) {
                  var dayNum = i + 1;
                  var shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                  return (
                    <button key={d} className={'flex-1 py-2 rounded-lg text-[10px] font-semibold border transition-all ' + (days.includes(dayNum) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-500 border-slate-200')} onClick={function() { toggleDay(dayNum); }}>
                      {shortDays[i]}
                    </button>
                  );
                })}
              </div>

              <h2 className="text-sm font-bold mt-4">Available Hours</h2>
              <div className="space-y-1">
                {HOURS.map(function(h) {
                  return (
                    <label key={h} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" checked={hours.includes(h)} onChange={function() { setHours(function(prev) { return prev.includes(h) ? prev.filter(function(x) { return x !== h; }) : [...prev, h]; }); }} className="rounded text-emerald-500" />
                      <span className="text-xs">{h}</span>
                    </label>
                  );
                })}
              </div>

              <div className="border-t border-slate-200 pt-4 mt-4">
                <h2 className="text-sm font-bold mb-3">Emergency Contact *</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-semibold text-slate-400 uppercase">Full Name *</label>
                    <input className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl text-sm bg-transparent" value={emergencyName} onChange={function(e) { setEmergencyName(e.target.value); }} placeholder="Emergency contact name" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-semibold text-slate-400 uppercase">Phone *</label>
                      <input className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl text-sm bg-transparent" value={emergencyPhone} onChange={function(e) { setEmergencyPhone(e.target.value); }} placeholder="+251-..." />
                    </div>
                    <div>
                      <label className="text-[9px] font-semibold text-slate-400 uppercase">Relationship</label>
                      <select className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl text-sm bg-transparent" value={emergencyRelation} onChange={function(e) { setEmergencyRelation(e.target.value); }}>
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
                    <input className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl text-sm bg-transparent" value={emergencyAddress} onChange={function(e) { setEmergencyAddress(e.target.value); }} placeholder="Emergency contact address" />
                  </div>

                  {/* Emergency Contact ID Upload field */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Emergency Contact ID (Fayda / Kebele) *</label>
                    <input type="file" accept="image/*" onChange={handleEmergencyIdChange} className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[9px] file:font-semibold file:bg-slate-100 file:text-slate-700 cursor-pointer" />
                    {emergencyIdImage && (
                      <div className="mt-2 w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                        <img src={emergencyIdImage} className="w-full h-full object-cover" alt="Emergency ID Preview" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold" onClick={function() { if (zones.length > 0 && emergencyName && emergencyPhone && emergencyIdImage) setStep(4); else toast('Service zones, Emergency name, phone, and ID card are required', 'error'); }}>Continue →</button>
            </div>
          )}

          {/* Step 4: Payment + Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold">Payment & Submit</h2>
              <p className="text-[9px] text-slate-400">How you'll receive your earnings</p>

              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase">Telebirr Number (preferred)</label>
                <input className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl text-sm bg-transparent" value={telebirr} onChange={function(e) { setTelebirr(e.target.value); }} placeholder="+251-..." />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-slate-400 uppercase">Bank Name</label>
                  <input className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl text-sm bg-transparent" value={bankName} onChange={function(e) { setBankName(e.target.value); }} placeholder="e.g., CBE" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-400 uppercase">Account Number</label>
                  <input className="w-full mt-1 p-2.5 border border-slate-200 rounded-xl text-sm bg-transparent" value={bankAccount} onChange={function(e) { setBankAccount(e.target.value); }} placeholder="XXXXXXXXXX" />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 space-y-1.5">
                <p className="text-[10px] font-semibold">📋 Summary</p>
                <div className="text-[9px] text-slate-500 space-y-0.5">
                  <p>👤 {nameLatin} {nameAmharic ? '(' + nameAmharic + ')' : ''}</p>
                  <p>🆔 Fayda: {faydaId}</p>
                  <p>🚚 {vehicleIcons[vehicleType] || '🏍️'} {vehicleType}</p>
                  <p>📍 Zones: {zones.join(', ')}</p>
                  <p>📞 Emergency: {emergencyName}</p>
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={agreeTerms} onChange={function() { setAgreeTerms(!agreeTerms); }} className="mt-1 rounded text-emerald-500" />
                <span className="text-[9px] text-slate-500">I confirm that all information provided is accurate. I agree to the terms of service as an independent delivery partner for Smart Shop Express.</span>
              </label>

              <button className={'w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50 transition-all'} onClick={submit} disabled={submitting || !agreeTerms}>
                {submitting ? 'Submitting...' : '📝 Submit Application'}
              </button>
            </div>
          )}
        </div>

        <p className="text-[9px] text-slate-400 text-center mt-4">🔒 All data is encrypted and verified. Your Fayda ID is used only for identity verification.</p>
      </div>
    </div>
  );
}
