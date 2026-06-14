import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { toZonedTime, format as formatTz } from 'date-fns-tz';

export default function ReportsTab({ employees, config, orgSlug }: { employees: any[], config: any, orgSlug: string }) {
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateReport();
  }, [employees]);

  const generateReport = async () => {
    setLoading(true);
    try {
      // Pagination as requested by prompt
      const { data, error } = await supabase.from('attendance_logs').select('*').range(0, 999);
      
      let allCheckins: any[] = [];
      if (data && data.length > 0) {
        allCheckins = data;
      } else {
        // Fallback to localStorage
        const ATTEND_KEY = `checkins_${orgSlug}`;
        allCheckins = JSON.parse(localStorage.getItem(ATTEND_KEY) || '[]');
      }
      
      const empData = employees.map(emp => {
        const empCheckins = allCheckins.filter(c => c.userId === emp.code || c.user_id === emp.id);
        
        const daysW = new Set(empCheckins.map(c => new Date(c.timestamp || c.time).toDateString())).size;
        
        const ins = empCheckins.filter(c => c.action === 'in' || c.check_type === 'check_in');
        const outs = empCheckins.filter(c => c.action === 'out' || c.check_type === 'check_out');
        
        let lates = 0;
        let totalHours = 0;
        
        ins.forEach(ci => {
          const checkinDt = new Date(ci.timestamp || ci.time);
          const zonedDt = toZonedTime(checkinDt, 'Asia/Phnom_Penh');
          
          const [sh, sm] = (config.startTime || '08:00').split(':').map(Number);
          const startDt = new Date(zonedDt);
          startDt.setHours(sh, sm, 0, 0);
          
          if (zonedDt > startDt) {
            lates++;
          }
          
          const matchingOut = outs.find(co => {
             const zonedOut = toZonedTime(new Date(co.timestamp || co.time), 'Asia/Phnom_Penh');
             return formatTz(zonedOut, 'yyyy-MM-dd') === formatTz(zonedDt, 'yyyy-MM-dd');
          });
          
          if (matchingOut) {
            const coTime = new Date(matchingOut.timestamp || matchingOut.time);
            totalHours += differenceInMinutes(coTime, checkinDt) / 60;
          } else {
             totalHours += 8; 
          }
        });

        return {
          code: emp.code,
          name: emp.name,
          daysWorked: daysW,
          lates,
          hours: totalHours.toFixed(1)
        };
      });
      setReport(empData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const exportCSV = () => {
    const header = "Code,Name,Days Worked,Lates,Hours\n";
    const rows = report.map(r => `${r.code},"${r.name}",${r.daysWorked},${r.lates},${r.hours}`).join("\n");
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${format(new Date(), 'yyyy_MM')}.csv`;
    a.click();
  };

  return (
    <div className="max-w-5xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-800">របាយការណ៍វត្តមានប្រចាំខែ (Monthly Report)</h2>
        <button onClick={exportCSV} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow flex items-center gap-2 transition">
          <Download size={18} /> ទាញយក CSV
        </button>
      </div>
      
      {loading ? <p className="text-slate-500 animate-pulse">កំពុងទាញទិន្នន័យ...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-slate-200">លេខកូដ</th>
                <th className="p-4 font-bold border-b border-slate-200">ឈ្មោះបុគ្គលិក</th>
                <th className="p-4 font-bold border-b border-slate-200">ថ្ងៃធ្វើការ (Days)</th>
                <th className="p-4 font-bold border-b border-slate-200 text-rose-500">មកយឺត (Late)</th>
                <th className="p-4 font-bold border-b border-slate-200">ម៉ោងសរុប (Hours)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {report.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold text-indigo-600">{r.code}</td>
                  <td className="p-4 font-bold text-slate-800">{r.name}</td>
                  <td className="p-4">{r.daysWorked} ថ្ងៃ</td>
                  <td className="p-4 text-rose-600 font-bold max-w-xs">{r.lates} ដង</td>
                  <td className="p-4 text-slate-600 font-mono">{r.hours} ម៉ោង</td>
                </tr>
              ))}
              {report.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-slate-400">គ្មានទិន្នន័យ (No report data)</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
