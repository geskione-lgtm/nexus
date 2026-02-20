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
    if (!isSupabaseConfigured()) return []

    // Each doctor's profile + count of related patients
    const { data, error } = await supabase
      .from('profiles')
      .select('*, patients(count)')
      .eq('role', UserRole.DOCTOR)

    if (error || !data) return []

    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      clinicName: d.clinic_name,
      packageId: d.package_id,
      patientCount: d.patients ? d.patients[0].count : 0
    }))
  },

  async getPatients(doctorId: string): Promise<Patient[]> {
    if (!isSupabaseConfigured()) return []

    const { data, error } = await supabase.from('patients').select('*').eq('doctor_id', doctorId)
    if (error || !data) return []

    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      weeksPregnant: p.weeks_pregnant,
      doctorId: p.doctor_id,

      // Keep a UI-friendly TR date if your Patient type expects string for display.
      // If your UI prefers raw ISO, change to: p.last_scan_date
      lastScanDate: p.last_scan_date ? toTRDateString(p.last_scan_date) : null
    }))
  },

  async savePatient(patient: Omit<Patient, 'id'>): Promise<any> {
    if (!isSupabaseConfigured()) throw new Error('Supabase yapılandırılmamış.')

    // IMPORTANT: Store ISO in DB (DATE/TIMESTAMP safe), not "DD.MM.YYYY"
    const isoLastScanDate = toISODateString(patient.lastScanDate as any)

    const { data, error } = await supabase
      .from('patients')
      .insert([
        {
          name: patient.name,
          weeks_pregnant: patient.weeksPregnant,
          doctor_id: patient.doctorId,
          last_scan_date: isoLastScanDate
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getScans(): Promise<ScanResult[]> {
    if (!isSupabaseConfigured()) return []

    const { data, error } = await supabase.from('scans').select('*').order('created_at', { ascending: false })
    if (error || !data) return []

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
      .single()

    if (error) throw error
    return data
  }
}
