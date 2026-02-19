
import { Package, User } from './types';

export const PACKAGES: Package[] = [
  {
    id: 'basic',
    name: 'Temel Klinik',
    price: 1990,
    limit: 50,
    features: ['50 AI Analiz / Ay', 'Hasta Kayıt Sistemi', 'Standart Bulut Depolama', 'E-posta Desteği']
  },
  {
    id: 'pro',
    name: 'Profesyonel',
    price: 4990,
    limit: 250,
    features: ['250 AI Analiz / Ay', '2K Yüksek Çözünürlük', 'Öncelikli İşleme', 'WhatsApp Destek Hattı']
  },
  {
    id: 'enterprise',
    name: 'Hastane Grubu',
    price: 12490,
    limit: 1000,
    features: ['Sınırsız AI Analiz', 'Özel Markalama', 'API Entegrasyonu', '7/24 Teknik Destek']
  }
];

export const INITIAL_DOCTORS: User[] = [];
export const INITIAL_PATIENTS = [];
