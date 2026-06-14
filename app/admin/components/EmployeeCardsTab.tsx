import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';

async function generateToken(secret: string, code: string) {
  const msgUint8 = new TextEncoder().encode(`${secret}:${code}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function EmployeeCardsTab({ employees, config }: { employees: any[], config: any }) {
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    async function prepareCards() {
      const secret = config.qrSecret || 'secatt_default_qr_secret_123';
      const c = await Promise.all(employees.map(async emp => {
        const token = await generateToken(secret, emp.code);
        return {
           ...emp,
           qrData: `SECATT-EMP:${emp.code}:${token}`
        };
      }));
      setCards(c);
    }
    prepareCards();
  }, [employees, config]);

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 print:p-0 print:border-none print:shadow-none">
      <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4 print:hidden">
         <h2 className="text-xl font-bold text-slate-800">កាតបុគ្គលិក (Employee Identity Cards)</h2>
         <button onClick={() => window.print()} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow flex items-center gap-2 transition">
           <Printer size={18}/> បោះពុម្ពកាតទាំងអស់ (Print)
         </button>
      </div>

      <p className="text-slate-500 mb-6 text-sm print:hidden">
        កាតនីមួយៗរួមបញ្ចូលនូវ QR Code សម្ងាត់សម្រាប់ស្កេនវត្តមាន។ QR Code នេះមានការចូលកូដទាន់សម័យ (SHA256 Signed) ការពារការលួចចម្លង ឬបង្កើតក្លែងក្លាយ។
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 print:grid-cols-3 print:gap-8">
        {cards.map(emp => (
          <div key={emp.code} className="border-2 border-slate-200 rounded-2xl p-6 flex flex-col items-center text-center bg-white shadow-sm print:border-slate-800 break-inside-avoid">
             <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full mb-4 flex items-center justify-center overflow-hidden border-4 border-white shadow">
               {emp.photoUrl ? (
                 <img src={emp.photoUrl} alt={emp.name} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-3xl font-bold">{emp.name.charAt(0)}</span>
               )}
             </div>
             <h3 className="font-bold text-lg mb-1">{emp.name}</h3>
             <p className="text-slate-500 font-mono text-sm px-3 py-1 bg-slate-50 rounded mb-4">
               {emp.code} {emp.dept ? `• ${emp.dept}` : ''}
             </p>
             <div className="p-3 bg-white border border-slate-200 rounded-xl inline-block shadow-sm">
                <QRCodeSVG value={emp.qrData} size={140} level="M" />
             </div>
             <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-wider font-bold">Secure Attendance Pass</p>
          </div>
        ))}
        {cards.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400">
             មិនទាន់មានបុគ្គលិកនៅឡើយទេ (No employees found)
          </div>
        )}
      </div>
    </div>
  );
}
