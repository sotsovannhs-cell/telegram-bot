'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { MapPin, ScanFace, QrCode, CreditCard, Clock, CheckCircle2, ChevronRight, Briefcase, LayoutDashboard, Users, Map as MapIcon, DollarSign, FileText, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';

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

const OFFICE_LAT = 11.5564;
const OFFICE_LNG = 104.9282; // Phnom Penh
const ALLOWED_RADIUS = 100; // meters

export default function Home() {
  // New State for UI Selection
  const [view, setView] = useState<'admin' | 'employee'>('admin');
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkMethod, setCheckMethod] = useState<string | null>(null);

  // Map state
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locError, setLocError] = useState<string>('');

  const locateUser = () => {
    setLocError('');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const uLat = position.coords.latitude;
          const uLng = position.coords.longitude;
          setUserLoc({ lat: uLat, lng: uLng });
          setDistance(getDistance(OFFICE_LAT, OFFICE_LNG, uLat, uLng));
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
    if (view === 'employee') {
      locateUser();
    }
  }, [view]);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = (method: string) => {
    setIsCheckedIn(true);
    setCheckMethod(method);
    setTimeout(() => {
      setIsCheckedIn(false);
      setCheckMethod(null);
    }, 3000);
  };

  const employeeMethods = [
    { id: 'gps', title: 'ទីតាំង GPS', icon: MapPin, color: 'bg-blue-500' },
    { id: 'face', title: 'ស្កេនផ្ទៃមុខ', icon: ScanFace, color: 'bg-indigo-500' },
    { id: 'qr', title: 'កូដ QR', icon: QrCode, color: 'bg-violet-500' },
    { id: 'nfc', title: 'កាត NFC', icon: CreditCard, color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col indigo-violet-bg text-slate-50 relative overflow-hidden">
      
      {/* Floating UI Switcher (រើសផ្ទាំង UI) */}
      <div className="absolute bottom-6 right-6 z-50 bg-white/10 backdrop-blur-xl p-1.5 rounded-2xl border border-white/20 shadow-2xl flex">
        <button 
          onClick={() => setView('admin')}
          className={`px-4 py-2 font-bold text-sm rounded-xl transition-all ${view === 'admin' ? 'bg-white text-indigo-700 shadow-lg' : 'text-white/80 hover:text-white'}`}
        >
          ផ្ទាំងអ្នកគ្រប់គ្រង
        </button>
        <button 
          onClick={() => setView('employee')}
          className={`px-4 py-2 font-bold text-sm rounded-xl transition-all ${view === 'employee' ? 'bg-white text-indigo-700 shadow-lg' : 'text-white/80 hover:text-white'}`}
        >
          ផ្ទាំងបុគ្គលិក
        </button>
      </div>

      {view === 'admin' ? (
        /* ADMIN DASHBOARD VIEW */
        <div className="flex flex-col h-screen w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
           {/* Top Navigation */}
           <nav className="h-16 flex items-center justify-between px-8 glass border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
                  <div className="w-6 h-6 rounded-full border-4 border-indigo-600"></div>
                </div>
                <span className="text-xl font-bold tracking-tight text-white">SecureAttend</span>
                <span className="ml-4 px-3 py-1 rounded-full bg-white/10 text-xs font-medium uppercase tracking-wider border border-white/20 text-white hidden md:inline-block">Premium SaaS</span>
              </div>
              <div className="flex items-center gap-4 md:gap-6">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-white">សាលាអន្តរជាតិអាស៊ី</div>
                  <div className="text-[10px] text-white/70">ID: INS-8829-KH</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 overflow-hidden relative">
                  <Image src="https://picsum.photos/seed/avatar1/100" alt="Admin" width={40} height={40} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                </div>
              </div>
            </nav>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar */}
              <aside className="w-16 md:w-60 glass border-r border-white/10 p-4 md:p-6 flex flex-col gap-2 shrink-0 overflow-y-auto">
                <div className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2 hidden md:block">មឺនុយមេ</div>
                <div className="flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl bg-white/10 text-white font-medium cursor-pointer">
                  <LayoutDashboard size={20} className="opacity-80" /> <span className="hidden md:inline">ផ្ទាំងគ្រប់គ្រង</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl text-white/60 hover:bg-white/5 transition-colors cursor-pointer">
                  <UserCheck size={20} className="opacity-80" /> <span className="hidden md:inline">វត្តមានបុគ្គលិក</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl text-white/60 hover:bg-white/5 transition-colors cursor-pointer">
                  <Users size={20} className="opacity-80" /> <span className="hidden md:inline">បញ្ជីឈ្មោះបុគ្គលិក</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl text-white/60 hover:bg-white/5 transition-colors cursor-pointer">
                  <MapIcon size={20} className="opacity-80" /> <span className="hidden md:inline">តំបន់ Geofence</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl text-white/60 hover:bg-white/5 transition-colors cursor-pointer">
                  <DollarSign size={20} className="opacity-80" /> <span className="hidden md:inline">បើកប្រាក់បៀវត្សរ៍</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl text-white/60 hover:bg-white/5 transition-colors cursor-pointer">
                  <FileText size={20} className="opacity-80" /> <span className="hidden md:inline">របាយការណ៍</span>
                </div>
                <div className="mt-auto p-4 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 hidden md:block">
                  <div className="text-xs font-bold mb-1 text-white">Telegram Bot</div>
                  <div className="text-[10px] text-white/80 mb-3">ភ្ជាប់ទៅកាន់ @SecureAttend_Bot</div>
                  <button className="w-full py-2 bg-white text-indigo-700 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all">
                    កំណត់រចនាសម្ព័ន្ធ
                  </button>
                </div>
              </aside>

              {/* Main Content Dashboard */}
              <main className="flex-1 p-4 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 overflow-y-auto bg-slate-50 text-slate-800">
                <div className="md:col-span-12 flex justify-between items-end mb-2">
                  <h1 className="text-xl md:text-2xl font-bold text-indigo-950">សេចក្តីសង្ខេបវត្តមានថ្ងៃនេះ</h1>
                  <div className="text-xs md:text-sm font-medium text-slate-500" suppressHydrationWarning>{mounted ? format(currentTime, 'EEEE, dd MMMM yyyy') : "----"}</div>
                </div>

                {/* Stat Cards */}
                <div className="md:col-span-3 card p-5 flex flex-col justify-between border-l-4 border-green-500">
                  <div className="text-slate-500 text-sm font-medium">វត្តមានសរុប</div>
                  <div className="text-3xl font-bold mt-1 text-indigo-900">1,248</div>
                  <div className="text-[10px] text-green-600 font-bold mt-2">↑ 12% ធៀបនឹងម្សិលមិញ</div>
                </div>
                <div className="md:col-span-3 card p-5 flex flex-col justify-between border-l-4 border-amber-500">
                  <div className="text-slate-500 text-sm font-medium">យឺតយ៉ាវ</div>
                  <div className="text-3xl font-bold mt-1 text-indigo-900">14</div>
                  <div className="text-[10px] text-amber-600 font-bold mt-2">⚠️ ភាគច្រើនផ្នែកលក់</div>
                </div>
                <div className="md:col-span-3 card p-5 flex flex-col justify-between border-l-4 border-rose-500">
                  <div className="text-slate-500 text-sm font-medium">អវត្តមាន</div>
                  <div className="text-3xl font-bold mt-1 text-indigo-900">05</div>
                  <div className="text-[10px] text-rose-600 font-bold mt-2">↓ 2% ធៀបនឹងមធ្យមភាគ</div>
                </div>
                <div className="md:col-span-3 card p-5 flex flex-col justify-between border-l-4 border-indigo-500">
                  <div className="text-slate-500 text-sm font-medium">សុំច្បាប់</div>
                  <div className="text-3xl font-bold mt-1 text-indigo-900">08</div>
                  <div className="text-[10px] text-indigo-400 font-bold mt-2">🔍 ពិនិត្យសំណើថ្មី</div>
                </div>

                {/* Table Section */}
                <div className="md:col-span-8 card overflow-hidden flex flex-col min-h-[400px]">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold flex items-center gap-2 text-indigo-950">កំណត់ត្រាវត្តមានថ្មីៗ</h3>
                    <button className="text-xs text-indigo-600 font-bold hover:underline">មើលទាំងអស់</button>
                  </div>
                  <div className="flex-1 overflow-x-auto p-4">
                    <table className="w-full text-sm min-w-[600px]">
                      <thead className="text-slate-400 text-left border-b border-slate-100">
                        <tr className="h-10 font-medium">
                          <th className="pb-2">បុគ្គលិក</th>
                          <th className="pb-2">ម៉ោងចូល</th>
                          <th className="pb-2">វិធីសាស្ត្រ</th>
                          <th className="pb-2">ទីតាំង</th>
                          <th className="pb-2 text-right">ស្ថានភាព</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600">
                        {[
                          { init: 'កណ', color: 'bg-indigo-100 text-indigo-600', name: 'កែវ ណារ៉េត', dept: 'IT Dept', time: '08:02 AM', method: 'Face AI + QR', loc: 'មហាវិថីព្រះនរោត្តម', status: 'ទាន់ពេល', statusStyle: 'bg-green-100 text-green-700' },
                          { init: 'សវ', color: 'bg-violet-100 text-violet-600', name: 'សុខ វិបុល', dept: 'Marketing', time: '08:15 AM', method: 'GPS Geofence', loc: 'ខណ្ឌដូនពេញ', status: 'យឺត (15នាទី)', statusStyle: 'bg-amber-100 text-amber-700' },
                          { init: 'ចម', color: 'bg-slate-100 text-slate-600', name: 'ចាន់ ម៉ាលី', dept: 'HR Manager', time: '07:55 AM', method: 'NFC Card', loc: 'ការិយាល័យកណ្តាល', status: 'ទាន់ពេល', statusStyle: 'bg-green-100 text-green-700' },
                          { init: 'ភរ', color: 'bg-blue-100 text-blue-600', name: 'ភូ រតនា', dept: 'Security', time: '08:00 AM', method: 'Face AI', loc: 'ច្រកទ្វារលេខ២', status: 'ទាន់ពេល', statusStyle: 'bg-green-100 text-green-700' },
                          { init: 'សន', color: 'bg-emerald-100 text-emerald-600', name: 'សេង នីតា', dept: 'Sales', time: '08:45 AM', method: 'GPS ទូរស័ព្ទ', loc: 'ខណ្ឌទួលគោក', status: 'យឺត (45នាទី)', statusStyle: 'bg-amber-100 text-amber-700' },
                        ].map((row, i) => (
                          <tr key={i} className="h-14 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                            <td className="flex items-center gap-3 pt-2">
                              <div className={`w-8 h-8 rounded-full ${row.color} flex items-center justify-center font-bold text-xs`}>{row.init}</div>
                              <div>
                                <div className="font-bold text-indigo-900">{row.name}</div>
                                <div className="text-[10px] opacity-60">{row.dept}</div>
                              </div>
                            </td>
                            <td className="font-mono text-xs font-medium">{row.time}</td>
                            <td className="text-xs">{row.method}</td>
                            <td className="text-xs">{row.loc}</td>
                            <td className="text-right">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold ${row.statusStyle}`}>{row.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column Maps & Status */}
                <div className="md:col-span-4 flex flex-col gap-4 md:gap-6">
                  <div className="card flex-1 p-4 flex flex-col min-h-[220px]">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-indigo-950">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span> ផែនទី GPS Geofence
                    </h3>
                    <div className="flex-1 rounded-xl bg-slate-100 relative overflow-hidden flex items-center justify-center border border-slate-200">
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#1e1b4b 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                      <div className="w-32 h-32 rounded-full bg-indigo-500/20 border-2 border-indigo-500 animate-[pulse_3s_ease-in-out_infinite] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                      </div>
                      <div className="absolute bottom-3 left-3 bg-white px-2 py-1 rounded text-[10px] font-bold shadow-sm text-indigo-950">តំបន់ការិយាល័យ (កាំ 100m)</div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>បុគ្គលិកក្នុងតំបន់: 42</span>
                      <span>ក្រៅតំបន់: 3</span>
                    </div>
                  </div>
                  <div className="card p-4 h-40 bg-indigo-900 text-white flex flex-col justify-between overflow-hidden relative">
                    <div className="relative z-10">
                      <div className="text-xs text-indigo-200 mb-1 font-medium">AI Face Match Accuracy</div>
                      <div className="text-3xl font-bold">99.8%</div>
                      <div className="text-[10px] text-green-400 font-bold mt-1">✨ ដំណើរការដោយ DeepLearning</div>
                    </div>
                    <div className="mt-4 h-8 flex items-end gap-1 relative z-10">
                      {[20, 40, 25, 60, 30, 20, 80].map((h, i) => (
                        <div key={i} className={`flex-1 rounded-sm ${h === 80 ? 'bg-green-400' : 'bg-white/20'}`} style={{ height: `${h}%` }}></div>
                      ))}
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-indigo-500/30 rounded-full blur-2xl pointer-events-none"></div>
                  </div>
                </div>

              </main>
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
                <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center overflow-hidden border-2 border-white relative">
                  <Image src="https://picsum.photos/seed/avatar1/100" alt="Profile" width={40} height={40} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                </div>
              </div>

              <div className="text-center mt-2">
                <h2 className="text-2xl font-bold text-white mb-4 drop-shadow">សួស្តី, កែវ ណារ៉េត! 👋</h2>
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
                      officeLat={OFFICE_LAT} 
                      officeLng={OFFICE_LNG} 
                      userLat={userLoc?.lat} 
                      userLng={userLoc?.lng}
                      radius={ALLOWED_RADIUS}
                    />
                  </div>

                  {locError && <div className="text-xs text-rose-500 mb-3 text-center">{locError}</div>}
                  
                  {!locError && distance !== null && (
                    <div className={`text-center text-sm font-bold mb-4 ${distance <= ALLOWED_RADIUS ? 'text-green-600' : 'text-rose-600'}`}>
                      ចម្ងាយ: {distance}m {distance <= ALLOWED_RADIUS ? '(ក្នុងតំបន់)' : '(ក្រៅតំបន់)'}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      disabled={distance === null || distance > ALLOWED_RADIUS}
                      onClick={() => handleCheckIn('in')}
                      className="w-full py-3 bg-indigo-600 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:active:scale-100 disabled:shadow-none"
                    >
                      Check IN
                    </button>
                    <button 
                      disabled={distance === null || distance > ALLOWED_RADIUS}
                      onClick={() => handleCheckIn('out')}
                      className="w-full py-3 bg-rose-500 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:active:scale-100 disabled:shadow-none"
                    >
                      Check OUT
                    </button>
                  </div>
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
        </div>
      )}

    </div>
  );
}

