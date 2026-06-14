'use client';

import { useState, useEffect, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Camera, X, Loader2, CheckCircle2 } from 'lucide-react';

interface FaceCheckInModalProps {
  onClose: () => void;
  onMatch: (name: string) => void;
}

export default function FaceCheckInModal({ onClose, onMatch }: FaceCheckInModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [status, setStatus] = useState<string>('កំពុងផ្ទុក Models...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [matchResult, setMatchResult] = useState<{name: string, distance: number} | null>(null);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' } })
      .then((currentStream) => {
        setStream(currentStream);
        if (videoRef.current) {
           videoRef.current.srcObject = currentStream;
        }
      })
      .catch((err) => {
        setStatus('មិនអាចបើកកាមេរ៉ាបានទេ។');
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
        setStatus('កំពុងវិភាគទម្រង់មុខ...');
        startVideo();
      } catch (err) {
        setStatus('បរាជ័យក្នុងការផ្ទុក Models។');
      }
    };
    loadModels();

    return () => stopVideo();
  }, [stream]);

  const verifyFace = async () => {
    if (!videoRef.current || !isModelsLoaded) return;
    setIsProcessing(true);
    setStatus('កំពុងស្វែងរកទិន្នន័យមុខ...');

    try {
      const enrollments = JSON.parse(localStorage.getItem('face_enrollments') || '[]');
      
      if (enrollments.length === 0) {
        setStatus('មិនមានទិន្នន័យមុខក្នុងប្រព័ន្ធទេ។ សូមចុះឈ្មោះជាមុនសិន។');
        setIsProcessing(false);
        return;
      }

      // Convert stored descriptors to Float32Array
      const labeledDescriptors = enrollments.map((e: any) => {
        return new faceapi.LabeledFaceDescriptors(e.name, [new Float32Array(e.descriptor)]);
      });

      const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5);

      const detection = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();

      if (!detection) {
        setStatus('រកមិនឃើញទម្រង់មុខទេ។ សូមនៅស្ងៀម។');
        setIsProcessing(false);
        return;
      }

      const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

      if (bestMatch.label !== 'unknown') {
        setStatus('ជោគជ័យ!');
        setMatchResult({ name: bestMatch.label, distance: bestMatch.distance });
        setTimeout(() => {
          stopVideo();
          onMatch(bestMatch.label);
        }, 1500);
      } else {
        setStatus('ទម្រង់មុខមិនត្រូវគ្នា! (មិនអនុញ្ញាតឡើយ)');
      }

    } catch (err) {
      setStatus('មានបញ្ហាបច្ចេកទេស។');
    }
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
        <button onClick={() => { stopVideo(); onClose(); }} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/20 rounded-full text-white hover:bg-black/40">
          <X size={18} />
        </button>
        
        <div className="p-6 bg-indigo-900 text-white text-center">
          <h2 className="text-xl font-bold">ស្កេនទម្រង់មុខ (Face Check-In)</h2>
          <p className="text-indigo-200 text-xs mt-2">ត្រូវប្រាកដថាទីតាំងភ្លឺគ្រប់គ្រាន់</p>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className={`relative w-64 h-64 rounded-xl overflow-hidden bg-slate-100 border-4 shadow-inner mb-6 transition-colors ${matchResult ? 'border-green-400' : 'border-indigo-100'}`}>
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
            />
            {matchResult && (
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-sm">
                <div className="bg-white rounded-xl p-4 shadow-xl flex flex-col items-center text-center animate-in zoom-in">
                  <CheckCircle2 size={40} className="text-green-500 mb-2" />
                  <span className="font-bold text-indigo-950">{matchResult.name}</span>
                  <span className="text-[10px] text-slate-500">គម្លាតបច្ចេកទេស: {matchResult.distance.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <p className={`text-sm font-bold text-center mb-6 h-8 ${matchResult ? 'text-green-600' : 'text-slate-600'}`}>
            {status}
          </p>

          {!matchResult && (
            <button
              onClick={verifyFace}
              disabled={!isModelsLoaded || isProcessing}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
              ថតរូបស្កេន (Verify)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
