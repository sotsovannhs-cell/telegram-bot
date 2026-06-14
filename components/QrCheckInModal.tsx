'use client';

import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { X, QrCode, CheckCircle2 } from 'lucide-react';

interface QrCheckInModalProps {
  onClose: () => void;
  onSuccess: () => void;
  expectedSecret: string;
}

export default function QrCheckInModal({ onClose, onSuccess, expectedSecret }: QrCheckInModalProps) {
  const [status, setStatus] = useState<string>('សូមដាក់កូដ QR នៅចំកណ្តាលកាមេរ៉ា');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleScan = (text: string) => {
    if (isSuccess) return;
    
    if (text === expectedSecret) {
      setStatus('ស្កេនជោគជ័យ!');
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } else {
      setStatus('កូដ QR មិនត្រឹមត្រូវ! (Invalid QR code)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/20 rounded-full text-white hover:bg-black/40">
          <X size={18} />
        </button>
        
        <div className="p-6 bg-violet-600 text-white text-center">
          <h2 className="text-xl font-bold flex items-center justify-center gap-2">
            <QrCode size={24} /> ស្កេនកូដការិយាល័យ
          </h2>
          <p className="text-violet-200 text-xs mt-2">ត្រូវប្រាកដថាលោកអ្នកនៅក្បែរកូដ QR រួចស្កេន</p>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className={`relative w-full aspect-square rounded-xl overflow-hidden mb-6 transition-all border-4 ${isSuccess ? 'border-green-400' : 'border-violet-100'}`}>
            {!isSuccess ? (
              <Scanner 
                onScan={(detectedCodes) => {
                  if (detectedCodes.length > 0) {
                    handleScan(detectedCodes[0].rawValue);
                  }
                }}
                onError={(err) => setStatus('សូមអនុញ្ញាតកាមេរ៉ា (Camera Error)')}
                components={{ finder: false }}
              />
            ) : (
              <div className="absolute inset-0 bg-green-50 flex flex-col items-center justify-center space-y-2 animate-in zoom-in">
                <CheckCircle2 size={64} className="text-green-500" />
                <p className="text-green-700 font-bold">ជោគជ័យ</p>
              </div>
            )}
          </div>
          
          <p className={`text-sm font-bold text-center h-8 ${isSuccess ? 'text-green-600' : 'text-slate-600'}`}>
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}
