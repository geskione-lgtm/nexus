
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
      // Gemini 3 Pro ve Video/Image modelleri için zorunlu API Key kontrolü
      if (highRes) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await (window as any).aistudio.openSelectKey();
          // Yarış durumunu önlemek için seçimin başarılı olduğunu varsayıyoruz
        }
      }

      const resultUrl = await generateBabyFace(previewUrl, highRes);
      
      const newScan: ScanResult = {
        id: `scan_${Date.now()}`,
        patientId: patient.id,
        ultrasoundUrl: previewUrl,
        babyFaceUrl: resultUrl,
        createdAt: new Date().toLocaleDateString('tr-TR')
      };
      
      onScanGenerated(newScan);
      setPreviewUrl(null);
    } catch (err: any) {
      if (err.message === "API_KEY_EXPIRED") {
        alert("API Anahtarı geçersiz veya süresi dolmuş. Lütfen tekrar seçin.");
        await (window as any).aistudio.openSelectKey();
      } else {
        setError(err.message || 'Bulut işleme hatası oluştu.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="space-y-8">
        <div className="bg-white p-12 rounded-[40px] border-2 border-dashed border-slate-200 hover:border-nexus-green transition-all flex flex-col items-center justify-center text-center relative group">
          {previewUrl ? (
            <div className="w-full space-y-6">
              <img src={previewUrl} alt="Önizleme" className="w-full h-80 object-cover rounded-[32px] border border-slate-100 shadow-xl" />
              <button onClick={() => setPreviewUrl(null)} className="text-xs font-black uppercase tracking-widest text-red-400 hover:text-red-500">Girdi Verisini Temizle</button>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-[#F9F9F9] text-nexus-green rounded-[32px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <p className="text-black font-black uppercase tracking-tighter text-xl mb-2">Bulut İşleme İçin Veri Yükle</p>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-8 text-center max-w-xs">Görüntüler Google Cloud üzerinde güvenli bir şekilde işlenecektir.</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-10 py-4 bg-black text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform"
              >
                Görüntüyü Seç
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </>
          )}
        </div>

        <div className="bg-black text-white p-10 rounded-[40px] shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-nexus-green opacity-10 rounded-full blur-3xl"></div>
          <div>
             <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
               <span className="w-2 h-2 bg-nexus-green rounded-full shadow-[0_0_10px_#10b981]"></span>
               Cloud AI Parametreleri
             </h3>
          </div>
          
          <div className="flex items-center justify-between p-6 bg-white/5 rounded-[24px] border border-white/10 hover:bg-white/10 transition-colors">
            <div>
              <p className="font-bold text-sm uppercase tracking-widest">Gemini 3 Pro Sentezleme (2K)</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Ücretli API Key Gerektirir</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={highRes} onChange={() => setHighRes(!highRes)} />
              <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nexus-green"></div>
            </label>
          </div>
          
          {error && (
            <div className="p-4 bg-red-400/10 border border-red-400/20 rounded-xl">
              <p className="text-red-400 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>
            </div>
          )}

          <button 
            disabled={!previewUrl || isGenerating}
            onClick={handleGenerate}
            className={`w-full py-6 rounded-[24px] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 transition-all ${isGenerating || !previewUrl ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-nexus-green text-white hover:scale-[1.02] shadow-[0_10px_30px_rgba(16,185,129,0.3)]'}`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Bulut İşleme Alınıyor...
              </>
            ) : 'Profil Sentezlemeyi Başlat'}
          </button>
          
          {highRes && (
            <p className="text-[9px] text-slate-500 font-bold text-center uppercase tracking-widest">
              Faturalandırma hakkında bilgi için: <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-nexus-green underline">ai.google.dev/billing</a>
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[40px] p-10 border border-slate-100 min-h-[600px] flex flex-col shadow-sm">
        <h3 className="text-xl font-black uppercase tracking-tighter text-black mb-8 border-b border-slate-50 pb-6 flex justify-between items-center">
          Cloud Arşivi
          <span className="text-[10px] font-black text-slate-400 tracking-[0.2em]">{patient.name}</span>
        </h3>
        
        {history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <div className="w-16 h-16 border-2 border-slate-100 rounded-full flex items-center justify-center mb-4">
               <div className="w-2 h-2 bg-slate-100 rounded-full"></div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Kayıt Bulunmuyor</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12 overflow-y-auto pr-2 max-h-[800px] scroll-smooth">
            {history.map(result => (
              <div key={result.id} className="bg-[#fcfcfc] rounded-[32px] overflow-hidden border border-slate-100 group hover:border-nexus-green transition-colors">
                <div className="grid grid-cols-2">
                  <div className="p-4 border-r border-slate-50">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">DICOM Tarama</p>
                    <img src={result.ultrasoundUrl} className="w-full aspect-square object-cover rounded-2xl grayscale opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-4 bg-white">
                    <p className="text-[9px] font-black text-nexus-green uppercase tracking-widest mb-3">AI Rekonstrüksiyon</p>
                    <img src={result.babyFaceUrl} className="w-full aspect-square object-cover rounded-2xl shadow-xl shadow-black/5" />
                  </div>
                </div>
                <div className="p-6 flex items-center justify-between border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{result.createdAt}</span>
                  <div className="flex gap-2">
                    <button className="p-3 bg-slate-50 hover:bg-black hover:text-white rounded-full transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                    <button className="px-5 py-3 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-nexus-green transition-all">
                      Sunucu Kaydını Paylaş
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BabyFaceGenerator;
