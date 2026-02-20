
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
    
    try {
      // Fetch all doctors, patients, and scans separately for reliable mapping
      const [doctorsRes, patientsRes, scansRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', UserRole.DOCTOR),
        supabase.from('patients').select('id, doctor_id'),
        supabase.from('scans').select('id, patient_id')
      ]);

      if (doctorsRes.error) throw doctorsRes.error;

      const doctors = doctorsRes.data || [];
      const patients = patientsRes.data || [];
      const scans = scansRes.data || [];

      return doctors.map(d => {
        const doctorPatients = patients.filter(p => p.doctor_id === d.id);
        const patientIds = doctorPatients.map(p => p.id);
        const doctorScans = scans.filter(s => patientIds.includes(s.patient_id));

        return {
          id: d.id,
          name: d.name,
          email: d.email,
          clinicName: d.clinic_name,
          packageId: d.package_id,
          patientCount: doctorPatients.length,
          scanCount: doctorScans.length
        };
      });
    } catch (e) {
      console.error("Error in getDoctorsWithStats:", e);
      return [];
    }
  },

  async getAllPatientsWithDoctorInfo(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        supabase.from('patients').select('*'),
        supabase.from('profiles').select('id, clinic_name, name').eq('role', UserRole.DOCTOR)
      ]);

      if (patientsRes.error) throw patientsRes.error;

      const patients = patientsRes.data || [];
      const doctors = doctorsRes.data || [];

      return patients.map(p => ({
        ...p,
        profiles: doctors.find(d => d.id === p.doctor_id)
      }));
    } catch (e) {
      console.error("Error in getAllPatientsWithDoctorInfo:", e);
      return [];
    }
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
