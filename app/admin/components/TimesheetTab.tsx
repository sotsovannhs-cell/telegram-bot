import { useState, useEffect } from 'react';
import { Calendar, Save, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export default function TimesheetTab({ employees, orgSlug }: { employees: any[], orgSlug: string }) {
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    // Basic mock logic or Supabase load
    const TIMESHEET_KEY = `schedules_${orgSlug}`;
    setSchedules(JSON.parse(localStorage.getItem(TIMESHEET_KEY) || '[]'));
  }, [orgSlug]);

  const saveSchedules = (newSchedules: any[]) => {
    setSchedules(newSchedules);
    const TIMESHEET_KEY = `schedules_${orgSlug}`;
    localStorage.setItem(TIMESHEET_KEY, JSON.stringify(newSchedules));
  };

  const addSchedule = () => {
    const newSch = {
      id: Date.now().toString(),
      code: employees[0]?.code || '',
      dayOfWeek: 'Monday',
      startHour: '08:00',
      endHour: '12:00'
    };
    saveSchedules([...schedules, newSch]);
  };

  const updateSchedule = (id: string, field: string, value: string) => {
    saveSchedules(schedules.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteSchedule = (id: string) => {
    saveSchedules(schedules.filter(s => s.id !== id));
  };

  return (
    <div className="max-w-5xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="text-indigo-600" /> កាលវិភាគការងារ (Weekly Timesheet / Schedule)
        </h2>
        <button onClick={addSchedule} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow flex items-center gap-2 transition">
          <Plus size={18} /> បន្ថែមកាលវិភាគថ្មី
        </button>
      </div>

      <p className="text-slate-500 mb-6 text-sm leading-relaxed">
        កំណត់កាលវិភាគ ឬម៉ោងការងារប្រចាំថ្ងៃ សម្រាប់បុគ្គលិកក្រៅម៉ោង (Part-time) ឬអ្នកដែលមានកាលវិភាគមិនប្រក្រតី។ <br />
        (កំណត់ចំណាំ: ការចុះវត្តមាន ដែលត្រូវគ្នានឹងកាលវិភាគនេះ នឹងត្រូវគិតជា "ទាន់ពេល")
      </p>

      <div className="space-y-4">
        {schedules.map(sch => (
          <div key={sch.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end p-4 border border-slate-200 rounded-xl bg-slate-50">
            <div>
               <label className="block text-xs font-bold text-slate-500 mb-2">បុគ្គលិក</label>
               <select value={sch.code} onChange={e => updateSchedule(sch.id, 'code', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                  {employees.map(emp => (
                    <option key={emp.code} value={emp.code}>{emp.name}</option>
                  ))}
               </select>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 mb-2">ថ្ងៃនៃសប្តាហ៍</label>
               <select value={sch.dayOfWeek} onChange={e => updateSchedule(sch.id, 'dayOfWeek', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                  <option value="Monday">ច័ន្ទ (Monday)</option>
                  <option value="Tuesday">អង្គារ (Tuesday)</option>
                  <option value="Wednesday">ពុធ (Wednesday)</option>
                  <option value="Thursday">ព្រហស្បតិ៍ (Thursday)</option>
                  <option value="Friday">សុក្រ (Friday)</option>
                  <option value="Saturday">សៅរ៍ (Saturday)</option>
                  <option value="Sunday">អាទិត្យ (Sunday)</option>
               </select>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 mb-2">ម៉ោងចូល</label>
               <input type="time" value={sch.startHour} onChange={e => updateSchedule(sch.id, 'startHour', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono" />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 mb-2">ម៉ោងចេញ</label>
               <input type="time" value={sch.endHour} onChange={e => updateSchedule(sch.id, 'endHour', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono" />
            </div>
            <div className="flex justify-end">
               <button onClick={() => deleteSchedule(sch.id)} className="p-3 text-rose-500 hover:bg-rose-100 rounded-lg transition">
                 <Trash2 size={18} />
               </button>
            </div>
          </div>
        ))}

        {schedules.length === 0 && (
          <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
             មិនទាន់មានកាលវិភាគ សម្រាប់បុគ្គលិកក្រៅម៉ោង (No custom schedules defined)
          </div>
        )}
      </div>

    </div>
  );
}
