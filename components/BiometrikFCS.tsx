import React, { useMemo, useRef, useState, useCallback } from 'react';
import { Upload, Microscope, ArrowRight, Info, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import { SoftCard } from './ui/SoftCard';

interface BiometrikFCSProps {
  onProceedToStudio: (measurements: Partial<Measurements>) => void;
  initialMeasurements?: Partial<Measurements>;
}

interface Measurements {
  gebelikHaftasi: number;
  fromen: number;
  burun: number;
  goztepe: number;
  bioccap: number;
  cene: number;
  agizcapi: number;
  onarka_bas: number;
  bpd: number;
  hc: number;
  goz: number;
}

type Percentiles = { p5: number; p50: number; p95: number };
type RefRow = { gaWeeks: number; bpd?: Percentiles; hc?: Percentiles; ac?: Percentiles; fl?: Percentiles; efw?: Percentiles };
type ReferenceSet = { id: string; label: string; rows: RefRow[]; meta?: any };
type ValidationError = { field: keyof Measurements; message: string; severity: 'warning' | 'error' };

// ============= STANDAR REFERANS VERISI =============
const STANDARD_NOMOGRAM: ReferenceSet = {
  id: 'hadlock_standard',
  label: 'Hadlock Standard Nomogram (18-40 hafta)',
  meta: { device: 'GE Voluson / Philips / Samsung', protocol: 'Standart Obstetrik Ölçüm', bpdDefinition: 'outer-outer', notes: 'Hadlock et al. 1984' },
  rows: [
    { gaWeeks: 18, bpd: { p5: 34.6, p50: 39.5, p95: 44.4 }, hc: { p5: 134.7, p50: 151.1, p95: 167.5 }, ac: { p5: 106.4, p50: 124.5, p95: 142.6 }, fl: { p5: 22.6, p50: 26.7, p95: 30.8 }, efw: { p5: 176, p50: 223, p95: 270 } },
    { gaWeeks: 19, bpd: { p5: 37.8, p50: 43.0, p95: 48.2 }, hc: { p5: 147.1, p50: 164.1, p95: 181.1 }, ac: { p5: 117.8, p50: 136.9, p95: 156.0 }, fl: { p5: 25.5, p50: 29.8, p95: 34.1 }, efw: { p5: 216, p50: 273, p95: 330 } },
    { gaWeeks: 20, bpd: { p5: 41.0, p50: 46.4, p95: 51.8 }, hc: { p5: 159.2, p50: 176.8, p95: 194.4 }, ac: { p5: 128.9, p50: 149.1, p95: 169.3 }, fl: { p5: 28.3, p50: 32.7, p95: 37.1 }, efw: { p5: 262, p50: 331, p95: 400 } },
    { gaWeeks: 21, bpd: { p5: 44.1, p50: 49.7, p95: 55.3 }, hc: { p5: 171.0, p50: 189.2, p95: 207.4 }, ac: { p5: 139.9, p50: 161.1, p95: 182.3 }, fl: { p5: 31.0, p50: 35.6, p95: 40.2 }, efw: { p5: 316, p50: 399, p95: 482 } },
    { gaWeeks: 22, bpd: { p5: 47.2, p50: 53.0, p95: 58.8 }, hc: { p5: 182.5, p50: 201.3, p95: 220.1 }, ac: { p5: 150.6, p50: 172.9, p95: 195.2 }, fl: { p5: 33.7, p50: 38.4, p95: 43.1 }, efw: { p5: 378, p50: 478, p95: 577 } },
    { gaWeeks: 23, bpd: { p5: 50.1, p50: 56.2, p95: 62.3 }, hc: { p5: 193.6, p50: 213.0, p95: 232.4 }, ac: { p5: 161.2, p50: 184.5, p95: 207.8 }, fl: { p5: 36.2, p50: 41.1, p95: 46.0 }, efw: { p5: 449, p50: 568, p95: 686 } },
    { gaWeeks: 24, bpd: { p5: 53.0, p50: 59.3, p95: 65.6 }, hc: { p5: 204.4, p50: 224.4, p95: 244.4 }, ac: { p5: 171.5, p50: 195.9, p95: 220.3 }, fl: { p5: 38.8, p50: 43.8, p95: 48.8 }, efw: { p5: 530, p50: 670, p95: 810 } },
    { gaWeeks: 25, bpd: { p5: 55.8, p50: 62.3, p95: 68.8 }, hc: { p5: 214.8, p50: 235.4, p95: 256.0 }, ac: { p5: 181.7, p50: 207.1, p95: 232.5 }, fl: { p5: 41.2, p50: 46.4, p95: 51.6 }, efw: { p5: 621, p50: 785, p95: 949 } },
    { gaWeeks: 26, bpd: { p5: 58.6, p50: 65.3, p95: 72.0 }, hc: { p5: 224.8, p50: 246.0, p95: 267.2 }, ac: { p5: 191.6, p50: 218.1, p95: 244.6 }, fl: { p5: 43.6, p50: 48.9, p95: 54.2 }, efw: { p5: 722, p50: 913, p95: 1104 } },
    { gaWeeks: 27, bpd: { p5: 61.1, p50: 68.1, p95: 75.1 }, hc: { p5: 234.4, p50: 256.2, p95: 278.0 }, ac: { p5: 201.4, p50: 228.9, p95: 256.4 }, fl: { p5: 45.9, p50: 51.4, p95: 56.9 }, efw: { p5: 835, p50: 1055, p95: 1275 } },
    { gaWeeks: 28, bpd: { p5: 63.6, p50: 70.8, p95: 78.0 }, hc: { p5: 243.7, p50: 266.1, p95: 288.5 }, ac: { p5: 211.0, p50: 239.6, p95: 268.2 }, fl: { p5: 48.2, p50: 53.8, p95: 59.4 }, efw: { p5: 957, p50: 1210, p95: 1463 } },
    { gaWeeks: 29, bpd: { p5: 66.1, p50: 73.5, p95: 80.9 }, hc: { p5: 252.5, p50: 275.5, p95: 298.5 }, ac: { p5: 220.4, p50: 250.0, p95: 279.6 }, fl: { p5: 50.3, p50: 56.1, p95: 61.9 }, efw: { p5: 1091, p50: 1379, p95: 1667 } },
    { gaWeeks: 30, bpd: { p5: 68.4, p50: 76.0, p95: 83.6 }, hc: { p5: 260.8, p50: 284.4, p95: 308.0 }, ac: { p5: 229.5, p50: 260.2, p95: 290.9 }, fl: { p5: 52.5, p50: 58.4, p95: 64.3 }, efw: { p5: 1234, p50: 1559, p95: 1885 } },
    { gaWeeks: 31, bpd: { p5: 70.5, p50: 78.4, p95: 86.3 }, hc: { p5: 268.7, p50: 292.9, p95: 317.1 }, ac: { p5: 238.5, p50: 270.2, p95: 301.9 }, fl: { p5: 54.5, p50: 60.6, p95: 66.7 }, efw: { p5: 1385, p50: 1751, p95: 2117 } },
    { gaWeeks: 32, bpd: { p5: 72.6, p50: 80.7, p95: 88.8 }, hc: { p5: 276.1, p50: 300.9, p95: 325.7 }, ac: { p5: 247.2, p50: 280.0, p95: 312.8 }, fl: { p5: 56.5, p50: 62.7, p95: 68.9 }, efw: { p5: 1545, p50: 1953, p95: 2361 } },
    { gaWeeks: 33, bpd: { p5: 74.6, p50: 82.9, p95: 91.2 }, hc: { p5: 283.0, p50: 308.4, p95: 333.8 }, ac: { p5: 255.8, p50: 289.6, p95: 323.4 }, fl: { p5: 58.4, p50: 64.8, p95: 71.2 }, efw: { p5: 1711, p50: 2162, p95: 2614 } },
    { gaWeeks: 34, bpd: { p5: 76.5, p50: 85.0, p95: 93.5 }, hc: { p5: 289.5, p50: 315.5, p95: 341.5 }, ac: { p5: 264.2, p50: 299.0, p95: 333.8 }, fl: { p5: 60.3, p50: 66.8, p95: 73.3 }, efw: { p5: 1881, p50: 2377, p95: 2874 } },
    { gaWeeks: 35, bpd: { p5: 78.3, p50: 87.0, p95: 95.7 }, hc: { p5: 295.4, p50: 322.0, p95: 348.6 }, ac: { p5: 272.3, p50: 308.2, p95: 344.1 }, fl: { p5: 62.0, p50: 68.7, p95: 75.4 }, efw: { p5: 2053, p50: 2595, p95: 3138 } },
    { gaWeeks: 36, bpd: { p5: 79.8, p50: 88.8, p95: 97.8 }, hc: { p5: 300.7, p50: 327.9, p95: 355.1 }, ac: { p5: 280.4, p50: 317.3, p95: 354.2 }, fl: { p5: 63.8, p50: 70.6, p95: 77.4 }, efw: { p5: 2226, p50: 2813, p95: 3401 } },
    { gaWeeks: 37, bpd: { p5: 81.3, p50: 90.5, p95: 99.7 }, hc: { p5: 305.5, p50: 333.3, p95: 361.1 }, ac: { p5: 288.1, p50: 326.1, p95: 364.1 }, fl: { p5: 65.3, p50: 72.3, p95: 79.3 }, efw: { p5: 2396, p50: 3028, p95: 3661 } },
    { gaWeeks: 38, bpd: { p5: 82.7, p50: 92.1, p95: 101.5 }, hc: { p5: 309.8, p50: 338.2, p95: 366.6 }, ac: { p5: 295.7, p50: 334.7, p95: 373.7 }, fl: { p5: 67.0, p50: 74.1, p95: 81.2 }, efw: { p5: 2560, p50: 3236, p95: 3913 } },
    { gaWeeks: 39, bpd: { p5: 83.9, p50: 93.5, p95: 103.1 }, hc: { p5: 313.5, p50: 342.5, p95: 371.5 }, ac: { p5: 303.0, p50: 343.1, p95: 383.2 }, fl: { p5: 68.4, p50: 75.7, p95: 83.0 }, efw: { p5: 2717, p50: 3435, p95: 4152 } },
    { gaWeeks: 40, bpd: { p5: 84.9, p50: 94.8, p95: 104.7 }, hc: { p5: 316.5, p50: 346.1, p95: 375.7 }, ac: { p5: 310.2, p50: 351.3, p95: 392.4 }, fl: { p5: 69.9, p50: 77.3, p95: 84.7 }, efw: { p5: 2863, p50: 3619, p95: 4375 } }
  ]
};

// ============= Utility Functions =============
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function lerpPct(a: Percentiles, b: Percentiles, t: number): Percentiles {
  return { p5: lerp(a.p5, b.p5, t), p50: lerp(a.p50, b.p50, t), p95: lerp(a.p95, b.p95, t) };
}

function expectedPercentiles(ref: ReferenceSet | null, metric: 'bpd' | 'hc', gaWeeks: number): Percentiles | null {
  if (!ref) return null;
  const rows = ref.rows.filter(r => typeof r.gaWeeks === 'number' && (r as any)[metric]).sort((a, b) => a.gaWeeks - b.gaWeeks);
  if (!rows.length) return null;
  if (gaWeeks <= rows[0].gaWeeks) return (rows[0] as any)[metric] as Percentiles;
  if (gaWeeks >= rows[rows.length - 1].gaWeeks) return (rows[rows.length - 1] as any)[metric] as Percentiles;
  for (let i = 0; i < rows.length - 1; i++) {
    const lo = rows[i], hi = rows[i + 1];
    if (gaWeeks >= lo.gaWeeks && gaWeeks <= hi.gaWeeks) {
      const t = (gaWeeks - lo.gaWeeks) / (hi.gaWeeks - lo.gaWeeks);
      return lerpPct((lo as any)[metric], (hi as any)[metric], t);
    }
  }
  return null;
}

function evaluateMeasurement(value: number, exp: Percentiles) {
  const inRange = value >= exp.p5 && value <= exp.p95;
  const halfBand = Math.max((exp.p95 - exp.p5) / 2, 1e-6);
  const score = (value - exp.p50) / halfBand;
  return { inRange, score, deviation: value - exp.p50, exp };
}

function validateMeasurements(m: Partial<Measurements>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (m.gebelikHaftasi && (m.gebelikHaftasi < 11 || m.gebelikHaftasi > 42)) {
    errors.push({ field: 'gebelikHaftasi', message: 'GA haftası 11-42 arasında olmalı', severity: 'error' });
  }
  if (m.bpd && m.hc) {
    const ratio = m.hc / m.bpd;
    if (ratio < 1.0 || ratio > 2.0) {
      errors.push({ field: 'hc', message: `Anormal HC/BPD oranı: ${ratio.toFixed(2)}`, severity: 'warning' });
    }
  }
  return errors;
}

// ============= OVERLAY SVG - BPD/HC'ye göre scale + Dynamic Features =============
interface OverlayProps {
  measurements: Partial<Measurements>;
  isOutOfRange: boolean;
  bpdRef: number;
  hcRef: number;
}

const DynamicOverlay: React.FC<OverlayProps> = ({ measurements, isOutOfRange, bpdRef, hcRef }) => {
  // Scale factors
  const bpdScale = measurements.bpd ? (measurements.bpd / bpdRef) : 1;
  const hcScale = measurements.hc ? (measurements.hc / hcRef) : 1;

  // Center positions (base model'ın yüz bölgesi)
  const cx = 250;
  const cy = 200;

  // ============= GÖZLER =============
  const eyeRadius = measurements.goz ? (measurements.goz / 8) * 10 : 0;
  const eyeY = cy - 40 * hcScale;
  const eyeSpacing = 60 * bpdScale;

  // ============= BURUN =============
  const noseScale = measurements.burun ? (measurements.burun / 10) * 0.8 : 0;
  const noseY = cy + 20 * hcScale;

  // ============= DUDAKLAR =============
  const mouthWidth = measurements.agizCapi ? (measurements.agizCapi / 30) : 0;
  const mouthY = cy + 60 * hcScale;

  // ============= ÇENE =============
  const chinHeight = measurements.cene ? (measurements.cene / 8) * 15 : 0;

  // ============= YANAKLAR =============
  const cheekOpacity = measurements.goztepe ? clamp((measurements.goztepe / 30), 0, 1) : 0;

  return (
    <svg viewBox="0 0 500 500" className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="ultrasound-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
          <feComposite operator="in" in2="SourceGraphic" />
          <feBlend mode="overlay" in2="SourceGraphic" />
        </filter>
        <radialGradient id="headGradient" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#f5e6d3" />
          <stop offset="70%" stopColor="#e8d5c0" />
          <stop offset="100%" stopColor="#d4bfa8" />
        </radialGradient>
      </defs>

      {/* KAFA ŞEKLİ - BPD ve HC'ye göre şekillenir */}
      <g filter="url(#ultrasound-noise)">
        {/* Ana Kafa Kitlesi - Prominent Forehead & Full Occipital */}
        <path
          d={`
            M ${cx} ${cy - 130 * hcScale}
            C ${cx + 110 * bpdScale} ${cy - 130 * hcScale}, ${cx + 120 * bpdScale} ${cy - 20 * hcScale}, ${cx + 100 * bpdScale} ${cy + 70 * hcScale}
            C ${cx + 80 * bpdScale} ${cy + 130 * hcScale}, ${cx - 80 * bpdScale} ${cy + 130 * hcScale}, ${cx - 100 * bpdScale} ${cy + 70 * hcScale}
            C ${cx - 120 * bpdScale} ${cy - 20 * hcScale}, ${cx - 110 * bpdScale} ${cy - 130 * hcScale}, ${cx} ${cy - 130 * hcScale}
          `}
          fill="url(#headGradient)"
          stroke="#c4a792"
          strokeWidth="1.2"
          opacity="0.95"
        />
        
        {/* Alın Bölgesi (Prominent Forehead Highlight) */}
        <path
          d={`M ${cx - 80 * bpdScale} ${cy - 90 * hcScale} Q ${cx} ${cy - 125 * hcScale} ${cx + 80 * bpdScale} ${cy - 90 * hcScale}`}
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          opacity="0.1"
          filter="url(#glow)"
        />
      </g>

      {/* GÖZLER - Sadece göz input girilmişse çiz */}
      {measurements.goz && eyeRadius > 0 && (
        <>
          {/* Sol göz */}
          <g>
            <ellipse
              cx={cx - eyeSpacing}
              cy={eyeY}
              rx={eyeRadius}
              ry={eyeRadius * 1.15}
              fill="#ffffff"
              stroke="#c4a792"
              strokeWidth="0.8"
              opacity="0.85"
              filter="url(#glow)"
            />
            <circle cx={cx - eyeSpacing - eyeRadius * 0.15} cy={eyeY} r={eyeRadius * 0.6} fill="#2d3748" />
            <circle cx={cx - eyeSpacing - eyeRadius * 0.35} cy={eyeY - eyeRadius * 0.3} r={eyeRadius * 0.3} fill="white" opacity="0.7" />
          </g>

          {/* Sağ göz */}
          <g>
            <ellipse
              cx={cx + eyeSpacing}
              cy={eyeY}
              rx={eyeRadius}
              ry={eyeRadius * 1.15}
              fill="#ffffff"
              stroke="#c4a792"
              strokeWidth="0.8"
              opacity="0.85"
              filter="url(#glow)"
            />
            <circle cx={cx + eyeSpacing + eyeRadius * 0.15} cy={eyeY} r={eyeRadius * 0.6} fill="#2d3748" />
            <circle cx={cx + eyeSpacing + eyeRadius * 0.35} cy={eyeY - eyeRadius * 0.3} r={eyeRadius * 0.3} fill="white" opacity="0.7" />
          </g>

          {/* Kaşlar */}
          <path
            d={`M ${cx - eyeSpacing - eyeRadius * 1.3} ${eyeY - eyeRadius * 1.6} Q ${cx - eyeSpacing} ${eyeY - eyeRadius * 2.2} ${cx - eyeSpacing + eyeRadius * 0.9} ${eyeY - eyeRadius * 1.7}`}
            stroke="#a89080"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d={`M ${cx + eyeSpacing + eyeRadius * 1.3} ${eyeY - eyeRadius * 1.6} Q ${cx + eyeSpacing} ${eyeY - eyeRadius * 2.2} ${cx + eyeSpacing - eyeRadius * 0.9} ${eyeY - eyeRadius * 1.7}`}
            stroke="#a89080"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
        </>
      )}

      {/* BURUN - Sadece burun input girilmişse çiz */}
      {measurements.burun && noseScale > 0 && (
        <g>
          {/* Burun şekli */}
          <path
            d={`M ${cx} ${noseY - 15 * noseScale} L ${cx - 5 * noseScale} ${noseY + 12 * noseScale} L ${cx + 5 * noseScale} ${noseY + 12 * noseScale} Z`}
            fill="#d9c5b0"
            stroke="#c4a792"
            strokeWidth="0.8"
            opacity="0.7"
          />
          {/* Burun delikleri */}
          <circle cx={cx - 3 * noseScale} cy={noseY + 8 * noseScale} r="1.8" fill="#9a8577" opacity="0.8" />
          <circle cx={cx + 3 * noseScale} cy={noseY + 8 * noseScale} r="1.8" fill="#9a8577" opacity="0.8" />
        </g>
      )}

      {/* DUDAKLAR / AĞIZ - Sadece ağız çapı girilmişse çiz */}
      {measurements.agizCapi && mouthWidth > 0 && (
        <>
          {/* Üst dudak */}
          <path
            d={`M ${cx - mouthWidth} ${mouthY} Q ${cx} ${mouthY - 4} ${cx + mouthWidth} ${mouthY}`}
            stroke="#d97070"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Alt dudak */}
          <path
            d={`M ${cx - mouthWidth} ${mouthY} Q ${cx} ${mouthY + 6} ${cx + mouthWidth} ${mouthY}`}
            stroke="#c45a5a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
        </>
      )}

      {/* ÇENE - Retrognathic Jaw (Small & Slightly Back) */}
      {measurements.cene && chinHeight > 0 && (
        <path
          d={`M ${cx - 50 * bpdScale} ${cy + 105 * hcScale} Q ${cx} ${cy + 105 * hcScale + chinHeight * 0.6} ${cx + 50 * bpdScale} ${cy + 105 * hcScale}`}
          stroke="#c4a792"
          strokeWidth="1.5"
          fill="none"
          opacity="0.4"
        />
      )}

      {/* YANAKLAR - Sadece göztepe girilmişse çiz */}
      {measurements.goztepe && cheekOpacity > 0 && (
        <>
          <ellipse
            cx={cx - 70 * bpdScale}
            cy={cy + 20}
            rx={50 * bpdScale}
            ry={30 * hcScale}
            fill="#f0d4c4"
            opacity={cheekOpacity * 0.5}
          />
          <ellipse
            cx={cx + 70 * bpdScale}
            cy={cy + 20}
            rx={50 * bpdScale}
            ry={30 * hcScale}
            fill="#f0d4c4"
            opacity={cheekOpacity * 0.5}
          />
        </>
      )}

      {/* FROMEN ÇİZGİSİ - Sadece fromen girilmişse çiz */}
      {measurements.fromen && (
        <path
          d={`M ${cx - 40 * bpdScale} ${cy - 80 * hcScale} Q ${cx} ${cy - 90 * hcScale} ${cx + 40 * bpdScale} ${cy - 80 * hcScale}`}
          stroke="#c4a792"
          strokeWidth="0.8"
          fill="none"
          opacity="0.2"
        />
      )}
    </svg>
  );
};

// ============= Ana Bileşen =============
const BiometrikFCS: React.FC<BiometrikFCSProps> = ({ onProceedToStudio, initialMeasurements }) => {
  const [measurements, setMeasurements] = useState<Partial<Measurements>>(initialMeasurements || {});
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback((field: keyof Measurements, value: string) => {
    const numValue = parseFloat(value);
    setMeasurements(prev => ({ ...prev, [field]: isNaN(numValue) ? undefined : numValue }));
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleReset = useCallback(() => {
    setMeasurements({});
    setImage(null);
  }, []);

  const gaWeeks = useMemo(() => {
    const ga = measurements.gebelikHaftasi;
    if (!ga || !isFinite(ga)) return null;
    return clamp(ga, 10, 42);
  }, [measurements.gebelikHaftasi]);

  const bpdEval = useMemo(() => {
    if (!gaWeeks || !measurements.bpd) return null;
    const exp = expectedPercentiles(STANDARD_NOMOGRAM, 'bpd', gaWeeks);
    return exp ? evaluateMeasurement(measurements.bpd, exp) : null;
  }, [gaWeeks, measurements.bpd]);

  const hcEval = useMemo(() => {
    if (!gaWeeks || !measurements.hc) return null;
    const exp = expectedPercentiles(STANDARD_NOMOGRAM, 'hc', gaWeeks);
    return exp ? evaluateMeasurement(measurements.hc, exp) : null;
  }, [gaWeeks, measurements.hc]);

  const validationErrors = useMemo(() => validateMeasurements(measurements), [measurements]);
  const isOutOfRange = (bpdEval && !bpdEval.inRange) || (hcEval && !hcEval.inRange);

  const bpdRef = bpdEval?.exp.p50 ?? 57;
  const hcRef = hcEval?.exp.p50 ?? 202;

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-4xl font-medium tracking-tighter text-text-primary">Biometrik FCS</h2>
          <p className="text-[10px] font-medium text-text-secondary uppercase tracking-[0.25em]">
            3D Base Model + Dynamic Overlay
          </p>
        </div>
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition flex items-center gap-2 text-sm font-medium shadow-lg shadow-primary/20"
        >
          <RotateCcw className="w-4 h-4" />
          Sıfırla
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sol Taraf */}
        <div className="lg:col-span-5 space-y-6">
          <SoftCard className="p-0 overflow-hidden">
            <div className="p-6 border-b border-border-subtle bg-slate-50/50">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-text-primary uppercase tracking-widest">
                  Ultrason Görüntüsü
                </span>
              </div>
            </div>
            <div className="p-8">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group overflow-hidden"
              >
                {image ? (
                  <img src={image} className="w-full h-full object-cover" alt="Ultrasound" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-text-primary">Görüntü Yükle</p>
                      <p className="text-[10px] text-text-secondary">JPG, PNG, DICOM</p>
                    </div>
                  </>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>
            </div>
          </SoftCard>

          <SoftCard className="p-0 overflow-hidden">
            <div className="p-6 border-b border-border-subtle bg-slate-50/50">
              <div className="flex items-center gap-3">
                <Microscope className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-text-primary uppercase tracking-widest">
                  Referans Nomogram
                </span>
              </div>
            </div>
            <div className="p-6 bg-emerald-50 border-t border-emerald-100">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-medium text-text-primary">{STANDARD_NOMOGRAM.label}</p>
                  <p className="text-text-secondary">✓ Otomatik • {STANDARD_NOMOGRAM.rows.length} hafta</p>
                </div>
              </div>
            </div>
          </SoftCard>

          <SoftCard className="p-0 overflow-hidden">
            <div className="p-6 border-b border-border-subtle bg-slate-50/50">
              <span className="text-xs font-medium text-text-primary uppercase tracking-widest flex items-center gap-2">
                <Microscope className="w-5 h-5 text-primary" />
                Doktor Ölçümleri
              </span>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="GA (hafta)" value={measurements.gebelikHaftasi} onChange={(v) => handleInputChange('gebelikHaftasi', v)} />
                <InputField label="BPD (mm)" value={measurements.bpd} onChange={(v) => handleInputChange('bpd', v)} />
                <InputField label="HC (mm)" value={measurements.hc} onChange={(v) => handleInputChange('hc', v)} />
                <InputField label="Fromen" value={measurements.fromen} onChange={(v) => handleInputChange('fromen', v)} />
                <InputField label="Burun (mm)" value={measurements.burun} onChange={(v) => handleInputChange('burun', v)} />
                <InputField label="Göztepe" value={measurements.goztepe} onChange={(v) => handleInputChange('goztepe', v)} />
                <InputField label="BiocCap" value={measurements.bioccap} onChange={(v) => handleInputChange('bioccap', v)} />
                <InputField label="Çene (mm)" value={measurements.cene} onChange={(v) => handleInputChange('cene', v)} />
                <InputField label="Ağız çapı (mm)" value={measurements.agizcapi} onChange={(v) => handleInputChange('agizcapi', v)} />
                <InputField label="Ön-arka baş (AC)" value={measurements.onarka_bas} onChange={(v) => handleInputChange('onarka_bas', v)} />
                <InputField label="Göz (mm)" value={measurements.goz} onChange={(v) => handleInputChange('goz', v)} />
              </div>

              {validationErrors.length > 0 && (
                <div className="space-y-2">
                  {validationErrors.map((err, i) => (
                    <div key={i} className={`p-2 rounded text-[11px] flex gap-2 ${err.severity === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {err.message}
                    </div>
                  ))}
                </div>
              )}

              {(bpdEval || hcEval) && (
                <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                  {bpdEval && <EvalRow title="BPD" value={measurements.bpd!} unit="mm" exp={bpdEval.exp} inRange={bpdEval.inRange} />}
                  {hcEval && <EvalRow title="HC" value={measurements.hc!} unit="mm" exp={hcEval.exp} inRange={hcEval.inRange} />}
                </div>
              )}
            </div>
          </SoftCard>
        </div>

        {/* Sağ Taraf - 3D Base Model + Overlay */}
        <div className="lg:col-span-7">
          <div className="sticky top-8">
            <SoftCard className="aspect-square flex items-center justify-center bg-slate-100 relative overflow-hidden">
              {/* Base 3D Model (PNG) */}
              <div className="absolute inset-0 w-full h-full bg-[#f8f9fa] flex items-center justify-center">
                {/* Background subtle pattern or gradient */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
              </div>

              {/* Dynamic Overlay SVG */}
              {(measurements.goz || measurements.burun || measurements.agizCapi || measurements.cene || measurements.goztepe || measurements.fromen || measurements.bpd || measurements.hc) && (
                <DynamicOverlay
                  measurements={measurements}
                  isOutOfRange={isOutOfRange || false}
                  bpdRef={bpdRef}
                  hcRef={hcRef}
                />
              )}
            </SoftCard>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => onProceedToStudio(measurements)}
          disabled={!measurements.bpd || !measurements.hc || validationErrors.some(e => e.severity === 'error')}
          className="px-16 py-5 bg-[#2563eb] text-white rounded-full text-sm font-medium uppercase tracking-widest hover:scale-105 active:scale-95 transition disabled:opacity-50 shadow-xl shadow-primary/20"
        >
          Devam Et <ArrowRight className="w-5 h-5 ml-2 inline" />
        </button>
      </div>
    </div>
  );
};

// ============= Yardımcı Bileşenler =============
const EvalRow: React.FC<{ title: string; value: number; unit: string; exp: Percentiles; inRange: boolean }> = ({
  title,
  value,
  exp,
  unit,
  inRange,
}) => (
  <div className="flex justify-between items-center text-sm">
    <div className="flex gap-2 items-center">
      <span className="font-medium">{title}</span>
      <span className={`text-[10px] px-2 py-1 rounded ${inRange ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
        {inRange ? 'Aralıkta' : 'Dışında'}
      </span>
    </div>
    <div className="text-right">
      <div className="font-medium">{value.toFixed(1)}{unit}</div>
      <div className="text-[9px] text-slate-500">P5: {exp.p5.toFixed(0)} | P50: {exp.p50.toFixed(0)} | P95: {exp.p95.toFixed(0)}</div>
    </div>
  </div>
);

const InputField: React.FC<{ label: string; value?: number; onChange: (v: string) => void; required?: boolean }> = ({
  label,
  value,
  onChange,
  required,
}) => (
  <div className="space-y-1">
    <label className="text-[9px] font-medium text-slate-600 uppercase">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="number"
      step="0.1"
      value={value === undefined ? '' : value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Girişi boş bırak"
      className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>
);

export default BiometrikFCS;