import React from 'react';
  import {
  Box,
  Layers,
  Flame,
  FileCode2,
  TrendingUp,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Scale,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatVND, formatFileSize } from '../utils/storage';
import { MATERIAL_TYPES } from '../utils/constants';

export default function StatsOverview() {
  const { filaments, files, setActiveTab, setIsFilamentModalOpen, setEditingFilament, setIsFileModalOpen, setEditingFile } = useApp();

  // Thống kê nhựa
  const totalSpools = filaments.length;
  const loadedSpools = filaments.filter((f) => f.status === 'loaded').length;
  const dryboxSpools = filaments.filter((f) => f.status === 'drybox').length;
  const lowSpools = filaments.filter((f) => (Number(f.remainingWeight) / Number(f.initialWeight || 1000)) < 0.15).length;

  const totalRemainingWeightGrams = filaments.reduce(
    (sum, f) => sum + (Number(f.remainingWeight) || 0),
    0
  );
  const totalInitialWeightGrams = filaments.reduce(
    (sum, f) => sum + (Number(f.initialWeight) || 1000),
    0
  );

  const totalInventoryValue = filaments.reduce((sum, f) => {
    const price = Number(f.price) || 0;
    const ratio = (Number(f.remainingWeight) || 0) / (Number(f.initialWeight) || 1000);
    return sum + price * ratio;
  }, 0);

  // Thống kê chất liệu
  const materialCounts = filaments.reduce((acc, f) => {
    const mat = f.material || 'OTHER';
    acc[mat] = (acc[mat] || 0) + 1;
    return acc;
  }, {});

  // Thống kê file
  const queuedFiles = files.filter((f) => f.category === 'queued').length;
  const readyFiles = files.filter((f) => f.category === 'ready').length;
  const printingFiles = files.filter((f) => f.category === 'printing').length;
  const completedFiles = files.filter((f) => f.category === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Guide */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Sẵn sàng làm việc hoàn toàn Offline / Local
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Trung Tâm Điều Hành In 3D & Kho Nhựa
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Kéo thả trực tiếp file <span className="text-indigo-300 font-semibold">.STL, .3MF, .GCODE</span> từ máy tính vào để lập kế hoạch.
              Kéo thả các <span className="text-emerald-300 font-semibold">màu nhựa</span> giữa các vị trí hoặc thả trực tiếp vào file in để ghép màu!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('filaments')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white text-xs font-semibold border border-slate-700 transition-all hover:scale-105 active:scale-95"
            >
              <Box className="w-4 h-4 text-emerald-400" />
              Bảng Kho Nhựa
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <FileCode2 className="w-4 h-4" />
              Bảng File In 3D
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ambient decorative glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng khối lượng nhựa */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-md hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Khối Lượng Nhựa Sẵn Có</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Scale className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {(totalRemainingWeightGrams / 1000).toFixed(2)}
            </span>
            <span className="text-sm text-slate-400 font-medium">kg nhựa</span>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                style={{
                  width: `${
                    totalInitialWeightGrams > 0
                      ? Math.min(100, (totalRemainingWeightGrams / totalInitialWeightGrams) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5">
              <span>Còn lại ~{Math.round((totalRemainingWeightGrams / (totalInitialWeightGrams || 1)) * 100)}% dung lượng</span>
              <span>{totalSpools} cuộn</span>
            </div>
          </div>
        </div>

        {/* Card 2: Giá trị kho nhựa */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-md hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Ước Tính Giá Trị Nhựa</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatVND(totalInventoryValue)}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Tính theo giá mua và tỷ lệ gram còn lại trong kho
          </p>
        </div>

        {/* Card 3: Trạng thái nạp máy & sấy */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-md hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Vị Trí Nhựa Hiện Tại</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Printer className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Đang nạp máy / AMS:
              </span>
              <span className="font-bold text-white">{loadedSpools} cuộn</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Hộp sấy / Chống ẩm:
              </span>
              <span className="font-bold text-white">{dryboxSpools} cuộn</span>
            </div>
            {lowSpools > 0 && (
              <div className="flex justify-between items-center text-xs text-rose-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Sắp hết (&lt;15%):
                </span>
                <span>{lowSpools} cuộn</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Tình trạng file in */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-md hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Tiến Độ File In 3D</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <FileCode2 className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{files.length}</span>
            <span className="text-sm text-slate-400 font-medium">file đã lưu</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
              Chờ: {queuedFiles}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              Sẵn sàng: {readyFiles}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
              Đang in: {printingFiles}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Phân bổ chất liệu & Cuộn nhựa đang nạp máy in */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phân bổ chất liệu */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Cơ Cấu Chất Liệu Nhựa
            </h3>
            <span className="text-xs text-slate-400">
              {Object.keys(materialCounts).length} loại
            </span>
          </div>

          <div className="space-y-2.5">
            {Object.entries(materialCounts).map(([matKey, count]) => {
              const matInfo = MATERIAL_TYPES.find((m) => m.id === matKey);
              const percentage = Math.round((count / (totalSpools || 1)) * 100);
              return (
                <div key={matKey} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-300">
                      {matInfo?.name || matKey}
                    </span>
                    <span className="text-slate-400">
                      {count} cuộn ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        backgroundColor: matInfo?.color || '#6366f1',
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cuộn nhựa đang nạp sẵn trên máy in (Loaded / AMS) */}
        <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Printer className="w-4 h-4 text-emerald-400" />
              Nhựa Đang Nạp Trực Tiếp Trên Máy ({loadedSpools})
            </h3>
            <button
              onClick={() => setActiveTab('filaments')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Xem tất cả →
            </button>
          </div>

          {loadedSpools === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl text-xs">
              Chưa có cuộn nhựa nào được đánh dấu đang nạp trên máy in.
              <br />
              Hãy kéo thả cuộn nhựa vào cột &quot;Đang nạp máy / AMS&quot; trong bảng Kho Nhựa!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filaments
                .filter((f) => f.status === 'loaded')
                .map((f) => {
                  const percent = Math.round(
                    ((Number(f.remainingWeight) || 0) / (Number(f.initialWeight) || 1000)) * 100
                  );
                  return (
                    <div
                      key={f.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 flex items-center gap-3 transition-all"
                    >
                      {/* Swatch màu */}
                      <div
                        className="w-8 h-8 rounded-full border-2 border-slate-700 shrink-0 shadow-inner flex items-center justify-center text-[10px] font-bold"
                        style={{
                          backgroundColor: f.colorHex === 'rainbow' ? '#ec4899' : f.colorHex,
                          color: ['#18181b', '#27272a', '#1e3a8a'].includes(f.colorHex) ? '#fff' : '#000',
                        }}
                      >
                        {f.colorHex === 'rainbow' && '🌈'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-white truncate">{f.name}</h4>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0 ml-1">
                            {f.material}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{f.slot || 'Chưa đặt slot'}</div>
                        <div className="flex items-center justify-between text-[11px] mt-1 text-slate-300">
                          <span>{f.remainingWeight}g</span>
                          <span className={percent < 15 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                            {percent}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
