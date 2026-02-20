import { supabase, isSupabaseConfigured } from './supabaseClient'
import { User, Patient, ScanResult, UserRole } from '../types'

/**
 * Converts various date inputs to an ISO date string (YYYY-MM-DD) suitable for Postgres DATE columns.
 * Accepts:
 * - Date object
 * - ISO strings (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss...)
 * - Turkish date strings (DD.MM.YYYY)
 * - Anything parsable by Date() as a fallback
 */
function toISODateString(input?: string | Date | null): string | null {
  if (!input) return null

  if (input instanceof Date) {
    if (isNaN(input.getTime())) throw new Error('Geçersiz Date nesnesi')
    return input.toISOString().slice(0, 10) // YYYY-MM-DD
  }

  const s = String(input).trim()
  if (!s) return null

  // Already ISO (YYYY-MM-DD or starts with it)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)

  // Turkish format DD.MM.YYYY
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (m) {
    const [, dd, mm, yyyy] = m
    return `${yyyy}-${mm}-${dd}`
  }

  // Fallback: try native parse (e.g. "2026/02/20", etc.)
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)

  throw new Error(`Geçersiz tarih formatı: ${s}`)
}

/**
 * Formats a date-ish value into Turkish locale date string for UI display.
 */
function toTRDateString(input?: string | Date | null): string | null {
  if (!input) return null
  const d = input instanceof Date ? input : new Date(String(input))
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('tr-TR')
}

export const DatabaseService = {
  async getCurrentProfile(): Promise<User | null> {
    if (!isSupabaseConfigured()) return null
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error || !data) return null

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        clinicName: data.clinic_name,
        packageId: data.package_id
      }
    } catch {
      return null
    }
  },

  async isSystemEmpty(): Promise<boolean> {
    if (!isSupabaseConfigured()) return true
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    return count === 0
  },

  async createInitialProfile(userData: User): Promise<User> {
    const { error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          clinic_name: userData.clinicName,
          package_id: userData.packageId
        }
      ])
      .select()
      .single()

    if (error) throw error
    return userData
  },

  async getDoctorsWithStats(): Promise<any[]> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not configured. Skipping getDoctorsWithStats.');
      return [];
    }

    try {
      // Fetch all doctors, patients, and scans separately for reliable mapping
      const [doctorsRes, patientsRes, scansRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', UserRole.DOCTOR),
        supabase.from('patients').select('id, doctor_id'),
        supabase.from('scans').select('id, patient_id')
      ])

      if (doctorsRes.error) {
        console.error('Error fetching doctors:', doctorsRes.error);
        throw doctorsRes.error;
      }
      if (patientsRes.error) {
        console.error('Error fetching patients for stats:', patientsRes.error);
      }
      if (scansRes.error) {
        console.error('Error fetching scans for stats:', scansRes.error);
      }

      const doctors = doctorsRes.data || []
      const patients = patientsRes.data || []
      const scans = scansRes.data || []

      return doctors.map(d => {
        const doctorPatients = patients.filter(p => p.doctor_id === d.id)
        const patientIds = doctorPatients.map(p => p.id)
        const doctorScans = scans.filter(s => patientIds.includes(s.patient_id))

        return {
          id: d.id,
          name: d.name,
          email: d.email,
          clinicName: d.clinic_name,
          packageId: d.package_id,
          patientCount: doctorPatients.length,
          scanCount: doctorScans.length
        }
      })
    } catch (e) {
      console.error('Critical error in getDoctorsWithStats:', e)
      return []
    }
  },

  async getAllPatientsWithDoctorInfo(): Promise<any[]> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not configured. Skipping getAllPatientsWithDoctorInfo.');
      return [];
    }
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        supabase.from('patients').select('*'),
        supabase.from('profiles').select('id, clinic_name, name').eq('role', UserRole.DOCTOR)
      ])

      if (patientsRes.error) {
        console.error('Error fetching all patients:', patientsRes.error);
        throw patientsRes.error;
      }
      if (doctorsRes.error) {
        console.error('Error fetching doctors for patient info:', doctorsRes.error);
      }

      const patients = patientsRes.data || []
      const doctors = doctorsRes.data || []

      return patients.map(p => ({
        ...p,
        profiles: doctors.find(d => d.id === p.doctor_id)
      }))
    } catch (e) {
      console.error('Critical error in getAllPatientsWithDoctorInfo:', e)
      return []
    }
  },

  async getPatients(doctorId: string): Promise<Patient[]> {
    if (!isSupabaseConfigured()) return []

    const { data, error } = await supabase.from('patients').select('*').eq('doctor_id', doctorId)
    if (error) {
      console.error('Error fetching patients for doctor:', error);
      return [];
    }
    if (!data) return []

    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      weeksPregnant: p.weeks_pregnant,
      doctorId: p.doctor_id,
      phone: p.phone || '',
      email: p.email || '',

      // Keep a UI-friendly TR date if your Patient type expects string for display.
      // If your UI prefers raw ISO, change to: p.last_scan_date
      lastScanDate: p.last_scan_date ? toTRDateString(p.last_scan_date) : null
    }))
  },

  async savePatient(patient: Omit<Patient, 'id'>): Promise<any> {
    if (!isSupabaseConfigured()) throw new Error('Supabase yapılandırılmamış.')

    const isoLastScanDate = toISODateString(patient.lastScanDate as any)

    const { data, error } = await supabase
      .from('patients')
      .insert([
        {
          name: patient.name,
          weeks_pregnant: patient.weeksPregnant,
          doctor_id: patient.doctorId,
          last_scan_date: isoLastScanDate,
          phone: patient.phone,
          email: patient.email
        }
      ])
      .select()

    if (error) throw error
    return data ? data[0] : null
  },

  async updatePatient(id: string, patient: Partial<Patient>): Promise<any> {
    if (!isSupabaseConfigured()) throw new Error('Supabase yapılandırılmamış.')

    const updateData: any = {}
    if (patient.name !== undefined) updateData.name = patient.name
    if (patient.weeksPregnant !== undefined) updateData.weeks_pregnant = patient.weeksPregnant
    if (patient.phone !== undefined) updateData.phone = patient.phone
    if (patient.email !== undefined) updateData.email = patient.email
    if (patient.lastScanDate !== undefined) {
      updateData.last_scan_date = toISODateString(patient.lastScanDate)
    }

    const { data, error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Update error:', error)
      throw error
    }
    
    if (!data || data.length === 0) {
      throw new Error('Güncelleme başarısız: Kayıt bulunamadı veya yetkiniz yok.')
    }

    return data[0]
  },

  async getScans(): Promise<ScanResult[]> {
    if (!isSupabaseConfigured()) return []

    const { data, error } = await supabase.from('scans').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching scans:', error);
      return [];
    }
    if (!data) return []

    return data.map((s: any) => ({
      id: s.id,
      patientId: s.patient_id,
      ultrasoundUrl: s.ultrasound_url,
      babyFaceUrl: s.baby_face_url,

      // UI formatting only
      createdAt: s.created_at ? toTRDateString(s.created_at) || '' : ''
    }))
  },

  async saveScan(scan: Omit<ScanResult, 'id' | 'createdAt'>): Promise<any> {
    if (!isSupabaseConfigured()) throw new Error('Supabase yapılandırılmamış.')

    const { data, error } = await supabase
      .from('scans')
      .insert([
        {
          patient_id: scan.patientId,
          ultrasound_url: scan.ultrasoundUrl,
          baby_face_url: scan.babyFaceUrl
        }
      ])
      .select()

    if (error) throw error
    return data ? data[0] : null
  }
}