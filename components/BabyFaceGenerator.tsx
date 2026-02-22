
import React, { useState, useRef, useEffect } from 'react';
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
  const [options, setOptions] = useState({
    gender: 'unknown',
    expression: 'neutral',
    style: 'hyper-realistic',
    notes: ''
  });
  const [show3DModal, setShow3DModal] = useState(false);
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
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-switch view when step changes
  useEffect(() => {
    const step = steps.find(s => s.id === currentStep);
    if (step) {
      if (step.view === 'front') setRotation({ x: 0, y: 0 });
      if (step.view === 'profile') setRotation({ x: 0, y: 90 });
      if (step.view === 'top') setRotation({ x: 90, y: 0 });
    }
  }, [currentStep]);

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
    
    if (previewUrl) {
      // Direct transition to generation without extra steps
      handleGenerate();
    } else {
      alert("Lütfen önce bir ultrason dosyası seçin.");
    }
  };

  const handleViewerInteraction = (e: React.MouseEvent | React.WheelEvent) => {
    if (e.type === 'wheel') {
      const we = e as React.WheelEvent;
      setZoom(prev => Math.max(0.5, Math.min(3, prev - we.deltaY * 0.001)));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const isRightClick = e.button === 2 || (e.button === 0 && e.shiftKey);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (isRightClick) {
        setPan(prev => ({ x: prev.x + dx * 0.5, y: prev.y + dy * 0.5 }));
      } else {
        setRotation(prev => ({ x: prev.x + dy * 0.5, y: prev.y + dx * 0.5 }));
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

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
      console.log('Starting AI Synthesis with Biometric Data...');
      const resultBase64 = await generateBabyFace(previewUrl, highRes, options, measurements);
      
      // 2. Upload both to Supabase Storage
      console.log('Uploading results to cloud storage...');
      const timestamp = Date.now();
      const ultrasoundPath = `patients/${patient.id}/source_${timestamp}.png`;
      const babyFacePath = `patients/${patient.id}/synthesis_${timestamp}.png`;

      const [ultrasoundUrl, babyFaceUrl] = await Promise.all([
        StorageService.uploadImage(previewUrl, ultrasoundPath),
        StorageService.uploadImage(resultBase64, babyFacePath)
      ]);

      console.log('Upload successful. Saving scan record...');
      const newScan: ScanResult = {
        id: `scan_${timestamp}`,
        patientId: patient.id,
        ultrasoundUrl: ultrasoundUrl,
        babyFaceUrl: babyFaceUrl,
        createdAt: new Date().toLocaleDateString()
      };

      onScanGenerated(newScan);
      setPreviewUrl(null);
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

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareWhatsApp = (url: string) => {
    const text = encodeURIComponent(`NeoBreed AI: Bebeğinizin ilk portresi hazır! 👶✨ Görseli buradan inceleyebilirsiniz: ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative">
      {/* 3D Measurement Modal */}
      <AnimatePresence>
        {show3DModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[48px] w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-black/5 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-black tracking-tight">3D Kafa Ölçümleme</h3>
                  <p className="text-apple-gray text-xs font-semibold uppercase tracking-widest mt-1">Modeli döndür, ölçümü seç, mm gir veya sürükleyerek ayarla.</p>
                </div>
                <button onClick={() => setShow3DModal(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>

              {/* Modal Content - 3 Columns */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Column: Step List - Redesigned for Professional Look */}
                <div className="w-80 bg-slate-900 overflow-y-auto flex flex-col">
                  <div className="p-8 border-b border-white/5">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Ölçüm Protokolü</p>
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-bold text-sm">Biyometrik Analiz</h4>
                      <div className="px-2 py-1 bg-nexus-mint/20 rounded text-[9px] font-bold text-nexus-mint uppercase tracking-wider">
                        {steps.filter(s => measurements[s.id as keyof Measurements] !== null).length}/{steps.length}
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(steps.filter(s => measurements[s.id as keyof Measurements] !== null).length / steps.length) * 100}%` }}
                        className="h-full bg-nexus-mint shadow-[0_0_10px_#10b981]"
                      />
                    </div>
                  </div>

                  <div className="flex-1 py-4">
                    {steps.map((step, idx) => (
                      <button
                        key={step.id}
                        onClick={() => setCurrentStep(step.id as any)}
                        className={`w-full text-left px-8 py-5 transition-all flex items-center gap-4 border-b border-white/5 relative group ${currentStep === step.id ? 'bg-white/5' : 'hover:bg-white/[0.02]'}`}
                      >
                        {currentStep === step.id && (
                          <motion.div layoutId="activeStep" className="absolute left-0 top-0 bottom-0 w-1 bg-nexus-mint shadow-[0_0_15px_#10b981]" />
                        )}
                        <span className={`font-mono text-[10px] ${currentStep === step.id ? 'text-nexus-mint' : 'text-white/20'}`}>
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <div className="flex-1">
                          <p className={`text-[11px] font-bold tracking-tight ${currentStep === step.id ? 'text-white' : 'text-white/60'}`}>
                            {step.label.split(': ')[1] || step.label}
                          </p>
                          <p className="text-[9px] text-white/20 font-medium uppercase tracking-widest mt-0.5">
                            {step.view === 'front' ? 'Anterior' : step.view === 'profile' ? 'Sagittal' : 'Axial'} Görünüm
                          </p>
                        </div>
                        {measurements[step.id as keyof Measurements] !== null ? (
                          <div className="w-5 h-5 rounded-full bg-nexus-mint/20 flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-nexus-mint" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-white/10 group-hover:border-white/20 transition-colors" />
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <div className="p-6 bg-black/20">
                    <div className="flex items-center gap-3 text-white/30">
                      <Activity className="w-4 h-4" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Sistem Hazır</span>
                    </div>
                  </div>
                </div>

                {/* Center Column: Head Viewer */}
                <div className="flex-1 bg-[#f8fafc] relative overflow-hidden flex flex-col">
                  {/* Grid Background Overlay */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
                  
                  <div 
                    ref={viewerRef}
                    onWheel={handleViewerInteraction}
                    onMouseDown={handleMouseDown}
                    onContextMenu={(e) => e.preventDefault()}
                    className="flex-1 cursor-move relative"
                  >
                    {/* Fetal Head Model Container */}
                    <div 
                      className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
                      style={{ 
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      }}
                    >
                      <div className="relative w-80 h-96 flex items-center justify-center">
                        {/* Realistic Fetal Head Images */}
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

                          {/* Shading/Medical Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-nexus-mint/5 to-transparent pointer-events-none rounded-full"></div>
                        </div>

                        {/* Interactive Markers Layer */}
                        <div className="absolute inset-0 pointer-events-none">
                          {steps.map((step) => {
                            const isSelected = currentStep === step.id;
                            if (!isSelected) return null;

                            return (
                              <div key={step.id} className="absolute inset-0 pointer-events-auto">
                                {/* Marker Points based on Step */}
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
                                      style={{ 
                                        left: '50%', 
                                        top: '50%', 
                                        width: '60%', 
                                        height: '68%', 
                                        transform: 'translate(-50%, -50%)' 
                                      }}
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

                {/* Right Column: Numeric Input - Redesigned for Professional Look */}
                <div className="w-80 border-l border-black/5 flex flex-col">
                  <div className="p-8 border-b border-black/5 bg-slate-50/50">
                    <p className="text-[10px] font-black text-apple-gray uppercase tracking-[0.2em] mb-6">Veri Giriş Paneli</p>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black text-black uppercase tracking-tight">
                            {steps.find(s => s.id === currentStep)?.label.split(': ')[1] || steps.find(s => s.id === currentStep)?.label}
                          </label>
                          <span className="text-[10px] font-mono text-apple-gray">REF: {currentStep.split('_')[0].toUpperCase()}</span>
                        </div>
                        
                        <div className="relative group">
                          <input 
                            type="number" 
                            value={measurements[currentStep as keyof Measurements] || ''}
                            onChange={(e) => setMeasurements(prev => ({ ...prev, [currentStep]: e.target.value ? parseFloat(e.target.value) : null }))}
                            className="w-full px-8 py-6 bg-white rounded-3xl border border-black/5 text-3xl font-black focus:ring-2 focus:ring-nexus-mint focus:border-transparent transition-all shadow-xl shadow-black/[0.02] text-center"
                            placeholder="0.0"
                          />
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center">
                            <span className="text-[10px] font-black text-nexus-mint uppercase">mm</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {[-0.5, -0.1, 0.1, 0.5].map(val => (
                          <button
                            key={val}
                            onClick={() => setMeasurements(prev => ({ ...prev, [currentStep]: Math.round(((prev[currentStep as keyof Measurements] || 0) + val) * 10) / 10 }))}
                            className="py-3 bg-white border border-black/5 hover:border-nexus-mint hover:text-nexus-mint rounded-2xl text-[10px] font-black transition-all shadow-sm active:scale-95"
                          >
                            {val > 0 ? `+${val}` : val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 p-8 space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[11px] font-black text-black uppercase tracking-tight">Hassas Kontrol</p>
                          <p className="text-[9px] text-apple-gray font-medium">Model üzerinden sürükleme</p>
                        </div>
                        <button 
                          onClick={() => setDragEnabled(!dragEnabled)}
                          className={`w-12 h-6 rounded-full relative transition-all duration-300 ${dragEnabled ? 'bg-nexus-mint shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-200'}`}
                        >
                          <motion.div 
                            animate={{ x: dragEnabled ? 24 : 4 }}
                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                          />
                        </button>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-[32px] border border-black/5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                          <Settings2 className="w-4 h-4 text-apple-gray" />
                        </div>
                        <p className="text-[10px] font-bold text-black uppercase tracking-widest">Kılavuz</p>
                      </div>
                      <p className="text-[10px] leading-relaxed text-apple-gray font-medium">
                        Ölçüm yapmak için model üzerindeki hedef noktaları kullanın veya sağ panelden değer girin. Sürükleme modu aktifken noktaları dikey yönde hareket ettirerek ince ayar yapabilirsiniz.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-black/5 flex justify-between items-center bg-slate-50/50">
                <button 
                  onClick={() => setShow3DModal(false)}
                  className="px-10 py-4 bg-white border border-black/5 text-black rounded-full font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Kapat
                </button>
                <button 
                  onClick={handleSave3D}
                  className="px-12 py-4 bg-black text-white rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20"
                >
                  Kaydet ve Devam Et
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
        <div className="aspect-[4/5] bg-black rounded-[48px] overflow-hidden relative flex flex-col items-center justify-center p-10 group shadow-2xl border border-white/5">
          {previewUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-6 animate-in zoom-in duration-500 relative">
              <div className="relative w-full max-h-[60%] flex items-center justify-center">
                <img src={previewUrl} className="max-w-full max-h-full object-contain rounded-[32px] border border-white/10" />
                
                {/* Analysis Overlay */}
                <AnimatePresence>
                  {isGenerating && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 overflow-hidden rounded-[32px] pointer-events-none z-20"
                    >
                      {/* Scanning Line with Glow */}
                      <motion.div 
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute left-0 right-0 h-[3px] bg-nexus-mint shadow-[0_0_40px_#10b981,0_0_10px_#fff] z-40"
                      />
                      
                      {/* Face Detection Frame */}
                      <motion.div 
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-12 border-2 border-nexus-mint/30 rounded-[40px] z-30"
                      >
                        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-nexus-mint rounded-tl-3xl"></div>
                        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-nexus-mint rounded-tr-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-nexus-mint rounded-bl-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-nexus-mint rounded-br-3xl"></div>
                      </motion.div>

                      {/* Dynamic Biometric Mesh */}
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
                          {/* Inner Mesh Lines */}
                          {[...Array(8)].map((_, i) => (
                            <motion.line
                              key={i}
                              x1={50 + i * 40} y1="0" x2={50 + i * 40} y2="500"
                              stroke="currentColor" strokeWidth="0.2" strokeDasharray="4 4"
                              animate={{ opacity: [0.1, 0.3, 0.1] }}
                              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                            />
                          ))}
                        </svg>
                      </div>

                      {/* Biometric Markers (Reference Points) */}
                      {[
                        { x: '30%', y: '25%' }, { x: '70%', y: '25%' },
                        { x: '50%', y: '45%' }, { x: '40%', y: '65%' },
                        { x: '60%', y: '65%' }, { x: '50%', y: '80%' }
                      ].map((point, i) => (
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
                            PT_{i+1}: {Math.random().toFixed(4)}
                          </motion.span>
                        </motion.div>
                      ))}
                      
                      {/* HUD Data Streams */}
                      <div className="absolute top-10 left-10 flex flex-col gap-4">
                        <div className="flex items-center gap-3 bg-black/80 backdrop-blur-2xl px-5 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
                          <div className="w-2 h-2 bg-nexus-mint rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                          <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Neural Analysis v4.2</span>
                        </div>
                        
                        <div className="bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 space-y-2">
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

                      {/* Right Side Data Feed */}
                      <div className="absolute top-10 right-10 flex flex-col items-end gap-3">
                        <div className="bg-nexus-mint/10 text-nexus-mint text-[9px] font-black px-4 py-1.5 rounded-full border border-nexus-mint/20 uppercase tracking-[0.2em] backdrop-blur-md">
                          Processing Stream
                        </div>
                        <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/5 font-mono text-[7px] text-white/60 leading-relaxed text-right">
                          {`SCAN_ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`}<br/>
                          {`FREQ: 14.22 MHz`}<br/>
                          {`DEPTH: 124.5 mm`}<br/>
                          {`GAIN: 42.0 dB`}
                        </div>
                      </div>

                      {/* Bottom Status Bar */}
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
              </div>
              
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
                <span className="text-[9px] font-bold text-nexus-mint uppercase tracking-widest">NeoBreed Intelligence Core Synthesis</span>
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
              <button 
                onClick={() => setShow3DModal(true)}
                className="px-6 py-2.5 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                3D Ölçüm ile Devam Et
              </button>
              {measurements.createdAt && (
                <div className="text-[9px] font-mono text-nexus-mint/60 uppercase tracking-tighter animate-in fade-in slide-in-from-top-1">
                  {steps.filter(s => measurements[s.id as keyof Measurements] !== null).map(s => `${s.id.split('_')[0]}: ${measurements[s.id as keyof Measurements]}mm`).join(' · ')}
                </div>
              )}
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dragEnabled) return;
    setIsDragging(true);
    e.stopPropagation();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = Math.round((moveEvent.movementY || 0) * -0.1 * 10) / 10;
      if (delta !== 0) {
        onValueChange(Math.max(0, (value || 0) + delta));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      ref={markerRef}
      className={`absolute -translate-x-1/2 -translate-y-1/2 group z-40 ${isDragging ? 'cursor-grabbing' : dragEnabled ? 'cursor-grab' : 'cursor-pointer'}`}
      style={{ left: x, top: y }}
      onMouseDown={handleMouseDown}
    >
      {/* Professional Medical Crosshair Marker */}
      <div 
        onClick={() => !isDragging && setShowPopover(!showPopover)}
        className="relative flex items-center justify-center"
      >
        {/* Outer Ring */}
        <motion.div 
          animate={{ 
            scale: value !== null ? [1, 1.1, 1] : 1,
            opacity: value !== null ? 1 : 0.6
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${value !== null ? 'border-nexus-mint bg-nexus-mint/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-black/20 bg-white/40 backdrop-blur-sm group-hover:border-nexus-mint/50 group-hover:bg-nexus-mint/5'}`}
        >
          {/* Crosshair Lines */}
          <div className={`absolute w-full h-px ${value !== null ? 'bg-nexus-mint/40' : 'bg-black/10'}`}></div>
          <div className={`absolute h-full w-px ${value !== null ? 'bg-nexus-mint/40' : 'bg-black/10'}`}></div>
          
          {/* Inner Core */}
          <div className={`w-2 h-2 rounded-full shadow-sm transition-all duration-300 ${value !== null ? 'bg-nexus-mint scale-125' : 'bg-black/20 group-hover:bg-nexus-mint/60'}`}></div>
        </motion.div>

        {/* Target Corners */}
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
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-5 border border-black/5 min-w-[160px] z-[120]"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[9px] font-black text-apple-gray uppercase tracking-[0.2em]">{label}</span>
                <span className="text-[9px] font-mono text-nexus-mint">INPUT</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input 
                    autoFocus
                    type="number" 
                    value={value || ''}
                    onChange={(e) => onValueChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-none text-sm font-black focus:bg-white transition-all text-center"
                    placeholder="0.0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-bold text-apple-gray">mm</span>
                </div>
                <button onClick={() => setShowPopover(false)} className="p-3 bg-black text-white rounded-2xl hover:bg-nexus-mint transition-colors shadow-lg shadow-black/10">
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Popover Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-white drop-shadow-sm"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label Tooltip - Refined */}
      {!showPopover && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 px-3 py-1.5 bg-black/90 backdrop-blur-xl text-white text-[9px] font-black uppercase tracking-[0.15em] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-xl border border-white/10 translate-y-2 group-hover:translate-y-0">
          {label} {value && <span className="text-nexus-mint ml-2">· {value}mm</span>}
        </div>
      )}
    </div>
  );
};

export default BabyFaceGenerator;
