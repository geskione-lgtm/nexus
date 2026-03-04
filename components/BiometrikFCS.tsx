import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, Microscope, ArrowRight, Info, AlertCircle, CheckCircle, RotateCcw, Zap, Activity } from 'lucide-react';
import { SoftCard } from './ui/SoftCard';
import { parseGA, formatGA } from '../constants';
import { generateFetalImage } from '../services/geminiService';
import { biometrikFcsPythonService, MorphWeights } from '../services/biometrikFcsPythonService';

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
  ustDudak: number;
}

interface Landmark {
  x: number;
  y: number;
  label: string;
}

type Percentiles = { p5: number; p50: number; p95: number };
type RefRow = { gaWeeks: number; bpd?: Percentiles; hc?: Percentiles; ac?: Percentiles; fl?: Percentiles; efw?: Percentiles };
type ReferenceSet = { id: string; label: string; rows: RefRow[]; meta?: any };
type ValidationError = { field: keyof Measurements; message: string; severity: 'warning' | 'error' };

interface BiometrikFCSProps {
  onProceedToStudio: (measurements: Partial<Measurements>, landmarks?: Record<string, {x: number, y: number}>, guideImage?: string) => void;
  initialMeasurements?: Partial<Measurements>;
}

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
  landmarks?: Record<string, {x: number, y: number}>;
  morphWeights?: MorphWeights;
}

const DynamicOverlay: React.FC<OverlayProps> = ({ measurements, isOutOfRange, bpdRef, hcRef, landmarks }) => {
  // Scale factors
  const bpdScale = measurements.bpd ? (measurements.bpd / bpdRef) : 1;
  const hcScale = measurements.hc ? (measurements.hc / hcRef) : 1;

  // Use landmarks if available, otherwise use defaults
  const v = landmarks?.vertex || { x: 250, y: 70 };
  const n = landmarks?.nasion || { x: 250, y: 185 };
  const s = landmarks?.subnasale || { x: 250, y: 240 };
  const m = landmarks?.menton || { x: 250, y: 350 };

  // Calculate center and rotation based on landmarks
  const cx = (v.x + m.x) / 2;
  const cy = (v.y + m.y) / 2;
  
  // Feature positions (relative to landmarks)
  const eyeY = n.y - 20 * hcScale;
  const eyeSpacing = 55 * bpdScale;
  const eyeSize = measurements.goz ? (measurements.goz / 10) * 12 : 12;

  const noseY = n.y + (s.y - n.y) / 2;
  const noseSize = measurements.burun ? (measurements.burun / 10) * 15 : 15;

  const upperLipY = measurements.ustDudak ? s.y + (measurements.ustDudak * 2) : s.y + 15;

  const mouthY = s.y + (m.y - s.y) / 2;
  const mouthWidth = measurements.agizcapi ? (measurements.agizcapi / 15) * 20 : 20;

  return (
    <svg viewBox="0 0 500 500" className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
      <defs>
        {/* Medical Glow */}
        <filter id="medGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Ultrasound Texture Filter */}
        <filter id="ultrasoundTexture">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
          <feComposite operator="in" in2="SourceGraphic" />
          <feBlend mode="overlay" in2="SourceGraphic" />
        </filter>

        {/* Anatomical Shading Gradient */}
        <radialGradient id="anatomicalGradient" cx="45%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fdf6ed" />
          <stop offset="40%" stopColor="#f5e6d3" />
          <stop offset="85%" stopColor="#e8d5c0" />
          <stop offset="100%" stopColor="#d4bfa8" />
        </radialGradient>

        {/* HUD Line Pattern */}
        <pattern id="hudGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(37, 99, 235, 0.05)" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Background HUD Layer */}
      <rect width="500" height="500" fill="url(#hudGrid)" />
      
      {/* Technical Calipers (Visualizing BPD/HC) */}
      <g opacity="0.4">
        {/* BPD Caliper Line */}
        <line 
          x1={cx - 120 * bpdScale} y1={cy} x2={cx + 120 * bpdScale} y2={cy} 
          stroke="#2563eb" strokeWidth="0.5" strokeDasharray="4 2" 
        />
        <path d={`M ${cx - 120 * bpdScale} ${cy - 10} L ${cx - 120 * bpdScale} ${cy + 10}`} stroke="#2563eb" strokeWidth="1" />
        <path d={`M ${cx + 120 * bpdScale} ${cy - 10} L ${cx + 120 * bpdScale} ${cy + 10}`} stroke="#2563eb" strokeWidth="1" />
        <text x={cx} y={cy - 5} textAnchor="middle" className="text-[8px] font-mono fill-blue-600 font-bold">BPD AXIS</text>

        {/* HC Caliper Circle (Subtle) */}
        <ellipse 
          cx={cx} cy={cy} rx={125 * bpdScale} ry={145 * hcScale} 
          fill="none" stroke="#2563eb" strokeWidth="0.5" strokeDasharray="2 4" 
        />
      </g>

      {/* ANATOMICAL HEAD STRUCTURE */}
      <g filter="url(#ultrasoundTexture)">
        {/* Main Cranial Mass */}
        <path
          d={`
            M ${v.x} ${v.y}
            C ${v.x + 130 * bpdScale} ${v.y}, ${m.x + 140 * bpdScale} ${m.y - 100 * hcScale}, ${m.x + 115 * bpdScale} ${m.y}
            C ${m.x + 90 * bpdScale} ${m.y + 50 * hcScale}, ${m.x - 90 * bpdScale} ${m.y + 50 * hcScale}, ${m.x - 115 * bpdScale} ${m.y}
            C ${m.x - 140 * bpdScale} ${m.y - 100 * hcScale}, ${v.x - 130 * bpdScale} ${v.y}, ${v.x} ${v.y}
          `}
          fill="url(#anatomicalGradient)"
          stroke="#c4a792"
          strokeWidth="1.5"
          className="transition-all duration-700 ease-in-out"
        />

        {/* Forehead Highlight (Anatomical Volume) */}
        <path
          d={`M ${cx - 90 * bpdScale} ${cy - 110 * hcScale} Q ${cx} ${cy - 145 * hcScale} ${cx + 90 * bpdScale} ${cy - 110 * hcScale}`}
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
          opacity="0.15"
          filter="url(#medGlow)"
        />

        {/* Orbital Ridges (Kaş Üstü Kemikleri) */}
        <path
          d={`M ${cx - 80 * bpdScale} ${eyeY - 15} Q ${cx - 55 * bpdScale} ${eyeY - 25} ${cx - 30 * bpdScale} ${eyeY - 15}`}
          fill="none"
          stroke="#c4a792"
          strokeWidth="1"
          opacity="0.3"
        />
        <path
          d={`M ${cx + 30 * bpdScale} ${eyeY - 15} Q ${cx + 55 * bpdScale} ${eyeY - 25} ${cx + 80 * bpdScale} ${eyeY - 15}`}
          fill="none"
          stroke="#c4a792"
          strokeWidth="1"
          opacity="0.3"
        />
      </g>

      {/* EYES (Anatomical Rendering) */}
      {measurements.goz && (
        <g opacity="0.85">
          {/* Left Eye */}
          <g transform={`translate(${cx - eyeSpacing}, ${eyeY})`}>
            <path d={`M -${eyeSize} 0 Q 0 -${eyeSize * 0.7} ${eyeSize} 0 Q 0 ${eyeSize * 0.7} -${eyeSize} 0`} fill="white" stroke="#c4a792" strokeWidth="0.5" />
            <circle r={eyeSize * 0.4} fill="#2d3748" />
            <circle cx={-eyeSize * 0.15} cy={-eyeSize * 0.15} r={eyeSize * 0.15} fill="white" opacity="0.8" />
          </g>
          {/* Right Eye */}
          <g transform={`translate(${cx + eyeSpacing}, ${eyeY})`}>
            <path d={`M -${eyeSize} 0 Q 0 -${eyeSize * 0.7} ${eyeSize} 0 Q 0 ${eyeSize * 0.7} -${eyeSize} 0`} fill="white" stroke="#c4a792" strokeWidth="0.5" />
            <circle r={eyeSize * 0.4} fill="#2d3748" />
            <circle cx={-eyeSize * 0.15} cy={-eyeSize * 0.15} r={eyeSize * 0.15} fill="white" opacity="0.8" />
          </g>
        </g>
      )}

      {/* NOSE (Anatomical Bridge & Tip) */}
      {measurements.burun && (
        <g transform={`translate(${cx}, ${noseY})`} opacity="0.6">
          <path 
            d={`M 0 -${noseSize * 0.8} Q -${noseSize * 0.2} 0 -${noseSize * 0.4} ${noseSize * 0.4} Q 0 ${noseSize * 0.6} ${noseSize * 0.4} ${noseSize * 0.4} Q ${noseSize * 0.2} 0 0 -${noseSize * 0.8}`}
            fill="#d9c5b0"
            stroke="#c4a792"
            strokeWidth="0.8"
          />
          <circle cx={-noseSize * 0.15} cy={noseSize * 0.3} r="1.5" fill="#9a8577" />
          <circle cx={noseSize * 0.15} cy={noseSize * 0.3} r="1.5" fill="#9a8577" />
        </g>
      )}

      {/* UPPER LIP (New Feature) */}
      {measurements.ustDudak && (
        <g transform={`translate(${cx}, ${upperLipY})`} opacity="0.8">
          <path 
            d={`M -15 -2 Q -7 -5 0 -2 Q 7 -5 15 -2`}
            fill="none" stroke="#d97070" strokeWidth="1.5" strokeLinecap="round"
          />
        </g>
      )}

      {/* MOUTH (Soft Tissue Rendering) */}
      {measurements.agizcapi && (
        <g transform={`translate(${cx}, ${mouthY})`} opacity="0.7">
          {/* Upper Lip (Cupid's Bow) */}
          <path 
            d={`M -${mouthWidth} 0 Q -${mouthWidth * 0.5} -5 0 -2 Q ${mouthWidth * 0.5} -5 ${mouthWidth} 0`}
            fill="none" stroke="#d97070" strokeWidth="2" strokeLinecap="round"
          />
          {/* Lower Lip */}
          <path 
            d={`M -${mouthWidth} 0 Q 0 8 ${mouthWidth} 0`}
            fill="none" stroke="#c45a5a" strokeWidth="1.5" strokeLinecap="round"
          />
        </g>
      )}

      {/* CHIN & JAWLINE */}
      <path
        d={`M ${cx - 60 * bpdScale} ${cy + 120 * hcScale} Q ${cx} ${cy + 135 * hcScale} ${cx + 60 * bpdScale} ${cy + 120 * hcScale}`}
        stroke="#c4a792"
        strokeWidth="1.5"
        fill="none"
        opacity="0.3"
      />

      {/* HUD LABELS & METRICS */}
      <g className="text-[7px] font-mono fill-blue-500/60 font-bold">
        <text x="40" y="40">SCAN_MODE: FCS_DYNAMIC</text>
        <text x="40" y="52">SIGNAL_STRENGTH: 98.4%</text>
        <text x="40" y="64">RENDER_ENGINE: NEOBREED_V4</text>
        
        <text x="400" y="40" textAnchor="end">GA: {measurements.ga || '--'} WEEKS</text>
        <text x="400" y="52" textAnchor="end">BPD: {measurements.bpd || '--'} MM</text>
        <text x="400" y="64" textAnchor="end">HC: {measurements.hc || '--'} MM</text>
      </g>

      {/* SCANNING LINE ANIMATION */}
      <motion.line
        x1="50" x2="450"
        initial={{ y: 50 }}
        animate={{ y: 450 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        stroke="rgba(37, 99, 235, 0.2)"
        strokeWidth="1"
        filter="url(#medGlow)"
      />
    </svg>
  );
};

const createGuideImage = (landmarks: Record<string, {x: number, y: number}>, measurements: Partial<Measurements>): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Black background
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 512, 512);

  // White dots and lines
  ctx.strokeStyle = 'white';
  ctx.fillStyle = 'white';
  ctx.lineWidth = 3;

  const points = {
    vertex: landmarks.vertex ? { x: landmarks.vertex.x * 5.12, y: landmarks.vertex.y * 5.12 } : null,
    nasion: landmarks.nasion ? { x: landmarks.nasion.x * 5.12, y: landmarks.nasion.y * 5.12 } : null,
    subnasale: landmarks.subnasale ? { x: landmarks.subnasale.x * 5.12, y: landmarks.subnasale.y * 5.12 } : null,
    menton: landmarks.menton ? { x: landmarks.menton.x * 5.12, y: landmarks.menton.y * 5.12 } : null,
  };

  // Draw skull oval
  if (points.vertex && points.menton) {
    const cx = (points.vertex.x + points.menton.x) / 2;
    const cy = (points.vertex.y + points.menton.y) / 2;
    const rx = Math.abs(points.vertex.y - points.menton.y) * 0.45;
    const ry = Math.abs(points.vertex.y - points.menton.y) * 0.55;
    
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Axis
    ctx.beginPath();
    ctx.moveTo(points.vertex.x, points.vertex.y);
    ctx.lineTo(points.menton.x, points.menton.y);
    ctx.stroke();
  }

  if (points.nasion && points.subnasale) {
    ctx.beginPath();
    ctx.moveTo(points.nasion.x, points.nasion.y);
    ctx.lineTo(points.nasion.x + 25, (points.nasion.y + points.subnasale.y) / 2);
    ctx.lineTo(points.subnasale.x, points.subnasale.y);
    ctx.stroke();
  }

  // Dots
  Object.values(points).forEach(p => {
    if (p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  return canvas.toDataURL('image/png');
};

const FetalHeadMorphPreview: React.FC<OverlayProps> = ({ measurements, isOutOfRange, bpdRef, hcRef, landmarks, morphWeights }) => {
  const bpdScale = measurements.bpd ? (measurements.bpd / bpdRef) : 1;
  const hcScale = measurements.hc ? (measurements.hc / hcRef) : 1;

  // Apply morph weights if available
  const headRoundness = morphWeights?.head_roundness ?? 0.5;
  const chinProjection = morphWeights?.chin_projection ?? 0.5;
  const noseLength = morphWeights?.nose_length ?? 0.5;

  // Scale percentage landmarks (0-100) to SVG coordinates (0-500)
  const scale = (p: {x: number, y: number} | undefined, def: {x: number, y: number}) => {
    if (!p) return def;
    return { x: (p.x / 100) * 500, y: (p.y / 100) * 500 };
  };

  const v = scale(landmarks?.vertex, { x: 250, y: 70 });
  const n = scale(landmarks?.nasion, { x: 250, y: 185 });
  const s = scale(landmarks?.subnasale, { x: 250, y: 240 });
  const m = scale(landmarks?.menton, { x: 250, y: 350 });

  const cx = (v.x + m.x) / 2;
  const cy = (v.y + m.y) / 2;
  
  const headWidth = 120 * bpdScale * (0.8 + headRoundness * 0.4);
  const headHeight = Math.abs(m.y - v.y);
  
  // Bezier points for a realistic profile silhouette
  const foreheadX = v.x - 20 * bpdScale;
  const backHeadX = v.x + 130 * bpdScale;
  
  // Adjust chin and nose based on weights
  const adjustedMentonX = m.x + (chinProjection - 0.5) * 40;
  const adjustedSubnasaleX = s.x + (noseLength - 0.5) * 30;

  return (
    <svg viewBox="0 0 500 500" className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(37, 99, 235, 0.1)" />
          <stop offset="100%" stopColor="rgba(37, 99, 235, 0.02)" />
        </linearGradient>
      </defs>

      {/* Silhouette Path */}
      <path
        d={`
          M ${v.x} ${v.y}
          C ${v.x + headWidth * 1.2} ${v.y}, ${adjustedMentonX + headWidth * 1.2} ${m.y - headHeight * 0.3}, ${adjustedMentonX} ${m.y}
          C ${adjustedMentonX - headWidth * 0.5} ${m.y + 20}, ${adjustedSubnasaleX - 40} ${s.y + 20}, ${adjustedSubnasaleX} ${s.y}
          C ${adjustedSubnasaleX + 20} ${s.y - (s.y-n.y)/2}, ${n.x + 20} ${n.y + (s.y-n.y)/2}, ${n.x} ${n.y}
          C ${n.x - 40} ${n.y - 20}, ${v.x - 40} ${v.y + 20}, ${v.x} ${v.y}
          Z
        `}
        fill="url(#headGrad)"
        stroke="#2563eb"
        strokeWidth="2"
        strokeDasharray="4 2"
        filter="url(#glow)"
        className="transition-all duration-300 ease-out"
      />

      {/* Structural Lines */}
      <line x1={v.x} y1={v.y} x2={adjustedMentonX} y2={m.y} stroke="rgba(37, 99, 235, 0.2)" strokeWidth="1" />
      <line x1={n.x} y1={n.y} x2={adjustedSubnasaleX} y2={s.y} stroke="rgba(37, 99, 235, 0.2)" strokeWidth="1" />

      {/* Landmarks */}
      {[v, n, {x: adjustedSubnasaleX, y: s.y}, {x: adjustedMentonX, y: m.y}].map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#2563eb" />
      ))}
    </svg>
  );
};

// ============= Ana Bileşen =============
const BiometrikFCS: React.FC<BiometrikFCSProps> = ({ onProceedToStudio, initialMeasurements }) => {
  const [measurements, setMeasurements] = useState<Partial<Measurements>>(initialMeasurements || {});
  const [image, setImage] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<Record<string, {x: number, y: number}>>({});
  const [activeLandmark, setActiveLandmark] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [baseFetalImages, setBaseFetalImages] = useState<Record<string, string>>({});
  const [activeView, setActiveView] = useState<'front' | 'profile' | 'top'>('front');
  const [isGeneratingPrototype, setIsGeneratingPrototype] = useState(false);
  const [morphWeights, setMorphWeights] = useState<MorphWeights | undefined>(undefined);
  const [isCalculatingWeights, setIsCalculatingWeights] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const landmarkTypes = [
    { id: 'vertex', label: 'Alın/Tepe', color: 'bg-red-500' },
    { id: 'nasion', label: 'Burun Kökü', color: 'bg-blue-500' },
    { id: 'subnasale', label: 'Burun Altı', color: 'bg-green-500' },
    { id: 'menton', label: 'Çene Ucu', color: 'bg-yellow-500' },
  ];

  const handleImageClick = (e: React.MouseEvent) => {
    if (!activeLandmark || !imageContainerRef.current) return;
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setLandmarks(prev => ({
      ...prev,
      [activeLandmark]: { x, y }
    }));
    
    // Auto-advance to next landmark
    const currentIndex = landmarkTypes.findIndex(l => l.id === activeLandmark);
    if (currentIndex < landmarkTypes.length - 1) {
      setActiveLandmark(landmarkTypes[currentIndex + 1].id);
    } else {
      setActiveLandmark(null);
    }
  };

  const handleInputChange = useCallback((field: keyof Measurements, value: string) => {
    if (field === 'gebelikHaftasi') {
      const numValue = parseGA(value);
      setMeasurements(prev => ({ ...prev, [field]: numValue }));
    } else {
      const numValue = parseFloat(value);
      setMeasurements(prev => ({ ...prev, [field]: isNaN(numValue) ? undefined : numValue }));
    }
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
    setLandmarks({});
    setBaseFetalImages({});
    setActiveView('front');
    setMorphWeights(undefined);
  }, []);

  // Fetch morph weights from Python service when measurements change
  useEffect(() => {
    const fetchWeights = async () => {
      if (!gaWeeks) return;
      
      setIsCalculatingWeights(true);
      try {
        const response = await biometrikFcsPythonService.getWeights({
          ga_weeks: gaWeeks,
          bpd_mm: measurements.bpd,
          hc_mm: measurements.hc,
          nb_mm: measurements.burun,
          chin_mm: measurements.cene,
          jaw_mm: measurements.bioccap,
          seed: 12345, // Fixed seed for determinism
          template: 'default'
        });
        setMorphWeights(response.weights);
      } catch (err) {
        console.error('Failed to fetch morph weights:', err);
      } finally {
        setIsCalculatingWeights(false);
      }
    };

    const debounceTimer = setTimeout(fetchWeights, 500);
    return () => clearTimeout(debounceTimer);
  }, [gaWeeks, measurements.bpd, measurements.hc, measurements.burun, measurements.cene, measurements.bioccap]);

  const handleGeneratePrototype = async () => {
    if (!image) return;
    setIsGeneratingPrototype(true);
    try {
      const views: ('front' | 'profile' | 'top')[] = ['front', 'profile', 'top'];
      
      const results = await Promise.all(
        views.map(view => 
          generateFetalImage(
            gaWeeks || 20,
            measurements,
            image,
            view
          ).catch(err => {
            console.error(`Failed to generate ${view} view:`, err);
            return null;
          })
        )
      );

      const newImages: Record<string, string> = {};
      views.forEach((view, index) => {
        if (results[index]) {
          newImages[view] = results[index] as string;
        }
      });

      setBaseFetalImages(prev => ({ ...prev, ...newImages }));
    } catch (err) {
      console.error("Fetal prototype generation failed:", err);
    } finally {
      setIsGeneratingPrototype(false);
    }
  };

  const switchView = (view: 'front' | 'profile' | 'top') => {
    setActiveView(view);
  };

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
            <div className="p-6 border-b border-border-subtle bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-text-primary uppercase tracking-widest">
                  1. Ultrason & Landmark İşaretleme
                </span>
              </div>
              {image && (
                <button 
                  onClick={() => setActiveLandmark(landmarkTypes[0].id)}
                  className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                >
                  Yeniden İşaretle
                </button>
              )}
            </div>
            <div className="p-6 space-y-4">
              <div
                ref={imageContainerRef}
                onClick={handleImageClick}
                className={`aspect-video rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#2563eb]/50 transition-all group overflow-hidden relative ${activeLandmark ? 'cursor-crosshair' : ''}`}
              >
                {image ? (
                  <>
                    <img src={image} className="w-full h-full object-cover grayscale contrast-125" alt="Ultrasound" />
                    {/* Landmark Dots */}
                    {Object.entries(landmarks).map(([id, pos]) => {
                      const type = landmarkTypes.find(l => l.id === id);
                      return (
                        <div 
                          key={id}
                          className={`absolute w-3 h-3 rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 ${type?.color}`}
                          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                        >
                          <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[8px] font-bold text-white bg-black/50 px-1 rounded whitespace-nowrap">
                            {type?.label}
                          </span>
                        </div>
                      );
                    })}
                    {activeLandmark && (
                      <div className="absolute inset-0 bg-primary/5 flex items-start justify-center pt-4 pointer-events-none">
                        <span className="px-4 py-2 bg-primary text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg animate-pulse">
                          Lütfen İşaretleyin: {landmarkTypes.find(l => l.id === activeLandmark)?.label}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-4">
                    <Upload className="w-8 h-8 text-slate-400" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-text-primary">Görüntü Yükle</p>
                      <p className="text-[10px] text-text-secondary">JPG, PNG, DICOM</p>
                    </div>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>

              {image && !activeLandmark && Object.keys(landmarks).length < 4 && (
                <button 
                  onClick={() => setActiveLandmark(landmarkTypes[0].id)}
                  className="w-full py-3 bg-primary/10 text-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all"
                >
                  Anatomik Noktaları İşaretle (Zorunlu)
                </button>
              )}
            </div>
          </SoftCard>

          {image && Object.keys(landmarks).length === 4 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <SoftCard className={`p-0 overflow-hidden border-primary/20 ${baseFetalImages[activeView] ? 'bg-emerald-50/30' : 'bg-primary/5'}`}>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${baseFetalImages[activeView] ? 'bg-emerald-100' : 'bg-primary/20'}`}>
                      {baseFetalImages[activeView] ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Microscope className="w-4 h-4 text-primary" />}
                    </div>
                    <div>
                      <h4 className={`text-[11px] font-bold uppercase tracking-widest ${baseFetalImages[activeView] ? 'text-emerald-700' : 'text-primary'}`}>
                        2. 3D Kafa/Yüz Taslağı Oluşturma
                      </h4>
                      <p className={`text-[10px] font-medium ${baseFetalImages[activeView] ? 'text-emerald-600/60' : 'text-primary/60'}`}>
                        {baseFetalImages[activeView] ? '3D Kafa Prototipi başarıyla üretildi.' : 'İşaretlenen noktalara göre kafa yapısı üretilecek.'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleGeneratePrototype}
                    disabled={isGeneratingPrototype}
                    className={`w-full py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${
                      isGeneratingPrototype 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : Object.keys(baseFetalImages).length > 0
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200' 
                          : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'
                    }`}
                  >
                    {isGeneratingPrototype ? (
                      <>
                        <div className="w-3 h-3 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></div>
                        3 Açı Üretiliyor...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3" />
                        {Object.keys(baseFetalImages).length > 0 ? 'Tüm Görünümleri Güncelle' : '3D Kafa Taslağı Üret (3 Açı)'}
                      </>
                    )}
                  </button>
                </div>
              </SoftCard>
            </motion.div>
          )}

          <div className={image && Object.keys(landmarks).length === 4 ? 'opacity-100' : 'opacity-30 pointer-events-none'}>
            <SoftCard className="p-0 overflow-hidden">
              <div className="p-6 border-b border-border-subtle bg-slate-50/50">
                <span className="text-xs font-medium text-text-primary uppercase tracking-widest flex items-center gap-2">
                  <Microscope className="w-5 h-5 text-primary" />
                  3. Doktor Ölçümleri (Biyometrik Veri)
                </span>
              </div>
              <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-medium text-slate-600 uppercase">GA (HAFTA/GÜN)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={measurements.gebelikHaftasi !== undefined ? formatGA(measurements.gebelikHaftasi) : ''}
                      onChange={(e) => handleInputChange('gebelikHaftasi', e.target.value)}
                      placeholder="21w6d"
                      className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                    {measurements.gebelikHaftasi !== undefined && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-[#2563eb]">
                        {measurements.gebelikHaftasi.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
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
                <InputField label="Üst Dudak (mm)" value={measurements.ustDudak} onChange={(v) => handleInputChange('ustDudak', v)} />
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
      </div>

      {/* Sağ Taraf - 3D Base Model + Overlay */}
      <div className="lg:col-span-7">
          <div className="sticky top-8">
            <SoftCard className="aspect-square flex items-center justify-center bg-slate-100 relative overflow-hidden">
              {/* Base 3D Model (PNG) */}
              <div className="absolute inset-0 w-full h-full bg-[#f8f9fa] flex items-center justify-center">
                {baseFetalImages[activeView] ? (
                  <div className="relative w-full h-full">
                    <img src={baseFetalImages[activeView]} className="w-full h-full object-contain" alt="3D Head Prototype" />
                    
                    {/* 3D View Controls (AutoCAD Style) */}
                    <div className="absolute top-6 right-6 flex flex-col gap-2 z-50">
                      {[
                        { id: 'top', label: 'ÜST' },
                        { id: 'front', label: 'ÖN' },
                        { id: 'profile', label: 'YAN' }
                      ].map(v => (
                        <button
                          key={v.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            switchView(v.id as any);
                          }}
                          className={`w-12 h-12 rounded-lg border flex items-center justify-center text-[10px] font-black transition-all shadow-soft pointer-events-auto ${
                            activeView === v.id 
                              ? 'bg-primary text-white border-primary scale-110 z-10' 
                              : 'bg-white text-slate-400 border-slate-200 hover:border-primary/50'
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>

                    <div className="absolute top-6 left-6 px-4 py-2 bg-white/80 backdrop-blur rounded-full border border-border-subtle shadow-soft">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                        3D KAFA PROTOTİPİ: {activeView === 'front' ? 'ÖN' : activeView === 'profile' ? 'YAN' : 'ÜST'} GÖRÜNÜM
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
                )}
              </div>

                  {/* Morph Preview - Removed the confusing SVG overlay as requested */}
                  {image && !baseFetalImages[activeView] && (
                    <div className="absolute inset-0 w-full h-full pointer-events-none">
                      <img src={image} className="w-full h-full object-cover opacity-30 grayscale" alt="Ultrasound BG" />
                    </div>
                  )}

                  {/* Dynamic Morph Overlay using Python-calculated weights */}
                  <FetalHeadMorphPreview
                    measurements={measurements}
                    isOutOfRange={isOutOfRange || false}
                    bpdRef={bpdRef}
                    hcRef={hcRef}
                    landmarks={landmarks}
                    morphWeights={morphWeights}
                  />

                  {/* Intelligence Status Indicator */}
                  <div className="absolute bottom-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full border border-primary/20 shadow-sm z-50">
                    <div className={`w-2 h-2 rounded-full ${isCalculatingWeights ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {isCalculatingWeights ? 'Zeka Hesaplıyor...' : 'Deformasyon Zekası Aktif'}
                    </span>
                  </div>
            </SoftCard>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => {
            onProceedToStudio(measurements, landmarks, baseFetalImages.front || baseFetalImages.profile || undefined);
          }}
          disabled={!measurements.bpd || !measurements.hc || Object.keys(landmarks).length < 4 || validationErrors.some(e => e.severity === 'error')}
          className="px-16 py-5 bg-[#2563eb] text-white rounded-full text-sm font-medium uppercase tracking-widest hover:scale-105 active:scale-95 transition disabled:opacity-50 shadow-xl shadow-primary/20"
        >
          Sentezi Başlat <ArrowRight className="w-5 h-5 ml-2 inline" />
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