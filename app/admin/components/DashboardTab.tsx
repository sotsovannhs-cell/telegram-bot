import { useState, useEffect } from 'react';
import { Users, UserCheck, Clock, UserX, ArrowRight, LayoutDashboard, Settings, Bell, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function DashboardTab({ employees, config, orgSlug, setActiveTab }: { employees: any[], config: any, orgSlug: string, setActiveTab: (tab: any) => void }) {
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    presentPercent: '0',
    latePercent: '0'
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const ATTEND_KEY = `checkins_${orgSlug}`;
    const checkins = JSON.parse(localStorage.getItem(ATTEND_KEY) || '[]');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    // Get unique employees who checked in today
    const todaysLogs = checkins.filter((c: any) => {
        try {
            return c.timestamp.startsWith(todayStr) && c.action === 'in';
        } catch { return false; }
    });
    
    // Group by user, get earliest check in
    const userCheckins: Record<string, any> = {};
    todaysLogs.forEach((log: any) => {
      if (!userCheckins[log.userId]) {
        userCheckins[log.userId] = log.timestamp;
      } else {
        if (new Date(log.timestamp) < new Date(userCheckins[log.userId])) {
           userCheckins[log.userId] = log.timestamp;
        }
      }
    });

    const presentIds = Object.keys(userCheckins);
    const presentCount = presentIds.length;
    const totalCount = employees.filter(e => e.active).length || 0;
    const absentCount = Math.max(0, totalCount - presentCount);

    // Calculate Late (after config.startTime)
    let lateCount = 0;
    if (config?.startTime) {
       const [startH, startM] = config.startTime.split(':').map(Number);
       presentIds.forEach(id => {
          const tDate = new Date(userCheckins[id]);
          const h = tDate.getHours();
          const m = tDate.getMinutes();
          if (h > startH || (h === startH && m > startM)) {
             lateCount++;
          }
       });
    }

    const presentPercent = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : '0';
    const latePercent = presentCount > 0 ? ((lateCount / presentCount) * 100).toFixed(0) : '0';

    setStats({
      total: totalCount,
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      presentPercent,
      latePercent
    });

  }, [employees, orgSlug, config, currentTime.getMinutes()]); // refresh briefly on minute change

  return (
    <div className="w-full flex flex-col flex-1 animate-in fade-in duration-300 min-h-screen pb-10">
      
      {/* Integrated Header & Hero */}
      <div className="bg-[#5c55e8] text-white pt-4 pb-20 px-6 md:px-10 shrink-0">
        
        {/* Top Navbar */}
        <div className="flex items-center justify-between mb-12">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center border border-white/30 backdrop-blur-sm">
                <Briefcase size={16} className="text-white" />
             </div>
             <span className="font-bold text-lg tracking-tight">SecureAttend</span>
           </div>

           <div className="hidden md:flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
              <Clock size={16} className="text-indigo-200" />
              <span className="text-sm font-medium tracking-wider font-mono">{format(currentTime, 'hh:mm:ss a')}</span>
              <span className="text-xs text-indigo-200 ml-2">{format(currentTime, 'EEE, MMM dd')}</span>
           </div>

           <div className="flex items-center gap-4">
              <button className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                 <Bell size={20} className="text-indigo-100" />
                 <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-[#5c55e8]"></span>
              </button>
              
              <div className="flex items-center gap-3 bg-white/10 pl-4 py-1.5 pr-1.5 rounded-full border border-white/10 backdrop-blur-md cursor-pointer hover:bg-white/20 transition-all">
                 <span className="text-sm font-medium">សុខ ចាន់ដារ៉ា</span>
                 <div className="w-7 h-7 bg-white text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold font-sans">
                   SC
                 </div>
              </div>
           </div>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-7xl mx-auto">
           <div>
             <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">អរុណសួស្តី, ចាន់ដារ៉ា! 👋</h1>
             <p className="text-indigo-200 text-sm md:text-base font-medium">នេះជារបាយការណ៍សង្ខេបសម្រាប់ថ្ងៃនេះ។</p>
           </div>
           
           <button className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl font-bold text-xs transition-all shadow-sm">
              ប្រតិបត្តិការណ៍សកម្មភាព
           </button>
        </div>
      </div>

      {/* Main Content Area - Overlapping the hero */}
      <div className="-mt-12 px-6 md:px-10 max-w-7xl mx-auto w-full space-y-6">
         
         {/* Stats Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[110px]">
               <h3 className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">បុគ្គលិកសរុប</h3>
               <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-slate-800 tracking-tight">{stats.total}</span>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded">+4 ថ្មី</span>
               </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[110px]">
               <h3 className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">វត្តមានថ្ងៃនេះ</h3>
               <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-[#6366f1] tracking-tight">{stats.present}</span>
                  <span className="text-[10px] font-bold text-slate-400">{stats.presentPercent}% នៃសរុប</span>
               </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[110px]">
               <h3 className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">មកយឺត</h3>
               <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-amber-500 tracking-tight">{stats.late}</span>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">-{stats.latePercent}% ធៀបមុន</span>
               </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[110px] relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
               <h3 className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2 pl-2">អវត្តមាន</h3>
               <div className="flex items-end justify-between pl-2">
                  <span className="text-3xl font-black text-rose-600 tracking-tight">{stats.absent}</span>
                  <span className="text-[10px] font-bold text-slate-400">គ្មានច្បាប់</span>
               </div>
            </div>
         </div>

         {/* Big Promo Banner & Bottom Layout */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-[#5c55e8] rounded-2xl p-8 md:p-10 text-white relative overflow-hidden shadow-lg border border-indigo-500/20">
                  <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50"></div>
                  
                  <div className="relative z-10 max-w-xl">
                     <h2 className="text-2xl md:text-3xl font-extrabold mb-3 tracking-snug">បុគ្គលិកចុះវត្ដមានទីនេះ</h2>
                     <p className="text-indigo-200 font-medium mb-8 text-sm md:text-base leading-relaxed max-w-md">
                        ចូលទៅកាន់ទំព័រចុះវត្ដមានសម្រាប់បុគ្គលិក (មុខ, QR, ទីតាំង) នៅលើតំណភ្ជាប់ខាងក្រោម។
                     </p>
                     
                     <div className="flex flex-wrap items-center gap-3">
                        <button onClick={() => window.open('/employee', '_blank')} className="px-5 py-2.5 bg-white text-indigo-700 font-bold rounded-lg shadow-md hover:bg-slate-50 transition-all text-sm flex items-center gap-2">
                           មុខងារបុគ្គលិក <ArrowRight size={16} />
                        </button>
                        <button onClick={() => setActiveTab('system')} className="px-5 py-2.5 bg-transparent border border-indigo-400 text-white font-bold rounded-lg hover:bg-white/10 transition-all text-sm">
                           គ្រប់គ្រងប្រព័ន្ធ (Admin)
                        </button>
                     </div>
                  </div>
               </div>

               {/* Chart Card */}
               <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                       <h3 className="font-bold text-slate-800 text-sm">របាយការណ៍វត្តមានថ្ងៃនេះ (Today&apos;s Attendance)</h3>
                       <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">ទិន្នន័យជាក់ស្តែង / Real-time Data</p>
                     </div>
                  </div>
                  
                  <div className="h-[220px] w-full bg-slate-50/50 rounded-xl relative overflow-hidden border border-slate-100 flex items-center justify-center p-4">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={[
                             { name: 'វត្តមាន (Present)', value: stats.present },
                             { name: 'អវត្តមាន (Absent)', value: stats.absent }
                           ]}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                         >
                           <Cell fill="#6366f1" />
                           <Cell fill="#f43f5e" />
                         </Pie>
                         <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                         />
                         <Legend 
                            verticalAlign="bottom" 
                            height={36} 
                            iconType="circle"
                            formatter={(value, entry, index) => <span className="text-xs font-medium text-slate-600">{value}</span>}
                         />
                       </PieChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>

            {/* Right Column: System Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 self-start space-y-6">
               <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-bold text-slate-800 text-sm">ការគ្រប់គ្រងប្រព័ន្ធ</h3>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">System Controls & Settings</p>
               </div>

               <div className="space-y-5">
                  <div className="flex items-center justify-between group">
                     <div>
                        <h4 className="text-[13px] font-bold text-slate-700">AI Face Tracking</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 transition-colors group-hover:text-slate-500">ដំណើរការដោយ AI Accuracy 99.8%</p>
                     </div>
                     <button onClick={() => setActiveTab('employees')} className="px-3 py-1.5 bg-slate-100 text-slate-600 font-bold text-[11px] rounded-lg hover:bg-slate-200 transition-colors">
                        ចុះឈ្មោះមុខ
                     </button>
                  </div>

                  <div className="flex items-center justify-between group">
                     <div>
                        <h4 className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">Duck Mood <span className="text-sm">🦆</span></h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 transition-colors group-hover:text-slate-500">បើកមុខងារអារម្មណ៍លេង</p>
                     </div>
                     <button className="w-10 h-5 bg-slate-200 rounded-full relative transition-colors border border-slate-300">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
                     </button>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 group">
                     <div>
                        <h4 className="text-[13px] font-bold text-slate-700">QR វត្តមានប្រចាំថ្ងៃ</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 transition-colors group-hover:text-slate-500">ផ្លាស់ប្តូរកូដ QR សម្រាប់ថ្ងៃនេះ</p>
                     </div>
                     <div className="flex items-center gap-2">
                       <button onClick={() => setActiveTab('qrcode')} className="w-7 h-7 bg-slate-50 border border-slate-200 text-slate-400 rounded-lg flex items-center justify-center hover:bg-slate-100 hover:text-slate-600 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                       </button>
                       <button onClick={() => setActiveTab('qrcode')} className="w-7 h-7 bg-slate-50 border border-slate-200 text-slate-400 rounded-lg flex items-center justify-center hover:bg-slate-100 hover:text-slate-600 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                       </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
