
import React, { useState, useRef } from 'react';
import { Patient, ScanResult } from '../types';
import { generateBabyFace } from '../services/geminiService';

interface Props { patient: Patient; onScanGenerated: (result: ScanResult) => void; history: ScanResult[]; }

const BabyFaceGenerator: React.FC<Props> = ({ patient, onScanGenerated, history }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [highRes, setHighRes] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!previewUrl) return;
    setIsGenerating(true);
    setError(null);

    try {
      const resultUrl = await generateBabyFace(previewUrl, highRes);
      const newScan: ScanResult = {
        id: `scan_${Date.now()}`,
        patientId: patient.id,
        ultrasoundUrl: previewUrl,
        babyFaceUrl: resultUrl,
        createdAt: new Date().toLocaleDateString()
      };
      onScanGenerated(newScan);
      setPreviewUrl(null);
    } catch (err: any) {
      setError(err.message || 'Processing failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* Studio Viewport */}
      <div className="space-y-8">
        <div className="aspect-[4/5] bg-black rounded-[48px] overflow-hidden relative flex flex-col items-center justify-center p-10 group shadow-2xl">
          {previewUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-10 animate-in zoom-in duration-500">
              <img src={previewUrl} className="max-w-full max-h-[80%] object-contain rounded-[32px] border border-white/10" />
              <button onClick={() => setPreviewUrl(null)} className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors">Replace Scan Data</button>
            </div>
          ) : (
            <div className="text-center space-y-8">
              <div className="w-24 h-24 mx-auto bg-white/5 rounded-[32px] flex items-center justify-center text-white/20 group-hover:bg-white/10 transition-colors">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-white tracking-tight">Upload Ultrasound Data</p>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Secure Cloud Synthesis v3.0</p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-10 py-4 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
              >
                Select DICOM File
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
          )}
          
          {/* Controls Overlay */}
          <div className="absolute bottom-8 left-8 right-8 p-1 apple-blur bg-white/5 rounded-[32px] border border-white/10 flex items-center justify-between">
             <div className="px-6 flex items-center gap-4">
               <label className="text-white/40 text-[9px] font-bold uppercase tracking-widest">High Definition</label>
               <input type="checkbox" checked={highRes} onChange={() => setHighRes(!highRes)} className="w-4 h-4 rounded-full accent-nexus-mint bg-white/5" />
             </div>
             <button 
               disabled={!previewUrl || isGenerating}
               onClick={handleGenerate}
               className={`px-8 py-3.5 rounded-[26px] text-[10px] font-bold uppercase tracking-widest transition-all ${isGenerating || !previewUrl ? 'bg-white/5 text-white/10' : 'bg-white text-black hover:bg-nexus-mint hover:text-white'}`}
             >
               {isGenerating ? 'Synthesizing...' : 'Start Render'}
             </button>
          </div>
        </div>
      </div>

      {/* History Grid */}
      <div className="apple-card rounded-[48px] p-10 flex flex-col h-[750px]">
        <h3 className="text-xl font-bold text-black mb-10 tracking-tight flex justify-between items-center">
          Render Archives
          <span className="text-[10px] font-bold text-apple-gray uppercase tracking-widest">{patient.name}</span>
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-10 pr-2">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-apple-gray space-y-4">
              <div className="w-16 h-16 rounded-full border border-black/5 flex items-center justify-center">
                 <div className="w-1 h-1 bg-black/10 rounded-full"></div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest">No previous sessions</p>
            </div>
          ) : (
            history.map(result => (
              <div key={result.id} className="group space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-apple-gray uppercase px-2 tracking-widest">Source</p>
                    <img src={result.ultrasoundUrl} className="w-full aspect-square object-cover rounded-[28px] grayscale contrast-125 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-nexus-mint uppercase px-2 tracking-widest">AI Synthesis</p>
                    <img src={result.babyFaceUrl} className="w-full aspect-square object-cover rounded-[28px] shadow-2xl shadow-black/10 transition-transform group-hover:scale-[1.02]" />
                  </div>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-semibold text-apple-gray">{result.createdAt}</span>
                  <div className="flex gap-4">
                    <button className="text-[9px] font-bold uppercase tracking-widest text-black/40 hover:text-black">Share</button>
                    <button className="text-[9px] font-bold uppercase tracking-widest text-black/40 hover:text-black">Download</button>
                  </div>
                </div>
                <div className="h-px bg-black/[0.03] w-full"></div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BabyFaceGenerator;
