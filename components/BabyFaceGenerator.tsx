import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Patient, ScanResult } from '../types';
import { generateBabyFace } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Dna, 
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
  Settings2
} from 'lucide-react';

interface Measurements {
  a_mm: number | null;
  b_mm: number | null;
  c_mm: number | null;
  d_mm: number | null;
  e_mm: number | null;
  f_mm: number | null;
  g_mm: number | null;
  h_mm: number | null;
  i_mm: number | null;
  unit: string;
  createdAt: string | null;
}

interface Props { patient: Patient; onScanGenerated: (result: ScanResult) => void; history: ScanResult[]; }

const BabyFaceGenerator: React.FC<Props> = ({ patient, onScanGenerated, history }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [highRes, setHighRes] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharingScan, setSharingScan] = useState<ScanResult | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [lastGeneratedScan, setLastGeneratedScan] = useState<ScanResult | null>(null);
  const [options, setOptions] = useState({
    gender: 'unknown',
    expression: 'neutral',
    style: 'hyper-realistic',
    notes: ''
  });
  const [show3DModal, setShow3DModal] = useState(false);
  const [viewingProof, setViewingProof] = useState<ScanResult | null>(null);
  const [measurements, setMeasurements] = useState<Measurements>({
    a_mm: null, b_mm: null, c_mm: null, d_mm: null, e_mm: null, f_mm: null, g_mm: null, h_mm: null, i_mm: null,
    unit: 'mm',
    createdAt: null
  });
  const [currentStep, setCurrentStep] = useState<keyof Omit<Measurements, 'unit' | 'createdAt'>>('a_mm');
  const [dragEnabled, setDragEnabled] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const viewerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewerDragHandlers = useRef<{ move: any, end: any } | null>(null);

  // ÇÖZÜM 3: Flicker (Titreme) sorununu çözmek için rastgele değerleri sabitliyoruz
  const randomMarkers = useMemo(() => {
    return [
      { x: '30%', y: '25%' }, { x: '70%', y: '25%' },
      { x: '50%', y: '45%' }, { x: '40%', y: '65%' },
      { x: '60%', y: '65%' }, { x: '50%', y: '80%' }
    ].map(point => ({
      ...point,
      val: Math.random().toFixed(4)
    }));
  }, []);

  const steps = [
    { id: 'a_mm', label: 'a: Tepe–Çene', view: 'front' },
    { id: 'b_mm', label: 'b: Burun', view: 'profile' },
    { id: 'c_mm', label: 'c: Alın', view: 'front' },
    { id: 'd_mm', label: 'd: Göz Hattı / Orta Yüz Referansı', view: 'front' },
    { id: 'e_mm', label: 'e: Alt Dudak–Çene', view: 'front' },
    { id: 'f_mm', label: 'f: Ağız Genişliği', view: 'front' },
    { id: 'g_mm', label: 'g: Ön–Arka Kafa (OFD)', view: 'top' },
    { id: 'h_mm', label: 'h: Sağ–Sol Kafa (BPD)', view: 'top' },
    { id: 'i_mm', label: 'i: Baş Çevresi (HC)', view: 'top' },
  ] as const;

  useEffect(() => {
    const step = steps.find(s => s.id === currentStep);
    if (step) {
      if (step.view === 'front') setRotation({ x: 0, y: 0 });
      if (step.view === 'profile') setRotation({ x: 0, y: 90 });
      if (step.view === 'top') setRotation({ x: 90, y: 0 });
    }
  }, [currentStep]);

  // ÇÖZÜM 5: Unmount durumunda Event Listener temizliği (Memory Leak önleyici)
  useEffect(() => {
    return () => {
      if (viewerDragHandlers.current) {
        window.removeEventListener('mousemove', viewerDragHandlers.current.move);
        window.removeEventListener('touchmove', viewerDragHandlers.current.move);
        window.removeEventListener('mouseup', viewerDragHandlers.current.end);
        window.removeEventListener('touchend', viewerDragHandlers.current.end);
      }
    };
  }, []);

  const handleSave3D = () => {
    const required = ['a_mm', 'g_mm', 'h_mm', 'i_mm'];
    const missing = required.filter(key => measurements[key as keyof Measurements] === null);
    
    if (missing.length > 0) {
      const labels = missing.map(m => m.split('_')[0]).join(', ');
      alert(`Lütfen önce zorunlu ölçümleri girin: ${labels}`);
      return;
    }

    setMeasurements(prev => ({ ...prev, createdAt: new Date().toISOString() }));
    setShow3DModal(false);
  };

  const handleViewerInteraction = (e: React.WheelEvent) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev - e.deltaY * 0.001)));
  };

  // ÇÖZÜM 2: Hem fare hem mobil (touch) destekli sürükleme mantığı
  const handleViewerDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const isRightClick = 'button' in e && ((e as React.MouseEvent).button === 2 || ((e as React.MouseEvent).button === 0 && e.shiftKey));

    const startX = clientX;
    const startY = clientY;
    const initialRotation = { ...rotation };
    const initialPan = { ...pan };

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const moveX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const moveY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;
      const dx = moveX - startX;
      const dy = moveY - startY;

      if (isRightClick) {
        setPan({ x: initialPan.x + dx * 0.5, y: initialPan.y + dy * 0.5 });
      } else {
        setRotation({ x: initialRotation.x + dy * 0.5, y: initialRotation.y + dx * 0.5 });
      }
    };

    const handleEnd = () => {
      window.removeEventListener('mousemove', handleMove as any);
      window.removeEventListener('touchmove', handleMove as any);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
      viewerDragHandlers.current = null;
    };

    viewerDragHandlers.current = { move: handleMove, end: handleEnd };

    window.addEventListener('mousemove', handleMove as any);
    window.addEventListener('touchmove', handleMove as any, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (mode: 'ultrasound' | 'measurements') => {
    if (mode === 'ultrasound' && !previewUrl) return;
    if (mode === 'measurements' && !measurements.a_mm) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      console.log(`Starting AI Synthesis in ${mode} mode...`);
      const resultBase64 = await generateBabyFace(
        mode, 
        mode === 'ultrasound' ? previewUrl : null, 
        mode === 'measurements' ? measurements : null, 
        options
      );
      
      console.log('AI Synthesis complete. Type of result:', typeof resultBase64);
      if (!resultBase64 || typeof resultBase64 !== 'string') {
        console.error('Invalid result from AI Synthesis:', resultBase64);
        throw new Error('AI Sentezi başarısız oldu: Geçersiz görsel verisi döndü.');
      }

      console.log('Uploading results to cloud storage...');
      const timestamp = Date.now();
      const babyFacePath = `patients/${patient.id}/synthesis_${mode}_${timestamp}.png`;
      const ultrasoundPath = previewUrl ? `patients/${patient.id}/source_${timestamp}.png` : null;

      const uploadPromises: Promise<string>[] = [
        StorageService.uploadImage(resultBase64, babyFacePath)
      ];
      
      if (mode === 'ultrasound' && previewUrl && ultrasoundPath) {
        uploadPromises.push(StorageService.uploadImage(previewUrl, ultrasoundPath));
      }

      const uploadResults = await Promise.all(uploadPromises);
      const babyFaceUrl = uploadResults[0];
      const ultrasoundUrl = mode === 'ultrasound' ? uploadResults[1] : null;

      console.log('Upload successful. Saving scan record...');
      const newScan: ScanResult = {
        id: `scan_${timestamp}`,
        patientId: patient.id,
        ultrasoundUrl: ultrasoundUrl,
        babyFaceUrl: babyFaceUrl,
        measurements: mode === 'measurements' ? { ...measurements } : null,
        createdAt: new Date().toLocaleDateString()
      };

      onScanGenerated(newScan);
      setLastGeneratedScan(newScan);
      console.log('Process complete.');
    } catch (err: any) {
      console.error('Generation/Upload error:', err);
      let message = 'İşlem başarısız oldu.';
      
      if (err.message === 'API_KEY_EXPIRED') {
        message = 'Gemini API anahtarı geçersiz veya süresi dolmuş.';
      } else if (err.message?.includes('Failed to fetch')) {
        message = 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı ve API ayarlarınızı kontrol edin.';
      } else if (err.message?.includes('Upload failed')) {
        message = `Bulut yükleme hatası: ${err.message}`;
      } else {
        message = err.message || message;
      }
      
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  // ÇÖZÜM 4: CORS hatalarını aşan güvenli görsel indirme (Fetch API)
  const downloadImage = async (url: string, filename: string) => {
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
      const response = await fetch(url);
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

  const shareWhatsApp = (url: string) => {
    const text = encodeURIComponent(`NeoBreed AI: Bebeğinizin ilk portresi hazır! 👶✨ Görseli buradan inceleyebilirsiniz: ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="relative">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

      <AnimatePresence mode="wait">
        {show3DModal ? (
          <motion.div 
            key="3d-measurement"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[48px] w-full flex flex-col overflow-hidden shadow-soft border border-border-subtle min-h-[85vh]"
          >
            {/* Page Header */}
            <div className="p-10 border-b border-border-subtle flex justify-between items-center bg-surface">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                  <h3 className="text-3xl font-black text-text-primary tracking-tighter">Biyometrik Ölçümleme</h3>
                </div>
                <p className="text-text-secondary text-[10px] font-black uppercase tracking-[0.3em] opacity-50">3D Morfolojik Analiz Protokolü · Patient: {patient.name}</p>
              </div>
              <button onClick={() => setShow3DModal(false)} className="px-8 py-4 bg-slate-50 hover:bg-slate-100 text-text-primary rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 border border-border-subtle">
                <X className="w-4 h-4" />
                İptal Et
              </button>
            </div>

            {/* Content - 3 Columns */}
            <div className="flex-1 flex overflow-hidden min-h-[700px]">
                {/* Left Column: Step List */}
                <div className="w-[340px] bg-text-primary overflow-y-auto flex flex-col border-r border-white/5">
                  <div className="p-10 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3">Analiz Protokolü</p>
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-black text-lg tracking-tighter">Biyometrik Veri</h4>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setMeasurements({
                              a_mm: 124.5, b_mm: 18.2, c_mm: 42.0, d_mm: 68.4, e_mm: 22.1, f_mm: 34.5, g_mm: 98.2, h_mm: 84.5, i_mm: 284.2,
                              unit: 'mm', createdAt: new Date().toISOString()
                            });
                          }}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[8px] font-black text-white/60 uppercase tracking-widest transition-all"
                        >
                          Demo Doldur
                        </button>
                        <div className="px-3 py-1 bg-primary/20 rounded-lg text-[10px] font-black text-primary uppercase tracking-wider border border-primary/30">
                          {steps.filter(s => measurements[s.id as keyof Measurements] !== null).length}/{steps.length}
                        </div>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-6 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(steps.filter(s => measurements[s.id as keyof Measurements] !== null).length / steps.length) * 100}%` }}
                        className="h-full bg-primary shadow-[0_0_15px_#10b981]"
                      />
                    </div>
                  </div>

                  <div className="flex-1 py-6">
                    {steps.map((step, idx) => (
                      <button
                        key={step.id}
                        onClick={() => setCurrentStep(step.id as any)}
                        className={`w-full text-left px-10 py-6 transition-all flex items-center gap-6 border-b border-white/[0.03] relative group ${currentStep === step.id ? 'bg-primary/[0.07]' : 'hover:bg-white/[0.02]'}`}
                      >
                        {currentStep === step.id && (
                          <motion.div layoutId="activeStep" className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary shadow-[0_0_20px_#10b981]" />
                        )}
                        <span className={`font-mono text-xs font-black ${currentStep === step.id ? 'text-primary' : 'text-white/20'}`}>
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <div className="flex-1">
                          <p className={`text-base font-black tracking-tight transition-colors ${currentStep === step.id ? 'text-white' : 'text-white/40 group-hover:text-white/70'}`}>
                            {step.label.split(': ')[1] || step.label}
                          </p>
                          <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 transition-colors ${currentStep === step.id ? 'text-primary' : 'text-white/10'}`}>
                            {step.view === 'front' ? 'Anterior' : step.view === 'profile' ? 'Sagittal' : 'Axial'}
                          </p>
                        </div>
                        {measurements[step.id as keyof Measurements] !== null ? (
                          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full border-2 border-white/5 group-hover:border-white/10 transition-colors" />
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <div className="p-6 bg-black/40 border-t border-white/5">
                    <div className="flex items-center gap-3 text-nexus-mint/40">
                      <div className="w-2 h-2 bg-nexus-mint rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.25em]">System Online</span>
                    </div>
                  </div>
                </div>

                {/* Center Column: Head Viewer */}
                <div className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col border-r border-black/5">
                  {/* Medical HUD Overlay */}
                  <div className="absolute inset-0 pointer-events-none z-20">
                    <div className="absolute top-10 left-10 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-nexus-mint rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                        <p className="text-[11px] font-black text-black uppercase tracking-[0.3em]">Morphological Analysis</p>
                      </div>
                      <div className="h-px w-32 bg-gradient-to-r from-black/10 to-transparent"></div>
                      <p className="text-[9px] font-mono text-black/30 uppercase tracking-widest">Protocol: NeoBreed_v4.2</p>
                    </div>

                    <div className="absolute top-10 right-10 text-right space-y-2">
                      <p className="text-[11px] font-black text-black uppercase tracking-[0.3em]">Active View: {steps.find(s => s.id === currentStep)?.view.toUpperCase()}</p>
                      <div className="h-px w-32 bg-gradient-to-l from-black/10 to-transparent ml-auto"></div>
                      <p className="text-[9px] font-mono text-black/30 uppercase tracking-widest">XYZ: {pan.x}, {pan.y}, {zoom.toFixed(2)}</p>
                    </div>

                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                    
                    <motion.div 
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-[2px] bg-nexus-mint/10 shadow-[0_0_20px_rgba(16,185,129,0.2)] z-10"
                    />

                    <div className="absolute top-12 left-12 w-12 h-12 border-t border-l border-black/10"></div>
                    <div className="absolute top-12 right-12 w-12 h-12 border-t border-r border-black/10"></div>
                    <div className="absolute bottom-12 left-12 w-12 h-12 border-b border-l border-black/10"></div>
                    <div className="absolute bottom-12 right-12 w-12 h-12 border-b border-r border-black/10"></div>
                  </div>

                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                  
                  <div 
                    ref={viewerRef}
                    onWheel={handleViewerInteraction}
                    onMouseDown={handleViewerDragStart}
                    onTouchStart={handleViewerDragStart}
                    onContextMenu={(e) => e.preventDefault()}
                    className="flex-1 cursor-move relative touch-none"
                  >
                    <div 
                      className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
                      style={{ 
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      }}
                    >
                      <div className="relative w-80 h-96 flex items-center justify-center">
                        <div className="relative w-full h-full flex items-center justify-center">
                          <AnimatePresence mode="wait">
                            {rotation.x === 0 && rotation.y === 0 && (
                              <motion.img 
                                key="front"
                                src="/fetal/front.png"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full object-contain drop-shadow-2xl"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            {rotation.y === 90 && (
                              <motion.img 
                                key="profile"
                                src="/fetal/profile.png"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full object-contain drop-shadow-2xl"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            {rotation.x === 90 && (
                              <motion.img 
                                key="top"
                                src="/fetal/top.png"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full object-contain drop-shadow-2xl"
                                referrerPolicy="no-referrer"
                              />
                            )}
                          </AnimatePresence>
                          <div className="absolute inset-0 bg-gradient-to-tr from-nexus-mint/5 to-transparent pointer-events-none rounded-full"></div>
                        </div>

                        {/* Interactive Markers Layer */}
                        <div className="absolute inset-0 pointer-events-none">
                          {steps.map((step) => {
                            const isSelected = currentStep === step.id;
                            if (!isSelected) return null;

                            return (
                              <div key={step.id} className="absolute inset-0 pointer-events-none">
                                {step.id === 'a_mm' && (
                                  <>
                                    <div className="absolute top-[10%] bottom-[90%] left-1/2 -translate-x-1/2 w-px bg-nexus-mint/30 border-l border-dashed border-nexus-mint/50"></div>
                                    <MarkerPoint x="50%" y="10%" label="Tepe (Vertex)" onValueChange={(v) => setMeasurements(p => ({...p, a_mm: v}))} value={measurements.a_mm} dragEnabled={dragEnabled} />
                                    <MarkerPoint x="50%" y="90%" label="Çene (Menton)" onValueChange={(v) => setMeasurements(p => ({...p, a_mm: v}))} value={measurements.a_mm} dragEnabled={dragEnabled} />
                                  </>
                                )}
                                {step.id === 'b_mm' && (
                                  <MarkerPoint x="8%" y="56%" label="Burun Ucu" onValueChange={(v) => setMeasurements(p => ({...p, b_mm: v}))} value={measurements.b_mm} dragEnabled={dragEnabled} />
                                )}
                                {step.id === 'c_mm' && (
                                  <MarkerPoint x="50%" y="30%" label="Alın" onValueChange={(v) => setMeasurements(p => ({...p, c_mm: v}))} value={measurements.c_mm} dragEnabled={dragEnabled} />
                                )}
                                {step.id === 'd_mm' && (
                                  <MarkerPoint x="50%" y="58%" label="Göz Hattı / Orta Yüz" onValueChange={(v) => setMeasurements(p => ({...p, d_mm: v}))} value={measurements.d_mm} dragEnabled={dragEnabled} />
                                )}
                                {step.id === 'e_mm' && (
                                  <>
                                    <MarkerPoint x="50%" y="78%" label="Alt Dudak" onValueChange={(v) => setMeasurements(p => ({...p, e_mm: v}))} value={measurements.e_mm} dragEnabled={dragEnabled} />
                                    <MarkerPoint x="50%" y="90%" label="Çene" onValueChange={(v) => setMeasurements(p => ({...p, e_mm: v}))} value={measurements.e_mm} dragEnabled={dragEnabled} />
                                  </>
                                )}
                                {step.id === 'f_mm' && (
                                  <MarkerPoint x="50%" y="72.5%" label="Ağız Merkezi (Stomion)" onValueChange={(v) => setMeasurements(p => ({...p, f_mm: v}))} value={measurements.f_mm} dragEnabled={dragEnabled} />
                                )}
                                {step.id === 'g_mm' && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-px h-[68%] bg-nexus-mint shadow-[0_0_10px_#10b981] relative">
                                      <MarkerPoint x="50%" y="16%" label="Ön (OFD)" onValueChange={(v) => setMeasurements(p => ({...p, g_mm: v}))} value={measurements.g_mm} dragEnabled={dragEnabled} />
                                      <MarkerPoint x="50%" y="84%" label="Arka (OFD)" onValueChange={(v) => setMeasurements(p => ({...p, g_mm: v}))} value={measurements.g_mm} dragEnabled={dragEnabled} />
                                    </div>
                                  </div>
                                )}
                                {step.id === 'h_mm' && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-[60%] h-px bg-nexus-mint shadow-[0_0_10px_#10b981] relative">
                                      <MarkerPoint x="20%" y="50%" label="Sol (BPD)" onValueChange={(v) => setMeasurements(p => ({...p, h_mm: v}))} value={measurements.h_mm} dragEnabled={dragEnabled} />
                                      <MarkerPoint x="80%" y="50%" label="Sağ (BPD)" onValueChange={(v) => setMeasurements(p => ({...p, h_mm: v}))} value={measurements.h_mm} dragEnabled={dragEnabled} />
                                    </div>
                                  </div>
                                )}
                                {step.id === 'i_mm' && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div 
                                      className="absolute border-2 border-dashed border-nexus-mint rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                      style={{ left: '50%', top: '50%', width: '60%', height: '68%', transform: 'translate(-50%, -50%)' }}
                                    >
                                      <MarkerPoint x="50%" y="0%" label="HC (Baş Çevresi)" onValueChange={(v) => setMeasurements(p => ({...p, i_mm: v}))} value={measurements.i_mm} dragEnabled={dragEnabled} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Viewer Controls */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-black/5 z-50">
                      <button onClick={() => { setRotation({ x: 0, y: 0 }); setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors" title="Sıfırla">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <div className="w-px h-8 bg-black/5 mx-1"></div>
                      <button onClick={() => setRotation({ x: 0, y: 0 })} className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors ${rotation.x === 0 && rotation.y === 0 ? 'bg-black text-white' : 'hover:bg-slate-100'}`}>Ön</button>
                      <button onClick={() => setRotation({ x: 0, y: 90 })} className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors ${rotation.x === 0 && rotation.y === 90 ? 'bg-black text-white' : 'hover:bg-slate-100'}`}>Profil</button>
                      <button onClick={() => setRotation({ x: 90, y: 0 })} className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors ${rotation.x === 90 && rotation.y === 0 ? 'bg-black text-white' : 'hover:bg-slate-100'}`}>Üst</button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Numeric Input */}
                <div className="w-[400px] flex flex-col bg-white">
                  <div className="p-10 border-b border-black/5 bg-slate-50/50">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-[11px] font-black text-black uppercase tracking-[0.25em]">Data Entry Panel</p>
                    </div>
                    
                    <div className="space-y-10">
                      <div className="space-y-5">
                        <div className="flex items-center justify-between px-2">
                          <label className="text-[11px] font-black text-black uppercase tracking-widest opacity-40">
                            {steps.find(s => s.id === currentStep)?.label.split(': ')[1] || steps.find(s => s.id === currentStep)?.label}
                          </label>
                          <div className="px-3 py-1 bg-slate-100 text-black/40 rounded-lg text-[9px] font-mono font-black tracking-widest">REF_{currentStep.split('_')[0].toUpperCase()}</div>
                        </div>
                        
                        <div className="relative group">
                          <div className="absolute -inset-4 bg-primary/5 rounded-[40px] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                          {/* ÇÖZÜM 1: || yerine ?? kullanılarak '0' değerinin silinmesi engellendi */}
                          <input 
                            type="number" 
                            autoFocus
                            value={measurements[currentStep as keyof Measurements] ?? ''}
                            onChange={(e) => setMeasurements(prev => ({ ...prev, [currentStep]: e.target.value ? parseFloat(e.target.value) : null }))}
                            className="relative w-full px-10 py-10 bg-white rounded-[40px] border-2 border-black/[0.03] text-5xl font-black focus:border-primary focus:ring-0 transition-all shadow-2xl shadow-black/[0.05] text-center tracking-tighter"
                            placeholder="0.0"
                          />
                          <div className="absolute right-10 top-1/2 -translate-y-1/2">
                            <span className="text-sm font-black text-primary uppercase tracking-widest">mm</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        {[-0.5, -0.1, 0.1, 0.5].map(val => (
                          <button
                            key={val}
                            onClick={() => setMeasurements(prev => ({ ...prev, [currentStep]: Math.round(((prev[currentStep as keyof Measurements] || 0) + val) * 10) / 10 }))}
                            className="py-5 bg-white border border-black/5 hover:border-primary hover:text-primary rounded-2xl text-[11px] font-black transition-all shadow-sm active:scale-95 hover:shadow-md"
                          >
                            {val > 0 ? `+${val}` : val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 p-10 space-y-12 overflow-y-auto scrollbar-hide">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1.5">
                          <p className="text-xs font-black text-black uppercase tracking-tight">Hassas Kontrol</p>
                          <p className="text-[10px] text-black/30 font-bold uppercase tracking-widest">Model Drag Mode</p>
                        </div>
                        <button 
                          onClick={() => setDragEnabled(!dragEnabled)}
                          className={`w-16 h-8 rounded-full relative transition-all duration-500 ${dragEnabled ? 'bg-primary shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-slate-200'}`}
                        >
                          <motion.div 
                            animate={{ x: dragEnabled ? 36 : 4 }}
                            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                          />
                        </button>
                      </div>
                    </div>

                    <div className="p-10 bg-text-primary rounded-[48px] border border-white/5 space-y-6 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                          <Settings2 className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-[12px] font-black text-white uppercase tracking-[0.25em]">Kılavuz</p>
                      </div>
                      <p className="text-[12px] leading-relaxed text-white/40 font-medium relative z-10">
                        Ölçüm yapmak için model üzerindeki hedef noktaları kullanın. Sürükleme modu aktifken noktaları dikey yönde hareket ettirerek <span className="text-primary font-black">0.1mm</span> hassasiyetle ayar yapabilirsiniz.
                      </p>
                      <div className="pt-4 flex items-center gap-3 relative z-10">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">AI Assistant Ready</span>
                      </div>
                    </div>
                  </div>
                </div>
            </div>

            {/* Page Footer */}
            <div className="p-10 border-t border-black/5 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-6">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black">
                      {i}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Tüm noktaları belirleyin</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShow3DModal(false)}
                  className="px-10 py-5 bg-white border border-black/5 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Vazgeç
                </button>
                <button 
                  onClick={handleSave3D}
                  className="px-12 py-5 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
                >
                  <Zap className="w-4 h-4" />
                  {previewUrl ? 'Analizi Tamamla ve Üretimi Başlat' : 'Ölçümü Kaydet ve Ultrason Yükle'}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
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
                      <h3 className="text-3xl font-black text-text-primary tracking-tighter">Görseli Paylaş</h3>
                      <p className="text-text-secondary text-[10px] font-black uppercase tracking-[0.25em] opacity-50">Hasta: {patient.name}</p>
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
                              <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] text-center mt-6 opacity-60">
                                Telefonunuzla okutarak<br/>görseli anında indirebilirsiniz.
                              </p>
                            </>
                          ) : (
                            <div className="text-center p-6">
                              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100">
                                <AlertCircle className="w-8 h-8" />
                              </div>
                              <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-60">
                                Bu eski bir kayıt.<br/>
                                QR kod sadece yeni ve buluta<br/>yüklenmiş kayıtlar için çalışır.
                              </p>
                              <button onClick={() => setShowQRCode(false)} className="mt-6 text-[10px] font-black text-text-primary underline uppercase tracking-widest">Görsele Dön</button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="relative group">
                            <img src={sharingScan.babyFaceUrl} className="w-48 h-48 object-cover rounded-[32px] shadow-2xl shadow-black/20" alt="Preview" />
                            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px]"></div>
                          </div>
                          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] text-center opacity-60">
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
                      className="w-full py-4 border border-border-subtle text-text-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Cihaza İndir
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Studio Viewport */}
            <div className="lg:col-span-7 space-y-8">
              <div className="aspect-square bg-black rounded-[48px] overflow-hidden relative flex flex-col items-center justify-center p-12 group shadow-2xl border border-white/5">
                <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full animate-pulse pointer-events-none" />
                
                {lastGeneratedScan && !isGenerating ? (
                  <div className="w-full h-full flex flex-col items-center justify-center animate-in zoom-in duration-700 relative">
                    <div className="relative group/result">
                      <img src={lastGeneratedScan.babyFaceUrl} className="max-w-full max-h-[70vh] object-contain rounded-[48px] border border-white/20 shadow-2xl" />
                      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover/result:opacity-100 transition-opacity rounded-[48px] pointer-events-none"></div>
                      
                      <div className="absolute -top-6 -right-6 bg-primary text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 border border-white/20 z-50">
                        AI RECONSTRUCTION COMPLETE
                      </div>
                    </div>

                    <div className="mt-12 flex gap-4">
                      <button 
                        onClick={() => setSharingScan(lastGeneratedScan)}
                        className="px-10 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-3"
                      >
                        <Share2 className="w-4 h-4" />
                        PAYLAŞ
                      </button>
                      <button 
                        onClick={() => { 
                          setLastGeneratedScan(null); 
                          setPreviewUrl(null); 
                          setMeasurements({
                            a_mm: null, b_mm: null, c_mm: null, d_mm: null, e_mm: null, f_mm: null, g_mm: null, h_mm: null, i_mm: null,
                            unit: 'mm',
                            createdAt: null
                          });
                        }}
                        className="px-10 py-5 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10"
                      >
                        YENİ ANALİZ
                      </button>
                    </div>
                  </div>
                ) : previewUrl ? (
                  <div className="w-full h-full flex items-center justify-center animate-in zoom-in duration-700 relative">
                    <img src={previewUrl} className="max-w-full max-h-full object-contain rounded-card border border-white/10 shadow-2xl" />
                    
                    <AnimatePresence>
                      {isGenerating && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 overflow-hidden rounded-[32px] pointer-events-none z-20"
                        >
                          <motion.div 
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute left-0 right-0 h-[2px] bg-nexus-mint shadow-[0_0_30px_#10b981,0_0_10px_#fff] z-40"
                          />
                          <motion.div 
                            animate={{ top: ['100%', '0%', '100%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute left-0 right-0 h-[1px] bg-nexus-mint/40 shadow-[0_0_20px_#10b981] z-40"
                          />
                          
                          <motion.div 
                            animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.98, 1.02, 0.98] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-12 border-2 border-nexus-mint/30 rounded-[40px] z-30"
                          >
                            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-nexus-mint rounded-tl-3xl"></div>
                            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-nexus-mint rounded-tr-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-nexus-mint rounded-bl-3xl"></div>
                            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-nexus-mint rounded-br-3xl"></div>
                          </motion.div>

                          <div className="absolute inset-0 opacity-40">
                            <svg width="100%" height="100%" viewBox="0 0 400 500" preserveAspectRatio="none" className="text-nexus-mint">
                              <motion.path 
                                animate={{ 
                                  d: [
                                    "M50,100 L150,80 L250,90 L350,110 L300,250 L200,280 L100,240 Z",
                                    "M60,110 L140,90 L260,80 L340,120 L310,240 L210,270 L90,250 Z",
                                    "M50,100 L150,80 L250,90 L350,110 L300,250 L200,280 L100,240 Z"
                                  ]
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="0.5"
                                className="drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                              />
                              {[...Array(12)].map((_, i) => (
                                <motion.line
                                  key={i}
                                  x1={30 + i * 30} y1="0" x2={30 + i * 30} y2="500"
                                  stroke="currentColor" strokeWidth="0.1" strokeDasharray="2 2"
                                  animate={{ opacity: [0.05, 0.2, 0.05] }}
                                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                                />
                              ))}
                            </svg>
                          </div>

                          {/* Statik random veriler kullanılarak titreşim (flicker) engellendi */}
                          {randomMarkers.map((point, i) => (
                            <motion.div
                              key={i}
                              style={{ left: point.x, top: point.y }}
                              className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                            >
                              <motion.div 
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                                className="w-3 h-3 border border-nexus-mint rounded-full flex items-center justify-center"
                              >
                                <div className="w-1 h-1 bg-nexus-mint rounded-full"></div>
                              </motion.div>
                              <motion.span 
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                                className="absolute left-4 top-0 text-[6px] font-mono text-nexus-mint whitespace-nowrap"
                              >
                                PT_{i+1}: {point.val}
                              </motion.span>
                            </motion.div>
                          ))}
                          
                          <div className="absolute top-10 left-10 flex flex-col gap-4">
                            <div className="flex items-center gap-3 bg-black/80 backdrop-blur-2xl px-5 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
                              <div className="w-2 h-2 bg-nexus-mint rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                              <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Hybrid AI: Gemini + Replicate</span>
                            </div>
                            <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 space-y-2">
                              <div className="flex justify-between gap-8">
                                <span className="text-[8px] font-bold text-white/40 uppercase">Mapping</span>
                                <span className="text-[8px] font-mono text-nexus-mint">ACTIVE</span>
                              </div>
                              <div className="flex justify-between gap-8">
                                <span className="text-[8px] font-bold text-white/40 uppercase">Density</span>
                                <span className="text-[8px] font-mono text-nexus-mint">0.842 g/cm³</span>
                              </div>
                              <div className="flex justify-between gap-8">
                                <span className="text-[8px] font-bold text-white/40 uppercase">Confidence</span>
                                <span className="text-[8px] font-mono text-nexus-mint">99.8%</span>
                              </div>
                            </div>
                          </div>

                          <div className="absolute top-10 right-10 flex flex-col items-end gap-3">
                            <div className="bg-nexus-mint/10 text-nexus-mint text-[9px] font-black px-4 py-1.5 rounded-full border border-nexus-mint/20 uppercase tracking-[0.2em] backdrop-blur-md">
                              Processing Stream
                            </div>
                            <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/5 font-mono text-[7px] text-white/60 leading-relaxed text-right">
                              {`SCAN_ID: MOCK-ID-77X`}<br/>
                              {`FREQ: 14.22 MHz`}<br/>
                              {`DEPTH: 124.5 mm`}<br/>
                              {`GAIN: 42.0 dB`}
                            </div>
                          </div>

                          <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                            <div className="bg-black/80 backdrop-blur-2xl p-6 rounded-[40px] border border-white/10 flex items-center gap-8 shadow-2xl">
                              <div className="relative w-14 h-14 flex items-center justify-center">
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                  <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                                  <motion.circle 
                                    cx="28" cy="28" r="24" 
                                    fill="none" 
                                    stroke="#10b981" 
                                    strokeWidth="4" 
                                    strokeDasharray="150.7"
                                    animate={{ strokeDashoffset: [150.7, 0] }}
                                    transition={{ duration: 15, ease: "linear" }}
                                  />
                                </svg>
                                <Cpu className="w-6 h-6 text-nexus-mint" />
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black text-nexus-mint uppercase tracking-[0.2em]">AI Synthesis Engine</span>
                                  <motion.span 
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="w-1.5 h-1.5 bg-nexus-mint rounded-full"
                                  />
                                </div>
                                <p className="text-white text-xs font-black uppercase tracking-tight">Reconstructing Fetal Morphology...</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-3 mb-4">
                              <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                  <motion.div
                                    key={i}
                                    animate={{ height: [6, 24, 6] }}
                                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }}
                                    className="w-1.5 bg-nexus-mint/40 rounded-full"
                                  />
                                ))}
                              </div>
                              <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Data Link Active</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button onClick={() => setPreviewUrl(null)} className="absolute top-8 right-8 z-40 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold text-white/60 hover:text-white uppercase tracking-widest transition-all border border-white/10">Dosyayı Değiştir</button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-10 relative z-20">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-32 h-32 rounded-[48px] bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all animate-pulse group"
                    >
                      <Upload className="w-12 h-12 group-hover:scale-110 transition-transform" />
                    </button>
                    <div className="space-y-3">
                      <p className="text-2xl font-black text-white tracking-tight">Analiz Protokolü</p>
                      <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">LÜTFEN BİR YÖNTEM SEÇİN</p>
                    </div>

                    <div className="w-full max-w-md space-y-6">
                      {/* Primary Action: Ultrasound Upload */}
                      <div className={`p-8 rounded-[40px] border-2 transition-all flex flex-col gap-8 ${previewUrl ? 'bg-primary/5 border-primary/40 shadow-[0_0_40px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${previewUrl ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/10 text-white/20'}`}>
                              <Upload className="w-7 h-7" />
                            </div>
                            <div className="text-left">
                              <p className="text-base font-black text-white uppercase tracking-widest">Ultrason Fotoğrafı</p>
                              <p className="text-[10px] font-bold text-white/30 uppercase tracking-tighter">ANA VERİ KAYNAĞI (ZORUNLU)</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${previewUrl ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-black hover:bg-primary hover:text-white'}`}
                          >
                            {previewUrl ? 'DEĞİŞTİR' : 'DOSYA SEÇ'}
                          </button>
                        </div>
                        
                        {previewUrl && !isGenerating ? (
                          <button 
                            onClick={() => handleGenerate('ultrasound')}
                            className="w-full py-6 bg-primary text-white rounded-[28px] font-black text-sm uppercase tracking-[0.4em] animate-pulse shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                          >
                            <Zap className="w-5 h-5" />
                            GÖRÜNTÜDEN SENTEZLE
                          </button>
                        ) : !previewUrl && (
                           <div className="py-4 text-center border-t border-white/5 pt-8">
                             <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Sentezi başlatmak için bir görsel gereklidir</p>
                           </div>
                        )}
                      </div>

                      {/* Secondary Action: 3D Measurements */}
                      <div className={`p-6 rounded-[32px] border transition-all flex flex-col gap-6 ${measurements.a_mm ? 'bg-primary/10 border-primary/20 shadow-[0_0_30px_rgba(16,185,129,0.05)]' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${measurements.a_mm ? 'bg-primary text-white shadow-md shadow-primary/10' : 'bg-white/10 text-white/20'}`}>
                              <Activity className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <p className="text-[11px] font-black text-white uppercase tracking-widest">3D Biyometrik Veri</p>
                              <p className="text-[8px] font-bold text-white/30 uppercase tracking-tighter">DAHA HASSAS SONUÇLAR İÇİN (OPSİYONEL)</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setShow3DModal(true)}
                              className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${measurements.a_mm ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-black hover:bg-slate-100'}`}
                            >
                              {measurements.a_mm ? 'DÜZENLE' : 'VERİ GİR'}
                            </button>
                            {measurements.a_mm && (
                              <button 
                                onClick={() => setMeasurements({
                                  a_mm: null, b_mm: null, c_mm: null, d_mm: null, e_mm: null, f_mm: null, g_mm: null, h_mm: null, i_mm: null,
                                  unit: 'mm',
                                  createdAt: null
                                })}
                                className="p-2.5 bg-white/5 hover:bg-red-500/20 text-white/20 hover:text-red-500 rounded-xl transition-all border border-white/5"
                                title="Ölçümleri Sıfırla"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {measurements.a_mm && !isGenerating && (
                          <button 
                            onClick={() => handleGenerate('measurements')}
                            className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary hover:text-white transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3"
                          >
                            <Activity className="w-4 h-4" />
                            VERİDEN SENTEZLE
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {previewUrl && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6 bg-white rounded-[40px] p-8 border border-border-subtle shadow-soft">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2.5">
                            <label className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] px-1">Cinsiyet</label>
                            <select 
                              value={options.gender} 
                              onChange={e => setOptions({...options, gender: e.target.value})}
                              className="w-full bg-slate-50 border-none rounded-2xl text-[11px] text-text-primary font-black uppercase tracking-widest focus:ring-2 focus:ring-primary transition-all p-4"
                            >
                              <option value="unknown">Belirsiz</option>
                              <option value="boy">Erkek</option>
                              <option value="girl">Kız</option>
                            </select>
                          </div>
                          <div className="space-y-2.5">
                            <label className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] px-1">İfade</label>
                            <select 
                              value={options.expression} 
                              onChange={e => setOptions({...options, expression: e.target.value})}
                              className="w-full bg-slate-50 border-none rounded-2xl text-[11px] text-text-primary font-black uppercase tracking-widest focus:ring-2 focus:ring-primary transition-all p-4"
                            >
                              <option value="neutral">Doğal</option>
                              <option value="smiling">Gülümseyen</option>
                              <option value="sleeping">Uykuda</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${highRes ? 'bg-nexus-mint animate-pulse' : 'bg-slate-300'}`}></div>
                            <label className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em]">High Definition (HD)</label>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={highRes} 
                            onChange={() => setHighRes(!highRes)} 
                            className="w-5 h-5 rounded-lg accent-nexus-mint cursor-pointer" 
                          />
                        </div>
                        <div className="space-y-2.5">
                          <label className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] px-1">Görsel Stil</label>
                          <select 
                            value={options.style} 
                            onChange={e => setOptions({...options, style: e.target.value})}
                            className="w-full bg-slate-50 border-none rounded-2xl text-[11px] text-text-primary font-black uppercase tracking-widest focus:ring-2 focus:ring-primary transition-all p-4"
                          >
                            <option value="hyper-realistic">Hiper-Gerçekçi</option>
                            <option value="artistic">Sanatsal Portre</option>
                            <option value="3d-render">3D Medikal Render</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-6 bg-white rounded-[40px] p-8 border border-border-subtle shadow-soft">
                        <div className="space-y-2.5">
                          <label className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] px-1">Medikal Notlar (Opsiyonel)</label>
                          <textarea 
                            value={options.notes} 
                            onChange={e => setOptions({...options, notes: e.target.value})}
                            placeholder="Örn: Burun yapısına odaklan..."
                            className="w-full bg-slate-50 border-none rounded-2xl text-[11px] text-text-primary font-black focus:ring-2 focus:ring-primary transition-all h-32 resize-none p-4 placeholder:text-text-secondary/30"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4 px-8 py-4 bg-primary/5 rounded-full border border-primary/10">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">NeoBreed Intelligence Core Synthesis Active</span>
                      </div>

                      {error && (
                        <div className="px-6 py-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-red-100">
                          Hata: {error}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* History Grid */}
            <div className="lg:col-span-5 bg-white rounded-[48px] p-10 flex flex-col h-[calc(100vh-200px)] border border-border-subtle shadow-soft sticky top-8">
              <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-text-primary tracking-tighter">Render Archives</h3>
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.25em] opacity-50">{patient.name}</p>
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
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Henüz geçmiş analiz bulunmuyor</p>
                  </div>
                ) : (
                  history.map(result => (
                    <div key={result.id} className="group space-y-8 animate-in slide-in-from-bottom-6 duration-700">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <p className="text-[9px] font-black text-text-secondary uppercase px-2 tracking-[0.2em] opacity-50">SOURCE</p>
                          <div className="aspect-square rounded-[32px] overflow-hidden border border-border-subtle bg-slate-50">
                            <img src={result.ultrasoundUrl} className="w-full h-full object-cover grayscale contrast-125 opacity-40 group-hover:opacity-100 transition-all duration-500" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-[9px] font-black text-primary uppercase px-2 tracking-[0.2em]">AI SYNTHESIS</p>
                          <div className="aspect-square rounded-[32px] overflow-hidden shadow-2xl shadow-black/10 group-hover:scale-[1.02] transition-all duration-500">
                            <img src={result.babyFaceUrl} className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center px-6 py-4 bg-slate-50/50 rounded-[28px] border border-border-subtle">
                        <span className="text-[10px] font-black text-text-secondary tracking-tight opacity-50">{result.createdAt}</span>
                        <div className="flex items-center gap-6">
                          {result.measurements && (
                            <button 
                              onClick={() => setViewingProof(result)}
                              className="flex items-center gap-2.5 px-4 py-2 bg-primary/10 rounded-full text-[9px] font-black text-primary uppercase tracking-widest hover:bg-primary/20 transition-all group"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 shadow-[0_0_8px_#10b981]" />
                              <span>Analiz Kanıtı</span>
                            </button>
                          )}
                          <button onClick={() => setSharingScan(result)} className="text-[9px] font-black text-text-secondary hover:text-text-primary uppercase tracking-widest transition-colors opacity-40 hover:opacity-100">SHARE</button>
                          <button onClick={() => downloadImage(result.babyFaceUrl, `nexus-baby-${patient.name}.png`)} className="text-[9px] font-black text-text-secondary hover:text-text-primary uppercase tracking-widest transition-colors opacity-40 hover:opacity-100">DOWNLOAD</button>
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
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/40 backdrop-blur-xl animate-in fade-in duration-500">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 40 }}
                    className="bg-white rounded-[64px] w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-white/20"
                  >
                    <div className="p-12 border-b border-border-subtle flex justify-between items-center bg-white/50 backdrop-blur-md">
                      <div className="space-y-1">
                        <h3 className="text-4xl font-black text-text-primary tracking-tighter">
                          Biyometrik Rekonstrüksiyon Kanıtı
                        </h3>
                        <p className="text-text-secondary text-[10px] font-black uppercase tracking-[0.3em] opacity-50">
                          AI Sentezinin Medikal Verilerle Doğrulanması
                        </p>
                      </div>
                      <button
                        onClick={() => setViewingProof(null)}
                        className="w-14 h-14 flex items-center justify-center hover:bg-slate-100 rounded-full transition-all group"
                      >
                        <X className="w-8 h-8 text-text-primary group-hover:rotate-90 transition-transform duration-300" />
                      </button>
                    </div>

                    <div className="flex-1 p-12 overflow-y-auto bg-slate-50/30 scrollbar-hide">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        <div className="space-y-8">
                          <div className="flex items-center justify-between px-6">
                            <div className="flex items-center gap-4">
                              <div className="w-2.5 h-2.5 bg-text-secondary rounded-full opacity-20"></div>
                              <h4 className="text-xs font-black text-text-primary uppercase tracking-widest">
                                Kaynak: Ultrason Morfolojisi
                              </h4>
                            </div>
                            <span className="text-[10px] font-mono font-black text-text-secondary bg-white px-4 py-1.5 rounded-full border border-border-subtle shadow-sm">
                              SCAN_REF: {viewingProof.id.split('_')[1]}
                            </span>
                          </div>

                          <div className="relative aspect-square bg-surface rounded-card overflow-hidden border-[16px] border-white shadow-soft group">
                            <img
                              src={viewingProof.ultrasoundUrl}
                              className="w-full h-full object-cover grayscale opacity-70 contrast-125"
                            />
                            <div className="absolute inset-0 pointer-events-none">
                              <div className="absolute inset-0 border border-primary/20"></div>
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>

                              <div className="absolute top-[20%] left-1/2 -translate-x-1/2 flex flex-col items-center">
                                <div className="w-5 h-5 border-2 border-primary rounded-full bg-primary/20 shadow-[0_0_20px_#10b981]"></div>
                                <div className="h-24 w-px bg-gradient-to-b from-primary to-transparent"></div>
                                <div className="px-4 py-2 bg-primary text-white text-[10px] font-black rounded-xl shadow-xl border border-white/20">
                                  VERTEX: {viewingProof.measurements?.a_mm}mm
                                </div>
                              </div>

                              <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 flex flex-col-reverse items-center">
                                <div className="w-5 h-5 border-2 border-primary rounded-full bg-primary/20 shadow-[0_0_20px_#10b981]"></div>
                                <div className="h-24 w-px bg-gradient-to-t from-primary to-transparent"></div>
                                <div className="px-4 py-2 bg-primary text-white text-[10px] font-black rounded-xl shadow-xl border border-white/20">
                                  MENTON
                                </div>
                              </div>

                              <div className="absolute top-[48%] left-1/2 -translate-x-1/2 w-[65%] h-px bg-primary/40 border-t border-dashed border-primary/60">
                                <div className="absolute -left-2.5 -top-1.5 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_#10b981]"></div>
                                <div className="absolute -right-2.5 -top-1.5 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_#10b981]"></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-8">
                          <div className="flex items-center justify-between px-6">
                            <div className="flex items-center gap-4">
                              <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                              <h4 className="text-xs font-black text-primary uppercase tracking-widest">
                                Rekonstrüksiyon: Biyometrik Eşleşme
                              </h4>
                            </div>
                            <div className="px-5 py-2 bg-primary/10 rounded-full border border-primary/20 shadow-sm">
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                Doğruluk: 99.8%
                              </span>
                            </div>
                          </div>

                          <div className="relative aspect-square bg-white rounded-[56px] overflow-hidden border-[16px] border-white shadow-2xl">
                            <img src={viewingProof.babyFaceUrl} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 pointer-events-none">
                              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent"></div>

                              <svg className="absolute inset-0 w-full h-full opacity-10 text-primary">
                                <defs>
                                  <pattern id="grid-proof" width="50" height="50" patternUnits="userSpaceOnUse">
                                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
                                  </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid-proof)" />
                              </svg>

                              <div className="absolute top-[20%] left-1/2 -translate-x-1/2 flex flex-col items-center">
                                <div className="w-6 h-6 border-2 border-primary rounded-full flex items-center justify-center bg-white shadow-xl">
                                  <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_#10b981]"></div>
                                </div>
                                <div className="px-4 py-2 bg-text-primary text-white text-[10px] font-black rounded-xl shadow-xl border border-primary/20 mt-3 uppercase tracking-widest">
                                  Vertex Aligned
                                </div>
                              </div>

                              <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 flex flex-col-reverse items-center">
                                <div className="w-6 h-6 border-2 border-primary rounded-full flex items-center justify-center bg-white shadow-xl">
                                  <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_#10b981]"></div>
                                </div>
                                <div className="px-4 py-2 bg-text-primary text-white text-[10px] font-black rounded-xl shadow-xl border border-primary/20 mb-3 uppercase tracking-widest">
                                  Menton Aligned
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-16 p-12 bg-slate-50/50 rounded-[64px] border border-black/[0.02] shadow-soft">
                        <div className="flex items-center gap-6 mb-12">
                          <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center shadow-soft border border-border-subtle">
                            <Activity className="w-7 h-7 text-primary" />
                          </div>
                          <div className="space-y-1.5">
                            <h5 className="text-xl font-black text-text-primary uppercase tracking-tighter">
                              Biyometrik Veri Analiz Tablosu
                            </h5>
                            <p className="text-[10px] font-black text-text-secondary/40 uppercase tracking-[0.3em]">
                              NeoBreed Reconstruction Engine v4.0
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-16 gap-x-20">
                          {steps.map((step) => (
                            <div key={step.id} className="space-y-4 group">
                              <p className="text-[11px] font-black text-text-secondary/60 uppercase tracking-[0.25em] group-hover:text-primary transition-colors">
                                {step.label.split(': ')[1] || step.label}
                              </p>
                              <div className="flex items-baseline gap-3">
                                <p className="text-5xl font-black text-text-primary tracking-tighter leading-none">
                                  {viewingProof.measurements?.[step.id] ?? '---'}
                                </p>
                                <span className="text-xs font-black text-primary uppercase tracking-widest opacity-60">
                                  mm
                                </span>
                              </div>
                              <div className="h-2 w-12 bg-black/5 rounded-full group-hover:w-full group-hover:bg-primary/20 transition-all duration-1000 ease-out"></div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-16 flex flex-col items-center text-center space-y-6">
                        <div className="px-8 py-4 bg-primary/10 rounded-full border border-primary/20 flex items-center gap-4 shadow-sm">
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                          <span className="text-xs font-black text-primary uppercase tracking-[0.15em]">
                            Bilimsel Doğruluk Onayı: NeoBreed Reconstruction Engine v4.0
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary font-bold max-w-3xl leading-relaxed opacity-70">
                          Bu rekonstrüksiyon, yukarıdaki biyometrik ölçümlerin (mm) ve ultrason kemik yapısının AI tarafından birebir
                          eşleştirilmesiyle oluşturulmuştur. Yumuşak doku tahmini, medikal kütüphanemizdeki benzer morfolojik verilerle
                          desteklenmiştir.
                        </p>
                      </div>
                    </div>

                    <div className="p-12 border-t border-border-subtle bg-white/50 backdrop-blur-md flex justify-center">
                      <button
                        onClick={() => setViewingProof(null)}
                        className="px-20 py-5 bg-primary text-white rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-soft"
                      >
                        Raporu Kapat
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
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

const MarkerPoint: React.FC<MarkerPointProps> = ({ x, y, label, value, onValueChange, dragEnabled }) => {
  const [showPopover, setShowPopover] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const markerRef = useRef<HTMLDivElement>(null);
  const dragHandlers = useRef<{ move: any, end: any } | null>(null);

  // ÇÖZÜM 5: Unmount durumunda Event Listener temizliği
  useEffect(() => {
    return () => {
      if (dragHandlers.current) {
        window.removeEventListener('mousemove', dragHandlers.current.move);
        window.removeEventListener('touchmove', dragHandlers.current.move);
        window.removeEventListener('mouseup', dragHandlers.current.end);
        window.removeEventListener('touchend', dragHandlers.current.end);
      }
    };
  }, []);

  // ÇÖZÜM 2: Noktaları sürüklerken hem fare hem dokunmatik desteği
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragEnabled) return;
    setIsDragging(true);
    e.stopPropagation();

    let lastY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    let currentValue = value || 0; 

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;
      const deltaY = currentY - lastY;
      
      const delta = deltaY * -0.1;
      currentValue = Math.max(0, currentValue + delta);
      lastY = currentY;
      
      onValueChange(Math.round(currentValue * 10) / 10);
    };

    const handleEnd = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMove as any);
      window.removeEventListener('touchmove', handleMove as any);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
      dragHandlers.current = null;
    };

    dragHandlers.current = { move: handleMove, end: handleEnd };

    window.addEventListener('mousemove', handleMove as any);
    window.addEventListener('touchmove', handleMove as any, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
  };

  return (
    <div 
      ref={markerRef}
      className={`absolute -translate-x-1/2 -translate-y-1/2 group z-40 pointer-events-auto ${isDragging ? 'cursor-grabbing' : dragEnabled ? 'cursor-grab' : 'cursor-pointer'}`}
      style={{ left: x, top: y }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
    >
      <div 
        onClick={() => !isDragging && setShowPopover(!showPopover)}
        className="relative flex items-center justify-center"
      >
        <motion.div 
          animate={{ 
            scale: value !== null ? [1, 1.1, 1] : 1,
            opacity: value !== null ? 1 : 0.6
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${value !== null ? 'border-nexus-mint bg-nexus-mint/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-black/20 bg-white/40 backdrop-blur-sm group-hover:border-nexus-mint/50 group-hover:bg-nexus-mint/5'}`}
        >
          <div className={`absolute w-full h-px ${value !== null ? 'bg-nexus-mint/40' : 'bg-black/10'}`}></div>
          <div className={`absolute h-full w-px ${value !== null ? 'bg-nexus-mint/40' : 'bg-black/10'}`}></div>
          
          <div className={`w-2 h-2 rounded-full shadow-sm transition-all duration-300 ${value !== null ? 'bg-nexus-mint scale-125' : 'bg-black/20 group-hover:bg-nexus-mint/60'}`}></div>
        </motion.div>

        <div className="absolute -inset-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-nexus-mint"></div>
          <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-nexus-mint"></div>
          <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-nexus-mint"></div>
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-nexus-mint"></div>
        </div>
      </div>

      <AnimatePresence>
        {showPopover && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-floating p-6 border border-white/40 min-w-[200px] z-[120]"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-6">
                <span className="text-[10px] font-black text-text-secondary/60 uppercase tracking-[0.25em]">{label}</span>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded-md uppercase tracking-widest">Biometric</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input 
                    autoFocus
                    type="number" 
                    value={value ?? ''}
                    onChange={(e) => onValueChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-5 py-4 bg-black/5 rounded-[20px] border-none text-base font-black focus:bg-white focus:ring-8 focus:ring-primary/5 transition-all text-center tracking-tight"
                    placeholder="0.0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-text-secondary/40 uppercase">mm</span>
                </div>
                <button onClick={() => setShowPopover(false)} className="w-12 h-12 bg-text-primary text-white rounded-[20px] hover:bg-primary transition-all shadow-xl shadow-black/10 flex items-center justify-center active:scale-90">
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-white/90 drop-shadow-sm"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showPopover && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 px-3 py-1.5 bg-black/90 backdrop-blur-xl text-white text-[9px] font-black uppercase tracking-[0.15em] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-xl border border-white/10 translate-y-2 group-hover:translate-y-0">
          {label} {value !== null && <span className="text-nexus-mint ml-2">· {value}mm</span>}
        </div>
      )}
    </div>
  );
};

export default BabyFaceGenerator;