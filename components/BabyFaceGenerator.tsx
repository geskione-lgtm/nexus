
import React, { useState, useRef } from 'react';
import { Patient, ScanResult } from '../types';
import { generateBabyFace } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { QRCodeSVG } from 'qrcode.react';

interface Props { patient: Patient; onScanGenerated: (result: ScanResult) => void; history: ScanResult[]; }

const BabyFaceGenerator: React.FC<Props> = ({ patient, onScanGenerated, history }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [highRes, setHighRes] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharingScan, setSharingScan] = useState<ScanResult | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [options, setOptions] = useState({
    gender: 'unknown',
    expression: 'neutral',
    style: 'hyper-realistic',
    notes: ''
  });
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
      // 1. Generate baby face (returns base64)
      const resultBase64 = await generateBabyFace(previewUrl, highRes, options);
      
      // 2. Upload both to Supabase Storage
      const timestamp = Date.now();
      const ultrasoundPath = `patients/${patient.id}/source_${timestamp}.png`;
      const babyFacePath = `patients/${patient.id}/synthesis_${timestamp}.png`;

      const [ultrasoundUrl, babyFaceUrl] = await Promise.all([
        StorageService.uploadImage(previewUrl, ultrasoundPath),
        StorageService.uploadImage(resultBase64, babyFacePath)
      ]);

      const newScan: ScanResult = {
        id: `scan_${timestamp}`,
        patientId: patient.id,
        ultrasoundUrl: ultrasoundUrl,
        babyFaceUrl: babyFaceUrl,
        createdAt: new Date().toLocaleDateString()
      };

      onScanGenerated(newScan);
      setPreviewUrl(null);
    } catch (err: any) {
      console.error('Generation/Upload error:', err);
      setError(err.message || 'İşlem başarısız oldu.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareWhatsApp = (url: string) => {
    const text = encodeURIComponent(`Nexus Medical AI: Bebeğinizin ilk portresi hazır! 👶✨ Görseli buradan inceleyebilirsiniz: ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative">
      {/* Share Modal */}
      {sharingScan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-bold text-black tracking-tight">Görseli Paylaş</h3>
                <p className="text-apple-gray text-xs font-semibold uppercase tracking-widest mt-1">Hasta: {patient.name}</p>
              </div>
              <button onClick={() => { setSharingScan(null); setShowQRCode(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-8">
              <div className="bg-slate-50 p-6 rounded-[32px] flex flex-col items-center justify-center space-y-4 min-h-[240px]">
                {showQRCode ? (
                  <div className="animate-in zoom-in duration-300 flex flex-col items-center">
                    {!sharingScan.babyFaceUrl.startsWith('data:') ? (
                      <>
                        <QRCodeSVG value={sharingScan.babyFaceUrl} size={200} level="H" includeMargin={true} />
                        <p className="text-[10px] font-bold text-apple-gray uppercase tracking-widest text-center mt-4">
                          Telefonunuzla okutarak<br/>görseli anında indirebilirsiniz.
                        </p>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <p className="text-[10px] font-bold text-apple-gray uppercase tracking-widest">
                          Bu eski bir kayıt.<br/>
                          QR kod sadece yeni ve buluta<br/>yüklenmiş kayıtlar için çalışır.
                        </p>
                        <button onClick={() => setShowQRCode(false)} className="mt-4 text-[9px] font-bold text-black underline uppercase tracking-widest">Görsele Dön</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <img src={sharingScan.babyFaceUrl} className="w-40 h-40 object-cover rounded-2xl shadow-lg" alt="Preview" />
                    <p className="text-[10px] font-bold text-apple-gray uppercase tracking-widest text-center">
                      {sharingScan.babyFaceUrl.startsWith('data:') 
                        ? 'Yerel Kayıt (Buluta yüklenmemiş)' 
                        : 'Görsel buluta yüklendi.'}
                      <br/>
                      WhatsApp veya QR Kod ile paylaşabilirsiniz.
                    </p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => shareWhatsApp(sharingScan.babyFaceUrl)}
                  className="flex items-center justify-center gap-3 py-4 bg-[#25D366] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-all"
                >
                  WhatsApp
                </button>
                <button 
                  onClick={() => setShowQRCode(!showQRCode)}
                  className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-all ${showQRCode ? 'bg-slate-100 text-black' : 'bg-black text-white'}`}
                >
                  {showQRCode ? 'Görsele Dön' : 'QR Kod Göster'}
                </button>
              </div>

              <button 
                onClick={() => downloadImage(sharingScan.babyFaceUrl, `nexus-baby-${patient.name}.png`)}
                className="w-full py-4 border border-black/10 text-black rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Cihaza İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Studio Viewport */}
      <div className="space-y-8">
        <div className="aspect-[4/5] bg-black rounded-[48px] overflow-hidden relative flex flex-col items-center justify-center p-10 group shadow-2xl">
          {previewUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-6 animate-in zoom-in duration-500">
              <img src={previewUrl} className="max-w-full max-h-[60%] object-contain rounded-[32px] border border-white/10" />
              
              {/* Parameter Inputs */}
              <div className="w-full max-w-md space-y-4 apple-blur bg-white/5 p-6 rounded-[32px] border border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest px-1">Cinsiyet</label>
                    <select 
                      value={options.gender} 
                      onChange={e => setOptions({...options, gender: e.target.value})}
                      className="w-full bg-white/5 border-none rounded-xl text-[11px] text-white font-medium focus:ring-1 focus:ring-nexus-mint transition-all"
                    >
                      <option value="unknown" className="bg-slate-900">Belirsiz</option>
                      <option value="boy" className="bg-slate-900">Erkek</option>
                      <option value="girl" className="bg-slate-900">Kız</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest px-1">İfade</label>
                    <select 
                      value={options.expression} 
                      onChange={e => setOptions({...options, expression: e.target.value})}
                      className="w-full bg-white/5 border-none rounded-xl text-[11px] text-white font-medium focus:ring-1 focus:ring-nexus-mint transition-all"
                    >
                      <option value="neutral" className="bg-slate-900">Doğal</option>
                      <option value="smiling" className="bg-slate-900">Gülümseyen</option>
                      <option value="sleeping" className="bg-slate-900">Uykuda</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest px-1">Görsel Stil</label>
                  <select 
                    value={options.style} 
                    onChange={e => setOptions({...options, style: e.target.value})}
                    className="w-full bg-white/5 border-none rounded-xl text-[11px] text-white font-medium focus:ring-1 focus:ring-nexus-mint transition-all"
                  >
                    <option value="hyper-realistic" className="bg-slate-900">Hiper-Gerçekçi</option>
                    <option value="artistic" className="bg-slate-900">Sanatsal Portre</option>
                    <option value="3d-render" className="bg-slate-900">3D Medikal Render</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest px-1">Medikal Notlar (Opsiyonel)</label>
                  <textarea 
                    value={options.notes} 
                    onChange={e => setOptions({...options, notes: e.target.value})}
                    placeholder="Örn: Burun yapısına odaklan..."
                    className="w-full bg-white/5 border-none rounded-xl text-[11px] text-white font-medium focus:ring-1 focus:ring-nexus-mint transition-all h-16 resize-none p-3"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 bg-nexus-mint/10 rounded-full border border-nexus-mint/20">
                <div className="w-1.5 h-1.5 bg-nexus-mint rounded-full animate-pulse"></div>
                <span className="text-[9px] font-bold text-nexus-mint uppercase tracking-widest">Nexus Intelligence Core Synthesis</span>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] text-red-400 font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                  Hata: {error}
                </div>
              )}

              <button onClick={() => setPreviewUrl(null)} className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors">Dosyayı Değiştir</button>
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
                    <button 
                      onClick={() => setSharingScan(result)}
                      className="text-[9px] font-bold uppercase tracking-widest text-black/40 hover:text-black"
                    >
                      Share
                    </button>
                    <button 
                      onClick={() => downloadImage(result.babyFaceUrl, `nexus-baby-${patient.name}.png`)}
                      className="text-[9px] font-bold uppercase tracking-widest text-black/40 hover:text-black"
                    >
                      Download
                    </button>
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
