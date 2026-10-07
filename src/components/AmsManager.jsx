import React, { useState } from 'react';
import { Cpu, Printer, Sparkles, X, Plus, Layers, Flame, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import FilamentCard from './FilamentCard';

export default function AmsManager() {
  const { filaments, updateFilament, moveFilament } = useApp();
  const [activeDropSlot, setActiveDropSlot] = useState(null);

  // 4 Slot AMS cố định
  const slots = [
    { id: 'slot-1', name: 'AMS Slot 1', label: 'Khay 1' },
    { id: 'slot-2', name: 'AMS Slot 2', label: 'Khay 2' },
    { id: 'slot-3', name: 'AMS Slot 3', label: 'Khay 3' },
    { id: 'slot-4', name: 'AMS Slot 4', label: 'Khay 4' },
  ];

  // Tìm cuộn nhựa đang được gán vào từng slot
  const getFilamentInSlot = (slotName) => {
    return filaments.find(
      (f) => f.slot && f.slot.toLowerCase().includes(slotName.toLowerCase())
    );
  };

  const handleDragOver = (e, slotId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropSlot !== slotId) {
      setActiveDropSlot(slotId);
    }
  };

  const handleDragLeave = (e, slotId) => {
    if (activeDropSlot === slotId) {
      setActiveDropSlot(null);
    }
  };

  const handleDrop = (e, targetSlot) => {
    e.preventDefault();
    setActiveDropSlot(null);

    try {
      const rawData = e.dataTransfer.getData('application/json');
      let filamentId = null;
      if (rawData) {
        const parsed = JSON.parse(rawData);
        if (parsed.type === 'filament') filamentId = parsed.filamentId;
      }
      if (!filamentId) {
        const plain = e.dataTransfer.getData('text/plain');
        if (plain && plain.startsWith('fil-')) filamentId = plain;
      }

      if (filamentId) {
        // Gán cuộn nhựa vào slot này và chuyển trạng thái thành loaded
        updateFilament(filamentId, {
          slot: targetSlot.name,
          status: 'loaded',
        });
      }
    } catch (err) {
      console.error('Lỗi khi drop vào AMS slot:', err);
    }
  };

  const handleEjectSlot = (filamentId) => {
    updateFilament(filamentId, {
      slot: 'Hộp chống ẩm / Tủ sấy',
      status: 'drybox',
    });
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Bộ Nạp Nhựa Đa Màu AMS / Spool Hub
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kéo thả các cuộn nhựa vào từng khay (Slot 1 - 4) để chuẩn bị in phối màu tự động
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-950/60 px-3.5 py-1.5 rounded-xl border border-indigo-500/30">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Kéo thả màu nhựa từ danh sách bên dưới vào 4 khay</span>
        </div>
      </div>

      {/* 4 Interactive Spool Slots Unit */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Khay Cấp Nhựa Trực Tiếp (Bambu AMS / Multi-Feed)
            </h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Trực Tuyến / Sẵn Sàng
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {slots.map((slot, index) => {
            const fil = getFilamentInSlot(slot.name);
            const isOver = activeDropSlot === slot.id;

            return (
              <div
                key={slot.id}
                onDragOver={(e) => handleDragOver(e, slot.id)}
                onDragLeave={(e) => handleDragLeave(e, slot.id)}
                onDrop={(e) => handleDrop(e, slot)}
                className={`relative flex flex-col items-center p-5 rounded-2xl border-2 transition-all min-h-[300px] justify-between ${
                  isOver
                    ? 'border-indigo-400 bg-indigo-500/15 shadow-xl shadow-indigo-500/25 scale-[1.02]'
                    : fil
                    ? 'border-slate-800 bg-slate-950/80 shadow-md'
                    : 'border-dashed border-slate-800 bg-slate-950/30 hover:border-slate-700'
                }`}
              >
                {/* Slot Number Badge */}
                <div className="w-full flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {slot.label}
                  </span>
                  {fil && (
                    <button
                      onClick={() => handleEjectSlot(fil.id)}
                      className="text-xs text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                      title="Tháo cuộn nhựa khỏi khay nạp"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Spool Visual Wheel */}
                <div className="my-4 relative flex flex-col items-center">
                  {fil ? (
                    <div className="relative group">
                      {/* Realistic Spool Outer Rim */}
                      <div
                        className="w-28 h-28 rounded-full border-4 border-slate-700 shadow-2xl flex items-center justify-center transition-transform group-hover:rotate-45 duration-700"
                        style={{
                          backgroundColor: fil.colorHex === 'rainbow' ? '#ec4899' : fil.colorHex,
                        }}
                      >
                        {/* Spool Center Core */}
                        <div className="w-12 h-12 rounded-full bg-slate-950 border-2 border-slate-700 flex items-center justify-center text-xs font-bold shadow-inner">
                          {fil.colorHex === 'rainbow' ? '🌈' : (
                            <span className="text-[10px] text-slate-400 font-mono">1.75</span>
                          )}
                        </div>
                      </div>

                      {/* Small glow ring */}
                      <div
                        className="absolute inset-0 rounded-full blur-md opacity-30 -z-10"
                        style={{
                          backgroundColor: fil.colorHex === 'rainbow' ? '#ec4899' : fil.colorHex,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-full border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-3 text-slate-600">
                      <Plus className="w-6 h-6 mb-1 text-slate-500" />
                      <span className="text-[11px] font-medium text-slate-400">Khay trống</span>
                    </div>
                  )}
                </div>

                {/* Info Area */}
                {fil ? (
                  <div className="w-full text-center space-y-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {fil.material}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate" title={fil.name}>
                      {fil.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">{fil.colorName}</p>
                    <div className="text-xs font-semibold text-emerald-400 pt-1">
                      Còn {fil.remainingWeight}g ({Math.round(((fil.remainingWeight || 0) / (fil.initialWeight || 1000)) * 100)}%)
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-[11px] text-slate-500 pb-2">
                    Kéo cuộn nhựa thả vào đây
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Spools Drawer (Tất cả cuộn nhựa có thể kéo thả) */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Tất Cả Cuộn Nhựa Trong Kho (Kéo lên các khay ở trên)
          </h3>
          <span className="text-xs text-slate-400">{filaments.length} cuộn có sẵn</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filaments.map((f) => (
            <FilamentCard key={f.id} filament={f} />
          ))}
        </div>
      </div>
    </div>
  );
}
