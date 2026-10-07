import React, { useState } from 'react';
import {
  FileCode2,
  Clock,
  Scale,
  Layers,
  Printer,
  GripVertical,
  Edit2,
  Trash2,
  MinusCircle,
  Sparkles,
  CheckCircle2,
  Tag,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatFileSize } from '../utils/storage';

export default function FileCard({ file }) {
  const {
    filaments,
    deleteFile,
    setEditingFile,
    setIsFileModalOpen,
    assignFilamentToFile,
    deductWeightForJob,
  } = useApp();

  const [isFilamentDragOver, setIsFilamentDragOver] = useState(false);

  // Tìm thông tin cuộn nhựa đã gán
  const assignedFilament = filaments.find((f) => f.id === file.assignedFilamentId);

  // Xử lý kéo thẻ file sang cột khác
  const handleDragStart = (e) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'file', fileId: file.id, name: file.name })
    );
    e.dataTransfer.setData('text/plain', file.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Xử lý khi có cuộn nhựa được kéo thả vào thẻ file này
  const handleFilamentDropOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFilamentDragOver(true);
  };

  const handleFilamentDropLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFilamentDragOver(false);
  };

  const handleFilamentDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFilamentDragOver(false);

    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (rawData) {
        const parsed = JSON.parse(rawData);
        if (parsed.type === 'filament' && parsed.filamentId) {
          assignFilamentToFile(file.id, parsed.filamentId);
          return;
        }
      }

      const plainId = e.dataTransfer.getData('text/plain');
      if (plainId && plainId.startsWith('fil-')) {
        assignFilamentToFile(file.id, plainId);
      }
    } catch (err) {
      console.error('Lỗi khi thả nhựa vào file:', err);
    }
  };

  const handleEdit = () => {
    setEditingFile(file);
    setIsFileModalOpen(true);
  };

  // Xác định màu sắc nhãn định dạng file
  const ext = file.fileType || 'stl';
  let badgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
  if (ext === '3mf') badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
  else if (ext === 'gcode') badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  else if (ext === 'step' || ext === 'stp') badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`group relative bg-slate-900/90 hover:bg-slate-850 border rounded-xl p-4 shadow-md transition-all select-none cursor-grab active:cursor-grabbing ${
        isFilamentDragOver
          ? 'border-emerald-400 bg-emerald-950/30 ring-2 ring-emerald-400/40'
          : 'border-slate-800 hover:border-indigo-500/50'
      }`}
    >
      {/* File Header */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 shrink-0 mt-0.5">
            <FileCode2 className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded border ${badgeColor}`}>
                {ext}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {formatFileSize(file.sizeBytes)}
              </span>
            </div>

            <h4
              onClick={handleEdit}
              className="text-xs font-bold text-white mt-1 hover:text-indigo-300 transition-colors line-clamp-2 cursor-pointer"
              title={file.name}
            >
              {file.name}
            </h4>
          </div>
        </div>

        {/* Drag handle */}
        <div className="text-slate-500 group-hover:text-indigo-400 transition-colors p-0.5" title="Kéo thẻ file này sang cột trạng thái khác">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      {/* Target Printer & Slice Specs */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
        <div className="flex items-center gap-1.5 truncate">
          <Printer className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{file.targetPrinter || 'Chưa gán máy'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>{file.estimatedTime || '--'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>~{file.estimatedWeight || 0}g nhựa</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Lớp {file.layerHeight || '0.20'}mm / {file.infill || '20%'}</span>
        </div>
      </div>

      {/* Dropzone Cuộn Nhựa (Kéo thả màu nhựa vào đây) */}
      <div
        onDragOver={handleFilamentDropOver}
        onDragLeave={handleFilamentDropLeave}
        onDrop={handleFilamentDrop}
        className={`mt-3 p-2.5 rounded-xl border transition-all ${
          assignedFilament
            ? 'bg-slate-950/80 border-slate-800'
            : isFilamentDragOver
            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
            : 'bg-slate-950/40 border-dashed border-slate-800 hover:border-slate-700 text-slate-400'
        }`}
      >
        {assignedFilament ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* Swatch màu cuộn nhựa */}
              <div
                className="w-5 h-5 rounded-full border border-slate-600 shadow-sm shrink-0 flex items-center justify-center text-[8px]"
                style={{
                  backgroundColor: assignedFilament.colorHex === 'rainbow' ? '#ec4899' : assignedFilament.colorHex,
                }}
              >
                {assignedFilament.colorHex === 'rainbow' && '🌈'}
              </div>

              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-white truncate">
                  {assignedFilament.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {assignedFilament.material} • Còn {assignedFilament.remainingWeight}g
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                assignFilamentToFile(file.id, null);
              }}
              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Bỏ gán cuộn nhựa này"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 py-0.5 text-center text-[11px]">
            <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
            <span>Kéo thả cuộn nhựa vào đây để ghép màu</span>
          </div>
        )}
      </div>

      {/* Tags if any */}
      {file.tags && file.tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
          {file.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Card Actions Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80 text-xs">
        {/* Nút trừ nhựa khi in xong */}
        {assignedFilament && (file.category === 'completed' || file.category === 'printing') ? (
          <button
            onClick={() => deductWeightForJob(file.id)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-emerald-600/30 hover:text-emerald-300 text-slate-300 text-[11px] font-medium transition-colors"
            title={`Trừ ${file.estimatedWeight || 0}g vào cuộn ${assignedFilament.name}`}
          >
            <MinusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Trừ {file.estimatedWeight || 0}g nhựa</span>
          </button>
        ) : (
          <span className="text-[10px] text-slate-500">
            {file.notes ? 'Có ghi chú' : 'Sẵn sàng'}
          </span>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={handleEdit}
            className="p-1.5 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
            title="Sửa thông số file in"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Xác nhận xóa file "${file.name}" khỏi danh sách?`)) {
                deleteFile(file.id);
              }
            }}
            className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Xóa file khỏi danh sách"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
