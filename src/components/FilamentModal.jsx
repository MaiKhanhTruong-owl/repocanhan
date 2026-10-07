import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Box, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MATERIAL_TYPES, POPULAR_BRANDS, PRESET_COLORS, FILAMENT_COLUMNS } from '../utils/constants';

export default function FilamentModal() {
  const {
    isFilamentModalOpen,
    setIsFilamentModalOpen,
    editingFilament,
    addFilament,
    updateFilament,
  } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    brand: 'Bambu Lab',
    material: 'PLA',
    colorName: 'Đen (Black)',
    colorHex: '#18181b',
    initialWeight: 1000,
    remainingWeight: 1000,
    tempNozzle: '210-230',
    tempBed: '55-65',
    status: 'loaded',
    slot: '',
    price: 300000,
    notes: '',
  });

  useEffect(() => {
    if (editingFilament) {
      setFormData({
        name: editingFilament.name || '',
        brand: editingFilament.brand || 'Bambu Lab',
        material: editingFilament.material || 'PLA',
        colorName: editingFilament.colorName || 'Đen',
        colorHex: editingFilament.colorHex || '#18181b',
        initialWeight: editingFilament.initialWeight || 1000,
        remainingWeight: editingFilament.remainingWeight || 1000,
        tempNozzle: editingFilament.tempNozzle || '210-230',
        tempBed: editingFilament.tempBed || '55-65',
        status: editingFilament.status || 'loaded',
        slot: editingFilament.slot || '',
        price: editingFilament.price || 0,
        notes: editingFilament.notes || '',
      });
    } else {
      // Giá trị mặc định khi tạo mới
      setFormData({
        name: 'Cuộn Nhựa Mới',
        brand: 'Bambu Lab',
        material: 'PLA',
        colorName: 'Đen (Black)',
        colorHex: '#18181b',
        initialWeight: 1000,
        remainingWeight: 1000,
        tempNozzle: '210-230',
        tempBed: '55-65',
        status: 'loaded',
        slot: 'AMS Slot 1',
        price: 320000,
        notes: '',
      });
    }
  }, [editingFilament, isFilamentModalOpen]);

  if (!isFilamentModalOpen) return null;

  const handleMaterialChange = (matId) => {
    const mat = MATERIAL_TYPES.find((m) => m.id === matId);
    setFormData((prev) => ({
      ...prev,
      material: matId,
      tempNozzle: mat?.tempNozzle?.replace('°C', '') || prev.tempNozzle,
      tempBed: mat?.tempBed?.replace('°C', '') || prev.tempBed,
    }));
  };

  const handleSelectPresetColor = (preset) => {
    setFormData((prev) => ({
      ...prev,
      colorName: preset.name,
      colorHex: preset.hex,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên cuộn nhựa');
      return;
    }

    if (editingFilament) {
      updateFilament(editingFilament.id, formData);
    } else {
      addFilament(formData);
    }
    setIsFilamentModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Box className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {editingFilament ? 'Chỉnh Sửa Cuộn Nhựa' : 'Thêm Cuộn Nhựa In 3D Mới'}
              </h2>
              <p className="text-xs text-slate-400">
                Lưu trữ thuộc tính màu sắc, khối lượng, nhiệt độ và vị trí lưu kho
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsFilamentModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(85vh-120px)] overflow-y-auto">
          {/* Tên cuộn nhựa */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tên Định Danh Cuộn Nhựa <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Bambu PLA Matte Đen Nhám, eSun PLA+ Trắng..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Hãng & Chất liệu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Thương Hiệu / Nhà Sản Xuất
              </label>
              <select
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {POPULAR_BRANDS.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Chất Liệu Nhựa (Material)
              </label>
              <select
                value={formData.material}
                onChange={(e) => handleMaterialChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {MATERIAL_TYPES.map((mat) => (
                  <option key={mat.id} value={mat.id}>
                    {mat.name} ({mat.tempNozzle})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Phần Chọn Màu Sắc */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200">
                Màu Sắc Cuộn Nhựa
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Xem trước:</span>
                <div
                  className="w-6 h-6 rounded-full border-2 border-slate-700 shadow flex items-center justify-center text-[10px]"
                  style={{
                    backgroundColor: formData.colorHex === 'rainbow' ? '#ec4899' : formData.colorHex,
                  }}
                >
                  {formData.colorHex === 'rainbow' && '🌈'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Tên Màu Hiển Thị</label>
                <input
                  type="text"
                  value={formData.colorName}
                  onChange={(e) => setFormData({ ...formData, colorName: e.target.value })}
                  placeholder="VD: Trắng đục, Đen mờ, Xanh neon..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Mã Màu HEX / Tùy Chỉnh</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.colorHex === 'rainbow' ? '#ec4899' : formData.colorHex}
                    onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.colorHex}
                    onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white uppercase font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Bảng Màu Nhanh */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5">Chọn nhanh bảng màu có sẵn:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPresetColor(preset)}
                    className="w-6 h-6 rounded-full border border-slate-700 hover:scale-125 transition-transform flex items-center justify-center text-[10px] relative group"
                    style={{
                      backgroundColor: preset.hex === 'rainbow' ? '#ec4899' : preset.hex,
                    }}
                    title={preset.name}
                  >
                    {preset.hex === 'rainbow' && '🌈'}
                    {formData.colorHex === preset.hex && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow ring-1 ring-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Khối lượng (Trọng lượng) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Khối Lượng Ban Đầu (g)
              </label>
              <input
                type="number"
                min="50"
                step="50"
                value={formData.initialWeight}
                onChange={(e) => setFormData({ ...formData, initialWeight: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Khối Lượng Còn Lại (g)
              </label>
              <input
                type="number"
                min="0"
                max={formData.initialWeight}
                value={formData.remainingWeight}
                onChange={(e) => setFormData({ ...formData, remainingWeight: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          {/* Vị trí lưu & Trạng thái */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Danh Mục / Trạng Thái Ban Đầu
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {FILAMENT_COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vị Trí Cụ Thể (Slot / Ngăn Tủ)
              </label>
              <input
                type="text"
                value={formData.slot}
                onChange={(e) => setFormData({ ...formData, slot: e.target.value })}
                placeholder="VD: Bambu AMS Slot 1, Kệ B-Tầng 3..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          {/* Nhiệt độ in khuyến nghị & Giá tiền */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nhiệt Độ Đầu Phun (°C)
              </label>
              <input
                type="text"
                value={formData.tempNozzle}
                onChange={(e) => setFormData({ ...formData, tempNozzle: e.target.value })}
                placeholder="VD: 210-230"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nhiệt Bàn In (°C)
              </label>
              <input
                type="text"
                value={formData.tempBed}
                onChange={(e) => setFormData({ ...formData, tempBed: e.target.value })}
                placeholder="VD: 55-65"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Giá Mua (VNĐ)
              </label>
              <input
                type="number"
                step="10000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                placeholder="VD: 320000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ghi Chú In &amp; Hiệu Chỉnh
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="VD: Cần sấy 6 tiếng trước khi in, hệ số K = 0.02, dán keo cẩn thận..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsFilamentModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{editingFilament ? 'Cập Nhật Cuộn Nhựa' : 'Lưu Cuộn Nhựa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
