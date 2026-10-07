import React from 'react';
import {
  GripVertical,
  Thermometer,
  Layers,
  MapPin,
  Edit2,
  Trash2,
  Copy,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MATERIAL_TYPES } from '../utils/constants';

export default function FilamentCard({ filament }) {
  const {
    deleteFilament,
    setEditingFilament,
    setIsFilamentModalOpen,
    addFilament,
    adjustFilamentWeight,
  } = useApp();

  const matInfo = MATERIAL_TYPES.find((m) => m.id === filament.material);
  const remaining = Number(filament.remainingWeight) || 0;
  const initial = Number(filament.initialWeight) || 1000;
  const percentage = Math.min(100, Math.max(0, Math.round((remaining / initial) * 100)));

  // Màu sắc progress bar dựa trên % còn lại
  let progressColor = 'bg-emerald-500';
  if (percentage <= 15) progressColor = 'bg-rose-500 animate-pulse';
  else if (percentage <= 40) progressColor = 'bg-amber-500';

  const handleDragStart = (e) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'filament', filamentId: filament.id, colorHex: filament.colorHex, name: filament.name })
    );
    e.dataTransfer.setData('text/plain', filament.id);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleEdit = () => {
    setEditingFilament(filament);
    setIsFilamentModalOpen(true);
  };

  const handleDuplicate = () => {
    const copy = {
      ...filament,
      name: `${filament.name} (Bản sao)`,
      slot: filament.slot ? `${filament.slot} (Mới)` : '',
    };
    delete copy.id;
    addFilament(copy);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group relative bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 shadow-md transition-all hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing select-none"
    >
      {/* Top row: Color Swatch + Title + Drag Icon */}
      <div className="flex items-start gap-3">
        {/* Visual Spool Swatch */}
        <div className="relative shrink-0 mt-0.5">
          <div
            className="w-10 h-10 rounded-full border-2 border-slate-700 shadow-md flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-105"
            style={{
              backgroundColor: filament.colorHex === 'rainbow' ? '#ec4899' : filament.colorHex,
              color: ['#18181b', '#27272a', '#1e3a8a', '#000000'].includes(filament.colorHex)
                ? '#ffffff'
                : '#000000',
            }}
            title={`Mã màu: ${filament.colorHex}`}
          >
            {filament.colorHex === 'rainbow' ? '🌈' : (
              <span className="w-3 h-3 rounded-full bg-slate-950/40 border border-white/20" />
            )}
          </div>
          {/* Vạch chỉ số % nhỏ ở góc swatch */}
          <span className="absolute -bottom-1 -right-1 text-[9px] font-bold px-1 rounded-full bg-slate-950 border border-slate-700 text-slate-300">
            {percentage}%
          </span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
              style={{ backgroundColor: matInfo?.color || '#6366f1' }}
            >
              {filament.material}
            </span>
            <span className="text-[11px] text-slate-400 font-medium truncate">
              {filament.brand}
            </span>
          </div>

          <h4 className="text-sm font-bold text-white mt-0.5 truncate group-hover:text-indigo-300 transition-colors" title={filament.name}>
            {filament.name}
          </h4>

          <div className="text-xs text-slate-400 truncate mt-0.5">
            Màu: <span className="text-slate-300 font-medium">{filament.colorName}</span>
          </div>
        </div>

        {/* Drag Indicator */}
        <div className="text-slate-500 group-hover:text-indigo-400 transition-colors p-1" title="Kéo cuộn nhựa này sang mục khác hoặc thả vào file in">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      {/* Weight Progress Bar */}
      <div className="mt-3.5 space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Khối lượng:</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white">{remaining}g</span>
            <span className="text-slate-500 text-[11px]">/ {initial}g</span>
          </div>
        </div>

        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Quick Adjust Buttons: -50g / +50g */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => adjustFilamentWeight(filament.id, -50)}
            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 transition-colors"
            title="Trừ 50g nhựa"
          >
            -50g
          </button>
          <button
            onClick={() => adjustFilamentWeight(filament.id, -10)}
            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 transition-colors"
            title="Trừ 10g nhựa"
          >
            -10g
          </button>
          <button
            onClick={() => adjustFilamentWeight(filament.id, 50)}
            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-400 transition-colors"
            title="Cộng 50g nhựa"
          >
            +50g
          </button>
        </div>

        {filament.slot ? (
          <div className="flex items-center gap-1 text-slate-400 truncate max-w-[120px]" title={filament.slot}>
            <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="truncate">{filament.slot}</span>
          </div>
        ) : (
          <span className="text-slate-500 text-[10px]">Chưa gắn vị trí</span>
        )}
      </div>

      {/* Temperature & Footer action buttons */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Thermometer className="w-3.5 h-3.5 text-amber-400" />
          <span>{filament.tempNozzle || '210'}°C / {filament.tempBed || '60'}°C</span>
        </div>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDuplicate}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Nhân bản cuộn nhựa này"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleEdit}
            className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
            title="Chỉnh sửa chi tiết"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Xác nhận xóa cuộn nhựa "${filament.name}"?`)) {
                deleteFilament(filament.id);
              }
            }}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Xóa cuộn nhựa"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
