// Bộ sưu tập ảnh nền 4K thiên nhiên chuẩn phong cách Bonjourr (Unsplash High-Res)
export const BONJOURR_WALLPAPERS = [
  {
    id: 'dolomites',
    title: 'Dolomites Alps • Hoàng Hôn Vàng',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=85',
    category: 'Núi non',
  },
  {
    id: 'aurora',
    title: 'Bắc Cực Quang • Na Uy Huyền Ảo',
    url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=2560&q=85',
    category: 'Vũ trụ',
  },
  {
    id: 'fuji',
    title: 'Núi Phú Sĩ • Bình Minh Nhật Bản',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2560&q=85',
    category: 'Núi non',
  },
  {
    id: 'forest',
    title: 'Rừng Thông Sương Mù • Thụy Sĩ',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2560&q=85',
    category: 'Rừng cây',
  },
  {
    id: 'moraine',
    title: 'Hồ Moraine • Xanh Ngọc Banff',
    url: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=2560&q=85',
    category: 'Sông hồ',
  },
  {
    id: 'yosemite',
    title: 'Thung Lũng Yosemite • Vách Đá Hùng Vĩ',
    url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=2560&q=85',
    category: 'Thiên nhiên',
  },
  {
    id: 'desert',
    title: 'Cồn Cát Vàng • Sahara Chiều Tà',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=2560&q=85',
    category: 'Hoang mạc',
  },
  {
    id: 'matterhorn',
    title: 'Đỉnh Matterhorn • Tuyết Trắng Alps',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2560&q=85',
    category: 'Núi non',
  },
  {
    id: 'halong',
    title: 'Vịnh Hạ Long • Non Nước Hùng Vĩ',
    url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=2560&q=85',
    category: 'Việt Nam',
  },
  {
    id: 'tokyo',
    title: 'Tokyo Night • Ánh Đèn Thành Thị',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=2560&q=85',
    category: 'Đô thị',
  },
  {
    id: 'milkyway',
    title: 'Dải Ngân Hà • Bầu Trời Đầy Sao',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2560&q=85',
    category: 'Vũ trụ',
  },
  {
    id: 'maldives',
    title: 'Maldives • Biển Xanh Cát Trắng',
    url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=2560&q=85',
    category: 'Biển đảo',
  },
];

export const DEFAULT_BONJOURR_CONFIG = {
  enabled: true,
  mode: 'curated', // 'curated' | 'custom' | 'live'
  currentIndex: 0,
  customUrl: '',
  dimOpacity: 45,
  blurAmount: 2,
  autoRotateMinutes: 0,
};

const STORAGE_KEY = 'bonjourr_full_config';

export function loadBonjourrConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_BONJOURR_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Error parsing bonjourr_full_config:', e);
  }

  // Fallback to individual legacy localStorage keys
  try {
    const legacyEnabled = localStorage.getItem('bonjourr_bg_enabled');
    const legacyMode = localStorage.getItem('bonjourr_bg_mode');
    const legacyIndex = localStorage.getItem('bonjourr_bg_index');
    const legacyDim = localStorage.getItem('bonjourr_bg_dim');
    const legacyBlur = localStorage.getItem('bonjourr_bg_blur');
    const legacyCustom = localStorage.getItem('bonjourr_bg_custom');
    const legacyRotate = localStorage.getItem('bonjourr_bg_autorotate');

    return {
      enabled: legacyEnabled !== null ? legacyEnabled === 'true' : DEFAULT_BONJOURR_CONFIG.enabled,
      mode: legacyMode || DEFAULT_BONJOURR_CONFIG.mode,
      currentIndex: legacyIndex !== null ? Number(legacyIndex) || 0 : DEFAULT_BONJOURR_CONFIG.currentIndex,
      customUrl: legacyCustom || '',
      dimOpacity: legacyDim !== null ? Number(legacyDim) : DEFAULT_BONJOURR_CONFIG.dimOpacity,
      blurAmount: legacyBlur !== null ? Number(legacyBlur) : DEFAULT_BONJOURR_CONFIG.blurAmount,
      autoRotateMinutes: legacyRotate !== null ? Number(legacyRotate) : DEFAULT_BONJOURR_CONFIG.autoRotateMinutes,
    };
  } catch (e) {
    return DEFAULT_BONJOURR_CONFIG;
  }
}

export function saveBonjourrConfig(config) {
  try {
    const merged = { ...DEFAULT_BONJOURR_CONFIG, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

    // Also sync to legacy keys for compatibility
    localStorage.setItem('bonjourr_bg_enabled', String(merged.enabled));
    localStorage.setItem('bonjourr_bg_mode', merged.mode);
    localStorage.setItem('bonjourr_bg_index', String(merged.currentIndex));
    localStorage.setItem('bonjourr_bg_dim', String(merged.dimOpacity));
    localStorage.setItem('bonjourr_bg_blur', String(merged.blurAmount));
    localStorage.setItem('bonjourr_bg_custom', merged.customUrl || '');
    localStorage.setItem('bonjourr_bg_autorotate', String(merged.autoRotateMinutes));
  } catch (e) {
    console.error('Error saving bonjourr config:', e);
  }
}
