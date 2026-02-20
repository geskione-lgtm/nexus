
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { User, Patient, ScanResult, UserRole } from '../types';

export const DatabaseService = {
  async getCurrentProfile(): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

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
    } catch (e) { return null; }
  },

  async isSystemEmpty(): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    return count === 0;
  },

  async createInitialProfile(userData: User): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        clinic_name: userData.clinicName,
        package_id: userData.packageId
      }])
      .select().single();
    if (error) throw error;
    return userData;
  },

  async getDoctorsWithStats(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    
    // Fetch doctors, their patients count, and their patients' scans count
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        patients (
          id,
          scans (count)
        )
      `)
      .eq('role', UserRole.DOCTOR);
    
    if (error) {
      console.error("Error fetching doctor stats:", error);
      return [];
    }

    return data.map(d => {
      const patientCount = d.patients ? d.patients.length : 0;
      const scanCount = d.patients ? d.patients.reduce((acc: number, p: any) => acc + (p.scans ? p.scans[0].count : 0), 0) : 0;
      
      return {
        id: d.id,
        name: d.name,
        email: d.email,
        clinicName: d.clinic_name,
        packageId: d.package_id,
        patientCount,
        scanCount
      };
    });
  },

  async getAllPatientsWithDoctorInfo(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        profiles:doctor_id (clinic_name, name)
      `);
    
    if (error) return [];
    return data;
  },

  async getPatients(doctorId: string): Promise<Patient[]> {
    const { data } = await supabase.from('patients').select('*').eq('doctor_id', doctorId);
    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      weeksPregnant: p.weeks_pregnant,
      doctorId: p.doctor_id,
      lastScanDate: p.last_scan_date
    }));
  },

  async savePatient(patient: Omit<Patient, 'id'>): Promise<any> {
    const { data, error } = await supabase.from('patients').insert([{
      name: patient.name,
      weeks_pregnant: patient.weeksPregnant,
      doctor_id: patient.doctorId,
      last_scan_date: patient.lastScanDate
    }]).select().single();
    if (error) throw error;
    return data;
  },

  async getScans(): Promise<ScanResult[]> {
    const { data } = await supabase.from('scans').select('*').order('created_at', { ascending: false });
    return (data || []).map(s => ({
      id: s.id,
      patientId: s.patient_id,
      ultrasoundUrl: s.ultrasound_url,
      babyFaceUrl: s.baby_face_url,
      createdAt: new Date(s.created_at).toLocaleDateString('tr-TR')
    }));
  },

  async saveScan(scan: Omit<ScanResult, 'id' | 'createdAt'>): Promise<any> {
    const { data, error } = await supabase.from('scans').insert([{
      patient_id: scan.patientId,
      ultrasound_url: scan.ultrasoundUrl,
      baby_face_url: scan.babyFaceUrl
    }]).select().single();
    if (error) throw error;
    return data;
  }
};
