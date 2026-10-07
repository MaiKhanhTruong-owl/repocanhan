import React, { useRef } from 'react';
import {
  Layers,
  Box,
  FileCode2,
  SlidersHorizontal,
  Plus,
  Upload,
  Download,
  RotateCcw,
  Search,
  Cpu,
  Sparkles,
  Cloud,
  LogOut,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenTester }) {
  const { user, isConfigured, setIsAuthModalOpen, signOut } = useAuth();
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    setIsFilamentModalOpen,
    setEditingFilament,
    setIsFileModalOpen,
    setEditingFile,
    resetToSampleData,
    handleExportData,
    handleImportData,
    filaments,
    files,
  } = useApp();

  const fileInputRef = useRef(null);

  const onOpenNewFilament = () => {
    setEditingFilament(null);
    setIsFilamentModalOpen(true);
  };

  const onOpenNewFile = () => {
    setEditingFile(null);
    setIsFileModalOpen(true);
  };

  const onFileImportChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportData(file);
      e.target.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Box className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-tight">PrintFlow</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Local 3D Hub
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Quản lý kho nhựa in & File mô hình 3D
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Tổng quan</span>
            </button>

            <button
              onClick={() => setActiveTab('filaments')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'filaments'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="relative">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
              </div>
              <span>Kho Nhựa</span>
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {filaments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'files'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileCode2 className="w-4 h-4" />
              <span>File In 3D</span>
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {files.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ams')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'ams'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Bộ Nạp AMS</span>
            </button>
          </nav>

          {/* Search bar & Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Quick search input */}
            <div className="relative hidden lg:block w-48 xl:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm màu, chất liệu, file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Thêm cuộn nhựa */}
            <button
              onClick={onOpenNewFilament}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 transition-all active:scale-95"
              title="Thêm cuộn nhựa mới"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm Nhựa</span>
            </button>

            {/* Thêm file */}
            <button
              onClick={onOpenNewFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm shadow-indigo-600/30 transition-all active:scale-95"
              title="Thêm file 3D mới"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm File</span>
            </button>

            {/* Backup / Export / Import Tools dropdown or buttons */}
            <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
              <button
                onClick={handleExportData}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Xuất file JSON sao lưu dự phòng"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Nhập dữ liệu từ file JSON"
              >
                <Upload className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileImportChange}
                accept=".json"
                className="hidden"
              />

              <button
                onClick={resetToSampleData}
                className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                title="Khôi phục dữ liệu mẫu ban đầu"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Cloud Sync & User Profile */}
            <div className="flex items-center pl-1 border-l border-slate-800">
              {user ? (
                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Đang đồng bộ Cloud" />
                  <span className="text-slate-300 font-medium max-w-[100px] sm:max-w-[130px] truncate" title={user.email}>
                    {user.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-1"
                    title="Đăng xuất tài khoản"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => (onOpenTester ? onOpenTester() : setIsAuthModalOpen(true))}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-all shadow-sm"
                  title="Kiểm tra kết nối và đăng nhập tài khoản Supabase"
                >
                  <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Kiểm Tra Supabase</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${
              activeTab === 'overview' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('filaments')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${
              activeTab === 'filaments' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            Kho Nhựa ({filaments.length})
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${
              activeTab === 'files' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            File In ({files.length})
          </button>
          <button
            onClick={() => setActiveTab('ams')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${
              activeTab === 'ams' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            AMS
          </button>
        </div>
      </div>
    </header>
  );
}
