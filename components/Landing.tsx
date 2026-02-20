import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { PACKAGES } from '../constants';

// ✅ Only your uploaded logo (NO box, NO text)
// If your file is PNG use .png, if SVG use .svg

interface Props {
  onLogin: () => void;
  onRegister: () => void;
}

const Landing: React.FC<Props> = ({ onLogin, onRegister }) => {
  const [isRealistic, setIsRealistic] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsRealistic((prev) => !prev);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] scroll-smooth">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
          {/* ✅ ONLY LOGO (no box, no text) */}
          <div
            className="cursor-pointer select-none"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img
              src="/public/neobreed-logo.png"
              alt="NeoBreed"
              className="h-36 w-auto"
              draggable={false}
            />
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <button onClick={() => scrollTo('tech')} className="hover:text-black transition-colors">
              Teknoloji
            </button>
            <button onClick={() => scrollTo('clinics')} className="hover:text-black transition-colors">
              Klinikler
            </button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-black transition-colors">
              Fiyatlandırma
            </button>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onLogin} className="text-sm font-bold text-slate-700 hover:text-black">
              Giriş Yap
            </button>
            <button
              onClick={onRegister}
              className="bg-black text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
            >
              Hemen Başla
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 pt-56 pb-32">
        <div className="inline-block px-4 py-1.5 bg-[#E8F5F1] text-[#10b981] rounded-full text-[11px] font-black uppercase tracking-widest mb-8">
          Gelişmiş Fetal Görüntüleme v3.0
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            {/* Modern / thinner slogan */}
            <h1 className="text-[56px] md:text-[76px] leading-[0.95] font-medium tracking-[-0.02em] text-black mb-10">
              Geleceği<br />
              <span className="text-nexus-green font-semibold">İlk Nefesten</span><br />
              Önce Görün.
            </h1>

            <p className="max-w-xl text-lg text-slate-500 font-medium leading-relaxed mb-12">
              NeoBreed AI, kadın doğum uzmanlarını gerçek zamanlı 3D fetal görselleştirme ve akıllı tanı desteği ile güçlendirir.{' '}
              <span className="text-black font-bold">NeoBreed Intelligence Core</span> teknolojisiyle her piksel, bebeğinizin sağlığına dair derin bir anlam taşır.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={onRegister}
                className="bg-black text-white px-10 py-5 rounded-full font-bold flex items-center gap-3 hover:scale-105 transition-transform shadow-xl shadow-black/10"
              >
                Hemen Başla
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              <button
                onClick={onLogin}
                className="px-10 py-5 rounded-full font-bold flex items-center gap-3 border border-black/10 hover:bg-black/5 transition-all"
              >
                Giriş Yap
              </button>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="absolute inset-0 bg-nexus-green/10 blur-[120px] rounded-full animate-pulse"></div>

            <div className="relative bg-white p-3 rounded-[56px] shadow-2xl overflow-hidden aspect-square border border-slate-100">
              <AnimatePresence mode="wait">
                {!isRealistic ? (
                  <motion.div
                    key="ultrasound"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&q=80&w=800"
                      alt="Ultrasound Raw"
                      className="w-full h-full object-cover grayscale contrast-150 brightness-75"
                    />
                    <div className="absolute inset-0 bg-black/40"></div>

                    {/* Scanning Line Effect */}
                    <motion.div
                      initial={{ top: '-10%' }}
                      animate={{ top: '110%' }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="absolute left-0 right-0 h-1 bg-nexus-green shadow-[0_0_20px_rgba(16,185,129,0.8)] z-10"
                    />

                    <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-nexus-green uppercase tracking-widest">Signal Status</p>
                        <p className="text-white text-xs font-bold uppercase tracking-tight">Raw Fetal Data Stream</p>
                      </div>
                      <span className="text-white/40 text-[10px] font-mono">0x442_RECON</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="realistic"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&q=80&w=800"
                      alt="AI Synthesis"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                    {/* Data Points Overlay */}
                    <div className="absolute inset-0 opacity-30">
                      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-nexus-green rounded-full animate-ping"></div>
                      <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-nexus-green rounded-full animate-ping delay-700"></div>
                      <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-nexus-green rounded-full animate-ping delay-1000"></div>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="px-8 py-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-4 h-4 text-nexus-green" />
                          <span className="text-white text-[11px] font-black uppercase tracking-[0.4em]">
                            NeoBreed AI Sentezi
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-nexus-green uppercase tracking-widest">Synthesis Complete</p>
                        <p className="text-white text-xs font-bold uppercase tracking-tight">4K Anatomik Rekonstrüksiyon</p>
                      </div>
                      <span className="text-nexus-green text-[10px] font-mono">CONFIDENCE: 99.8%</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Section */}
      <section id="tech" className="bg-black py-32 text-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-24">
            <p className="text-nexus-green text-[10px] font-black uppercase tracking-[0.4em] mb-4">
              NEOBREED INTELLIGENCE CORE V4
            </p>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter">GÖREMEDİĞİNİZİ GÖRÜN.</h2>
            <p className="text-slate-400 mt-6 max-w-2xl mx-auto font-medium">
              Geleneksel ultrasonun ötesine geçiyoruz. NeoBreed AI, milyonlarca fetal veri noktasını işleyerek bebeğinizin anatomik yapısını en ince ayrıntısına kadar dijital olarak yeniden inşa eder.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <TechCard
              title="Biyometrik Sentez"
              desc="Ultrason dalgalarından gelen ham verileri, kemik yoğunluğu ve yumuşak doku haritalandırması ile %99.4 doğrulukla ayrıştıran patentli algoritmamız."
              icon="M13 10V3L4 14h7v7l9-11h-7z"
            />
            <TechCard
              title="NeoBreed AI Engine"
              desc="Kendi kapalı devre sunucu ağımızda çalışan, saniyeler içinde 4K çözünürlükte hiper-gerçekçi rekonstrüksiyon sağlayan özel üretim modelimiz."
              icon="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"
            />
            <TechCard
              title="Etik Yapay Zeka"
              desc="Tüm analizler tıbbi etik kurallara uygun olarak, doktor denetiminde ve hasta gizliliği en üst düzeyde tutularak gerçekleştirilir."
              icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </div>
        </div>
      </section>

      {/* Clinics Section */}
      <section id="clinics" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center gap-20">
          <div className="flex-1 space-y-8">
            <h2 className="text-6xl font-black tracking-tighter text-black">
              Modern Klinikler İçin<br />Teknoloji.
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed">
              NeoBreed, klinik yönetiminizi hastalarınız için unutulmaz bir deneyime dönüştürür. Bekleme odasından muayene koltuğuna kadar her aşamada dijital dönüşüm ve duygusal bağ kuran teknolojiler.
            </p>
            <div className="grid grid-cols-2 gap-8 pt-8">
              <div>
                <p className="text-4xl font-black text-black">2.500+</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Aktif Klinik</p>
              </div>
              <div>
                <p className="text-4xl font-black text-black">1.2M+</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Başarılı Analiz</p>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full grid grid-cols-2 gap-4">
            <div className="space-y-4 pt-12">
              <div className="h-64 bg-slate-50 rounded-[40px] flex items-center justify-center border border-slate-100 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=400"
                  className="object-cover h-full w-full"
                  alt="Baby"
                />
              </div>
              <div className="h-48 bg-nexus-green rounded-[40px] flex items-center justify-center p-8">
                <span className="text-white text-3xl font-black tracking-tighter leading-none italic">#NEOBREED</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="h-48 bg-black rounded-[40px] flex items-center justify-center p-8">
                <span className="text-white text-xs font-black tracking-[0.3em] uppercase">Trusted AI</span>
              </div>
              <div className="h-64 bg-slate-50 rounded-[40px] flex items-center justify-center border border-slate-100 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&q=80&w=400"
                  className="object-cover h-full w-full"
                  alt="Baby Care"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-[#F9F9F9]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-24">
            <h2 className="text-6xl font-black tracking-tighter text-black mb-6 uppercase">Lisans Paketleri</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              İster butik bir klinik, ister büyük bir hastane zinciri olun; NeoBreed her ölçek için esnek çözümler sunar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 group"
              >
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-2">{pkg.name}</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-5xl font-black text-black tracking-tighter">${pkg.price}</span>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">/ay</span>
                </div>
                <ul className="space-y-4 mb-12">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                      <svg className="w-5 h-5 text-nexus-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onRegister}
                  className="w-full py-5 rounded-3xl bg-black text-white font-black uppercase tracking-widest text-xs group-hover:bg-nexus-green transition-colors"
                >
                  Hemen Başlat
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="border-t border-slate-200 py-20 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center opacity-30 grayscale mb-20 flex-wrap gap-8">
            <span className="font-black tracking-widest text-xs">MAYO CLINIC</span>
            <span className="font-black tracking-widest text-xs">JOHNS HOPKINS</span>
            <span className="font-black tracking-widest text-xs">STANFORD MEDICINE</span>
            <span className="font-black tracking-widest text-xs">CEDARS-SINAI</span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            {/* ✅ ONLY LOGO (no text, no box) */}
            <img
              src="/assets/neobreed-logo.png"
              alt="NeoBreed"
              className="h-24 w-auto opacity-90"
              draggable={false}
            />

            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              © 2024 NeoBreed Systems. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const TechCard: React.FC<{ title: string; desc: string; icon: string }> = ({ title, desc, icon }) => (
  <div className="p-10 bg-white/5 border border-white/10 rounded-[40px] hover:bg-white/10 transition-colors group">
    <div className="w-12 h-12 bg-nexus-green rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
      <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
      </svg>
    </div>
    <h3 className="text-xl font-black mb-4 uppercase tracking-tighter">{title}</h3>
    <p className="text-slate-400 text-sm font-medium leading-relaxed">{desc}</p>
  </div>
);

export default Landing;