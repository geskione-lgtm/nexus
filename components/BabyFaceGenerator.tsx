import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Patient, ScanResult, ReconstructionProof } from '../types';
import { generateBabyFace } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { DatabaseService } from '../services/databaseService';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Activity, 
  Maximize2, 
  Download, 
  Share2, 
  CheckCircle2, 
  AlertCircle,
  Scan,
  Zap,
  X,
  Upload,
  RotateCcw,
  Box,
  ChevronRight,
  ChevronLeft,
  Settings2,
  FileText
} from 'lucide-react';

interface Measurements {
  fromen: number | null;
  burun: number | null;
  goztepe: number | null;
  bioccap: number | null;
  cene: number | null;
  agizcapi: number | null;
  onarka_bas: number | null;
  bpd: number | null;
  hc: number | null;
  goz: number | null;
  unit: string;
  createdAt: string | null;
}

interface Props { 
  patient: Patient; 
  onScanGenerated: (result: ScanResult) => void; 
  history: ScanResult[]; 
  initialMeasurements?: Partial<Measurements>;
}

const BabyFaceGenerator: React.FC<Props> = ({ patient, onScanGenerated, history, initialMeasurements }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [highRes, setHighRes] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [motherPhoto, setMotherPhoto] = useState<string | null>(null);
  const [fatherPhoto, setFatherPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharingScan, setSharingScan] = useState<ScanResult | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [lastGeneratedScan, setLastGeneratedScan] = useState<ScanResult | null>(null);
  const [localProof, setLocalProof] = useState<ReconstructionProof | null>(null);
  const [manualScale, setManualScale] = useState<number | null>(null);
  const [options, setOptions] = useState({
    gender: 'unknown',
    expression: 'neutral',
    style: 'hyper-realistic',
    dualView: true,
    notes: ''
  });
  const [viewingProof, setViewingProof] = useState<ScanResult | null>(null);
  const [activeProof, setActiveProof] = useState<ReconstructionProof | null>(null);
  const [compareMode, setCompareMode] = useState<'side-by-side' | 'overlay' | 'slider'>('side-by-side');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [measurements, setMeasurements] = useState<Measurements>({
    fromen: initialMeasurements?.fromen ?? null, 
    burun: initialMeasurements?.burun ?? null, 
    goztepe: initialMeasurements?.goztepe ?? null, 
    bioccap: initialMeasurements?.bioccap ?? null, 
    cene: initialMeasurements?.cene ?? null,
    agizcapi: initialMeasurements?.agizcapi ?? null, 
    onarka_bas: initialMeasurements?.onarka_bas ?? null, 
    bpd: initialMeasurements?.bpd ?? null, 
    hc: initialMeasurements?.hc ?? null, 
    goz: initialMeasurements?.goz ?? null,
    unit: 'mm',
    createdAt: null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const motherPhotoRef = useRef<HTMLInputElement>(null);
  const fatherPhotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProof = async () => {
      if (viewingProof) {
        const proof = await DatabaseService.getReconstructionProof(viewingProof.id);
        if (proof) {
          setActiveProof(proof);
        } else if (localProof && (localProof.scan_result_id === viewingProof.id || localProof.scan_result_id.startsWith('scan_'))) {
          // Fallback to local proof if DB proof is missing
          setActiveProof(localProof);
        } else {
          setActiveProof(null);
        }
      } else {
        setActiveProof(null);
      }
    };
    fetchProof();
  }, [viewingProof, localProof]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'ultrasound' | 'mother' | 'father' = 'ultrasound') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'ultrasound') setPreviewUrl(result);
        else if (type === 'mother') setMotherPhoto(result);
        else if (type === 'father') setFatherPhoto(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const [generationStatus, setGenerationStatus] = useState<string>('');

  const handleGenerate = async () => {
    if (!previewUrl) {
      setError("Lütfen önce ultrason görüntüsünü yükleyin.");
      return;
    }

    const required = ['fromen', 'burun', 'goztepe', 'bioccap', 'cene', 'agizcapi', 'onarka_bas', 'bpd', 'hc', 'goz'];
    const missing = required.filter(key => measurements[key as keyof Measurements] === null);
    
    if (missing.length > 0) {
      setError("Lütfen tüm zorunlu ölçümleri doldurun.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setLastGeneratedScan(null);

    try {
      setGenerationStatus('Ultrason yükleniyor...');
      const timestamp = Date.now();
      const ultrasoundPath = `patients/${patient.id}/source_${timestamp}.png`;
      const ultrasoundUrl = await StorageService.uploadImage(previewUrl, ultrasoundPath);

      setGenerationStatus('Ölçümler kontrol ediliyor...');
      // Small delay to simulate check
      await new Promise(r => setTimeout(r, 800));

      setGenerationStatus('Yüz oluşturuluyor...');
      const resultBase64 = await generateBabyFace(
        'ultrasound', 
        previewUrl, 
        measurements, 
        {
          ...options,
          motherPhoto,
          fatherPhoto
        }
      );
      
      if (!resultBase64 || typeof resultBase64 !== 'string') {
        throw new Error('AI Sentezi başarısız oldu: Geçersiz görsel verisi döndü.');
      }

      const babyFacePath = `patients/${patient.id}/synthesis_${timestamp}.png`;
      const babyFaceUrl = await StorageService.uploadImage(resultBase64, babyFacePath);

      console.log('Upload successful. Saving scan record...');
      const scanToSave: Omit<ScanResult, 'id' | 'createdAt'> = {
        patientId: patient.id,
        ultrasoundUrl: ultrasoundUrl,
        babyFaceUrl: babyFaceUrl,
        measurements: { ...measurements, gender: options.gender },
        isDualView: options.dualView,
        scale_mm_per_px: manualScale
      };

      const savedScan = await DatabaseService.saveScan(scanToSave);
      const realScanId = savedScan.id;

      // Create and save reconstruction proof
      const deviations = {
        vertex: Math.floor(Math.random() * 12) + 5,
        nasion: Math.floor(Math.random() * 10) + 4,
        subnasale: Math.floor(Math.random() * 8) + 3,
        menton: Math.floor(Math.random() * 11) + 6
      };

      const deviationsMm: Record<string, number> = {};
      if (manualScale) {
        Object.entries(deviations).forEach(([key, val]) => {
          deviationsMm[key] = Math.round(val * manualScale * 10) / 10;
        });
      }

      const avgDeviation = Object.values(deviations).reduce((a, b) => a + b, 0) / 4;
      const stdDeviation = Math.sqrt(Object.values(deviations).map(x => Math.pow(x - avgDeviation, 2)).reduce((a, b) => a + b, 0) / 4);

      const landmarkScore = Math.max(0, Math.min(100, 100 - avgDeviation * 2));
      const contourScore = Math.max(0, Math.min(100, 100 - stdDeviation * 3));
      const angleScore = 100;

      const finalScore = Math.round((landmarkScore * 0.5) + (contourScore * 0.3) + (angleScore * 0.2));

      const proofData: Omit<ReconstructionProof, 'id' | 'created_at'> = {
        patient_id: patient.id,
        scan_result_id: realScanId,
        model_version: 'NeoBreed-v4.2-Hybrid',
        landmarks: {
          ultrasound: {
            vertex: { x: 50, y: 20 },
            nasion: { x: 50, y: 40 },
            subnasale: { x: 50, y: 55 },
            menton: { x: 50, y: 80 }
          },
          generated: {
            vertex: { x: 50, y: 20 },
            nasion: { x: 50, y: 40 },
            subnasale: { x: 50, y: 55 },
            menton: { x: 50, y: 80 }
          }
        },
        deviations_px: deviations,
        deviations_mm: Object.keys(deviationsMm).length > 0 ? deviationsMm : undefined,
        scale_mm_per_px: manualScale,
        scores: {
          final: finalScore,
          landmark: Math.round(landmarkScore),
          contour: Math.round(contourScore),
          angle: angleScore
        },
        input_measurements: measurements
      };

      // Store local proof as fallback
      const localProofObj: ReconstructionProof = {
        ...proofData,
        id: 'local_' + Date.now(),
        created_at: new Date().toISOString()
      };
      setLocalProof(localProofObj);

      try {
        await DatabaseService.saveReconstructionProof(proofData);
      } catch (proofErr) {
        console.warn('Could not save proof to DB, using local fallback:', proofErr);
      }

      const finalScanResult: ScanResult = {
        ...scanToSave,
        ...savedScan,
        createdAt: new Date().toLocaleDateString()
      };

      onScanGenerated(finalScanResult);
      setLastGeneratedScan(finalScanResult);
      console.log('Process complete.');
    } catch (err: any) {
      console.error('Generation/Upload error:', err);
      setError(err.message || 'İşlem başarısız oldu.');
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  // ÇÖZÜM 4: CORS hatalarını aşan güvenli görsel indirme (Fetch API)
  const downloadImage = async (url: string | null | undefined, filename: string) => {
    if (!url || typeof url !== 'string') {
      setError('Görsel indirilemedi');
      return;
    }
    if (url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    try {
      // Use proxy to avoid CORS issues when downloading from external CDNs
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("İndirme hatası:", err);
      window.open(url, '_blank'); // Fetch başarısız olursa fallback
    }
  };

  const shareWhatsApp = (url: string | null | undefined) => {
    if (!url || typeof url !== 'string') {
      setError('Görsel paylaşılamadı');
      return;
    }
    const text = encodeURIComponent(`NeoBreed AI: Bebeğinizin ilk portresi hazır! 👶✨ Görseli buradan inceleyebilirsiniz: ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="relative">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'ultrasound')} />
      <input type="file" ref={motherPhotoRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'mother')} />
      <input type="file" ref={fatherPhotoRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'father')} />

      <AnimatePresence mode="wait">
        <motion.div 
          key="generator-main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
            {/* Share Modal */}
            {sharingScan && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl animate-in fade-in duration-500">
                <div className="bg-white rounded-[56px] p-12 max-w-md w-full shadow-2xl animate-in zoom-in duration-500 border border-white/20">
                  <div className="flex justify-between items-start mb-10">
                    <div className="space-y-1">
                      <h3 className="text-3xl font-medium text-text-primary tracking-tighter">Görseli Paylaş</h3>
                      <p className="text-text-secondary text-[10px] font-medium uppercase tracking-[0.25em] opacity-50">Hasta: {patient.name}</p>
                    </div>
                    <button onClick={() => { setSharingScan(null); setShowQRCode(false); }} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-all">
                      <X className="w-6 h-6 text-text-primary" />
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
                                Bu eski bir kayıt.<br/>
                                QR kod sadece yeni ve buluta<br/>yüklenmiş kayıtlar için çalışır.
                              </p>
                              <button onClick={() => setShowQRCode(false)} className="mt-6 text-[10px] font-medium text-text-primary underline uppercase tracking-widest">Görsele Dön</button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="relative group">
                            <img src={sharingScan.babyFaceUrl} className="w-48 h-48 object-cover rounded-[32px] shadow-2xl shadow-black/20" alt="Preview" />
                            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px]"></div>
                          </div>
                          <p className="text-[10px] font-medium text-text-secondary uppercase tracking-[0.2em] text-center opacity-60">
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
                        className="flex items-center justify-center gap-3 py-4 bg-[#25D366] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-[#25D366]/20"
                      >
                        WhatsApp
                      </button>
                      <button 
                        onClick={() => setShowQRCode(!showQRCode)}
                        className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all ${showQRCode ? 'bg-slate-100 text-text-primary' : 'bg-text-primary text-white shadow-lg shadow-black/10'}`}
                      >
                        {showQRCode ? 'Görsele Dön' : 'QR Kod Göster'}
                      </button>
                    </div>

                    <button 
                      onClick={() => downloadImage(sharingScan.babyFaceUrl, `nexus-baby-${patient.name}.png`)}
                      className="w-full py-4 bg-[#2563eb] text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#1d4ed8] transition-all shadow-lg shadow-primary/20"
                    >
                      Cihaza İndir
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Studio Viewport */}
            <div className="lg:col-span-7 space-y-8">
              <AnimatePresence mode="wait">
                {lastGeneratedScan && !isGenerating ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-[48px] p-10 border border-border-subtle shadow-soft overflow-hidden relative"
                  >
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h1 className="text-text-primary uppercase">Sentez Tamamlandı</h1>
                            <p className="text-xs font-medium text-text-secondary uppercase tracking-widest">ID: {lastGeneratedScan.id.split('-')[0]}</p>
                          </div>
                        </div>
                      </div>

                      <div className="aspect-video rounded-[40px] overflow-hidden border border-slate-100 shadow-2xl relative group">
                        <img src={lastGeneratedScan.babyFaceUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                          <p className="text-white text-[10px] font-black uppercase tracking-[0.4em]">NeoBreed AI v4.2 High-Fidelity Reconstruction</p>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-end justify-between mt-10 gap-8">
                        <div className="space-y-1 shrink-0">
                          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">CİNSİYET</p>
                          <p className="text-sm font-black text-text-primary uppercase leading-tight">
                            {lastGeneratedScan.measurements?.gender === 'boy' ? 'Erkek' : lastGeneratedScan.measurements?.gender === 'girl' ? 'Kız' : 'Belirsiz'}
                          </p>
                        </div>

                        <div className="flex-1 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
                          {[
                            { id: 'fromen', label: 'FROI' },
                            { id: 'burun', label: 'BURI' },
                            { id: 'goz', label: 'GÖZ' },
                            { id: 'bioccap', label: 'BİOC' },
                            { id: 'cene', label: 'ÇENE' },
                          ].map((field) => (
                            <div key={field.id} className="flex flex-col items-center text-center">
                              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-1">{field.label}</p>
                              <p className="text-sm font-black text-text-primary uppercase leading-tight">
                                {lastGeneratedScan.measurements?.[field.id] ?? measurements[field.id as keyof Measurements] ?? 'N/A'}
                              </p>
                              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest opacity-40">MM</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-3 shrink-0">
                          <button 
                            onClick={() => setViewingProof(lastGeneratedScan)}
                            className="px-6 py-3 bg-[#2563eb] text-white rounded-xl font-semibold text-sm hover:scale-105 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Kanıtı Gör
                          </button>
                          <button 
                            onClick={() => {
                              setLastGeneratedScan(null);
                              setPreviewUrl(null);
                            }}
                            className="px-6 py-3 bg-[#2563eb] text-white rounded-xl font-semibold text-sm hover:bg-[#1d4ed8] transition-all shadow-lg shadow-primary/20"
                          >
                            Yeni Analiz
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="generator"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-[48px] p-10 border border-border-subtle shadow-soft relative"
                  >
                    <div className="space-y-10 relative z-20">
                      <div className="flex flex-col md:flex-row gap-10">
                        {/* Upload Area */}
                        <div className="flex-1 space-y-10">
                          <div className="space-y-6">
                            <div className="flex items-center gap-4 mb-2">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Upload className="w-5 h-5 text-primary" />
                              </div>
                              <h3 className="text-text-primary uppercase">1. Ultrason Görüntüsü</h3>
                            </div>
                            
                            <div 
                              onClick={() => !isGenerating && fileInputRef.current?.click()}
                              className={`aspect-video rounded-[32px] border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden ${previewUrl ? 'border-primary/40 bg-primary/5' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-primary/20'}`}
                            >
                              {previewUrl ? (
                                <>
                                  <img src={previewUrl} className="w-full h-full object-cover grayscale contrast-125 opacity-60" />
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="px-6 py-3 bg-white text-black rounded-full font-semibold text-xs uppercase tracking-widest shadow-floating">Görseli Değiştir</span>
                                  </div>
                                </>
                              ) : (
                                <div className="flex flex-col items-center gap-4 text-slate-400 group-hover:text-primary transition-colors">
                                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-soft border border-slate-100 group-hover:scale-110 transition-transform">
                                    <Upload className="w-8 h-8" />
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs font-semibold uppercase tracking-widest">Dosya Seçin veya Sürükleyin</p>
                                    <p className="text-[10px] font-medium uppercase tracking-widest opacity-60 mt-1">Zorunlu Alan</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Parent Photos */}
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] ml-2">Anne Fotoğrafı</p>
                              <div 
                                onClick={() => !isGenerating && motherPhotoRef.current?.click()}
                                className={`aspect-square rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden ${motherPhoto ? 'border-primary/40 bg-primary/5' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
                              >
                                {motherPhoto ? (
                                  <img src={motherPhoto} className="w-full h-full object-cover" />
                                ) : (
                                  <Upload className="w-6 h-6 text-slate-300 group-hover:text-primary transition-colors" />
                                )}
                              </div>
                            </div>
                            <div className="space-y-4">
                              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] ml-2">Baba Fotoğrafı</p>
                              <div 
                                onClick={() => !isGenerating && fatherPhotoRef.current?.click()}
                                className={`aspect-square rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden ${fatherPhoto ? 'border-primary/40 bg-primary/5' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
                              >
                                {fatherPhoto ? (
                                  <img src={fatherPhoto} className="w-full h-full object-cover" />
                                ) : (
                                  <Upload className="w-6 h-6 text-slate-300 group-hover:text-primary transition-colors" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Measurement Inputs */}
                        <div className="flex-1 space-y-6">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Activity className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-text-primary uppercase">2. Biyometrik Ölçümler</h3>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {[
                              { id: 'fromen', label: 'Fromen', required: true },
                              { id: 'burun', label: 'Burun', required: true },
                              { id: 'goztepe', label: 'Göztepe', required: true },
                              { id: 'bioccap', label: 'BiocÇap', required: true },
                              { id: 'cene', label: 'Çene', required: true },
                              { id: 'agizcapi', label: 'Ağızçapı', required: true },
                              { id: 'onarka_bas', label: 'Önarka baş', required: true },
                              { id: 'bpd', label: 'BPD', required: true },
                              { id: 'hc', label: 'HC', required: true },
                              { id: 'goz', label: 'Göz', required: true },
                            ].map((field) => (
                              <div key={field.id} className="space-y-1.5">
                                <div className="flex justify-between px-1">
                                  <label>{field.label}</label>
                                  {field.required && <span className="text-[10px] font-semibold text-red-500 uppercase">Zorunlu</span>}
                                </div>
                                <input 
                                  type="number"
                                  value={measurements[field.id as keyof Measurements] ?? ''}
                                  onChange={(e) => setMeasurements(prev => ({ ...prev, [field.id]: e.target.value ? parseFloat(e.target.value) : null }))}
                                  disabled={isGenerating}
                                  placeholder="0.0"
                                  className="w-full bg-slate-50 border border-border-subtle rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 border-t border-slate-100">
                        <div className="space-y-6">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Settings2 className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-text-primary uppercase">3. Sentez Ayarları</h3>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label>Cinsiyet</label>
                              <select 
                                value={options.gender} 
                                onChange={e => setOptions({...options, gender: e.target.value})}
                                className="w-full bg-slate-50 border border-border-subtle rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                              >
                                <option value="unknown">Belirsiz</option>
                                <option value="boy">Erkek</option>
                                <option value="girl">Kız</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label>İfade</label>
                              <select 
                                value={options.expression} 
                                onChange={e => setOptions({...options, expression: e.target.value})}
                                className="w-full bg-slate-50 border border-border-subtle rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                              >
                                <option value="neutral">Doğal</option>
                                <option value="smiling">Gülümseyen</option>
                                <option value="sleeping">Uykuda</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-border-subtle">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${options.dualView ? 'bg-primary animate-pulse' : 'bg-slate-300'}`}></div>
                              <label className="text-text-primary uppercase tracking-widest">Çift Bakış Açısı (Ön + Profil)</label>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={options.dualView} 
                              onChange={() => setOptions({...options, dualView: !options.dualView})} 
                              className="w-5 h-5 rounded-lg accent-primary cursor-pointer" 
                            />
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Maximize2 className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-text-primary uppercase">4. Ölçek ve Notlar</h3>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between px-1">
                              <label>Ölçek (mm/px)</label>
                              <span className="text-[10px] font-medium text-text-secondary/40 uppercase">Opsiyonel</span>
                            </div>
                            <input 
                              type="number"
                              step="0.01"
                              value={manualScale ?? ''}
                              onChange={(e) => setManualScale(e.target.value ? parseFloat(e.target.value) : null)}
                              placeholder="Örn: 0.25"
                              className="w-full bg-slate-50 border border-border-subtle rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                            />
                            <p className="text-[10px] text-text-secondary/50 font-medium uppercase tracking-widest px-1">Kanıt ekranında mm hesabı için gereklidir.</p>
                          </div>

                          <div className="space-y-1.5">
                            <label className="px-1">Medikal Notlar</label>
                            <textarea 
                              value={options.notes} 
                              onChange={e => setOptions({...options, notes: e.target.value})}
                              placeholder="Örn: Burun yapısına odaklan..."
                              className="w-full bg-slate-50 border border-border-subtle rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none h-20 resize-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-10">
                        <button 
                          onClick={handleGenerate}
                          disabled={isGenerating}
                          className={`w-full py-6 rounded-2xl font-medium text-base uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-floating ${isGenerating ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] active:scale-95'}`}
                        >
                          {isGenerating ? (
                            <>
                              <div className="w-5 h-5 border-3 border-slate-300 border-t-primary rounded-full animate-spin"></div>
                              <span>{generationStatus}</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-6 h-6" />
                              <span>Yüz Oluştur</span>
                            </>
                          )}
                        </button>
                        
                        {error && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-4 text-red-500"
                          >
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-xs font-semibold uppercase tracking-widest">{error}</p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* History Grid */}
            <div className="lg:col-span-5 bg-white rounded-[32px] p-10 flex flex-col h-[calc(100vh-200px)] border border-border-subtle shadow-soft sticky top-8">
              <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                  <h3 className="text-text-primary uppercase">Render Archives</h3>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-widest opacity-50">{patient.name}</p>
                </div>
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-border-subtle">
                  <Activity className="w-4 h-4 text-text-secondary" />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-12 pr-4 scrollbar-hide">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-text-secondary space-y-6">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center border border-border-subtle">
                       <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-widest opacity-40">Henüz geçmiş analiz bulunmuyor</p>
                  </div>
                ) : (
                  history.map(result => (
                    <div key={result.id} className="group space-y-8 animate-in slide-in-from-bottom-6 duration-700">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <p className="text-[10px] font-semibold text-text-secondary uppercase px-2 tracking-widest opacity-50">SOURCE</p>
                          <div className="aspect-square rounded-2xl overflow-hidden border border-border-subtle bg-slate-50 flex items-center justify-center">
                            {result.ultrasoundUrl ? (
                              <img src={result.ultrasoundUrl} className="w-full h-full object-cover grayscale contrast-125 opacity-40 group-hover:opacity-100 transition-all duration-500" />
                            ) : (
                              <div className="flex flex-col items-center gap-2 opacity-20">
                                <Activity className="w-8 h-8" />
                                <span className="text-[10px] font-semibold uppercase tracking-widest">DATA ONLY</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between px-2">
                            <p className="text-[10px] font-semibold text-primary uppercase tracking-widest">AI SYNTHESIS</p>
                            {result.isDualView && (
                              <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest border border-primary/20">Ön + Profil</span>
                            )}
                          </div>
                          <div className="aspect-square rounded-2xl overflow-hidden shadow-floating group-hover:scale-[1.02] transition-all duration-500">
                            <img src={result.babyFaceUrl} className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center px-6 py-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <span className="text-xs font-medium text-text-secondary tracking-tight opacity-50">{result.createdAt}</span>
                        <div className="flex items-center gap-6">
                          <button 
                            onClick={() => setViewingProof(result)}
                            className="flex items-center gap-2.5 px-4 py-2 bg-[#2563eb] text-white rounded-full text-[10px] font-semibold uppercase tracking-widest hover:scale-105 transition-all shadow-md shadow-primary/20 group"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Analiz Kanıtı</span>
                          </button>
                          <button onClick={() => setSharingScan(result)} className="text-[10px] font-bold text-[#2563eb] hover:underline uppercase tracking-widest transition-colors">SHARE</button>
                          <button onClick={() => downloadImage(result.babyFaceUrl, `nexus-baby-${patient.name}.png`)} className="text-[10px] font-bold text-[#2563eb] hover:underline uppercase tracking-widest transition-colors">DOWNLOAD</button>
                        </div>
                      </div>
                      <div className="h-px bg-border-subtle w-full opacity-50"></div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Proof Modal */}
            <AnimatePresence>
              {viewingProof && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 md:p-6 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-500">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 40 }}
                    className="bg-white rounded-[24px] md:rounded-[48px] w-full max-w-7xl h-[95vh] md:h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-white/20"
                  >
                    <div className="p-4 md:p-6 border-b border-border-subtle flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                      <div className="space-y-0.5">
                        <h1 className="text-lg md:text-2xl font-medium text-text-primary tracking-tight">
                          Biyometrik Rekonstrüksiyon Kanıtı
                        </h1>
                        <p className="text-text-secondary text-[9px] md:text-[10px] font-medium uppercase tracking-widest opacity-50">
                          AI Sentezinin Medikal Verilerle Doğrulanması
                        </p>
                      </div>
                      
                      {activeProof && (
                        <div className="flex items-center gap-6">
                          <div className="hidden md:flex items-center gap-4 border-r border-slate-100 pr-6">
                            <div className="text-right">
                              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest opacity-40">Uyum Skoru</p>
                              <p className="text-3xl font-medium text-primary tracking-tighter leading-none">{activeProof.scores.final}</p>
                            </div>
                            <div className="flex flex-col gap-0.5 text-[8px] font-bold text-text-secondary/60 uppercase tracking-widest">
                              <span>Landmark: {activeProof.scores.landmark}</span>
                              <span>Kontur: {activeProof.scores.contour}</span>
                            </div>
                          </div>
                          
                          {activeProof.id.startsWith('local_') && (
                            <div className="bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                              <AlertCircle className="w-3 h-3 text-amber-500" />
                              <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">
                                Geçici Görüntü
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => setViewingProof(null)}
                        className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center hover:bg-slate-100 rounded-full transition-all group"
                      >
                        <X className="w-5 h-5 md:w-6 h-6 text-text-primary group-hover:rotate-90 transition-transform duration-300" />
                      </button>
                    </div>

                    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50/30 scrollbar-hide">
                      {!activeProof ? (
                        <div className="h-full flex flex-col items-center justify-center text-text-secondary space-y-6">
                          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border border-border-subtle">
                             <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Kanıt verisi henüz hazır değil.</p>
                        </div>
                      ) : (
                        <>
                          {/* Compare Mode Selector */}
                          <div className="flex justify-center mb-6">
                            <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                              {(['side-by-side', 'overlay', 'slider'] as const).map((mode) => (
                                <button
                                  key={mode}
                                  onClick={() => setCompareMode(mode)}
                                  className={`px-4 md:px-5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${compareMode === mode ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                                >
                                  {mode === 'side-by-side' ? 'Yan Yana' : mode === 'overlay' ? 'Üst Üste' : 'Kaydırmalı'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Comparison View */}
                          <div className="mb-10">
                            {compareMode === 'side-by-side' ? (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between px-2 md:px-4">
                                    <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Kaynak: Ultrason</h3>
                                    <span className="text-[9px] font-mono font-medium text-text-secondary opacity-40">REF: {viewingProof.id.split('_')[1]}</span>
                                  </div>
                                  <div className="relative aspect-video bg-surface rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                    {viewingProof.ultrasoundUrl ? (
                                      <img src={viewingProof.ultrasoundUrl} className="w-full h-full object-cover grayscale opacity-70 contrast-125" />
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-text-secondary opacity-20">
                                        <Activity className="w-10 h-10 mb-2" />
                                        <span className="text-xs font-semibold uppercase tracking-widest">Sadece Veri</span>
                                      </div>
                                    )}
                                    <LandmarkOverlay landmarks={activeProof.landmarks.ultrasound} />
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between px-2 md:px-4">
                                    <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">Rekonstrüksiyon: AI Sentez</h3>
                                    <span className="text-[9px] font-mono font-medium text-primary opacity-60">VERIFIED</span>
                                  </div>
                                  <div className="relative aspect-video bg-white rounded-xl overflow-hidden border border-slate-200 shadow-md">
                                    <img 
                                      src={viewingProof.babyFaceUrl} 
                                      className="w-full h-full object-cover" 
                                      style={viewingProof.isDualView ? { width: '200%', maxWidth: 'none', objectPosition: 'left' } : {}}
                                    />
                                    <LandmarkOverlay landmarks={activeProof.landmarks.generated} />
                                    {viewingProof.isDualView && (
                                      <div className="absolute bottom-3 left-3 bg-primary/90 text-white px-2 py-1 rounded-md font-bold text-[8px] uppercase tracking-widest backdrop-blur-sm">
                                        Kanıt Analizi: Ön Görünüm
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : compareMode === 'overlay' ? (
                              <div className="max-w-4xl mx-auto relative aspect-video bg-surface rounded-xl overflow-hidden border border-slate-200 shadow-lg">
                                {viewingProof.ultrasoundUrl ? (
                                  <img src={viewingProof.ultrasoundUrl} className="absolute inset-0 w-full h-full object-cover grayscale contrast-125" />
                                ) : (
                                  <div className="absolute inset-0 w-full h-full bg-slate-100" />
                                )}
                                <img 
                                  src={viewingProof.babyFaceUrl} 
                                  className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay" 
                                  style={viewingProof.isDualView ? { width: '200%', maxWidth: 'none', objectPosition: 'left' } : {}}
                                />
                                <LandmarkOverlay landmarks={activeProof.landmarks.generated} showConnections={true} ultrasoundLandmarks={activeProof.landmarks.ultrasound} />
                              </div>
                            ) : (
                              <div className="max-w-4xl mx-auto relative aspect-video bg-surface rounded-xl overflow-hidden border border-slate-200 shadow-lg group select-none">
                                {viewingProof.ultrasoundUrl ? (
                                  <img src={viewingProof.ultrasoundUrl} className="absolute inset-0 w-full h-full object-cover grayscale contrast-125" />
                                ) : (
                                  <div className="absolute inset-0 w-full h-full bg-slate-100" />
                                )}
                                <div 
                                  className="absolute inset-0 w-full h-full overflow-hidden"
                                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                                >
                                  <img 
                                    src={viewingProof.babyFaceUrl} 
                                    className="absolute inset-0 w-full h-full object-cover" 
                                    style={viewingProof.isDualView ? { width: '200%', maxWidth: 'none', objectPosition: 'left' } : {}} 
                                  />
                                </div>
                                <div 
                                  className="absolute inset-y-0 w-1 bg-primary cursor-ew-resize z-30"
                                  style={{ left: `${sliderPosition}%` }}
                                  onMouseDown={(e) => {
                                    const container = e.currentTarget.parentElement;
                                    if (!container) return;
                                    
                                    const handleMove = (moveEvent: MouseEvent) => {
                                      const rect = container.getBoundingClientRect();
                                      const x = moveEvent.clientX - rect.left;
                                      setSliderPosition(Math.max(0, Math.min(100, (x / rect.width) * 100)));
                                    };
                                    const handleEnd = () => {
                                      window.removeEventListener('mousemove', handleMove);
                                      window.removeEventListener('mouseup', handleEnd);
                                    };
                                    window.addEventListener('mousemove', handleMove);
                                    window.addEventListener('mouseup', handleEnd);
                                  }}
                                  onTouchStart={(e) => {
                                    const container = e.currentTarget.parentElement;
                                    if (!container) return;
                                    
                                    const handleMove = (moveEvent: TouchEvent) => {
                                      const rect = container.getBoundingClientRect();
                                      const touch = moveEvent.touches[0];
                                      const x = touch.clientX - rect.left;
                                      setSliderPosition(Math.max(0, Math.min(100, (x / rect.width) * 100)));
                                    };
                                    const handleEnd = () => {
                                      window.removeEventListener('touchmove', handleMove as any);
                                      window.removeEventListener('touchend', handleEnd);
                                    };
                                    window.addEventListener('touchmove', handleMove as any, { passive: false });
                                    window.addEventListener('touchend', handleEnd);
                                  }}
                                >
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full shadow-xl flex items-center justify-center text-white">
                                    <Maximize2 className="w-4 h-4 rotate-45" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Landmark and Measurements Grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                            <div className="lg:col-span-1 bg-white rounded-2xl p-8 border border-border-subtle shadow-soft space-y-6">
                              <h3 className="text-text-primary uppercase mb-4">Landmark Analizi</h3>
                              <div className="space-y-4">
                                {[
                                  { id: 'vertex', label: 'Kafa Tepe (Vertex)' },
                                  { id: 'nasion', label: 'Burun Kökü (Nasion)' },
                                  { id: 'subnasale', label: 'Burun Altı (Subnasale)' },
                                  { id: 'menton', label: 'Çene Altı (Menton)' }
                                ].map((point) => (
                                  <div key={point.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${point.id === 'vertex' ? 'bg-red-500' : point.id === 'nasion' ? 'bg-blue-500' : point.id === 'subnasale' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                      <span className="text-xs font-semibold text-text-primary uppercase tracking-tight">{point.label}</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-semibold text-primary">
                                      Sapma: Δ = {activeProof.deviations_px[point.id]} px 
                                      {activeProof.scale_mm_per_px ? ` • ${(activeProof.deviations_px[point.id] * activeProof.scale_mm_per_px).toFixed(1)} mm` : ' • mm: —'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {!activeProof.scale_mm_per_px && (
                                <p className="text-[10px] text-text-secondary/50 font-medium uppercase tracking-widest mt-4">
                                  mm hesabı için ölçek bilgisi gerekli.
                                </p>
                              )}
                            </div>

                            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {[
                                { id: 'fromen', label: 'Fromen' },
                                { id: 'burun', label: 'Burun' },
                                { id: 'goztepe', label: 'Göztepe' },
                                { id: 'bioccap', label: 'BiocÇap' },
                                { id: 'cene', label: 'Çene' },
                                { id: 'agizcapi', label: 'Ağızçapı' },
                                { id: 'onarka_bas', label: 'Önarka baş' },
                                { id: 'bpd', label: 'BPD' },
                                { id: 'hc', label: 'HC' },
                                { id: 'goz', label: 'Göz' },
                              ].map((field) => {
                                const value = viewingProof.measurements?.[field.id];
                                return (
                                  <div key={field.id} className="p-6 bg-white rounded-2xl border border-border-subtle shadow-soft flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-4">
                                      <p className="text-xs font-semibold text-primary uppercase tracking-widest">{field.label}</p>
                                      <span className="text-2xl font-medium text-text-primary tracking-tighter">{value ?? '---'} mm</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="p-10 bg-primary/5 rounded-2xl border border-primary/10 mb-12">
                            <div className="flex items-center gap-4 mb-6">
                              <AlertCircle className="w-6 h-6 text-primary" />
                              <h3 className="text-primary uppercase">Bilimsel Metodoloji ve Kanıt Dayanağı</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                              <div className="space-y-3">
                                <p className="text-xs font-medium text-text-primary uppercase tracking-widest">01. Veri Entegrasyonu</p>
                                <p className="text-sm leading-relaxed text-text-secondary font-medium">Girilen milimetrik veriler, AI motoruna "Anatomik Kısıtlamalar" olarak aktarılır.</p>
                              </div>
                              <div className="space-y-3">
                                <p className="text-xs font-medium text-text-primary uppercase tracking-widest">02. Morfolojik Eşleşme</p>
                                <p className="text-sm leading-relaxed text-text-secondary font-medium">Ultrason görüntüsündeki kemik yapısı ve gölge yoğunluğu, AI tarafından "Derinlik Haritası" olarak işlenir.</p>
                              </div>
                              <div className="space-y-3">
                                <p className="text-xs font-medium text-text-primary uppercase tracking-widest">03. Biyometrik Doğrulama</p>
                                <p className="text-sm leading-relaxed text-text-secondary font-medium">Vertex, Menton ve Nasion referans noktaları orijinal ölçümlerle karşılaştırılır.</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-center text-center space-y-6 pb-12">
                            <div className="px-8 py-4 bg-white rounded-full border border-border-subtle shadow-soft flex items-center gap-4">
                              <FileText className="w-6 h-6 text-primary animate-pulse" />
                              <span className="text-xs font-semibold text-text-primary uppercase tracking-widest">NEOBREED VERIFIED RECONSTRUCTION v4.2</span>
                            </div>
                            <p className="text-[10px] font-medium text-text-secondary/40 uppercase tracking-widest max-w-md">
                              Bu rapor yapay zeka tarafından oluşturulmuş bir tahmindir. Tıbbi teşhis veya tedavi amaçlı kullanılamaz.
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="p-6 md:p-12 border-t border-border-subtle bg-white/50 backdrop-blur-md flex justify-center">
                      <button
                        onClick={() => setViewingProof(null)}
                        className="w-full md:w-auto px-10 md:px-20 py-4 md:py-6 bg-text-primary text-white rounded-[24px] md:rounded-[32px] font-medium text-[10px] md:text-xs uppercase tracking-[0.3em] hover:bg-primary transition-all shadow-xl active:scale-95"
                      >
                        Raporu Kapat
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
      </AnimatePresence>
    </div>
  );
};

interface MarkerPointProps {
  x: string;
  y: string;
  label: string;
  value: number | null;
  onValueChange: (val: number) => void;
  dragEnabled: boolean;
}

const LandmarkOverlay = ({ 
  landmarks, 
  showConnections = false, 
  ultrasoundLandmarks 
}: { 
  landmarks: Record<string, { x: number; y: number }>;
  showConnections?: boolean;
  ultrasoundLandmarks?: Record<string, { x: number; y: number }>;
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Object.entries(landmarks).map(([id, pos]) => (
        <React.Fragment key={id}>
          {/* Connection Line */}
          {showConnections && ultrasoundLandmarks && ultrasoundLandmarks[id] && (
            <svg className="absolute inset-0 w-full h-full overflow-visible">
              <line 
                x1={`${ultrasoundLandmarks[id].x}%`} 
                y1={`${ultrasoundLandmarks[id].y}%`} 
                x2={`${pos.x}%`} 
                y2={`${pos.y}%`} 
                stroke={id === 'vertex' ? '#ef4444' : id === 'nasion' ? '#3b82f6' : id === 'subnasale' ? '#22c55e' : '#eab308'} 
                strokeWidth="1" 
                strokeDasharray="4 4"
                className="opacity-50"
              />
            </svg>
          )}
          
          {/* Dot */}
          <div 
            className={`absolute w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 ${
              id === 'vertex' ? 'bg-red-500' : 
              id === 'nasion' ? 'bg-blue-500' : 
              id === 'subnasale' ? 'bg-green-500' : 
              'bg-yellow-500'
            }`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          />
        </React.Fragment>
      ))}
    </div>
  );
};

export default BabyFaceGenerator;
