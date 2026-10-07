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
    <div className={`min-h-screen flex font-sans transition-colors duration-200 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* 1. Menu Sidebar bên trái: Logo trên đầu, dưới là icon Home */}
      <Sidebar activeNav={activeNav} onSelectNav={setActiveNav} />

      {/* 2. Trang chính bên phải */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header trang chính */}
        <header
          className={`h-16 border-b px-8 flex items-center justify-between backdrop-blur-md transition-colors ${
            isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white/80 border-slate-200/80 shadow-xs'
          }`}
        >
          {/* Góc bên trái header: Tiêu đề trang */}
          <div className="flex items-center gap-2.5">
            <Home className="w-5 h-5 text-indigo-500" />
            <h1 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Trang Chủ
            </h1>
          </div>

          {/* Góc bên phải header: Nút Chế độ Sáng / Tối & Trạng thái user */}
          <div className="flex items-center gap-3">
            {/* User status */}
            <div
              className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Tài khoản:</span>
              <span className="text-emerald-500 font-bold">{user?.username}</span>
            </div>

            {/* NÚT CHẾ ĐỘ SÁNG / TỐI */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center active:scale-95 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700 hover:border-slate-600 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-indigo-600 border-slate-200 hover:border-slate-300 shadow-sm'
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

        {/* Nội dung trang chính */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
          <div className="max-w-md space-y-4">
            <div
              className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-xl transition-all ${
                isDark
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-emerald-400 shadow-indigo-500/10'
                  : 'bg-indigo-50 border border-indigo-100 text-emerald-500 shadow-indigo-100'
              }`}
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>

            <div className="space-y-1.5">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Đăng Nhập Thành Công!
              </h2>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Tài khoản <strong className="text-indigo-500 font-mono">[{user?.username}]</strong> đã sẵn sàng hoạt động cùng cơ sở dữ liệu Supabase.
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border text-xs text-left space-y-2 transition-all ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                  : 'bg-white border-slate-200 text-slate-600 shadow-sm'
              }`}
            >
              <div className={`flex items-center gap-2 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Header đã thêm nút chuyển Sáng / Tối</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Bạn có thể bấm vào nút hình <strong>Mặt Trời / Mặt Trăng</strong> ở góc trên bên phải header để đổi ngay giao diện giữa chế độ ban đêm và ban ngày.
              </p>
            </div>
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
