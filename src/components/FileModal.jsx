import React, { useState, useEffect } from 'react';
import { X, Check, FileCode2, Scale, Clock, Layers, Printer, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FILE_COLUMNS } from '../utils/constants';

export default function FileModal() {
  const {
    isFileModalOpen,
    setIsFileModalOpen,
    editingFile,
    addFile,
    updateFile,
    filaments,
    printers,
  } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    fileType: 'stl',
    sizeBytes: 5000000,
    category: 'queued',
    assignedFilamentId: '',
    estimatedWeight: 50,
    estimatedTime: '2h 00m',
    layerHeight: '0.20',
    infill: '20%',
    targetPrinter: printers[0]?.name || 'Bambu Lab P1S',
    tagsInput: '',
    notes: '',
  });

  useEffect(() => {
    if (editingFile) {
      setFormData({
        name: editingFile.name || '',
        fileType: editingFile.fileType || 'stl',
        sizeBytes: editingFile.sizeBytes || 1024000,
        category: editingFile.category || 'queued',
        assignedFilamentId: editingFile.assignedFilamentId || '',
        estimatedWeight: editingFile.estimatedWeight || 50,
        estimatedTime: editingFile.estimatedTime || '1h 30m',
        layerHeight: editingFile.layerHeight || '0.20',
        infill: editingFile.infill || '20%',
        targetPrinter: editingFile.targetPrinter || printers[0]?.name || 'Máy in 3D',
        tagsInput: editingFile.tags ? editingFile.tags.join(', ') : '',
        notes: editingFile.notes || '',
      });
    } else {
      setFormData({
        name: 'Mo_Hinh_In_3D_Moi.stl',
        fileType: 'stl',
        sizeBytes: 2450000,
        category: 'queued',
        assignedFilamentId: '',
        estimatedWeight: 45,
        estimatedTime: '1h 45m',
        layerHeight: '0.20',
        infill: '20%',
        targetPrinter: printers[0]?.name || 'Bambu Lab P1S',
        tagsInput: 'Decor, Tiện ích',
        notes: '',
      });
    }
  }, [editingFile, isFileModalOpen]);

  if (!isFileModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên file');
      return;
    }

    const tags = formData.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      ...formData,
      tags,
      estimatedWeight: Number(formData.estimatedWeight) || 0,
    };

    if (editingFile) {
      updateFile(editingFile.id, payload);
    } else {
      addFile(payload);
    }
    setIsFileModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <FileCode2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {editingFile ? 'Chỉnh Sửa Thông Tin File 3D' : 'Thêm File Mô Hình 3D Mới'}
              </h2>
              <p className="text-xs text-slate-400">
                Quản lý tên file, thông số cắt lát (slicer) và cuộn nhựa in tương ứng
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsFileModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto">
          {/* Tên file & Định dạng */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tên File <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Benchie_Speed_Test.stl"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Định Dạng
              </label>
              <select
                value={formData.fileType}
                onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="stl">.STL</option>
                <option value="3mf">.3MF</option>
                <option value="gcode">.GCODE</option>
                <option value="step">.STEP</option>
                <option value="obj">.OBJ</option>
                <option value="zip">.ZIP</option>
              </select>
            </div>
          </div>

          {/* Cột trạng thái & Cuộn nhựa gán */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Trạng Thái Tiến Độ
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {FILE_COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gán Cuộn Nhựa Dùng Để In
              </label>
              <select
                value={formData.assignedFilamentId || ''}
                onChange={(e) => setFormData({ ...formData, assignedFilamentId: e.target.value || null })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Chưa gán cuộn nhựa --</option>
                {filaments.map((fil) => (
                  <option key={fil.id} value={fil.id}>
                    {fil.name} ({fil.material} - Còn {fil.remainingWeight}g)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Máy in & Thời gian in */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Máy In Mục Tiêu
              </label>
              <input
                type="text"
                value={formData.targetPrinter}
                onChange={(e) => setFormData({ ...formData, targetPrinter: e.target.value })}
                placeholder="VD: Bambu Lab P1S, Ender 3..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Thời Gian In Ước Tính
              </label>
              <input
                type="text"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                placeholder="VD: 3h 45m"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          {/* Trọng lượng nhựa, Chiều cao lớp in, Infill */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Khối Lượng Nhựa (g)
              </label>
              <input
                type="number"
                min="0"
                value={formData.estimatedWeight}
                onChange={(e) => setFormData({ ...formData, estimatedWeight: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Độ Cao Lớp (mm)
              </label>
              <input
                type="text"
                value={formData.layerHeight}
                onChange={(e) => setFormData({ ...formData, layerHeight: e.target.value })}
                placeholder="0.20"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Độ Đặc Infill (%)
              </label>
              <input
                type="text"
                value={formData.infill}
                onChange={(e) => setFormData({ ...formData, infill: e.target.value })}
                placeholder="15%"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nhãn / Thẻ Phân Loại (Tags cách nhau bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={formData.tagsInput}
              onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
              placeholder="VD: Đồ chơi, Decor, Nâng cấp máy, Cơ khí"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
            />
          </div>

          {/* Ghi chú in */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ghi Chú In (Brim, Support, Tốc độ...)
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="VD: Cần bật Tree Support góc 30 độ, bôi keo dán bàn in..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsFileModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{editingFile ? 'Lưu Thay Đổi' : 'Tạo Bản Ghi File'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
