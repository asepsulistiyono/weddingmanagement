import type { ThemeTemplateId } from '../types.ts';

export type ThemeCategory =
  | 'Tradisional & Nusantara'
  | 'Modern & Luxury'
  | 'Floral & Romantic'
  | 'Minimalist & Editorial';

export interface WeddingThemeTemplate {
  id: ThemeTemplateId;
  number: string;
  name: string;
  category: ThemeCategory;
  tagline: string;
  description: string;
  motifLabel: string;
  photoFrameStyle: 'circle-dashed' | 'arch-frame' | 'rounded-luxury' | 'classic-oval';
  palette: {
    pageBg: string;
    heroBg: string;
    coverBg: string;
    coverOverlayGradient: string;
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accentSoftBg: string;
    accentBorder: string;
    headingText: string;
    bodyText: string;
    cardBg: string;
    footerBg: string;
    buttonBg: string;
    buttonText: string;
    swatchColors: [string, string, string, string];
  };
}

export const WEDDING_THEME_TEMPLATES: WeddingThemeTemplate[] = [
  {
    id: 'royal-javanese-gold',
    number: '01',
    name: 'Royal Javanese Gold',
    category: 'Tradisional & Nusantara',
    tagline: 'Keagungan Keraton Jawa dengan sentuhan emas klasik & cokelat sogan',
    description:
      'Nuansa hangat keraton klasik dengan aksen emas murni, krem gading, dan cokelat kayu jati yang anggun dan sakral.',
    motifLabel: 'Ornamen Klasik Emas & Sogan',
    photoFrameStyle: 'circle-dashed',
    palette: {
      pageBg: '#FDFBF7',
      heroBg: '#FAF6EE',
      coverBg: '#1E1B18',
      coverOverlayGradient: 'linear-gradient(to top, #141210, rgba(26,23,20,0.85), #141210)',
      primary: '#B45309',
      primaryLight: '#F59E0B',
      primaryDark: '#78350F',
      accentSoftBg: '#FFFBEB',
      accentBorder: '#FDE68A',
      headingText: '#451A03',
      bodyText: '#44403C',
      cardBg: '#FFFFFF',
      footerBg: '#1C1917',
      buttonBg: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
      buttonText: '#FFFFFF',
      swatchColors: ['#1E1B18', '#B45309', '#F59E0B', '#FDFBF7']
    }
  },
  {
    id: 'botanical-sage-emerald',
    number: '02',
    name: 'Botanical Sage & Emerald',
    category: 'Floral & Romantic',
    tagline: 'Kesegaran taman tropis dengan warna hijau sage & zamrud alami',
    description:
      'Terinspirasi dari pesta kebun (garden wedding) yang asri, memadukan warna daun eucalyptus, zamrud tua, dan putih bersih.',
    motifLabel: 'Daun Eucalyptus & Taman Asri',
    photoFrameStyle: 'arch-frame',
    palette: {
      pageBg: '#F6FAF7',
      heroBg: '#EDF5F0',
      coverBg: '#11221B',
      coverOverlayGradient: 'linear-gradient(to top, #0B1712, rgba(17,34,27,0.86), #0B1712)',
      primary: '#047857',
      primaryLight: '#10B981',
      primaryDark: '#064E3B',
      accentSoftBg: '#ECFDF5',
      accentBorder: '#A7F3D0',
      headingText: '#064E3B',
      bodyText: '#334139',
      cardBg: '#FFFFFF',
      footerBg: '#0F241C',
      buttonBg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      buttonText: '#FFFFFF',
      swatchColors: ['#11221B', '#047857', '#6EE7B7', '#F6FAF7']
    }
  },
  {
    id: 'sakura-blush-rose',
    number: '03',
    name: 'Sakura Blush & Dusty Rose',
    category: 'Floral & Romantic',
    tagline: 'Romantisme kelopak mawar merah muda & nuansa pastel yang lembut',
    description:
      'Desain feminin dan manis dengan perpaduan warna dusty rose, kelopak bunga sakura, dan aksen rose-gold yang menawan.',
    motifLabel: 'Kelopak Mawar & Rose Gold',
    photoFrameStyle: 'classic-oval',
    palette: {
      pageBg: '#FFF8F9',
      heroBg: '#FDF1F4',
      coverBg: '#2B141C',
      coverOverlayGradient: 'linear-gradient(to top, #1F0D14, rgba(43,20,28,0.85), #1F0D14)',
      primary: '#BE185D',
      primaryLight: '#EC4899',
      primaryDark: '#831843',
      accentSoftBg: '#FDF2F8',
      accentBorder: '#FBCFE8',
      headingText: '#831843',
      bodyText: '#4A353B',
      cardBg: '#FFFFFF',
      footerBg: '#281119',
      buttonBg: 'linear-gradient(135deg, #DB2777 0%, #9D174D 100%)',
      buttonText: '#FFFFFF',
      swatchColors: ['#2B141C', '#BE185D', '#F472B6', '#FFF8F9']
    }
  },
  {
    id: 'midnight-celestial-navy',
    number: '04',
    name: 'Midnight Celestial Navy',
    category: 'Modern & Luxury',
    tagline: 'Kemewahan malam berbintang dengan biru dongker & kilau emas',
    description:
      'Tampilan ballroom hotel bintang lima yang glamor dengan perpaduan biru malam (royal navy) dan aksen sampanye emas.',
    motifLabel: 'Bintang Malam & Royal Ballroom',
    photoFrameStyle: 'rounded-luxury',
    palette: {
      pageBg: '#F5F8FC',
      heroBg: '#EBF1F8',
      coverBg: '#0B1528',
      coverOverlayGradient: 'linear-gradient(to top, #070E1B, rgba(11,21,40,0.88), #070E1B)',
      primary: '#1D4ED8',
      primaryLight: '#3B82F6',
      primaryDark: '#1E3A8A',
      accentSoftBg: '#EFF6FF',
      accentBorder: '#BFDBFE',
      headingText: '#1E3A8A',
      bodyText: '#334155',
      cardBg: '#FFFFFF',
      footerBg: '#0F172A',
      buttonBg: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
      buttonText: '#FFFFFF',
      swatchColors: ['#0B1528', '#1E40AF', '#FBBF24', '#F5F8FC']
    }
  },
  {
    id: 'terracotta-tuscan-sunset',
    number: '05',
    name: 'Terracotta Tuscan Sunset',
    category: 'Floral & Romantic',
    tagline: 'Kehangatan senja mediterania dengan palet rust, coral & terracotta',
    description:
      'Gaya pernikahan bohemian-modern yang hangat dengan sentuhan warna tanah liat terracotta, senja keemasan, dan krem pasir.',
    motifLabel: 'Bohemian Senja & Dried Floral',
    photoFrameStyle: 'arch-frame',
    palette: {
      pageBg: '#FDF8F5',
      heroBg: '#FAEEE7',
      coverBg: '#2A1610',
      coverOverlayGradient: 'linear-gradient(to top, #1C0E0A, rgba(42,22,16,0.86), #1C0E0A)',
      primary: '#C2410C',
      primaryLight: '#EA580C',
      primaryDark: '#7C2D12',
      accentSoftBg: '#FFF7ED',
      accentBorder: '#FED7AA',
      headingText: '#7C2D12',
      bodyText: '#43342E',
      cardBg: '#FFFFFF',
      footerBg: '#27150F',
      buttonBg: 'linear-gradient(135deg, #EA580C 0%, #9A3412 100%)',
      buttonText: '#FFFFFF',
      swatchColors: ['#2A1610', '#C2410C', '#FB923C', '#FDF8F5']
    }
  },
  {
    id: 'champagne-ivory-classic',
    number: '06',
    name: 'Champagne Ivory Classic',
    category: 'Modern & Luxury',
    tagline: 'Keanggunan abadi warna mutiara, gading lembut & perak sampanye',
    description:
      'Desain serba terang dan bersih berkelas internasional yang menonjolkan kesucian hari pernikahan dengan palet ivory & warm taupe.',
    motifLabel: 'Mutiara Gading & Silk Ribbon',
    photoFrameStyle: 'classic-oval',
    palette: {
      pageBg: '#FAF9F5',
      heroBg: '#F3EFE6',
      coverBg: '#26231D',
      coverOverlayGradient: 'linear-gradient(to top, #1B1914, rgba(38,35,29,0.84), #1B1914)',
      primary: '#854D0E',
      primaryLight: '#CA8A04',
      primaryDark: '#713F12',
      accentSoftBg: '#FEFCE8',
      accentBorder: '#FEF08A',
      headingText: '#3F3A32',
      bodyText: '#57534E',
      cardBg: '#FFFFFF',
      footerBg: '#292524',
      buttonBg: 'linear-gradient(135deg, #A16207 0%, #713F12 100%)',
      buttonText: '#FFFFFF',
      swatchColors: ['#26231D', '#A16207', '#EAB308', '#FAF9F5']
    }
  },
  {
    id: 'lavender-provence-romance',
    number: '07',
    name: 'Lavender Provence Romance',
    category: 'Floral & Romantic',
    tagline: 'Pesona kebun lavender Prancis dengan ungu lilac & plum lembut',
    description:
      'Menghadirkan suasana kebun bunga lavender yang menenangkan dan romantis dengan aksen ungu kerajaan dan putih gading.',
    motifLabel: 'Bunga Lavender & Lilac',
    photoFrameStyle: 'circle-dashed',
    palette: {
      pageBg: '#FAF7FF',
      heroBg: '#F3ECFF',
      coverBg: '#1E132A',
      coverOverlayGradient: 'linear-gradient(to top, #140C1D, rgba(30,19,42,0.86), #140C1D)',
      primary: '#7E22CE',
      primaryLight: '#A855F7',
      primaryDark: '#581C87',
      accentSoftBg: '#FAF5FF',
      accentBorder: '#E9D5FF',
      headingText: '#4C1D95',
      bodyText: '#3E344A',
      cardBg: '#FFFFFF',
      footerBg: '#1B1126',
      buttonBg: 'linear-gradient(135deg, #9333EA 0%, #6B21A8 100%)',
      buttonText: '#FFFFFF',
      swatchColors: ['#1E132A', '#7E22CE', '#C084FC', '#FAF7FF']
    }
  },
  {
    id: 'burgundy-velvet-luxury',
    number: '08',
    name: 'Burgundy Velvet Luxury',
    category: 'Modern & Luxury',
    tagline: 'Kemewahan beludru merah marun & emas kerajaan yang megah',
    description:
      'Sangat cocok untuk resepsi gedung mewah maupun adat Minang/Tionghoa/Internasional dengan dominasi merah marun & emas.',
    motifLabel: 'Beludru Marun & Mahkota Emas',
    photoFrameStyle: 'rounded-luxury',
    palette: {
      pageBg: '#FDF8F8',
      heroBg: '#F9EEEE',
      coverBg: '#280A0E',
      coverOverlayGradient: 'linear-gradient(to top, #1A0608, rgba(40,10,14,0.88), #1A0608)',
      primary: '#9F1239',
      primaryLight: '#E11D48',
      primaryDark: '#881337',
      accentSoftBg: '#FFF1F2',
      accentBorder: '#FECDD3',
      headingText: '#881337',
      bodyText: '#442D31',
      cardBg: '#FFFFFF',
      footerBg: '#24080C',
      buttonBg: 'linear-gradient(135deg, #BE123C 0%, #881337 100%)',
      buttonText: '#FFFFFF',
      swatchColors: ['#280A0E', '#9F1239', '#FBBF24', '#FDF8F8']
    }
  },
  {
    id: 'ocean-breeze-santorini',
    number: '09',
    name: 'Ocean Breeze Santorini',
    category: 'Modern & Luxury',
    tagline: 'Nuansa tepi pantai biru pirus, langit cerah & pasir putih',
    description:
      'Pilihan tepat untuk pernikahan tepi pantai (beachfront) atau outdoor dengan kesegaran biru laut Aegean dan putih bersih.',
    motifLabel: 'Pantai Tropis & Biru Laut',
    photoFrameStyle: 'arch-frame',
    palette: {
      pageBg: '#F4FAFC',
      heroBg: '#E6F4F9',
      coverBg: '#0C222F',
      coverOverlayGradient: 'linear-gradient(to top, #07161F, rgba(12,34,47,0.86), #07161F)',
      primary: '#0369A1',
      primaryLight: '#0EA5E9',
      primaryDark: '#0C4A6E',
      accentSoftBg: '#F0F9FF',
      accentBorder: '#BAE6FD',
      headingText: '#0C4A6E',
      bodyText: '#334E5E',
      cardBg: '#FFFFFF',
      footerBg: '#091D29',
      buttonBg: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
      buttonText: '#FFFFFF',
      swatchColors: ['#0C222F', '#0369A1', '#38BDF8', '#F4FAFC']
    }
  },
  {
    id: 'minimalist-monochrome-noir',
    number: '10',
    name: 'Minimalist Monochrome Noir',
    category: 'Minimalist & Editorial',
    tagline: 'Gaya majalah fesyen hitam-putih modern yang tegas & kontemporer',
    description:
      'Estetika editorial monokrom dengan kontras tipografi yang tajam, bersih tanpa ornamen berlebihan, elegan dan timeless.',
    motifLabel: 'Editorial Fine-Art Monokrom',
    photoFrameStyle: 'rounded-luxury',
    palette: {
      pageBg: '#FAFAFA',
      heroBg: '#F2F2F2',
      coverBg: '#121212',
      coverOverlayGradient: 'linear-gradient(to top, #090909, rgba(18,18,18,0.88), #090909)',
      primary: '#262626',
      primaryLight: '#525252',
      primaryDark: '#171717',
      accentSoftBg: '#F5F5F5',
      accentBorder: '#D4D4D4',
      headingText: '#171717',
      bodyText: '#404040',
      cardBg: '#FFFFFF',
      footerBg: '#111111',
      buttonBg: 'linear-gradient(135deg, #404040 0%, #171717 100%)',
      buttonText: '#FFFFFF',
      swatchColors: ['#121212', '#262626', '#A3A3A3', '#FAFAFA']
    }
  },
  {
    id: 'sundanese-silver-keraton',
    number: '11',
    name: 'Sundanese Silver & Jasmine',
    category: 'Tradisional & Nusantara',
    tagline: 'Kelembutan ronce melati putih dengan aksen perak & biru es',
    description:
      'Terinspirasi dari keanggunan Siger Sunda dan haruman bunga melati putih dengan nuansa perak berkilau yang sejuk.',
    motifLabel: 'Ronce Melati & Siger Perak',
    photoFrameStyle: 'classic-oval',
    palette: {
      pageBg: '#F8FAFC',
      heroBg: '#EFF4F8',
      coverBg: '#17202A',
      coverOverlayGradient: 'linear-gradient(to top, #0E151C, rgba(23,32,42,0.86), #0E151C)',
      primary: '#0F766E',
      primaryLight: '#14B8A6',
      primaryDark: '#115E59',
      accentSoftBg: '#F0FDFA',
      accentBorder: '#99F6E4',
      headingText: '#134E4A',
      bodyText: '#334155',
      cardBg: '#FFFFFF',
      footerBg: '#131C24',
      buttonBg: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
      buttonText: '#FFFFFF',
      swatchColors: ['#17202A', '#0F766E', '#5EEAD4', '#F8FAFC']
    }
  },
  {
    id: 'balinese-tropical-resort',
    number: '12',
    name: 'Balinese Tropical Gold',
    category: 'Tradisional & Nusantara',
    tagline: 'Eksotisme tropis Pulau Dewata dengan bunga kamboja & emas ukir',
    description:
      'Perpaduan warna hijau daun tropis, emas prada khas Bali, dan hangatnya bunga kamboja di resort tepi tebing.',
    motifLabel: 'Prada Bali & Bunga Frangipani',
    photoFrameStyle: 'circle-dashed',
    palette: {
      pageBg: '#FBFBF4',
      heroBg: '#F4F4E6',
      coverBg: '#1A2118',
      coverOverlayGradient: 'linear-gradient(to top, #11160F, rgba(26,33,24,0.86), #11160F)',
      primary: '#65A30D',
      primaryLight: '#84CC16',
      primaryDark: '#3F6212',
      accentSoftBg: '#F7FEE7',
      accentBorder: '#BEF264',
      headingText: '#365314',
      bodyText: '#3F4438',
      cardBg: '#FFFFFF',
      footerBg: '#161C14',
      buttonBg: 'linear-gradient(135deg, #65A30D 0%, #3F6212 100%)',
      buttonText: '#FFFFFF',
      swatchColors: ['#1A2118', '#3F6212', '#EAB308', '#FBFBF4']
    }
  }
];

export function getThemeById(themeId?: string | null): WeddingThemeTemplate {
  if (!themeId) return WEDDING_THEME_TEMPLATES[0];
  const found = WEDDING_THEME_TEMPLATES.find((t) => t.id === themeId);
  return found || WEDDING_THEME_TEMPLATES[0];
}
