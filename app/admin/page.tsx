'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, Users, QrCode, Lock, UserCheck, CheckCircle2, ChevronRight, Briefcase, FileText, DollarSign, MapPin, Edit, Trash2, Plus, Upload, Calendar, CreditCard, Nfc, LayoutDashboard } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ReportsTab from './components/ReportsTab';
import PayrollTab from './components/PayrollTab';
import TimesheetTab from './components/TimesheetTab';
import EmployeeCardsTab from './components/EmployeeCardsTab';
import ManualEntryTab from './components/ManualEntryTab';
import DashboardTab from './components/DashboardTab';
import { read, utils, write } from 'xlsx';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get('org') || 'default';
  
  const CONF_KEY = `admin_config_${orgSlug}`;
  const EMP_KEY = `employees_${orgSlug}`;

  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'qrcode' | 'telegram' | 'system' | 'reports' | 'payroll' | 'timesheet' | 'cards' | 'manual'>('dashboard');

  // Config State
  const [config, setConfig] = useState({
    officeLat: 11.5564,
    officeLng: 104.9282,
    radius: 160,
    qrSecret: 'secure_attend_office_qr_123',
    telegramUrl: '',
    startTime: '08:00',
    endTime: '17:00'
  });

  const [mapLink, setMapLink] = useState('');

  // Employees State
  const [employees, setEmployees] = useState<any[]>([]);
  const [editingEmp, setEditingEmp] = useState<any>(null);
  
  const [empForm, setEmpForm] = useState({ code: '', name: '', dept: '', telegram_id: '', active: true, salaryType: 'fixed', rate: 0, nfc_serial: '' });
  const [showEmpForm, setShowEmpForm] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const loggedIn = sessionStorage.getItem('adminLoggedIn');
    if (loggedIn === 'true') setIsLoggedIn(true);

    const savedConfig = localStorage.getItem(CONF_KEY);
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }

    const savedEmps = localStorage.getItem(EMP_KEY);
    if (savedEmps) {
      setEmployees(JSON.parse(savedEmps));
    } else {
      const initialEmps = [
        { code: 'E001', name: 'កែវ ណារ៉េត', dept: 'IT Dept', telegram_id: '', active: true },
        { code: 'E002', name: 'ចាន់ ម៉ាលី', dept: 'HR Manager', telegram_id: '', active: true }
      ];
      setEmployees(initialEmps);
      localStorage.setItem(EMP_KEY, JSON.stringify(initialEmps));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
    let currentOrg = orgs.find((o: any) => o.slug === orgSlug);
    
    // Default fallback if running without owner setup
    if (!currentOrg && orgSlug === 'default') {
      currentOrg = { admin_password: 'admin' };
    }

    if (currentOrg && password === currentOrg.admin_password) {
      setIsLoggedIn(true);
      sessionStorage.setItem('adminLoggedIn', 'true');
      setLoginError('');
    } else {
      setLoginError('លេខសម្ងាត់មិនត្រឹមត្រូវ (Invalid password)');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('adminLoggedIn');
  };

  // SYSTEM SETTINGS
  const handleSaveConfig = () => {
    localStorage.setItem(CONF_KEY, JSON.stringify(config));
    alert('រក្សាទុកជោគជ័យ! (Saved successfully)');
  };

  const parseGoogleMapsLink = () => {
    try {
      // Very basic extraction of @lat,lng
      const match = mapLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        setConfig({...config, officeLat: parseFloat(match[1]), officeLng: parseFloat(match[2])});
      } else {
         alert('រកមិនឃើញទីតាំងក្នុង Link នេះទេ (Coordinate not found)');
      }
    } catch(err) {
      alert('Link មិនត្រឹមត្រូវ (Invalid link)');
    }
  };

  const getCurrentGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setConfig({...config, officeLat: pos.coords.latitude, officeLng: pos.coords.longitude}),
        (err) => alert('មិនអាចស្វែងរកទីតាំង (Cannot access GPS)'),
        { enableHighAccuracy: true }
      );
    }
  };

  // QR SETTINGS
  const downloadQR = () => {
    const svg = document.getElementById("office-qrcode");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new globalThis.Image() as HTMLImageElement;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if(ctx) {
        ctx.fillStyle = "white"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = "Office_QR.png";
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const regenerateQR = () => {
    const randomSecret = "qr_" + Math.random().toString(36).substring(2, 12);
    const newConfig = {...config, qrSecret: randomSecret};
    setConfig(newConfig);
    localStorage.setItem(CONF_KEY, JSON.stringify(newConfig));
  };

  // EMPLOYEES CRUD
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    let newEmps;
    if (editingEmp) {
      newEmps = employees.map(emp => emp.code === editingEmp.code ? empForm : emp);
    } else {
      newEmps = [...employees, empForm];
    }
    setEmployees(newEmps);
    localStorage.setItem(EMP_KEY, JSON.stringify(newEmps));
    setShowEmpForm(false);
    setEditingEmp(null);
    setEmpForm({ code: '', name: '', dept: '', telegram_id: '', active: true, salaryType: 'fixed', rate: 0, nfc_serial: '' });
  };

  const handleEditEmp = (emp: any) => {
    setEditingEmp(emp);
    setEmpForm(emp);
    setShowEmpForm(true);
  };

  const handleDeleteEmp = (code: string) => {
    if (confirm('តើអ្នកពិតជាចង់លុបបុគ្គលិកនេះមែនទេ? (Are you sure?)')) {
      const newEmps = employees.filter(emp => emp.code !== code);
      setEmployees(newEmps);
      localStorage.setItem(EMP_KEY, JSON.stringify(newEmps));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = utils.sheet_to_json(ws);
        
        const newEmployees = data.map((row: any) => ({
          code: row['Code'] || row['លេខកូដ'] || '',
          name: row['Name'] || row['ឈ្មោះ'] || '',
          dept: row['Department'] || row['ផ្នែក'] || '',
          telegram_id: row['Telegram ID'] || '',
          salaryType: row['Salary Type'] || 'fixed',
          rate: parseFloat(row['Rate']) || 0,
          nfc_serial: row['NFC Serial'] || '',
          active: true
        })).filter((e: any) => e.code && e.name);

        if (newEmployees.length > 0) {
          const combined = [...employees];
          newEmployees.forEach((ne: any) => {
            const existingIdx = combined.findIndex((ce: any) => ce.code === ne.code);
            if (existingIdx !== -1) {
              combined[existingIdx] = { ...combined[existingIdx], ...ne };
            } else {
              combined.push(ne);
            }
          });
          setEmployees(combined);
          localStorage.setItem(EMP_KEY, JSON.stringify(combined));
          alert(`បាននាំចូលទិន្នន័យបុគ្គលិកចំនួន ${newEmployees.length} នាក់ដោយជោគជ័យ!`);
        }
      } catch (err) {
        alert("កំហុសក្នុងការអានឯកសារ Excel");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isMounted) return null;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100">
          <div className="p-8 pb-6 bg-indigo-600 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur">
               <Lock size={32} />
            </div>
            <h2 className="text-xl font-bold">Admin Console</h2>
            <p className="text-indigo-200 text-sm mt-1">SecureAttend System</p>
          </div>
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">លេខសម្ងាត់ (Password)</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
                  placeholder="••••••••"
                />
                {loginError && <p className="text-xs text-rose-500 mt-2 font-medium">{loginError}</p>}
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95">
                ចូលប្រព័ន្ធ
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      {/* Sidebar - hidden when on dashboard to match screenshot landing layout */}
      {activeTab !== 'dashboard' && (
      <aside className="w-full md:w-64 bg-[#161b22] text-slate-300 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-6 pb-8 flex items-center gap-3 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <Briefcase size={20} />
          </div>
          <div>
            <div className="font-bold text-white text-lg leading-tight">Admin Console</div>
            <div className="text-xs text-slate-400">SecureAttend</div>
          </div>
        </div>

        <div className="flex flex-col px-4 gap-1 py-6">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/5'}`}
          >
            <LayoutDashboard size={18} className={activeTab === 'dashboard' ? 'text-white' : 'text-slate-400'} />
            <span className="font-medium text-sm">ផ្ទាំងគ្រប់គ្រង (Dashboard)</span>
          </button>

          <button 
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'employees' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/5'}`}
          >
            <Users size={18} className={activeTab === 'employees' ? 'text-white' : 'text-slate-400'} />
            <span className="font-medium text-sm">បុគ្គលិក (Employees)</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('qrcode')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'qrcode' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/5'}`}
          >
            <QrCode size={18} className={activeTab === 'qrcode' ? 'text-white' : 'text-slate-400'} />
            <span className="font-medium text-sm">កូដ QR វត្តមាន</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/5'}`}
          >
            <FileText size={18} className={activeTab === 'reports' ? 'text-white' : 'text-slate-400'} />
            <span className="font-medium text-sm">របាយការណ៍ (Reports)</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('payroll')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'payroll' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/5'}`}
          >
            <DollarSign size={18} className={activeTab === 'payroll' ? 'text-white' : 'text-slate-400'} />
            <span className="font-medium text-sm">ប្រាក់បៀវត្សរ៍ (Payroll)</span>
          </button>

          <button 
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'cards' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/5'}`}
          >
            <CreditCard size={18} className={activeTab === 'cards' ? 'text-white' : 'text-slate-400'} />
            <span className="font-medium text-sm">កាតបុគ្គលិក (Cards)</span>
          </button>

          <button 
            onClick={() => setActiveTab('timesheet')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'timesheet' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/5'}`}
          >
            <Calendar size={18} className={activeTab === 'timesheet' ? 'text-white' : 'text-slate-400'} />
            <span className="font-medium text-sm">កាលវិភាគ (Timesheet)</span>
          </button>

          <button 
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'manual' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/5'}`}
          >
            <Edit size={18} className={activeTab === 'manual' ? 'text-white' : 'text-slate-400'} />
            <span className="font-medium text-sm">បញ្ចូលដោយដៃ (Manual)</span>
          </button>

          <button 
            onClick={() => setActiveTab('telegram')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'telegram' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/5'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={activeTab === 'telegram' ? 'text-white' : 'text-slate-400'}><path d="m15 5 6 3-6 3"/><path d="M9 4v16"/><path d="m20 21-8-4-6 3V9l4-2"/><path d="m9 15-5-2.5"/></svg>
            <span className="font-medium text-sm">វិបផតថល Telegram</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all mt-4 ${activeTab === 'system' ? 'bg-slate-700 text-white shadow-md' : 'hover:bg-white/5'}`}
          >
            <Settings size={18} className={activeTab === 'system' ? 'text-white' : 'text-slate-400'} />
            <span className="font-medium text-sm">ប្រព័ន្ធ (System)</span>
          </button>
        </div>

        <div className="p-4 mt-auto border-t border-white/5">
           <button onClick={handleLogout} className="w-full py-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
             ចាកចេញ (Log out)
           </button>
        </div>
      </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden max-h-screen relative">
        {activeTab !== 'dashboard' && (
          <header className="h-20 px-8 flex items-center justify-between bg-white border-b border-slate-200 shrink-0">
             <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                {activeTab === 'system' ? 'មុខងារប្រព័ន្ធ (System Settings)' : 
                 activeTab === 'employees' ? 'គ្រប់គ្រងបុគ្គលិក (Employee Management)' : 
                 activeTab === 'qrcode' ? 'ការកំណត់កូដ QR' : 
                 activeTab === 'reports' ? 'របាយការណ៍បូកសរុប (Monthly Reports)' :
                 activeTab === 'payroll' ? 'គ្រប់គ្រងប្រាក់បៀវត្សរ៍ (Payroll)' : 
                 activeTab === 'cards' ? 'កាតបុគ្គលិក (NFC Cards)' :
                 activeTab === 'timesheet' ? 'កាលវិភាគ (Timesheet)' :
                 activeTab === 'manual' ? 'បញ្ជូលវត្តមានដោយដៃ (Manual Entry)' : 'Telegram Bot API'}
             </h1>
             <a href="/" className="text-sm font-bold text-indigo-600 hover:underline">ទៅកាន់ App បុគ្គលិក &rarr;</a>
          </header>
        )}

        <div className={`flex-1 overflow-y-auto relative ${activeTab === 'dashboard' ? 'p-0 bg-slate-50' : 'p-6 md:p-8'}`}>
           
           {/* DASHBOARD TAB */}
           {activeTab === 'dashboard' && <DashboardTab employees={employees} config={config} orgSlug={orgSlug} setActiveTab={setActiveTab} />}

           {/* SYSTEM TAB */}
           {activeTab === 'system' && (
             <div className="max-w-4xl space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="text-indigo-600" size={24} />
                    <h2 className="text-lg font-bold text-slate-800">ទីតាំងការិយាល័យ (Office GPS Setup)</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4">
                       <div className="flex-1">
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Google Maps Link</label>
                         <div className="flex gap-2">
                           <input 
                              type="text" 
                              value={mapLink}
                              onChange={e => setMapLink(e.target.value)}
                              placeholder=" Paste link from Google Maps..."
                              className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                           <button onClick={parseGoogleMapsLink} className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition">Parse</button>
                         </div>
                       </div>
                       <div className="flex items-end pb-1 text-slate-400 font-bold">ឬ</div>
                       <div className="flex items-end">
                         <button onClick={getCurrentGPS} className="px-6 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition flex items-center gap-2">
                            <MapPin size={18}/> ចាប់យកកន្លែងឈរ
                         </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">MAP LATITUDE</label>
                        <input type="number" step="any" value={config.officeLat} onChange={e => setConfig({...config, officeLat: parseFloat(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">MAP LONGITUDE</label>
                        <input type="number" step="any" value={config.officeLng} onChange={e => setConfig({...config, officeLng: parseFloat(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">កាំអនុញ្ញាត (Radius in Metres)</label>
                        <input type="number" value={config.radius} onChange={e => setConfig({...config, radius: parseFloat(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 mt-2">
                       <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ម៉ោងចូលធ្វើការ (Start Time)</label>
                         <input type="time" value={config.startTime} onChange={e => setConfig({...config, startTime: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ម៉ោងចេញធ្វើការ (End Time)</label>
                         <input type="time" value={config.endTime} onChange={e => setConfig({...config, endTime: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={handleSaveConfig} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md active:scale-95 transition">រក្សាទុកការកំណត់</button>
                </div>
             </div>
           )}

           {/* EMPLOYEES TAB */}
           {activeTab === 'employees' && (
             <div className="max-w-5xl">
                {!showEmpForm && (
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-slate-500">គណនីបុគ្គលិកសរុបមាន {employees.length}</p>
                    <div className="flex gap-3">
                       <input type="file" accept=".xlsx,.xls,.csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                       <button onClick={() => {
                          const ws = utils.json_to_sheet([{ Code: "E005", Name: "Somnang", Department: "IT", "Telegram ID": "", "Salary Type": "fixed", Rate: 500, "NFC Serial": "" }]);
                          const wb = utils.book_new();
                          utils.book_append_sheet(wb, ws, "Employees");
                          const wbout = write(wb, { bookType: "xlsx", type: "array" });
                          const blob = new Blob([wbout], { type: "application/octet-stream" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "Employee_Template.xlsx";
                          a.click();
                       }} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl shadow-sm border border-slate-200 flex items-center gap-2 text-sm transition">
                         ទាញយក Excel គំរូ
                       </button>
                       <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 text-sm transition">
                         <Upload size={16} /> នាំចូលទិន្នន័យ
                       </button>
                       <button onClick={() => { setEditingEmp(null); setEmpForm({code:'', name:'', dept:'', telegram_id:'', active:true, salaryType:'fixed', rate:0, nfc_serial: ''}); setShowEmpForm(true); }} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 text-sm transition">
                          <Plus size={16} /> បន្ថែមថ្មី
                       </button>
                    </div>
                  </div>
                )}

                {showEmpForm ? (
                   <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6 animate-in slide-in-from-top-4">
                     <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">{editingEmp ? 'កែប្រែព័ត៌មាន' : 'បង្កើតគណនីបុគ្គលិកថ្មី'}</h2>
                     <form onSubmit={handleSaveEmployee} className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">លេខកូដសម្គាល់ (e.g., E003)</label>
                            <input required type="text" value={empForm.code} onChange={e=>setEmpForm({...empForm, code: e.target.value.toUpperCase()})} disabled={!!editingEmp} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">ឈ្មោះពេញ (Full Name)</label>
                            <input required type="text" value={empForm.name} onChange={e=>setEmpForm({...empForm, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500" />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">ផ្នែក / តួនាទី (Department)</label>
                            <input type="text" value={empForm.dept} onChange={e=>setEmpForm({...empForm, dept: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500" />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Telegram Chat ID</label>
                            <input type="text" value={empForm.telegram_id} onChange={e=>setEmpForm({...empForm, telegram_id: e.target.value})} placeholder="e.g. 123456789" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-mono" />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">ប្រភេទប្រាក់ខែ (Salary Type)</label>
                            <select value={empForm.salaryType || 'fixed'} onChange={e=>setEmpForm({...empForm, salaryType: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500">
                              <option value="fixed">ប្រចាំខែ (Fixed Monthly)</option>
                              <option value="hourly">ប្រចាំម៉ោង (Hourly)</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">អត្រាប្រាក់ឈ្នួល (Rate in $)</label>
                            <input type="number" step="any" value={empForm.rate || 0} onChange={e=>setEmpForm({...empForm, rate: parseFloat(e.target.value)})} placeholder="e.g. 500 or 5.5" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500" />
                         </div>
                         <div className="col-span-full">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">លេខស៊េរី NFC (NFC Serial NO.)</label>
                            <div className="flex gap-2">
                              <input type="text" value={empForm.nfc_serial || ''} onChange={e=>setEmpForm({...empForm, nfc_serial: e.target.value})} placeholder="e.g. 04:XX:XX:XX" className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-mono text-sm" />
                              <button type="button" onClick={async () => {
                                if (!('NDEFReader' in window)) {
                                  alert('ឧបករណ៍របស់អ្នកមិនគាំទ្រ Web NFC ទេ។ ប្រសិនបើអ្នកប្រើប្រដាប់អាន USB (USB Reader) សូមចុចលើប្រអប់អត្ថបទ រួចអូសកាត។');
                                  return;
                                }
                                try {
                                  const ndef = new (window as any).NDEFReader();
                                  await ndef.scan();
                                  alert('សូមដាក់កាត NFC ផ្ទាល់នឹងឧបករណ៍របស់អ្នក (Tap the NFC card on your device)');
                                  ndef.onreading = (event: any) => {
                                    setEmpForm(prev => ({...prev, nfc_serial: event.serialNumber}));
                                    alert('អានកាតបានជោគជ័យ! (NFC scanned successfully: ' + event.serialNumber + ')');
                                  };
                                } catch (error) {
                                  alert('កំហុសក្នុងការបើក NFC: ' + String(error));
                                }
                              }} className="px-4 py-3 bg-zinc-800 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition hover:bg-zinc-900">
                                <Nfc size={16}/> ស្កេន NFC
                              </button>
                            </div>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-3 pt-2">
                          <input type="checkbox" id="empActive" checked={empForm.active} onChange={e=>setEmpForm({...empForm, active: e.target.checked})} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" />
                          <label htmlFor="empActive" className="font-bold text-slate-700">គណនីកំពុងសកម្ម (Active)</label>
                       </div>

                       <div className="flex gap-4 pt-4">
                         <button type="submit" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition">រក្សាទុក (Save)</button>
                         <button type="button" onClick={() => setShowEmpForm(false)} className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">បោះបង់ (Cancel)</button>
                       </div>
                     </form>
                   </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                            <th className="p-4 font-bold border-b border-slate-200 w-24">លេខកូដ</th>
                            <th className="p-4 font-bold border-b border-slate-200">ឈ្មោះបុគ្គលិក</th>
                            <th className="p-4 font-bold border-b border-slate-200">តួនាទី</th>
                            <th className="p-4 font-bold border-b border-slate-200">Telegram</th>
                            <th className="p-4 font-bold border-b border-slate-200">ស្ថានភាព</th>
                            <th className="p-4 font-bold border-b border-slate-200 text-right">សកម្មភាព</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {employees.map((emp: any) => (
                            <tr key={emp.code} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 font-mono font-bold text-indigo-600">{emp.code}</td>
                              <td className="p-4 font-bold text-slate-800">{emp.name}</td>
                              <td className="p-4 text-slate-600">{emp.dept}</td>
                              <td className="p-4 font-mono text-xs text-slate-500">{emp.telegram_id || '-'}</td>
                              <td className="p-4">
                                {emp.active ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] uppercase font-bold bg-green-100 text-green-700 border border-green-200">រួចរាល់</span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] uppercase font-bold bg-rose-100 text-rose-700 border border-rose-200">បិទស្រាប់</span>
                                )}
                              </td>
                              <td className="p-4 text-right flex items-center justify-end gap-2 text-slate-400">
                                <button onClick={() => handleEditEmp(emp)} className="p-2 hover:bg-slate-100 hover:text-indigo-600 rounded-lg transition"><Edit size={16}/></button>
                                <button onClick={() => handleDeleteEmp(emp.code)} className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition"><Trash2 size={16}/></button>
                              </td>
                            </tr>
                          ))}
                          {employees.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-12 text-center text-slate-400">មិនមានទិន្នន័យ (No records)</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
             </div>
           )}

           {/* QR CODE TAB */}
           {activeTab === 'qrcode' && (
             <div className="max-w-3xl">
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center">
                 <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-600 mb-6">
                   <QrCode size={32} />
                 </div>
                 <h2 className="text-xl font-bold text-slate-800 mb-2">បោះពុម្ពកូដ QR សម្រាប់ Check-in</h2>
                 <p className="text-sm text-slate-500 mb-8 text-center max-w-md">បុគ្គលិកអាចប្រើ App ដើរមកស្កេនកូដនេះដើម្បីចុះវត្តមាន ធានាថាពិតជានៅនឹងកន្លែងពិតមែន។</p>
                 
                 <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm mb-8">
                   <QRCodeSVG 
                     id="office-qrcode" 
                     value={config.qrSecret} 
                     size={220} 
                     level="H" 
                     includeMargin={false} 
                   />
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                   <button 
                     onClick={downloadQR}
                     className="flex-1 py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                   >
                     ទាញយកកូដ
                   </button>
                   <button 
                     onClick={regenerateQR}
                     className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                   >
                     ប្តូរកូដថ្មី
                   </button>
                 </div>
                 <p className="text-xs text-rose-500 mt-6 max-w-xs text-center">លេខកូដបំបាំងបច្ចុប្បន្ន: <span className="font-mono bg-slate-100 px-1 rounded">{config.qrSecret}</span></p>
               </div>
             </div>
           )}

           {/* TELEGRAM TAB */}
           {activeTab === 'telegram' && (
             <div className="max-w-3xl">
                <div className="bg-[#0088cc]/10 border border-[#0088cc]/20 rounded-2xl p-8">
                   <h2 className="text-xl font-bold text-[#0088cc] flex items-center gap-3 mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5 6 3-6 3"/><path d="M9 4v16"/><path d="m20 21-8-4-6 3V9l4-2"/><path d="m9 15-5-2.5"/></svg>
                     តភ្ជាប់ Telegram Bot Webhook
                   </h2>
                   <p className="text-slate-600 mb-6 leading-relaxed">
                     ត្រូវប្រាកដថាអ្នកបានហៅកូដខាងក្រោមក្នុង Browser ដើម្បីកំណត់ Webhook: <br/>
                     <code className="text-xs bg-white px-2 py-1 rounded block mt-2 text-indigo-600 select-all overflow-x-auto whitespace-nowrap">
                       https://api.telegram.org/bot[YOUR_BOT_TOKEN]/setWebhook?url=[YOUR_APP_URL]/api/telegram
                     </code>
                   </p>
                   <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                      <h3 className="font-bold text-slate-800 mb-2">មុខងារដែលគាំទ្រ:</h3>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                        <li>ផ្ញើសារក្នុង Group Admin រាល់ពេលមានអ្នកចុះវត្តមាន</li>
                        <li>ផ្ញើសារផ្ទាល់ចូលគណនីបុគ្គលិកតាម Private Chat</li>
                        <li>ពាក្យបញ្ជា <code className="bg-slate-100 px-1 rounded text-red-500 font-mono">/start</code> បើក Mini App កត់ត្រាវត្តមាន</li>
                        <li>ពាក្យបញ្ជា <code className="bg-slate-100 px-1 rounded text-red-500 font-mono">/link E001</code> តភ្ជាប់គណនីបុគ្គលិក</li>
                      </ul>
                   </div>
                </div>
             </div>
           )}
           
            {/* REPORTS TAB */}
           {activeTab === 'reports' && <ReportsTab employees={employees} config={config} orgSlug={orgSlug} />}

           {/* PAYROLL TAB */}
           {activeTab === 'payroll' && <PayrollTab employees={employees} config={config} orgSlug={orgSlug} />}

           {/* TIMESHEET TAB */}
           {activeTab === 'timesheet' && <TimesheetTab employees={employees} orgSlug={orgSlug} />}

           {/* EMPLOYEE CARDS TAB */}
           {activeTab === 'cards' && <EmployeeCardsTab employees={employees} config={config} />}

           {/* MANUAL ENTRY TAB */}
           {activeTab === 'manual' && <ManualEntryTab employees={employees} orgSlug={orgSlug} />}


        </div>
      </main>
    </div>
  );
}
