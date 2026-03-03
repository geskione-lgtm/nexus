
import React, { useState, useRef } from 'react';
import { Patient, ScanResult } from '../types';
import { generateFetalImage } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { DatabaseService } from '../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Download, 
  Share2, 
  AlertCircle,
  Upload,
  RotateCcw,
  Box,
  ChevronRight,
  Baby,
  X,
  Mail
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Measurements {
  bpd: number | null;
  hc: number | null;
  ac: number | null;
  fl: number | null;
  hl: number | null;
}

interface Props { 
  patient: Patient; 
  onScanGenerated: (result: ScanResult) => void; 
  history: ScanResult[]; 
}

const FetalGenerator: React.FC<Props> = ({ patient, onScanGenerated, history }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastGeneratedScan, setLastGeneratedScan] = useState<ScanResult | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [sharingScan, setSharingScan] = useState<ScanResult | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  
  const [measurements, setMeasurements] = useState<Measurements>({
    bpd: null,
    hc: null,
    ac: null,
    fl: null,
    hl: null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!previewUrl) {
      setError("Lütfen önce ultrason görüntüsünü yükleyin.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setLastGeneratedScan(null);

    try {
      setGenerationStatus('Ultrason yükleniyor...');
      const timestamp = Date.now();
      const ultrasoundPath = `patients/${patient.id}/fetal_source_${timestamp}.png`;
      const ultrasoundUrl = await StorageService.uploadImage(previewUrl, ultrasoundPath);

      setGenerationStatus('Fetal görüntü oluşturuluyor...');
      const fetalImageUrl = await generateFetalImage(
        patient.weeksPregnant,
        measurements,
        previewUrl
      );

      setGenerationStatus('Sonuçlar kaydediliyor...');
      const babyFacePath = `patients/${patient.id}/fetal_result_${timestamp}.png`;
      const savedFetalUrl = await StorageService.uploadImage(fetalImageUrl, babyFacePath);

      const scanToSave: Partial<ScanResult> = {
        patientId: patient.id,
        ultrasoundUrl: ultrasoundUrl,
        babyFaceUrl: savedFetalUrl,
        measurements: measurements,
        createdAt: new Date().toISOString()
      };

      const savedScan = await DatabaseService.saveScan(scanToSave as ScanResult);
      
      const finalResult = {
        ...scanToSave,
        ...savedScan,
        measurements: measurements // Ensure measurements are preserved
      } as ScanResult;

      setLastGeneratedScan(finalResult);
      onScanGenerated(finalResult);
    } catch (err: any) {
      console.error("Fetal generation error:", err);
      setError(err.message || "Fetal görüntü oluşturulurken bir hata oluştu.");
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
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
    const text = `NeoBreed Fetal Stüdyo Sonucu: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareEmail = (url: string) => {
    const subject = `NeoBreed Fetal Stüdyo Sonucu - ${patient.name}`;
    const body = `Merhaba,\n\n${patient.name} için oluşturulan fetal rekonstrüksiyon sonucunu aşağıda görebilirsiniz:\n\n${url}\n\nNeoBreed Intelligence`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Input Controls */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white rounded-[32px] p-8 shadow-soft border border-border-subtle space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2563eb]/10 flex items-center justify-center">
                <Baby className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-text-primary tracking-tight">Fetal Stüdyo</h2>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-50">Anne Karnında Görünüm</p>
              </div>
            </div>

            {/* Upload Area */}
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] ml-2">Ultrason Görüntüsü</p>
              <div 
                onClick={() => !isGenerating && fileInputRef.current?.click()}
                className={`aspect-video rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden ${previewUrl ? 'border-[#2563eb]/40 bg-[#2563eb]/5' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
              >
                {previewUrl ? (
                  <img src={previewUrl} className="w-full h-full object-cover grayscale opacity-60" />
                ) : (
                  <Upload className="w-8 h-8 text-slate-300 group-hover:text-primary transition-colors" />
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>
            </div>

            {/* Measurements */}
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] ml-2">Biyometrik Veriler (Opsiyonel)</p>
              <div className="grid grid-cols-2 gap-3">
                {['BPD', 'HC', 'AC', 'FL', 'HL'].map((id) => (
                  <div key={id} className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">{id}</label>
                    <input 
                      type="number"
                      placeholder="0.0"
                      className="w-full bg-slate-50 border border-border-subtle rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={measurements[id.toLowerCase() as keyof Measurements] ?? ''}
                      onChange={(e) => setMeasurements(prev => ({ ...prev, [id.toLowerCase()]: e.target.value ? parseFloat(e.target.value) : null }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !previewUrl}
              className={`w-full py-5 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${isGenerating || !previewUrl ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#2563eb] text-white hover:scale-[1.02] active:scale-95 shadow-primary/20'}`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{generationStatus || 'Oluşturuluyor...'}</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>Fetal Görüntü Oluştur</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5" />
                <p className="text-[10px] font-bold text-rose-600 uppercase leading-relaxed">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="xl:col-span-8 space-y-6">
          {lastGeneratedScan ? (
            <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-soft border border-border-subtle space-y-10 animate-in zoom-in-95 duration-700 relative overflow-hidden">
              {/* Decorative background glow - subtle */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#2563eb]/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-2">
                  <h2 className="text-3xl font-medium text-text-primary tracking-tighter">Fetal Rekonstrüksiyon</h2>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-[#2563eb]/10 text-[#2563eb] rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {patient.weeksPregnant}. Hafta
                    </span>
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-40">
                      STUDIO V3.0 • ID: {lastGeneratedScan.id.split('-')[0]}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => downloadImage(lastGeneratedScan.babyFaceUrl, `neobreed-fetal-${patient.name}.png`)}
                    className="w-12 h-12 rounded-2xl bg-[#2563eb] text-white hover:bg-[#1d4ed8] flex items-center justify-center transition-all shadow-lg shadow-[#2563eb]/20"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setSharingScan(lastGeneratedScan)}
                    className="w-12 h-12 rounded-2xl bg-[#2563eb] text-white hover:bg-[#1d4ed8] flex items-center justify-center transition-all shadow-lg shadow-[#2563eb]/20"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="aspect-square md:aspect-video rounded-[32px] overflow-hidden border border-border-subtle shadow-floating relative group bg-slate-50">
                <img 
                  src={lastGeneratedScan.babyFaceUrl} 
                  className="w-full h-full object-contain transition-transform duration-1000 group-hover:scale-105" 
                  alt="Fetal Result"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Overlay info */}
                <div className="absolute top-6 left-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-y-2 group-hover:translate-y-0">
                  <div className="bg-white/80 backdrop-blur-md border border-border-subtle px-3 py-1.5 rounded-full flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#2563eb] rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-bold text-text-primary uppercase tracking-widest">Medical 3D Render</span>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="bg-white/80 backdrop-blur-xl border border-border-subtle p-5 rounded-3xl shadow-lg">
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Gelişim Aşaması</p>
                    <p className="text-sm font-medium text-text-primary tracking-tight mt-1">Haftalık Fetal Morfoloji ve Gelişim</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
                {Object.entries(lastGeneratedScan.measurements || {}).map(([key, val]: [string, any]) => (
                  <div key={key} className="bg-slate-50 border border-border-subtle rounded-2xl p-4 text-center space-y-1">
                    <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest opacity-60">{key}</p>
                    <p className="text-lg font-medium text-text-primary tracking-tight">{val || '—'}</p>
                    <p className="text-[8px] font-bold text-text-secondary uppercase tracking-widest opacity-40">MM</p>
                  </div>
                ))}
              </div>
            </div>
          ) : isGenerating ? (
            <div className="bg-white rounded-[40px] aspect-video flex flex-col items-center justify-center space-y-8 border border-border-subtle shadow-soft relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>
              <div className="relative">
                <div className="w-24 h-24 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Baby className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2 relative z-10">
                <p className="text-sm font-medium text-text-primary uppercase tracking-[0.4em] animate-pulse">{generationStatus}</p>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-40">Yapay zeka biyometrik verileri işliyor...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[40px] aspect-video flex flex-col items-center justify-center space-y-6 border border-dashed border-slate-200">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
                <Baby className="w-10 h-10 text-slate-200" />
              </div>
              <div className="text-center max-w-xs">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Analiz Bekleniyor</p>
                <p className="text-[10px] font-medium text-text-secondary/60 uppercase tracking-widest mt-2">
                  Lütfen sol taraftan ultrason görüntüsünü yükleyip analizi başlatın.
                </p>
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-4">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Son Fetal Analizler</p>
                <button className="text-[10px] font-bold text-[#2563eb] uppercase tracking-widest hover:underline">Tümünü Gör</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {history.slice(-4).reverse().map((scan) => (
                  <div 
                    key={scan.id} 
                    onClick={() => setLastGeneratedScan(scan)}
                    className="bg-white rounded-2xl p-3 border border-border-subtle shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden mb-3 relative">
                      <img src={scan.babyFaceUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <RotateCcw className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-text-primary uppercase tracking-widest truncate">
                      {new Date(scan.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {sharingScan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl animate-in fade-in duration-500">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[56px] p-12 max-w-md w-full shadow-2xl border border-white/20"
            >
              <div className="flex justify-between items-start mb-10">
                <div className="space-y-1">
                  <h3 className="text-3xl font-medium text-[#111827] tracking-tighter">Görseli Paylaş</h3>
                  <p className="text-text-secondary text-[10px] font-medium uppercase tracking-[0.25em] opacity-50">Hasta: {patient.name}</p>
                </div>
                <button onClick={() => { setSharingScan(null); setShowQRCode(false); }} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-all">
                  <X className="w-6 h-6 text-[#111827]" />
                </button>
              </div>

              <div className="space-y-10">
                <div className="bg-slate-50 p-8 rounded-[40px] flex flex-col items-center justify-center space-y-6 min-h-[280px] border border-border-subtle">
                  {showQRCode ? (
                    <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                      {!sharingScan.babyFaceUrl.startsWith('data:') ? (
                        <>
                          <div className="p-4 bg-white rounded-3xl shadow-xl">
                            <QRCodeSVG value={sharingScan.babyFaceUrl} size={200} level="H" includeMargin={true} />
                          </div>
                          <p className="text-[10px] font-medium text-text-secondary uppercase tracking-[0.2em] text-center mt-6 opacity-60">
                            Telefonunuzla okutarak<br/>görseli anında indirebilirsiniz.
                          </p>
                        </>
                      ) : (
                        <div className="text-center p-6">
                          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100">
                            <AlertCircle className="w-8 h-8" />
                          </div>
                          <p className="text-[10px] font-medium text-text-secondary uppercase tracking-[0.2em] opacity-60">
                            Bu yerel bir kayıt.<br/>
                            QR kod sadece buluta<br/>yüklenmiş kayıtlar için çalışır.
                          </p>
                          <button onClick={() => setShowQRCode(false)} className="mt-6 text-[10px] font-medium text-[#111827] underline uppercase tracking-widest">Görsele Dön</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="relative group">
                        <img src={sharingScan.babyFaceUrl} className="w-48 h-48 object-cover rounded-[32px] shadow-2xl shadow-black/20" alt="Preview" />
                        <div className="absolute inset-0 bg-[#2563eb]/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px]"></div>
                      </div>
                      <p className="text-[10px] font-medium text-text-secondary uppercase tracking-[0.2em] text-center opacity-60">
                        {sharingScan.babyFaceUrl.startsWith('data:') 
                          ? 'Yerel Kayıt (Buluta yüklenmemiş)' 
                          : 'Görsel buluta yüklendi.'}
                        <br/>
                        Paylaşım seçeneklerini kullanabilirsiniz.
                      </p>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => shareWhatsApp(sharingScan.babyFaceUrl)}
                    className="flex flex-col items-center justify-center gap-2 py-4 bg-[#25D366] text-white rounded-2xl font-bold text-[9px] uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-[#25D366]/20"
                  >
                    <Share2 className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button 
                    onClick={() => shareEmail(sharingScan.babyFaceUrl)}
                    className="flex flex-col items-center justify-center gap-2 py-4 bg-[#2563eb] text-white rounded-2xl font-bold text-[9px] uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-[#2563eb]/20"
                  >
                    <Mail className="w-4 h-4" />
                    E-posta
                  </button>
                  <button 
                    onClick={() => setShowQRCode(!showQRCode)}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[9px] uppercase tracking-widest hover:scale-[1.02] transition-all ${showQRCode ? 'bg-slate-100 text-[#111827]' : 'bg-[#111827] text-white shadow-lg shadow-black/10'}`}
                  >
                    <Box className="w-4 h-4" />
                    {showQRCode ? 'Görsel' : 'QR Kod'}
                  </button>
                </div>

                <button 
                  onClick={() => downloadImage(sharingScan.babyFaceUrl, `neobreed-fetal-${patient.name}.png`)}
                  className="w-full py-4 bg-slate-100 text-[#111827] rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cihaza İndir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FetalGenerator;
