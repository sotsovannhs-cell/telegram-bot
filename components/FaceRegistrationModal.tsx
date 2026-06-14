'use client';

import { useState, useEffect, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { supabase } from '@/lib/supabase';
import { Camera, X, Check, Loader2 } from 'lucide-react';

interface FaceRegistrationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  employeeName: string;
}

export default function FaceRegistrationModal({ onClose, onSuccess, employeeName }: FaceRegistrationModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [status, setStatus] = useState<string>('កំពុងផ្ទុក Models...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' } })
      .then((currentStream) => {
        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
        setStatus('សម្លឹងមើលកាមេរ៉ា ហើយចុចចុះឈ្មោះ');
      })
      .catch((err) => {
        setStatus('មិនអាចបើកកាមេរ៉ាបានទេ។');
        console.error(err);
      });
  };

  const stopVideo = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        setIsModelsLoaded(true);
        setStatus('Models រួចរាល់។ កំពុងបើកកាមេរ៉ា...');
        startVideo();
      } catch (err) {
        setStatus('បរាជ័យក្នុងការផ្ទុក Models។');
        console.error(err);
      }
    };
    loadModels();

    return () => {
      stopVideo();
    };
  }, [stream]);

  const handleRegister = async () => {
    if (!videoRef.current || !isModelsLoaded) return;

    setIsProcessing(true);
    setStatus('កំពុងវិភាគទម្រង់មុខ...');

    try {
      const detection = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();

      if (!detection) {
        setStatus('រកមិនឃើញទម្រង់មុខទេ។ សូមព្យាយាមម្តងទៀត។');
        setIsProcessing(false);
        return;
      }

      const descriptorArray = Array.from(detection.descriptor);
      
      // Save to localStorage
      const enrollments = JSON.parse(localStorage.getItem('face_enrollments') || '[]');
      enrollments.push({
        id: Date.now().toString(),
        name: employeeName || 'បុគ្គលិកថ្មី',
        descriptor: descriptorArray
      });
      localStorage.setItem('face_enrollments', JSON.stringify(enrollments));

      // Attempt to save to Supabase
      try {
        await supabase.from('face_enrollments').insert([
          { 
            employee_name: employeeName || 'បុគ្គលិកថ្មី', 
            descriptor: descriptorArray 
          }
        ]);
      } catch (err) {
        console.warn('Supabase save failed (might not be configured)', err);
      }

      setStatus('ចុះឈ្មោះទម្រង់មុខជោគជ័យ!');
      setTimeout(() => {
        stopVideo();
        onSuccess();
      }, 1500);

    } catch (err) {
      setStatus('មានបញ្ហាក្នុងការចុះឈ្មោះ។');
      console.error(err);
    }
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
        <button onClick={() => { stopVideo(); onClose(); }} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/20 rounded-full text-white hover:bg-black/40">
          <X size={18} />
        </button>
        
        <div className="p-6 bg-indigo-600 text-white text-center">
          <h2 className="text-xl font-bold">ចុះឈ្មោះទម្រង់មុខ</h2>
          <p className="text-indigo-200 text-sm mt-1">{employeeName}</p>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="relative w-64 h-64 rounded-full overflow-hidden bg-slate-100 border-4 border-indigo-100 shadow-inner mb-6">
            {!isModelsLoaded && (
              <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
                <Loader2 className="animate-spin" size={32} />
              </div>
            )}
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline
              className="w-full h-full object-cover scale-x-[-1]" 
              onPlay={() => setIsModelsLoaded(true)}
            />
          </div>

          <p className="text-sm font-medium text-slate-600 text-center mb-6 h-8">{status}</p>

          <button
            onClick={handleRegister}
            disabled={!isModelsLoaded || isProcessing}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
            ចុះឈ្មោះ (Register Face)
          </button>
        </div>
      </div>
    </div>
  );
}
