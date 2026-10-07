import React, { useState } from 'react';
import {
  Printer,
  Flame,
  Package,
  Archive,
  Plus,
  Filter,
  Search,
  Sparkles,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FILAMENT_COLUMNS, MATERIAL_TYPES } from '../utils/constants';
import FilamentCard from './FilamentCard';

const COLUMN_ICONS = {
  Printer,
  Flame,
  Package,
  Archive,
};

export default function FilamentKanban() {
  const {
    filaments,
    moveFilament,
    searchQuery,
    setSearchQuery,
    materialFilter,
    setMaterialFilter,
    setIsFilamentModalOpen,
    setEditingFilament,
  } = useApp();

  const [activeDropColumn, setActiveDropColumn] = useState(null);

  // Lọc danh sách cuộn nhựa theo ô tìm kiếm và dropdown chất liệu
  const filteredFilaments = filaments.filter((f) => {
    const matchesSearch =
      !searchQuery ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.colorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.slot && f.slot.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMaterial = materialFilter === 'ALL' || f.material === materialFilter;

    return matchesSearch && matchesMaterial;
  });

  // Xử lý kéo thả HTML5
  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropColumn !== columnId) {
      setActiveDropColumn(columnId);
    }
  };

  const handleDragLeave = (e, columnId) => {
    if (activeDropColumn === columnId) {
      setActiveDropColumn(null);
    }
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    setActiveDropColumn(null);

    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (rawData) {
        const parsed = JSON.parse(rawData);
        if (parsed.type === 'filament' && parsed.filamentId) {
          moveFilament(parsed.filamentId, targetColumnId);
          return;
        }
      }

      const plainId = e.dataTransfer.getData('text/plain');
      if (plainId && plainId.startsWith('fil-')) {
        moveFilament(plainId, targetColumnId);
      }
    } catch (err) {
      console.error('Lỗi khi drop cuộn nhựa:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Toolbar */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo tên cuộn, hãng, màu, slot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Lọc theo chất liệu */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Tất cả chất liệu ({filaments.length})</option>
              {MATERIAL_TYPES.map((mat) => {
                const count = filaments.filter((f) => f.material === mat.id).length;
                return (
                  <option key={mat.id} value={mat.id}>
                    {mat.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Tổng cộng: <strong className="text-white">{filteredFilaments.length}</strong> cuộn
          </span>

          <button
            onClick={() => {
              setEditingFilament(null);
              setIsFilamentModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/25 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Cuộn Nhựa Mới</span>
          </button>
        </div>
      </div>

      {/* Quick Interactive Tip */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-300">
        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
        <span>
          <strong>Kéo &amp; Thả:</strong> Giữ chuột vào bất kỳ cuộn nhựa nào để kéo sang các cột trạng thái khác, hoặc chuyển sang tab <strong>&quot;File In 3D&quot;</strong> để thả vào thẻ file cần in!
        </span>
      </div>

      {/* Kanban Board 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {FILAMENT_COLUMNS.map((column) => {
          const IconComponent = COLUMN_ICONS[column.icon] || Package;
          const colFilaments = filteredFilaments.filter((f) => f.status === column.id);
          const isOver = activeDropColumn === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={(e) => handleDragLeave(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`flex flex-col bg-slate-900/60 rounded-2xl border transition-all duration-200 min-h-[520px] ${
                isOver
                  ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/30'
                  : 'border-slate-800/80 hover:border-slate-750'
              }`}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      column.id === 'loaded'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : column.id === 'drybox'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : column.id === 'storage'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {column.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{column.description}</p>
                  </div>
                </div>

                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {colFilaments.length}
                </span>
              </div>

              {/* Column Body / Card List */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                {colFilaments.length === 0 ? (
                  <div
                    className={`h-40 rounded-xl border border-dashed flex flex-col items-center justify-center p-4 text-center text-xs transition-colors ${
                      isOver
                        ? 'border-indigo-400 bg-indigo-500/10 text-indigo-300'
                        : 'border-slate-800 text-slate-500'
                    }`}
                  >
                    <p className="font-medium">Chưa có cuộn nhựa nào</p>
                    <p className="text-[11px] mt-1 text-slate-500">
                      Kéo thả cuộn nhựa vào đây để xếp vào danh mục này
                    </p>
                  </div>
                ) : (
                  colFilaments.map((filament) => (
                    <FilamentCard key={filament.id} filament={filament} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
