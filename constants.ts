
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

export const parseGA = (ga: string): number => {
  if (!ga) return 0;
  const match = ga.match(/(\d+)\s*[wW]?\s*(\d+)?\s*[dD]?/);
  if (match) {
    const weeks = parseInt(match[1]);
    const days = match[2] ? parseInt(match[2]) : 0;
    return weeks + days / 7;
  }
  return parseFloat(ga) || 0;
};

export const formatGA = (ga: number): string => {
  if (!ga) return '0w';
  const weeks = Math.floor(ga);
  const days = Math.round((ga - weeks) * 7);
  return days > 0 ? `${weeks}w${days}d` : `${weeks}w`;
};
