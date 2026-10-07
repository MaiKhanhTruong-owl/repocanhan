import React from 'react';
import { Home, Box, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeNav = 'home', onSelectNav }) {
  const { user, signOut } = useAuth();

  return (
    <aside className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-5 shrink-0 select-none z-30 min-h-screen">
      {/* 1. Logo trên đầu */}
      <div className="mb-8 flex flex-col items-center gap-1 group cursor-pointer" title="PrintFlow 3D">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Box className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
        <span className="text-[10px] font-extrabold tracking-wider text-slate-400 group-hover:text-indigo-400 transition-colors uppercase">
          Flow
        </span>
      </div>

      {/* 2. Menu Icons - Dưới là icon Home */}
      <nav className="flex-1 flex flex-col items-center gap-3 w-full px-2">
        <button
          onClick={() => onSelectNav && onSelectNav('home')}
          className={`group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            activeNav === 'home'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Trang chủ (Home)"
        >
          <Home className="w-5 h-5 transition-transform group-hover:scale-110" />

          {/* Tooltip khi hover */}
          <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl border border-slate-700 z-50">
            Trang chủ
          </span>
        </button>
      </nav>

      {/* 3. Phần tài khoản & Đăng xuất ở dưới cùng Sidebar */}
      <div className="flex flex-col items-center gap-3 pt-4 border-t border-slate-800/80 w-full px-2">
        {/* User avatar indicator */}
        <div
          className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 relative group cursor-default"
          title={`Đang đăng nhập: ${user?.username || 'admin'}`}
        >
          <User className="w-5 h-5" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 absolute -top-0.5 -right-0.5" />

          {/* Tooltip hiển thị tên */}
          <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl border border-slate-700 z-50">
            {user?.username || 'admin'} (Online)
          </span>
        </div>

        {/* Nút đăng xuất */}
        <button
          onClick={() => signOut()}
          className="group relative w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Đăng xuất"
        >
          <LogOut className="w-4 h-4" />
          <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-800 text-rose-300 text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl border border-slate-700 z-50">
            Đăng xuất
          </span>
        </button>
      </div>
    </aside>
  );
}
