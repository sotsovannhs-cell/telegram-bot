import { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, UserCheck, Clock, FileText } from 'lucide-react';

export default function ManualEntryTab({ employees, orgSlug }: { employees: any[], orgSlug: string }) {
  const [selectedEmp, setSelectedEmp] = useState<string>('');
  const [actionType, setActionType] = useState<'in' | 'out'>('in');
  const [overrideTime, setOverrideTime] = useState<string>(format(new Date(), "HH:mm"));
  const [overrideDate, setOverrideDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) {
      alert('សូមជ្រើសរើសបុគ្គលិក (Please select an employee)');
      return;
    }

    const emp = employees.find(e => e.code === selectedEmp);
    if (!emp) return;

    // Construct the timestamp from selected date and time
    const dateTimeStr = `${overrideDate}T${overrideTime}:00`;
    const timestamp = new Date(dateTimeStr);
    
    // Checkins key
    const ATTEND_KEY = `checkins_${orgSlug}`;
    const checkins = JSON.parse(localStorage.getItem(ATTEND_KEY) || '[]');
    
    const newLog = {
      id: Date.now().toString(),
      userId: emp.code,
      action: actionType,
      timestamp: timestamp.toISOString(),
      check_type: actionType === 'in' ? 'check_in' : 'check_out',
      method: 'manual',
      note: note,
      substitute_for: ''
    };
    
    checkins.push(newLog);
    localStorage.setItem(ATTEND_KEY, JSON.stringify(checkins));

    // Telegram Notify
    if (emp.telegram_id) {
       const message = `បុគ្គលិក: ${emp.name} (${emp.code}) ត្រូវបានបញ្ជាក់វត្តមានដោយ Admin: ${actionType === 'in' ? 'Check IN' : 'Check OUT'} នៅម៉ោង ${format(timestamp, 'HH:mm:ss dd/MM/yyyy')} (Manual/Proxy). ${note ? `\nសម្គាល់: ${note}` : ''}`;
       
       fetch('/api/notify', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ chatId: emp.telegram_id, message })
       }).catch(console.error);
    }
    
    setFeedback(`បានកត់ត្រាដោយជោគជ័យសម្រាប់ ${emp.name}!`);
    setTimeout(() => setFeedback(''), 4000);
    
    // Reset fields
    setNote('');
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="mb-8 border-b border-slate-100 pb-4">
         <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
           <UserCheck className="text-indigo-600" /> បញ្ចូលវត្តមានដោយដៃ (Manual / Proxy Attendance)
         </h2>
         <p className="text-slate-500 text-sm mt-2">
           កត់ត្រាការចូល/ចេញ ជំនួសបុគ្គលិកដែលភ្លេចទូរស័ព្ទ ឬមានបញ្ហាបច្ចេកទេស។
         </p>
      </div>

      {feedback && (
        <div className="mb-6 bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 flex items-center gap-3">
           <CheckCircle2 size={20} />
           <p className="font-bold">{feedback}</p>
        </div>
      )}

      <form onSubmit={handleManualCheckIn} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">ជ្រើសរើសបុគ្គលិក (Select Employee)</label>
          <select 
            required 
            value={selectedEmp} 
            onChange={(e) => setSelectedEmp(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          >
            <option value="">- ជ្រើសរើស -</option>
            {employees.map(emp => (
              <option key={emp.code} value={emp.code}>
                {emp.name} ({emp.code}) - {emp.dept || 'N/A'}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">ប្រភេទ (Type)</label>
            <div className="flex rounded-xl overflow-hidden border border-slate-300">
               <button 
                 type="button"
                 onClick={() => setActionType('in')}
                 className={`flex-1 py-3 font-bold transition ${actionType === 'in' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
               >
                 ចូល (IN)
               </button>
               <button 
                 type="button"
                 onClick={() => setActionType('out')}
                 className={`flex-1 py-3 font-bold transition ${actionType === 'out' ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
               >
                 ចេញ (OUT)
               </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-2">កាលបរិច្ឆេទ (Date)</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-2">ម៉ោង (Time)</label>
              <div className="relative">
                <input 
                  type="time" 
                  value={overrideTime}
                  onChange={(e) => setOverrideTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
                <Clock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">មូលហេតុ / សម្គាល់ (Note / Reason)</label>
          <div className="relative">
            <input 
              type="text" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. ភ្លេចទូរស័ព្ទ, ថ្មអស់..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
            <FileText className="absolute left-3 top-3.5 text-slate-400" size={18} />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button 
            type="submit" 
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg transition tracking-wide text-lg"
          >
            រក្សាត្រាវត្តមាន (Submit Record)
          </button>
        </div>
      </form>
    </div>
  );
}
