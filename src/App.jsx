import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import AuthTester from './components/AuthTester';
import { Home, Sparkles, CheckCircle2, Sun, Moon } from 'lucide-react';

function Dashboard() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeNav, setActiveNav] = useState('home');

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex font-sans transition-colors duration-200 ${
        isDark ? 'bg-[#18191c] text-zinc-100' : 'bg-[#f4f6f8] text-slate-800'
      }`}
    >
      {/* 1. Menu Sidebar bên trái */}
      <Sidebar activeNav={activeNav} onSelectNav={setActiveNav} />

      {/* 2. Trang chính bên phải */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header trang chính - Phân biệt rõ ranh giới */}
        <header
          className={`h-16 px-8 flex items-center justify-between backdrop-blur-md transition-colors duration-200 ${
            isDark
              ? 'bg-[#1f2024]/90 border-b border-zinc-800' // Tối: Xám đậm
              : 'bg-white border-b-2 border-slate-300 shadow-xs' // Sáng: Trắng tinh viền rõ rệt
          }`}
        >
          {/* Góc bên trái header: Tiêu đề trang */}
          <div className="flex items-center gap-2.5">
            <Home className="w-5 h-5 text-indigo-500" />
            <h1 className={`text-base font-bold tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              Trang Chủ
            </h1>
          </div>

          {/* Góc bên phải header: Trạng thái User & Nút Sáng/Tối */}
          <div className="flex items-center gap-3">
            {/* User status badge */}
            <div
              className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300'
                  : 'bg-slate-100 border-slate-300 text-slate-700 font-medium'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Tài khoản:</span>
              <span className={isDark ? 'text-emerald-400 font-bold' : 'text-emerald-600 font-bold'}>
                {user?.username}
              </span>
            </div>

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

        {/* Khu vực nội dung Canvas chính - Sạch sẽ, không chú thích thừa */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center">
          <div
            className={`w-full max-w-2xl h-80 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-colors ${
              isDark
                ? 'border-zinc-800 bg-zinc-900/30 text-zinc-500'
                : 'border-slate-300 bg-white/50 text-slate-400'
            }`}
          >
            <p className="text-sm font-medium">Khu vực làm việc Trang Chủ</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function MainApp() {
  const { user } = useAuth();

  if (!user) {
    return <AuthTester />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <MainApp />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
