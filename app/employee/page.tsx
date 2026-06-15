'use client';
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { MapPin, ScanFace, QrCode, CreditCard, Clock, CheckCircle2, ChevronRight, Briefcase, Unlock, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
const FaceRegistrationModal = dynamic(() => import('@/components/FaceRegistrationModal'), { ssr: false });
const FaceCheckInModal = dynamic(() => import('@/components/FaceCheckInModal'), { ssr: false });
const QrCheckInModal = dynamic(() => import('@/components/QrCheckInModal'), { ssr: false });
import { QRCodeSVG } from 'qrcode.react';

const MapLocation = dynamic(() => import('@/components/MapLocation'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm">កំពុងផ្ទុកផែនទី...</div>
});

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center text-slate-500">កំពុងផ្ទុក...</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get('org') || 'default';

  // App Configs
  const [officeLatConfig, setOfficeLatConfig] = useState(11.5564);
  const [officeLngConfig, setOfficeLngConfig] = useState(104.9282); // Phnom Penh
  const [allowedRadiusConfig, setAllowedRadiusConfig] = useState(160); // meters
  // QR AI state
  const [officeQrSecretConfig, setOfficeQrSecretConfig] = useState('secure_attend_office_qr_123');
  const [showQrCheckInModal, setShowQrCheckInModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
       const CONF_KEY = `admin_config_${orgSlug}`;
       const savedConfig = localStorage.getItem(CONF_KEY);
       if (savedConfig) {
         try {
           const parsed = JSON.parse(savedConfig);
           if (parsed.officeLat) setOfficeLatConfig(parsed.officeLat);
           if (parsed.officeLng) setOfficeLngConfig(parsed.officeLng);
           if (parsed.radius) setAllowedRadiusConfig(parsed.radius);
           if (parsed.qrSecret) setOfficeQrSecretConfig(parsed.qrSecret);
         } catch(e) {}
       }
    }
  }, []);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkMethod, setCheckMethod] = useState<string | null>(null);

  // Map state
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locError, setLocError] = useState<string>('');

  // Face UI state
  const [showFaceRegModal, setShowFaceRegModal] = useState(false);
  const [showFaceCheckInModal, setShowFaceCheckInModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'in' | 'out' | null>(null);
  
  // Substitution
  const [substituteFor, setSubstituteFor] = useState('');
  const [allEmployees, setAllEmployees] = useState<any[]>([]);

  // Employee Activation State
  const [activeEmployeeCode, setActiveEmployeeCode] = useState<string | null>(null);
  const [activeEmployeeName, setActiveEmployeeName] = useState<string>('');
  const [activateInputCode, setActivateInputCode] = useState('');
  const [activateError, setActivateError] = useState('');

  const locateUser = () => {
    setLocError('');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const uLat = position.coords.latitude;
          const uLng = position.coords.longitude;
          setUserLoc({ lat: uLat, lng: uLng });
          setDistance(getDistance(officeLatConfig, officeLngConfig, uLat, uLng));
        },
        error => {
          setLocError('មិនអាចស្វែងរកទីតាំង។ សូមបើក GPS។');
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocError('មិនគាំទ្រ GPS ទេ។');
    }
  };

  useEffect(() => {
    locateUser();
  }, [officeLatConfig, officeLngConfig]);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Initialize mock employees if empty
    if (typeof window !== 'undefined') {
      const EMP_KEY = `employees_${orgSlug}`;
      if (!localStorage.getItem(EMP_KEY)) {
        localStorage.setItem(EMP_KEY, JSON.stringify([
          { code: 'E001', name: 'កែវ ណារ៉េត', dept: 'IT Dept', telegram_id: '', active: true },
          { code: 'E002', name: 'ចាន់ ម៉ាលី', dept: 'HR Manager', telegram_id: '', active: true }
        ]));
      }

      const ACTIVE_KEY = `active_employee_code_${orgSlug}`;
      const storedCode = localStorage.getItem(ACTIVE_KEY);
      const emps = JSON.parse(localStorage.getItem(EMP_KEY) || '[]');
      setAllEmployees(emps);
      if (storedCode) {
        setActiveEmployeeCode(storedCode);
        const emp = emps.find((e: any) => e.code === storedCode);
        if (emp) setActiveEmployeeName(emp.name);
      }

      // Load telegram SDK
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-web-app.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.initDataUnsafe?.user) {
          const userId = tg.initDataUnsafe.user.id.toString();
          // Auto link if employee activated
          if (storedCode && userId) {
            const EMP_KEY = `employees_${orgSlug}`;
            const emps = JSON.parse(localStorage.getItem(EMP_KEY) || '[]');
            const updatedEmps = emps.map((e: any) => {
              if (e.code === storedCode && !e.telegram_id) {
                 e.telegram_id = userId;
              }
              return e;
            });
            localStorage.setItem(EMP_KEY, JSON.stringify(updatedEmps));
          }
        }
      };
    }

    return () => clearInterval(timer);
  }, []);

  const handleActivateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const EMP_KEY = `employees_${orgSlug}`;
    const emps = JSON.parse(localStorage.getItem(EMP_KEY) || '[]');
    const emp = emps.find((em: any) => em.code === activateInputCode.trim());
    
    if (emp) {
      const ACTIVE_KEY = `active_employee_code_${orgSlug}`;
      localStorage.setItem(ACTIVE_KEY, emp.code);
      setActiveEmployeeCode(emp.code);
      setActiveEmployeeName(emp.name);
      setActivateError('');
    } else {
      setActivateError('កូដបុគ្គលិកមិនត្រឹមត្រូវ! (Invalid code)');
    }
  };

  const clearEmployeeActivation = () => {
    const ACTIVE_KEY = `active_employee_code_${orgSlug}`;
    localStorage.removeItem(ACTIVE_KEY);
    setActiveEmployeeCode(null);
    setActiveEmployeeName('');
  };

  const handleCheckInAttempt = (method: 'in' | 'out') => {
    setPendingAction(method);
    setShowFaceCheckInModal(true);
  };

  const handleCheckInProceed = async (matchedName: string) => {
    setShowFaceCheckInModal(false);
    setIsCheckedIn(true);
    setCheckMethod(pendingAction || 'in');

    const newLog = {
      id: Date.now().toString(),
      userId: activeEmployeeCode,
      action: pendingAction,
      timestamp: new Date().toISOString(),
      check_type: pendingAction === 'in' ? 'check_in' : 'check_out',
      method: 'face',
      substitute_for: substituteFor
    };
    const ATTEND_KEY = `checkins_${orgSlug}`;
    const ckins = JSON.parse(localStorage.getItem(ATTEND_KEY) || '[]');
    ckins.push(newLog);
    localStorage.setItem(ATTEND_KEY, JSON.stringify(ckins));

    // Notify via Telegram
    try {
      const EMP_KEY = `employees_${orgSlug}`;
      const emps = JSON.parse(localStorage.getItem(EMP_KEY) || '[]');
      const emp = emps.find((e: any) => e.code === activeEmployeeCode);
      const tgId = emp?.telegram_id;
      
      const message = `បុគ្គលិក: ${activeEmployeeName} (${activeEmployeeCode}) ${substituteFor ? `(ជំនួស ${substituteFor}) ` : ''}បាន ${pendingAction === 'in' ? 'Check IN' : 'Check OUT'} ម៉ោង ${format(new Date(), 'HH:mm:ss')} (Face Match)`;
      
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, telegram_id: tgId })
      });
    } catch (err) {}

    setTimeout(() => {
      setIsCheckedIn(false);
      setCheckMethod(null);
    }, 3000);
  };

  const handleQRCheckInAttempt = (method: 'in' | 'out') => {
    setPendingAction(method);
    setShowQrCheckInModal(true);
  };

  const handleQRCheckInProceed = async () => {
    setShowQrCheckInModal(false);
    setIsCheckedIn(true);
    setCheckMethod(pendingAction || 'in');

    const newLog = {
      id: Date.now().toString(),
      userId: activeEmployeeCode,
      action: pendingAction,
      timestamp: new Date().toISOString(),
      check_type: pendingAction === 'in' ? 'check_in' : 'check_out',
      method: 'qr',
      substitute_for: substituteFor
    };
    const ATTEND_KEY = `checkins_${orgSlug}`;
    const ckins = JSON.parse(localStorage.getItem(ATTEND_KEY) || '[]');
    ckins.push(newLog);
    localStorage.setItem(ATTEND_KEY, JSON.stringify(ckins));

    // Notify via Telegram
    try {
      const EMP_KEY = `employees_${orgSlug}`;
      const emps = JSON.parse(localStorage.getItem(EMP_KEY) || '[]');
      const emp = emps.find((e: any) => e.code === activeEmployeeCode);
      const tgId = emp?.telegram_id;
      
      const message = `បុគ្គលិក: ${activeEmployeeName} (${activeEmployeeCode}) ${substituteFor ? `(ជំនួស ${substituteFor}) ` : ''}បាន ${pendingAction === 'in' ? 'Check IN' : 'Check OUT'} ម៉ោង ${format(new Date(), 'HH:mm:ss')} (QR Scan)`;
      
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, telegram_id: tgId })
      });
    } catch (err) {}

    setTimeout(() => {
      setIsCheckedIn(false);
      setCheckMethod(null);
    }, 3000);
  };

  const downloadQR = () => {
    const svg = document.getElementById("office-qrcode");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new globalThis.Image() as HTMLImageElement; // Using globalThis to avoid Next.js Image conflict here
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if(ctx) {
        ctx.fillStyle = "white"; // Background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = "Office_Attendance_QR.png";
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const regenerateQR = () => {
    const randomSecret = "qr_" + Math.random().toString(36).substring(2, 12);
    setOfficeQrSecretConfig(randomSecret);
  };

  const employeeMethods = [
    { id: 'gps', title: 'ទីតាំង GPS', icon: MapPin, color: 'bg-blue-500' },
    { id: 'face', title: 'ស្កេនផ្ទៃមុខ', icon: ScanFace, color: 'bg-indigo-500' },
    { id: 'qr', title: 'កូដ QR', icon: QrCode, color: 'bg-violet-500' },
    { id: 'nfc', title: 'កាត NFC', icon: CreditCard, color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col indigo-violet-bg text-slate-50 relative overflow-hidden">
      
      {!activeEmployeeCode ? (
        /* EMPLOYEE ACTIVATION VIEW */
          <div className="flex-1 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="card w-full max-w-sm p-8 shadow-2xl relative overflow-hidden border-t-4 border-indigo-600">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                  <UserCheck size={32} />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-center text-indigo-950 mb-2">ភ្ជាប់គណនី</h2>
              <p className="text-center text-slate-500 text-sm mb-6">សូមបញ្ចូលលេខកូដបុគ្គលិក ដើម្បីប្រើប្រាស់កម្មវិធីលើឧបករណ៍នេះ</p>
              
              <form onSubmit={handleActivateEmployee} className="space-y-4 relative z-10">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">លេខកូដបុគ្គលិក (ឧទាហរណ៍: E001)</label>
                  <input 
                    type="text" 
                    value={activateInputCode}
                    onChange={(e) => setActivateInputCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-800 font-mono tracking-widest text-center text-lg"
                    placeholder="E001"
                  />
                  {activateError && <p className="text-xs text-rose-500 mt-2 font-medium text-center">{activateError}</p>}
                </div>
                
                <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
                  ភ្ជាប់ឧបករណ៍ (Activate)
                </button>
              </form>
            </div>
          </div>
        ) : (
        /* EMPLOYEE CHECK-IN VIEW (Mobile App Concept) */
        <div className="flex-1 flex flex-col items-center py-6 md:py-10 px-4 overflow-y-auto animate-in fade-in slide-in-from-bottom-8 duration-300">
          <div className="w-full max-w-sm glass text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-white/20">
            <div className="px-6 pt-10 pb-16 relative z-10 flex flex-col items-center">
              <div className="w-full flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-base">SecureAttend</h2>
                    <p className="text-[10px] text-indigo-200 uppercase tracking-wider">សាលារៀនជំនាន់ថ្មី</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={clearEmployeeActivation} title="ផ្តាច់គណនី (Deactivate Device)" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <Unlock size={14} />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center overflow-hidden border-2 border-white relative">
                    <Image src="https://picsum.photos/seed/avatar1/100" alt="Profile" width={40} height={40} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                  </div>
                </div>
              </div>

              <div className="text-center mt-2">
                <h2 className="text-2xl font-bold text-white mb-4 drop-shadow">សួស្តី, {activeEmployeeName}! 👋</h2>
                <h1 className="text-5xl font-bold tracking-tight drop-shadow-md" suppressHydrationWarning>{mounted ? format(currentTime, 'HH:mm:ss') : "--:--:--"}</h1>
                <p className="mt-2 text-indigo-200 font-medium" suppressHydrationWarning>{mounted ? format(currentTime, 'dd MMMM yyyy') : "----"}</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm px-2 -mt-8 relative z-20 flex flex-col gap-4 md:gap-5 pb-20 md:pb-0">
            {/* Actions Card */}
            <div className="card p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-indigo-950">កត់ត្រាវត្តមាន (GPS)</h3>
                <button onClick={locateUser} className="text-xs text-indigo-600 hover:underline">ធ្វើបច្ចុប្បន្នភាព</button>
              </div>

              {isCheckedIn ? (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center justify-center py-6 text-green-600"
                >
                  <CheckCircle2 size={56} className="mb-4" />
                  <h2 className="text-2xl font-bold">ជោគជ័យ!</h2>
                  <p className="text-slate-500 mt-2 text-sm font-medium">កត់ត្រាដោយ {checkMethod === 'in' ? 'Check IN' : 'Check OUT'}</p>
                </motion.div>
              ) : (
                <>
                  <div className="h-48 w-full rounded-xl overflow-hidden mb-4 border border-slate-200">
                    <MapLocation 
                      officeLat={officeLatConfig} 
                      officeLng={officeLngConfig} 
                      userLat={userLoc?.lat} 
                      userLng={userLoc?.lng}
                      radius={allowedRadiusConfig}
                    />
                  </div>

                  {locError && <div className="text-xs text-rose-500 mb-3 text-center">{locError}</div>}
                  
                  {!locError && distance !== null && (
                    <div className={`text-center text-sm font-bold mb-4 ${distance <= allowedRadiusConfig ? 'text-green-600' : 'text-rose-600'}`}>
                      ចម្ងាយ: {distance}m {distance <= allowedRadiusConfig ? '(ក្នុងតំបន់)' : '(ក្រៅតំបន់)'}
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 mb-1">កំពុងធ្វើការជំនួស (Covering for) (ជម្រើស)</label>
                    <select 
                      value={substituteFor} 
                      onChange={(e) => setSubstituteFor(e.target.value)}
                      className="w-full text-slate-800 bg-white border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="">-- បុគ្គលិករបស់ខ្ញុំផ្ទាល់ (Myself) --</option>
                      {allEmployees.filter((e: any) => e.code !== activeEmployeeCode).map((e: any) => (
                        <option key={e.code} value={e.code}>{e.name} ({e.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button 
                      disabled={distance === null || distance > allowedRadiusConfig}
                      onClick={() => handleCheckInAttempt('in')}
                      className="w-full py-3 bg-indigo-600 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:active:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      <ScanFace size={18} /> Face IN
                    </button>
                    <button 
                      disabled={distance === null || distance > allowedRadiusConfig}
                      onClick={() => handleCheckInAttempt('out')}
                      className="w-full py-3 bg-rose-500 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:active:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      <ScanFace size={18} /> Face OUT
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button 
                      disabled={distance === null || distance > allowedRadiusConfig}
                      onClick={() => handleQRCheckInAttempt('in')}
                      className="w-full py-3 bg-violet-600 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:active:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      <QrCode size={18} /> QR IN
                    </button>
                    <button 
                      disabled={distance === null || distance > allowedRadiusConfig}
                      onClick={() => handleQRCheckInAttempt('out')}
                      className="w-full py-3 bg-violet-500 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:active:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      <QrCode size={18} /> QR OUT
                    </button>
                  </div>

                  <button 
                    onClick={() => setShowFaceRegModal(true)}
                    className="w-full py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                  >
                    + ចុះឈ្មោះទម្រង់មុខ (Face Enroll)
                  </button>
                </>
              )}
            </div>

            {/* Employee Activity Log */}
            <div className="card p-5 shadow-lg flex items-center justify-between border-l-4 border-indigo-500">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-900 text-sm">ចូល (ព្រឹក)</h4>
                  <p className="text-xs text-slate-500 mt-1">GPS ទូរស័ព្ទ</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-indigo-950">07:25 AM</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block bg-green-100 text-green-700">ទាន់ពេល</span>
              </div>
            </div>

            {/* Telegram Intro */}
            <div className="glass rounded-xl p-4 text-white flex items-center justify-between shadow-xl mt-2 mb-10">
              <div className="pr-4">
                <h4 className="font-bold text-sm mb-1">Telegram Bot</h4>
                <p className="text-[10px] text-white/80 leading-relaxed">ភ្ជាប់ដើម្បីទទួលបានការជូនដំណឹងពីម៉ោងធ្វើការ។</p>
              </div>
              <button className="whitespace-nowrap px-3 py-1.5 bg-white text-indigo-700 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all">
                ភ្ជាប់គណនី
              </button>
            </div>
          </div>
          
          {showFaceRegModal && (
            <FaceRegistrationModal 
              employeeName={activeEmployeeName}
              onClose={() => setShowFaceRegModal(false)}
              onSuccess={() => setShowFaceRegModal(false)}
            />
          )}

          {showFaceCheckInModal && (
            <FaceCheckInModal 
              onClose={() => setShowFaceCheckInModal(false)}
              onMatch={handleCheckInProceed}
            />
          )}

          {showQrCheckInModal && (
            <QrCheckInModal
              onClose={() => setShowQrCheckInModal(false)}
              onSuccess={handleQRCheckInProceed}
              expectedSecret={officeQrSecretConfig}
            />
          )}

        </div>
      )}

    </div>
  );
}

