import React from 'react';
import { Home, Box, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar({ activeNav = 'home', onSelectNav }) {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  return (
    <aside
      className={`w-20 flex flex-col items-center py-5 shrink-0 select-none z-30 min-h-screen transition-colors duration-200 ${
        isDark
          ? 'bg-zinc-900 border-r border-zinc-800' // Tối: Xám đậm
          : 'bg-slate-100 border-r-2 border-slate-300 shadow-sm' // Sáng: Phân rõ ranh giới với nền và header
      }`}
    >
      {/* 1. Logo trên đầu */}
      <div className="mb-8 flex flex-col items-center gap-1 group cursor-pointer" title="PrintFlow 3D">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-md shadow-indigo-500/20 transition-transform group-hover:scale-105">
          <div
            className={`w-full h-full rounded-[14px] flex items-center justify-center transition-colors ${
              isDark ? 'bg-zinc-800' : 'bg-white border border-slate-200'
            }`}
          >
            <Box className="w-6 h-6 text-indigo-500" />
          </div>
        </div>
        <span
          className={`text-[10px] font-extrabold tracking-wider transition-colors uppercase ${
            isDark ? 'text-zinc-400 group-hover:text-indigo-400' : 'text-slate-600 group-hover:text-indigo-600'
          }`}
        >
          Flow
        </span>
      </div>

      {/* 2. Menu Icons - Dưới là icon Home */}
      <nav className="flex-1 flex flex-col items-center gap-3 w-full px-2">
        <button
          onClick={() => onSelectNav && onSelectNav('home')}
          className={`group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            activeNav === 'home'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/30'
              : isDark
              ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-transparent hover:border-slate-300'
          }`}
          title="Trang chủ (Home)"
        >
          <Home className="w-5 h-5 transition-transform group-hover:scale-110" />

          {/* Tooltip khi hover */}
          <span
            className={`absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50 ${
              isDark ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'bg-slate-800 text-white shadow-md'
            }`}
          >
            Trang chủ
          </span>
        </button>
      </nav>

      {/* 3. Phần tài khoản & Đăng xuất ở dưới cùng Sidebar */}
      <div
        className={`flex flex-col items-center gap-3 pt-4 border-t w-full px-2 transition-colors ${
          isDark ? 'border-zinc-800' : 'border-slate-300'
        }`}
      >
        {/* User avatar indicator */}
        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center relative group cursor-default transition-colors ${
            isDark
              ? 'bg-zinc-800 border-zinc-700 text-emerald-400'
              : 'bg-white border-slate-300 text-emerald-600 shadow-xs'
          }`}
          title={`Đang đăng nhập: ${user?.username || 'admin'}`}
        >
          <User className="w-5 h-5" />
          <span
            className={`w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 absolute -top-0.5 -right-0.5 ${
              isDark ? 'ring-zinc-900' : 'ring-white'
            }`}
          />

          {/* Tooltip hiển thị tên */}
          <span
            className={`absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50 ${
              isDark
                ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                : 'bg-slate-800 text-emerald-300 shadow-md'
            }`}
          >
            {user?.username || 'admin'} (Online)
          </span>
        </div>

        {/* Nút đăng xuất */}
        <button
          onClick={() => signOut()}
          className={`group relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isDark
              ? 'text-zinc-500 hover:text-rose-400 hover:bg-zinc-800'
              : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
          }`}
          title="Đăng xuất"
        >
          <LogOut className="w-4 h-4" />
          <span
            className={`absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50 ${
              isDark ? 'bg-zinc-800 text-rose-300 border border-zinc-700' : 'bg-slate-800 text-rose-300 shadow-md'
            }`}
          >
            Đăng xuất
          </span>
        </button>
      </div>
    </aside>
  );
}
