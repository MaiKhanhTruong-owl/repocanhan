import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import AuthTester from './components/AuthTester';
import { Home, Sparkles, CheckCircle2 } from 'lucide-react';

function Dashboard() {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState('home');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* 1. Menu Sidebar bên trái: Logo trên đầu, dưới là icon Home */}
      <Sidebar activeNav={activeNav} onSelectNav={setActiveNav} />

      {/* 2. Trang chính bên phải (Đã dọn sạch) */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Header trang chính */}
        <header className="h-16 border-b border-slate-800/80 px-8 flex items-center justify-between bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <Home className="w-5 h-5 text-indigo-400" />
            <h1 className="text-base font-bold text-white tracking-tight">Trang Chủ</h1>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Đang hoạt động:</span>
            <span className="text-emerald-400 font-bold">{user?.username}</span>
          </div>
        </header>

        {/* Nội dung trang chính sạch sẽ */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
          <div className="max-w-md space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto shadow-xl shadow-indigo-500/10">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white">
                Đăng Nhập Thành Công!
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Tài khoản <strong className="text-indigo-300 font-mono">[{user?.username}]</strong> đã kết nối trực tiếp với cơ sở dữ liệu Supabase.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-left space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Trang chính đã được dọn sạch</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Menu Sidebar bên trái đã sẵn sàng với <strong>Logo</strong> ở trên cùng và <strong>Icon Home</strong> ở dưới. Tiếp theo bạn muốn thêm chức năng gì vào trang chính này?
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

  // Nếu chưa đăng nhập: hiện màn hình đăng nhập
  if (!user) {
    return <AuthTester />;
  }

  // Nếu đã đăng nhập: hiện layout mới với Sidebar bên trái
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </AuthProvider>
  );
}
