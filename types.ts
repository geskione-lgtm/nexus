
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  DOCTOR = 'DOCTOR'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clinicName?: string;
  packageId?: string;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  limit: number; // monthly generation limit
  features: string[];
}

export interface Patient {
  id: string;
  name: string;
  weeksPregnant: number;
  doctorId: string;
  lastScanDate: string;
  phone: string;
  email?: string;
}

export interface ScanResult {
  id: string;
  patientId: string;
  ultrasoundUrl: string;
  babyFaceUrl: string;
  measurements?: any;
  createdAt: string;
  isDualView?: boolean;
  scale_mm_per_px?: number | null;
}

export interface ReconstructionProof {
  id: string;
  created_at: string;
  clinic_id?: string;
  patient_id: string;
  scan_result_id: string;
  model_version: string;
  landmarks: {
    ultrasound: Record<string, { x: number; y: number }>;
    generated: Record<string, { x: number; y: number }>;
  };
  deviations_px: Record<string, number>;
  deviations_pct: Record<string, number>;
  deviations_mm: Record<string, number> | null;
  mmAvailable: boolean;
  scale_mm_per_px?: number | null;
  scores: {
    final: number;
    landmark: number;
    contour: number;
    angle: number;
  };
  input_measurements: any;
}
