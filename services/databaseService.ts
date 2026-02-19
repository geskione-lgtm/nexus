import { supabase } from './supabaseClient';
import { User, Patient, ScanResult, UserRole } from '../types';

const isConfigured = () => {
  const { supabaseUrl } = (supabase as any);
  return supabaseUrl && !supabaseUrl.includes('placeholder');
};

export const DatabaseService = {
  // --- AUTH & PROFILES ---
  async getCurrentProfile(): Promise<User | null> {
    if (!isConfigured()) return null;
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data) return null;
      
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        clinicName: data.clinic_name,
        packageId: data.package_id
      };
    } catch (e) {
      console.error("NEXUS: Profil kontrol hatası:", e);
      return null;
    }
  },

  async isSystemEmpty(): Promise<boolean> {
    if (!isConfigured()) return true;
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.warn("NEXUS: Tablo henüz oluşturulmamış olabilir veya erişim hatası:", error);
        return true; 
      }
      return count === 0;
    } catch (e) {
      return true;
    }
  },

  async createInitialProfile(userData: { id: string, name: string, email: string, role: UserRole }): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        clinic_name: userData.role === UserRole.SUPER_ADMIN ? 'Merkez Yönetim' : 'Yeni Klinik',
        package_id: 'pro'
      }])
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
      clinicName: data.clinic_name,
      packageId: data.package_id
    };
  },

  async getDoctors(): Promise<User[]> {
    if (!isConfigured()) return [];
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', UserRole.DOCTOR);
      
      if (error) throw error;
      
      return (data || []).map(d => ({
        id: d.id,
        name: d.name,
        email: d.email,
        role: d.role as UserRole,
        clinicName: d.clinic_name,
        packageId: d.package_id
      }));
    } catch (e) {
      return [];
    }
  },

  async saveDoctor(doctor: User): Promise<User> {
    // Not: Süper admin yeni doktor eklediğinde auth.users'a eklenmesi gerekir.
    // Bu demo sürümünde sadece profil tablosuna ekliyoruz.
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        name: doctor.name,
        email: doctor.email,
        role: doctor.role,
        clinic_name: doctor.clinicName,
        package_id: doctor.packageId
      }])
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
      clinicName: data.clinic_name,
      packageId: data.package_id
    };
  },

  // --- PATIENTS ---
  async getPatients(doctorId: string): Promise<Patient[]> {
    if (!isConfigured()) return [];
    
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('doctor_id', doctorId);

      if (error) throw error;
      
      return (data || []).map(p => ({
        id: p.id,
        name: p.name,
        weeksPregnant: p.weeks_pregnant,
        doctorId: p.doctor_id,
        lastScanDate: p.last_scan_date
      }));
    } catch (e) {
      return [];
    }
  },

  async savePatient(patient: Omit<Patient, 'id'>): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .insert([{
        name: patient.name,
        weeks_pregnant: patient.weeksPregnant,
        doctor_id: patient.doctorId,
        last_scan_date: patient.lastScanDate
      }])
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      weeksPregnant: data.weeks_pregnant,
      doctorId: data.doctor_id,
      lastScanDate: data.last_scan_date
    };
  },

  // --- SCANS ---
  async getScans(patientId?: string): Promise<ScanResult[]> {
    if (!isConfigured()) return [];
    
    try {
      let query = supabase.from('scans').select('*').order('created_at', { ascending: false });
      if (patientId) query = query.eq('patient_id', patientId);

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(s => ({
        id: s.id,
        patientId: s.patient_id,
        ultrasoundUrl: s.ultrasound_url,
        babyFaceUrl: s.baby_face_url,
        createdAt: new Date(s.created_at).toLocaleDateString('tr-TR')
      }));
    } catch (e) {
      return [];
    }
  },

  async saveScan(scan: Omit<ScanResult, 'id' | 'createdAt'>): Promise<ScanResult> {
    const { data, error } = await supabase
      .from('scans')
      .insert([{
        patient_id: scan.patientId,
        ultrasound_url: scan.ultrasoundUrl,
        baby_face_url: scan.babyFaceUrl
      }])
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      patientId: data.patient_id,
      ultrasoundUrl: data.ultrasound_url,
      babyFaceUrl: data.baby_face_url,
      createdAt: new Date(data.created_at).toLocaleDateString('tr-TR')
    };
  }
};