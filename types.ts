
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
  createdAt: string;
}
