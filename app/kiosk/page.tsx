'use client';
/* eslint-disable react-hooks/purity */

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Clock, UserIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function KioskPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>}>
      <KioskContent />
    </Suspense>
  );
}

function KioskContent() {
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get('org') || 'default';
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [inputValue, setInputValue] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [feedback, setFeedback] = useState<{
    status: 'success' | 'error' | 'idle';
    message: string;
    action?: 'in' | 'out';
    employeeName?: string;
  }>({ status: 'idle', message: '' });

  // time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // permanently focus input
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };
    focusInput();
    const interval = setInterval(focusInput, 500); // re-focus frequently
    
    const globalClickHandler = () => focusInput();
    window.addEventListener('click', globalClickHandler);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('click', globalClickHandler);
    };
  }, []);

  const processScan = (serial: string) => {
    const EMP_KEY = `employees_${orgSlug}`;
    const ATTEND_KEY = `checkins_${orgSlug}`;
    
    const emps = JSON.parse(localStorage.getItem(EMP_KEY) || '[]');
    const checkins = JSON.parse(localStorage.getItem(ATTEND_KEY) || '[]');
    
    // Find employee by NFC serial, or by code.
    const emp = emps.find((e: any) => e.nfc_serial === serial || e.code === serial);
    
    if (!emp) {
      setFeedback({ status: 'error', message: 'រកមិនឃើញបុគ្គលិក / Employee Not Found' });
      clearFeedback();
      return;
    }

    // Determine action based on last record
    const empLogs = checkins.filter((c: any) => c.userId === emp.code);
    // Sort by timestamp desc
    empLogs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const lastLog = empLogs[0];
    const lastAction = lastLog ? lastLog.check_type : 'check_out';
    // Toggle action
    const nextAction = lastAction === 'check_in' ? 'check_out' : 'check_in';
    
    const newLog = {
      id: Date.now().toString(),
      userId: emp.code,
      action: nextAction === 'check_in' ? 'in' : 'out',
      timestamp: new Date().toISOString(),
      check_type: nextAction,
      method: 'nfc_kiosk',
      substitute_for: ''
    };
    
    checkins.push(newLog);
    localStorage.setItem(ATTEND_KEY, JSON.stringify(checkins));
    
    setFeedback({
      status: 'success',
      message: 'ជោគជ័យ / Success',
      action: nextAction === 'check_in' ? 'in' : 'out',
      employeeName: emp.name
    });

    // Notify via Telegram API if needed
    if (emp.telegram_id) {
       const message = `បុគ្គលិក: ${emp.name} (${emp.code}) បាន ${nextAction === 'check_in' ? 'Check IN' : 'Check OUT'} ម៉ោង ${format(new Date(), 'HH:mm:ss')} (Kiosk NFC)`;
       fetch('/api/notify', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ chatId: emp.telegram_id, message })
       }).catch(() => {});
    }
    
    clearFeedback();
  };
  
  const clearFeedback = () => {
    setTimeout(() => {
      setFeedback({ status: 'idle', message: '' });
    }, 4000); // 4 seconds of big feedback
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (inputValue.trim()) {
        processScan(inputValue.trim());
      }
      setInputValue('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Invisible Input for HID RFID/NFC Reader */}
      <input 
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="absolute top-0 left-0 opacity-0 w-0 h-0 outline-none"
        autoFocus
        autoComplete="off"
        spellCheck="false"
      />
      
      <div className="text-center z-10 w-full max-w-5xl">
        {feedback.status === 'idle' && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="w-40 h-40 bg-slate-800 rounded-full mx-auto flex items-center justify-center mb-8 shadow-2xl border-4 border-slate-700">
              <Clock className="text-indigo-400" size={72} />
            </div>
            <h1 className="text-7xl md:text-9xl font-black text-white mb-6 font-mono tracking-tighter drop-shadow-2xl">
              {format(currentTime, 'HH:mm:ss')}
            </h1>
            <p className="text-2xl md:text-4xl text-slate-400 mb-16 font-medium tracking-wide">
              {format(currentTime, 'EEEE, dd MMMM yyyy')}
            </p>
            <div className="bg-slate-800/80 backdrop-blur-lg border border-slate-700/50 p-8 md:p-12 rounded-[3rem] w-full max-w-3xl mx-auto shadow-2xl">
               <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-widest mb-6">
                 សូមដាក់កាត (Tap Card)
               </h2>
               <p className="text-slate-400 text-xl md:text-2xl font-medium">
                 សម្រាប់កត់ត្រាវត្តមានចូល និងចេញ (Scan your NFC pass)
               </p>
            </div>
          </div>
        )}

        {feedback.status === 'success' && (
          <div className="animate-in zoom-in spin-in-3 duration-500">
            <div className={`w-48 h-48 rounded-full mx-auto flex items-center justify-center mb-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] border-8 border-slate-900 ${feedback.action === 'in' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500 shadow-amber-500/50'}`}>
               <CheckCircle2 className="text-white" size={100} />
            </div>
            <h1 className={`text-6xl md:text-8xl font-black mb-6 ${feedback.action === 'in' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {feedback.employeeName}
            </h1>
            <div className={`inline-block px-10 py-4 rounded-3xl mb-8 ${feedback.action === 'in' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
              <p className="text-5xl md:text-7xl font-black uppercase tracking-widest">
                {feedback.action === 'in' ? 'CHECK IN' : 'CHECK OUT'}
              </p>
            </div>
            <p className="text-3xl text-slate-400 mt-6 font-mono tracking-wide">
              {format(currentTime, 'HH:mm:ss')}
            </p>
          </div>
        )}

        {feedback.status === 'error' && (
          <div className="animate-in zoom-in duration-300">
            <div className="w-48 h-48 bg-rose-600 rounded-full mx-auto flex items-center justify-center mb-10 shadow-[0_0_100px_rgba(225,29,72,0.5)] border-8 border-slate-900 shadow-rose-600/50">
               <XCircle className="text-white" size={100} />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-rose-400 mb-6 px-4">
              {feedback.message}
            </h1>
            <div className="inline-block px-10 py-4 rounded-3xl bg-rose-500/20 text-rose-300 mb-8">
              <p className="text-4xl md:text-6xl font-black uppercase tracking-widest">
                ACCESS DENIED
              </p>
            </div>
          </div>
        )}
        
      </div>

      <div className="absolute bottom-6 text-slate-600 text-sm font-medium tracking-widest uppercase">
         [ SECURE ATTEND KIOSK MODE ]
      </div>
    </div>
  );
}
