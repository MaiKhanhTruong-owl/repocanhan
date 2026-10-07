import React, { useState } from 'react';
import {
  ListFilter,
  CheckCircle2,
  PlayCircle,
  Trophy,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Sparkles,
  LayoutGrid,
  List,
  Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FILE_COLUMNS } from '../utils/constants';
import FileCard from './FileCard';
import FileDropzone from './FileDropzone';

const COLUMN_ICONS = {
  ListFilter,
  CheckCircle2,
  PlayCircle,
  Trophy,
  AlertTriangle,
};

export default function FileKanban() {
  const {
    files,
    moveFile,
    handleDroppedComputerFiles,
    searchQuery,
    setSearchQuery,
    setIsFileModalOpen,
    setEditingFile,
  } = useApp();

  const [activeDropColumn, setActiveDropColumn] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  // Lọc file
  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      !searchQuery ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.notes && f.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.targetPrinter && f.targetPrinter.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.tags && f.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesType = filterType === 'ALL' || f.fileType === filterType;

    return matchesSearch && matchesType;
  });

  // Xử lý kéo thả HTML5 cho Cột Kanban
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

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    setActiveDropColumn(null);

    // 1. Kiểm tra nếu là file thả trực tiếp từ máy tính
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleDroppedComputerFiles(e.dataTransfer.files, columnId);
      return;
    }

    // 2. Kiểm tra nếu là thẻ file kéo thả giữa các cột
    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (rawData) {
        const parsed = JSON.parse(rawData);
        if (parsed.type === 'file' && parsed.fileId) {
          moveFile(parsed.fileId, columnId);
          return;
        }
      }

      const plainId = e.dataTransfer.getData('text/plain');
      if (plainId && plainId.startsWith('file-')) {
        moveFile(plainId, columnId);
      }
    } catch (err) {
      console.error('Lỗi khi drop file:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Dedicated Computer File Dropzone */}
      <FileDropzone targetCategory="queued" />

      {/* Toolbar & Filters */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo tên file, máy in, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Tất cả định dạng ({files.length})</option>
              <option value="stl">STL (3D Model)</option>
              <option value="3mf">3MF (Bambu/Prusa)</option>
              <option value="gcode">G-code (Đã Slice)</option>
              <option value="step">STEP / CAD</option>
              <option value="obj">OBJ</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Tìm thấy: <strong className="text-white">{filteredFiles.length}</strong> file
          </span>

          <button
            onClick={() => {
              setEditingFile(null);
              setIsFileModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm File Thủ Công</span>
          </button>
        </div>
      </div>

      {/* Kanban Board 5 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
        {FILE_COLUMNS.map((column) => {
          const IconComponent = COLUMN_ICONS[column.icon] || ListFilter;
          const colFiles = filteredFiles.filter((f) => f.category === column.id);
          const isOver = activeDropColumn === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={(e) => handleDragLeave(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`flex flex-col bg-slate-900/60 rounded-2xl border transition-all duration-200 min-h-[500px] ${
                isOver
                  ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/30'
                  : 'border-slate-800/80 hover:border-slate-750'
              }`}
            >
              {/* Header */}
              <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      column.id === 'ready'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : column.id === 'printing'
                        ? 'bg-amber-500/10 text-amber-400'
                        : column.id === 'completed'
                        ? 'bg-teal-500/10 text-teal-400'
                        : column.id === 'failed'
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-indigo-500/10 text-indigo-400'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{column.title}</h3>
                  </div>
                </div>

                <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-slate-800 text-slate-300">
                  {colFiles.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-290px)]">
                {colFiles.length === 0 ? (
                  <div
                    className={`h-32 rounded-xl border border-dashed flex flex-col items-center justify-center p-3 text-center text-xs transition-colors ${
                      isOver
                        ? 'border-indigo-400 bg-indigo-500/10 text-indigo-300'
                        : 'border-slate-800 text-slate-500'
                    }`}
                  >
                    <p className="font-medium text-[11px]">Trống</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Thả file từ máy tính hoặc kéo thẻ file vào đây
                    </p>
                  </div>
                ) : (
                  colFiles.map((file) => <FileCard key={file.id} file={file} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
