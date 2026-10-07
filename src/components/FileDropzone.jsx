import React, { useState, useRef } from 'react';
import { UploadCloud, FileCode2, Sparkles, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function FileDropzone({ targetCategory = 'queued' }) {
  const { handleDroppedComputerFiles } = useApp();
  const [isOver, setIsOver] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleDroppedComputerFiles(e.dataTransfer.files, targetCategory);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleDroppedComputerFiles(e.target.files, targetCategory);
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`group relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-300 ${
        isOver
          ? 'border-indigo-400 bg-indigo-500/15 shadow-xl shadow-indigo-500/20 scale-[1.01]'
          : 'border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900/80'
      }`}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileInput}
        multiple
        accept=".stl,.3mf,.gcode,.step,.stp,.obj,.ply,.zip"
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center gap-2">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isOver
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-110'
              : 'bg-slate-800/80 text-indigo-400 group-hover:bg-slate-800'
          }`}
        >
          <UploadCloud className="w-6 h-6 animate-bounce" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
            Kéo thả file 3D từ máy tính vào đây
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Hỗ trợ <span className="text-indigo-300 font-semibold">.STL</span>,{' '}
            <span className="text-cyan-300 font-semibold">.3MF</span>,{' '}
            <span className="text-amber-300 font-semibold">.GCODE</span>,{' '}
            <span className="text-emerald-300 font-semibold">.STEP</span> hoặc click để duyệt file
          </p>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Tự động lưu tên file, định dạng &amp; dung lượng
          </span>
        </div>
      </div>
    </div>
  );
}
