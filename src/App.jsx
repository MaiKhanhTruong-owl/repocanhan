import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import PrinterMonitor from './components/PrinterMonitor';
import PrintHistory from './components/PrintHistory';
import SmartHomeCard from './components/SmartHomeCard';
import BonjourrBackground from './components/BonjourrBackground';
import BonjourrSettings from './components/BonjourrSettings';
import { loadBonjourrConfig, saveBonjourrConfig } from './utils/bonjourrConfig';
import { Home, Sun, Moon, History, Zap, Palette } from 'lucide-react';

function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [activeNav, setActiveNavState] = useState(() => {
    return localStorage.getItem('printflow_active_nav') || 'home';
  });

  const setActiveNav = (nav) => {
    setActiveNavState(nav);
    localStorage.setItem('printflow_active_nav', nav);
  };

  // Luôn đảm bảo trạng thái trang được đồng bộ vào localStorage
  useEffect(() => {
    localStorage.setItem('printflow_active_nav', activeNav);
  }, [activeNav]);
  const [bonjourrConfig, setBonjourrConfig] = useState(() => loadBonjourrConfig());

  const handleUpdateBonjourrConfig = (newConfig) => {
    setBonjourrConfig(newConfig);
    saveBonjourrConfig(newConfig);
  };

  const handleAutoRotate = (nextIndex) => {
    setBonjourrConfig((prev) => {
      const updated = { ...prev, currentIndex: nextIndex };
      saveBonjourrConfig(updated);
      return updated;
    });
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex font-sans transition-colors duration-200 relative ${
        !bonjourrConfig.enabled
          ? isDark
            ? 'bg-[#18191c] text-zinc-100'
            : 'bg-[#f4f6f8] text-slate-800'
          : isDark
          ? 'text-zinc-100'
          : 'text-slate-800'
      }`}
    >
      {/* 0. Lớp hình nền Bonjourr toàn màn hình cố định */}
      <BonjourrBackground config={bonjourrConfig} onAutoRotate={handleAutoRotate} />

      {/* 1. Menu Sidebar bên trái */}
      <Sidebar activeNav={activeNav} onSelectNav={setActiveNav} />

      {/* 2. Trang chính bên phải */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Header trang chính - Phân biệt rõ ranh giới */}
        <header
          className={`h-16 px-4 sm:px-8 flex items-center justify-between backdrop-blur-xl transition-colors duration-200 shrink-0 ${
            bonjourrConfig.enabled
              ? isDark
                ? 'bg-[#1f2024]/80 border-b border-zinc-800/80 shadow-md'
                : 'bg-white/80 border-b border-slate-300/80 shadow-sm'
              : isDark
              ? 'bg-[#1f2024]/90 border-b border-zinc-800'
              : 'bg-white border-b-2 border-slate-300 shadow-xs'
          }`}
        >
          {/* Góc bên trái header: Tiêu đề trang theo mục được chọn */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {activeNav === 'home' && (
              <>
                <Home className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 shrink-0" />
                <h1 className={`text-sm sm:text-base font-bold tracking-tight truncate ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                  Trang Chủ • Giám Sát Máy In
                </h1>
              </>
            )}
            {activeNav === 'smarthome' && (
              <>
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 shrink-0" />
                <h1 className={`text-sm sm:text-base font-bold tracking-tight truncate ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                  Google Home • Ổ Cắm & Đèn Thông Minh
                </h1>
              </>
            )}
            {activeNav === 'history' && (
              <>
                <History className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 shrink-0" />
                <h1 className={`text-sm sm:text-base font-bold tracking-tight truncate ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                  Lịch Sử In & Thành Phẩm
                </h1>
              </>
            )}
            {activeNav === 'settings' && (
              <>
                <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 shrink-0" />
                <h1 className={`text-sm sm:text-base font-bold tracking-tight truncate ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                  Cài Đặt • Hình Nền Bonjourr Startpage
                </h1>
              </>
            )}
          </div>

          {/* Góc bên phải header: Nút Sáng/Tối */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* NÚT CHẾ ĐỘ SÁNG / TỐI */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-zinc-800 hover:bg-zinc-750 text-amber-400 border-zinc-700 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-indigo-600 border-slate-300 shadow-xs'
              }`}
              title={isDark ? 'Chuyển sang chế độ Sáng (Light Mode)' : 'Chuyển sang chế độ Tối (Dark Mode)'}
              aria-label="Chuyển chế độ sáng tối"
            >
              {isDark ? (
                <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
              )}
            </button>
          </div>
        </header>

        {/* Khu vực nội dung Canvas chính - Hiển thị theo trang được chọn */}
        <div className="flex-1 p-3.5 sm:p-6 md:p-8 flex flex-col items-center justify-start overflow-y-auto">
          {activeNav === 'home' && <PrinterMonitor />}
          {activeNav === 'smarthome' && (
            <div className="w-full max-w-4xl space-y-6 flex flex-col items-center">
              <SmartHomeCard />
            </div>
          )}
          {activeNav === 'history' && <PrintHistory />}
          {activeNav === 'settings' && (
            <BonjourrSettings
              config={bonjourrConfig}
              onUpdateConfig={handleUpdateBonjourrConfig}
              onNavigateHome={() => setActiveNav('home')}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <Dashboard />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
