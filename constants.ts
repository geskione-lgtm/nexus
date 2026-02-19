
import { Package, User } from './types';

export const PACKAGES: Package[] = [
  {
    id: 'basic',
    name: 'Başlangıç Kliniği',
    price: 99,
    limit: 50,
    features: ['50 Bebek Yüzü Üretimi', 'Hasta Yönetimi', 'Temel Destek']
  },
  {
    id: 'pro',
    name: 'Profesyonel',
    price: 299,
    limit: 200,
    features: ['200 Bebek Yüzü Üretimi', 'Yüksek Çözünürlüklü Çıktı', 'Öncelikli Destek', 'PDF Dışa Aktarma']
  },
  {
    id: 'enterprise',
    name: 'Hastane Ağı',
    price: 999,
    limit: 1000,
    features: ['1000 Bebek Yüzü Üretimi', 'Özel Markalama', 'API Erişimi', '7/24 Destek']
  }
];

// Demo verileri kaldırıldı, uygulama boş veritabanı ile başlar.
export const INITIAL_DOCTORS: User[] = [];
export const INITIAL_PATIENTS = [];
