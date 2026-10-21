import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { BONJOURR_WALLPAPERS, DEFAULT_BONJOURR_CONFIG } from '../utils/bonjourrConfig';

export { BONJOURR_WALLPAPERS };

export default function BonjourrBackground({ config, onAutoRotate }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const safeConfig = { ...DEFAULT_BONJOURR_CONFIG, ...(config || {}) };
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Auto-rotate effect nếu được bật
  useEffect(() => {
    if (!safeConfig.enabled || !safeConfig.autoRotateMinutes || safeConfig.autoRotateMinutes <= 0) {
      return;
    }

    const intervalMs = safeConfig.autoRotateMinutes * 60 * 1000;
    const timer = setInterval(() => {
      if (onAutoRotate) {
        const nextIndex = ((safeConfig.currentIndex || 0) + 1) % BONJOURR_WALLPAPERS.length;
        onAutoRotate(nextIndex);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [safeConfig.enabled, safeConfig.autoRotateMinutes, safeConfig.currentIndex, onAutoRotate]);

  if (!safeConfig.enabled) {
    return null;
  }

  const currentWallpaper = BONJOURR_WALLPAPERS[safeConfig.currentIndex] || BONJOURR_WALLPAPERS[0];
  const activeImageUrl = safeConfig.mode === 'custom' && safeConfig.customUrl
    ? safeConfig.customUrl
    : currentWallpaper.url;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden transition-all duration-700">
      {safeConfig.mode === 'live' ? (
        /* Chế độ Iframe nhúng trực tiếp trang chủ Bonjourr (online.bonjourr.fr) */
        <div className="absolute inset-0 w-full h-full">
          <iframe
            src="https://online.bonjourr.fr"
            title="Bonjourr Startpage"
            className="w-full h-full border-0 pointer-events-none scale-100"
            onLoad={() => setIframeLoaded(true)}
          />
        </div>
      ) : (
        /* Chế độ Ảnh 4K Unsplash Nature tuyển chọn hoặc Custom URL */
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-1000 ease-out transform scale-105"
          style={{
            backgroundImage: `url("${activeImageUrl}")`,
            filter: safeConfig.blurAmount > 0 ? `blur(${safeConfig.blurAmount}px)` : 'none',
          }}
        />
      )}

      {/* Lớp phủ làm dịu nền (Dim Overlay) để giao diện máy in đọc rõ ràng */}
      <div
        className={`absolute inset-0 transition-all duration-300 ${
          isDark ? 'bg-black' : 'bg-slate-900'
        }`}
        style={{ opacity: safeConfig.dimOpacity / 100 }}
      />

      {/* Hiệu ứng viền Vignette mềm mại chuẩn Bonjourr */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none opacity-60" />
    </div>
  );
}
