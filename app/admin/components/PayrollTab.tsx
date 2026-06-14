import { useState, useEffect } from 'react';
import { Send, DollarSign, Edit2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { differenceInMinutes } from 'date-fns';
import { toZonedTime, format as formatTz } from 'date-fns-tz';

export default function PayrollTab({ employees, config, orgSlug }: { employees: any[], config: any, orgSlug: string }) {
  const [payroll, setPayroll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    generatePayroll();
  }, [employees, config]);

  const generatePayroll = async () => {
    setLoading(true);
    try {
      // Pagination as explicitly requested
      const { data, error } = await supabase.from('attendance_logs').select('*').range(0, 999);
      
      let allCheckins: any[] = [];
      if (data && data.length > 0) {
        allCheckins = data;
      } else {
        const ATTEND_KEY = `checkins_${orgSlug}`;
        allCheckins = JSON.parse(localStorage.getItem(ATTEND_KEY) || '[]');
      }
      
      const pData = employees.map(emp => {
        const empCheckins = allCheckins.filter(c => c.userId === emp.code || c.user_id === emp.id);
        const ins = empCheckins.filter(c => c.action === 'in' || c.check_type === 'check_in');
        const outs = empCheckins.filter(c => c.action === 'out' || c.check_type === 'check_out');
        
        // Count lates and calculate hours
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

        // 22 working days assumed for fixed salary late calculations
        const workDaysMonth = 22;
        const rate = Number(emp.rate) || 0;
        let basePay = 0;
        let deduction = 0;

        if (emp.salaryType === 'fixed') {
          basePay = rate;
          // Simple absent/late deduction mock (e.g. late = -$5, absent = - daily rate)
          deduction = lates * 5; 
        } else {
          // hourly
          basePay = totalHours * rate;
        }

        const adjustment = adjustments[emp.code] || 0;
        const netPay = basePay - deduction + adjustment;

        return {
          code: emp.code,
          name: emp.name,
          salaryType: emp.salaryType || 'fixed',
          rate,
          basePay,
          deduction,
          adjustment,
          netPay,
          telegram_id: emp.telegram_id
        };
      });
      setPayroll(pData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const saveAdjustment = (code: string, newAdj: number) => {
    setAdjustments(prev => ({ ...prev, [code]: newAdj }));
    setEditingId(null);
  };

  const sendPayslip = async (emp: any) => {
    if (!emp.telegram_id) {
      alert("បុគ្គលិកនេះមិនមាន Telegram ID ទេ!");
      return;
    }
    const msg = `🧾 *ប័ណ្ណបើកប្រាក់បៀវត្សរ៍*\n👤 ឈ្មោះ: ${emp.name}\n💰 ប្រាក់គោល: $${emp.basePay.toFixed(2)}\n📉 កាត់ប្រាក់(យឺត/អវត្តមាន): -$${emp.deduction}\n⚖️ ប្រាក់កែតម្រូវ: $${emp.adjustment}\n✅ *ចំនួនប្រាក់ត្រូវបើកសរុប: $${emp.netPay.toFixed(2)}*`;
    
    try {
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', chat_id: emp.telegram_id, text: msg })
      });
      if (res.ok) alert("ផ្ញើជោគជ័យ!");
      else alert("ផ្ញើបរាជ័យ!");
    } catch(err) {
      alert("មានបញ្ហាពេលផ្ញើ (Network error)");
    }
  };

  // Re-run generation when adjustments change
  useEffect(() => {
    generatePayroll();
  }, [adjustments]);

  return (
    <div className="max-w-6xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-sm">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-3">
          <DollarSign className="text-indigo-600"/> គ្រប់គ្រងការបើកប្រាក់បៀវត្សរ៍ (Payroll)
        </h2>
        <div className="text-slate-500 font-medium bg-white px-4 py-2 rounded-lg border border-slate-200">
           ប្រើប្រាស់ម៉ោងធ្វើការ៖ {config.startTime || '08:00'} - {config.endTime || '17:00'}
        </div>
      </div>
      
      {loading ? <p className="p-8 text-center text-slate-500">កំពុងគណនា...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-slate-200">បុគ្គលិក</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right">ប្រាក់គោល (Base)</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right text-rose-500">កាត់ប្រាក់ (Ded.)</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right">កែតម្រូវ (Adj.)</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right text-emerald-600">ទឹកប្រាក់សរុប (Net)</th>
                <th className="p-4 font-bold border-b border-slate-200 text-center">សកម្មភាព (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {payroll.map((r) => (
                <tr key={r.code} className="hover:bg-slate-50/50">
                  <td className="p-4 font-sans">
                     <p className="font-bold text-slate-800">{r.name}</p>
                     <span className="text-xs text-slate-500">{r.code} • {r.salaryType === 'fixed' ? 'ខែ' : 'ម៉ោង'}</span>
                  </td>
                  <td className="p-4 text-right text-slate-600">${r.basePay.toFixed(2)}</td>
                  <td className="p-4 text-right text-rose-600 font-bold">-${r.deduction.toFixed(2)}</td>
                  <td className="p-4 text-right text-slate-600 relative">
                     {editingId === r.code ? (
                       <input 
                         type="number"
                         autoFocus
                         defaultValue={r.adjustment}
                         onBlur={(e) => saveAdjustment(r.code, parseFloat(e.target.value) || 0)}
                         onKeyDown={(e) => e.key === 'Enter' && saveAdjustment(r.code, parseFloat(e.currentTarget.value) || 0)}
                         className="w-20 px-2 py-1 border border-indigo-500 rounded text-right bg-white shadow-sm"
                       />
                     ) : (
                       <div className="flex items-center justify-end gap-2 group cursor-pointer" onClick={() => setEditingId(r.code)}>
                         <span className={r.adjustment < 0 ? 'text-rose-500' : r.adjustment > 0 ? 'text-emerald-500' : ''}>
                            {r.adjustment > 0 ? '+' : ''}${r.adjustment.toFixed(2)}
                         </span>
                         <Edit2 size={12} className="opacity-0 group-hover:opacity-50" />
                       </div>
                     )}
                  </td>
                  <td className="p-4 text-right font-bold text-lg text-emerald-600">${r.netPay.toFixed(2)}</td>
                  <td className="p-4 text-center">
                     <button onClick={() => sendPayslip(r)} disabled={!r.telegram_id} className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-lg transition-all inline-flex items-center gap-2 text-xs">
                        <Send size={14} /> ផ្ញើ (Send)
                     </button>
                  </td>
                </tr>
              ))}
              {payroll.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-slate-400 font-sans">គ្មានទិន្នន័យ (No payroll data)</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
