import React, { useState, useEffect, useRef } from 'react';
import {
  Image,
  Sliders,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  Check,
  Palette,
  Compass,
  ArrowRight,
  CheckCircle2,
  UploadCloud,
  FolderOpen,
  Trash2,
  FileImage,
  HardDrive,
  Loader2,
  Save,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { BONJOURR_WALLPAPERS, DEFAULT_BONJOURR_CONFIG } from '../utils/bonjourrConfig';

export default function BonjourrSettings({ config, onUpdateConfig, onNavigateHome }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const initialConfig = { ...DEFAULT_BONJOURR_CONFIG, ...(config || {}) };

  // Trạng thái nháp (draft): Người dùng tinh chỉnh tùy thích, chỉ lưu và áp dụng khi bấm nút "Lưu & Về Trang Chính"
  const [draftConfig, setDraftConfig] = useState(initialConfig);

  // Đồng bộ nếu cấu hình gốc từ props thay đổi
  useEffect(() => {
    setDraftConfig({ ...DEFAULT_BONJOURR_CONFIG, ...(config || {}) });
  }, [config]);

  const [activeFilter, setActiveFilter] = useState('all');
  const [customInputUrl, setCustomInputUrl] = useState(draftConfig.customUrl || '');
  const [notification, setNotification] = useState(null);

  // Danh sách ảnh người dùng tải lên lưu vào public/wallpapers
  const [customWallpapers, setCustomWallpapers] = useState([]);
  const [loadingWallpapers, setLoadingWallpapers] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Kiểm tra xem người dùng có chỉnh sửa gì so với ban đầu chưa
  const isDirty = JSON.stringify(draftConfig) !== JSON.stringify(initialConfig);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // NÚT LƯU & VỀ TRANG CHÍNH: Lưu cấu hình vào bộ nhớ và quay lại trang giám sát máy in
  const handleSaveAndReturn = () => {
    onUpdateConfig(draftConfig);
    showNotification('Đã lưu cấu hình hình nền thành công!');
    setTimeout(() => {
      if (onNavigateHome) onNavigateHome();
    }, 250);
  };

  // Tải danh sách ảnh từ API thư mục public/wallpapers
  const fetchCustomWallpapers = async () => {
    try {
      setLoadingWallpapers(true);
      const res = await fetch('/api/wallpapers');
      const data = await res.json();
      if (data.success && Array.isArray(data.wallpapers)) {
        setCustomWallpapers(data.wallpapers);
      }
    } catch (e) {
      console.warn('Không thể tải danh sách ảnh tải lên:', e);
    } finally {
      setLoadingWallpapers(false);
    }
  };

  useEffect(() => {
    fetchCustomWallpapers();
  }, []);

  // Lắng nghe sự kiện kéo thả toàn cửa sổ (Window Drag & Drop)
  // Ngăn chặn triệt để trình duyệt mở file ảnh hoặc reload trang khi kéo thả từ Explorer
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsDragging(false);
        dragCounter = 0;
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter = 0;

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleUploadFile(files[0]);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Xử lý upload file ảnh vào thư mục public/wallpapers
  const handleUploadFile = (file) => {
    if (!file) return;

    const ext = file.name ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '';
    const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const isImage = (file.type && file.type.startsWith('image/')) || validExts.includes(ext);

    if (!isImage) {
      showNotification('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP, GIF, SVG)');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      showNotification('Dung lượng ảnh tối đa cho phép là 25MB');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataBase64 = e.target.result;
        const res = await fetch('/api/wallpapers/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            name: file.name.replace(/\.[^/.]+$/, ''),
            dataBase64,
          }),
        });
        const result = await res.json();
        if (result.success && result.wallpaper) {
          setCustomWallpapers(result.wallpapers || [result.wallpaper, ...customWallpapers]);
          // Chọn ngay ảnh vừa tải lên trong bản nháp
          setDraftConfig((prev) => ({
            ...prev,
            enabled: true,
            mode: 'custom',
            customUrl: result.wallpaper.url,
          }));
          showNotification(`Đã tải lên "${result.wallpaper.title}". Bấm "Lưu & Về Trang Chính" để áp dụng!`);
        } else {
          showNotification(`Lỗi khi lưu ảnh: ${result.error || 'Không rõ nguyên nhân'}`);
        }
      } catch (err) {
        showNotification(`Lỗi kết nối máy chủ: ${err.message}`);
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      showNotification('Lỗi khi đọc file từ máy tính');
    };
    reader.readAsDataURL(file);
  };

  // Xóa ảnh đã lưu trong thư mục
  const handleDeleteWallpaper = async (wp, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ảnh "${wp.title}" khỏi thư mục máy tính?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/wallpapers?id=${encodeURIComponent(wp.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setCustomWallpapers(data.wallpapers || customWallpapers.filter((w) => w.id !== wp.id));
        if (draftConfig.mode === 'custom' && draftConfig.customUrl === wp.url) {
          setDraftConfig((prev) => ({
            ...prev,
            mode: 'curated',
            currentIndex: 0,
          }));
        }
        showNotification(`Đã xóa ảnh "${wp.title}"`);
      }
    } catch (err) {
      showNotification('Không thể xóa ảnh: ' + err.message);
    }
  };

  // Mở thư mục public/wallpapers trong Windows Explorer
  const handleOpenFolder = async () => {
    try {
      const res = await fetch('/api/wallpapers/open-folder', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification('Đã mở thư mục public/wallpapers trong Windows Explorer');
      }
    } catch (e) {
      showNotification('Đường dẫn: PrintFlow/public/wallpapers');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Danh mục phân loại ảnh
  const categories = ['all', 'Núi non', 'Rừng cây', 'Sông hồ', 'Vũ trụ', 'Việt Nam', 'Hoang mạc', 'Đô thị', 'Biển đảo'];

  const filteredWallpapers = activeFilter === 'all'
    ? BONJOURR_WALLPAPERS
    : BONJOURR_WALLPAPERS.filter((w) => w.category === activeFilter);

  const currentWallpaper = BONJOURR_WALLPAPERS[draftConfig.currentIndex] || BONJOURR_WALLPAPERS[0];

  const handleNextRandom = () => {
    const nextIdx = Math.floor(Math.random() * BONJOURR_WALLPAPERS.length);
    handleSelectWallpaper(nextIdx);
  };

  const handleSelectWallpaper = (idx) => {
    setDraftConfig((prev) => ({
      ...prev,
      enabled: true,
      mode: 'curated',
      currentIndex: idx,
    }));
    showNotification(`Đã chọn: ${BONJOURR_WALLPAPERS[idx]?.title || 'Mới'}. Bấm "Lưu & Về Trang Chính" để áp dụng.`);
  };

  const handleSelectCustomWallpaper = (wp) => {
    setDraftConfig((prev) => ({
      ...prev,
      enabled: true,
      mode: 'custom',
      customUrl: wp.url,
    }));
    showNotification(`Đã chọn: ${wp.title}. Bấm "Lưu & Về Trang Chính" để áp dụng.`);
  };

  const handleApplyCustomUrl = (e) => {
    e.preventDefault();
    if (!customInputUrl.trim()) return;
    setDraftConfig((prev) => ({
      ...prev,
      mode: 'custom',
      customUrl: customInputUrl.trim(),
    }));
    showNotification('Đã lưu URL hình nền riêng. Bấm "Lưu & Về Trang Chính" để áp dụng.');
  };

  return (
    <div className="w-full max-w-[1550px] space-y-6 pb-20 animate-in fade-in duration-300 relative">
      {/* LỚP PHỦ KHI KÉO THẢ TỆP VÀO CỬA SỔ TRÌNH DUYỆT */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-indigo-950/80 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150 border-4 border-dashed border-indigo-400 m-3 rounded-3xl shadow-2xl">
          <div className="p-8 rounded-3xl bg-zinc-900 border border-indigo-500/50 flex flex-col items-center gap-3 text-center shadow-2xl">
            <UploadCloud className="w-16 h-16 text-indigo-400 animate-bounce" />
            <h3 className="text-xl font-extrabold text-white">Thả ảnh vào đây để tải lên hình nền!</h3>
            <p className="text-xs text-indigo-200">
              Ảnh sẽ được lưu tự động vào thư mục <code>public/wallpapers</code> trên máy tính
            </p>
          </div>
        </div>
      )}

      {/* Toast thông báo nổi khi thay đổi cài đặt */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-xs shadow-xl shadow-indigo-600/30 border border-indigo-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* THANH LƯU NỔI CỐ ĐỊNH Ở ĐÁY MÀN HÌNH KHI CÓ THAY ĐỔI */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-lg w-[92%] sm:w-auto">
          <div
            className={`px-4 sm:px-5 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 sm:gap-4 ${
              isDark
                ? 'bg-zinc-900/95 border-indigo-500/50 text-zinc-100 shadow-black/80'
                : 'bg-white/95 border-indigo-300 text-slate-800 shadow-indigo-500/20'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
              <p className="text-xs font-bold truncate">Bạn có thay đổi chưa lưu</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSaveAndReturn}
                className="px-4 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer active:scale-95 ring-2 ring-indigo-400/40"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu & Về Trang Chính</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. KHỐI CÔNG TẮC BẬT/TẮT & XEM TRƯỚC (LIVE PREVIEW) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* CỘT TRÁI: BẬT TẮT & ĐIỀU CHỈNH THÔNG SỐ */}
        <div className="xl:col-span-1 space-y-4">
          <div
            className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            {/* Bật/Tắt hình nền toàn trang */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {draftConfig.enabled ? (
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Eye className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-500 flex items-center justify-center">
                    <EyeOff className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm">Hình Nền Toàn Trang</h3>
                  <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    {draftConfig.enabled ? 'Đang kích hoạt trên toàn màn hình' : 'Đang tắt (Dùng nền phẳng mặc định)'}
                  </p>
                </div>
              </div>

              {/* Toggle switch lớn */}
              <button
                onClick={() => {
                  setDraftConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  draftConfig.enabled ? 'bg-indigo-600' : isDark ? 'bg-zinc-700' : 'bg-slate-300'
                }`}
                aria-label="Bật hoặc tắt hình nền Bonjourr"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    draftConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Chế độ nguồn hình nền */}
            <div className="pt-2 border-t border-inherit space-y-2">
              <label className={`block text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Nguồn hình nền
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setDraftConfig((prev) => ({ ...prev, mode: 'curated' }))}
                  className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                    draftConfig.mode === 'curated'
                      ? 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-xs'
                      : isDark
                      ? 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-zinc-300'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="block text-xs font-bold">Ảnh 4K</span>
                  <span className="text-[10px] opacity-80 block truncate">Unsplash</span>
                </button>

                <button
                  onClick={() => setDraftConfig((prev) => ({ ...prev, mode: 'custom' }))}
                  className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                    draftConfig.mode === 'custom'
                      ? 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-xs'
                      : isDark
                      ? 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-zinc-300'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="block text-xs font-bold">Ảnh Của Bạn</span>
                  <span className="text-[10px] opacity-80 block truncate">Tải lên / Link</span>
                </button>

                <button
                  onClick={() => setDraftConfig((prev) => ({ ...prev, mode: 'live' }))}
                  className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                    draftConfig.mode === 'live'
                      ? 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-xs'
                      : isDark
                      ? 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-zinc-300'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="block text-xs font-bold">Bonjourr Live</span>
                  <span className="text-[10px] opacity-80 block truncate">Trực tiếp</span>
                </button>
              </div>
            </div>

            {/* Tùy chỉnh URL nếu chọn Custom */}
            {draftConfig.mode === 'custom' && (
              <form onSubmit={handleApplyCustomUrl} className="pt-2 border-t border-inherit space-y-2">
                <label className={`block text-[11px] font-bold ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                  Hoặc nhập URL hình ảnh trực tiếp:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customInputUrl}
                    onChange={(e) => setCustomInputUrl(e.target.value)}
                    placeholder="https://example.com/wallpaper.jpg"
                    className={`flex-1 px-3 py-1.5 rounded-xl border text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 ${
                      isDark ? 'bg-zinc-950 border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Chọn
                  </button>
                </div>
              </form>
            )}

            {/* Điều chỉnh độ tối (Dim) */}
            <div className="pt-2 border-t border-inherit space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">Độ tối phủ nền (Dim Overlay)</span>
                <span className="font-extrabold text-indigo-400">{draftConfig.dimOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={draftConfig.dimOpacity}
                onChange={(e) => setDraftConfig((prev) => ({ ...prev, dimOpacity: Number(e.target.value) }))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>0% (Sáng rõ nhất)</span>
                <span>45% (Khuyên dùng)</span>
                <span>90% (Gần như đen)</span>
              </div>
            </div>

            {/* Điều chỉnh độ mờ kính (Backdrop Blur) */}
            <div className="pt-2 border-t border-inherit space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">Độ mờ hậu cảnh (Blur)</span>
                <span className="font-extrabold text-indigo-400">{draftConfig.blurAmount}px</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { px: 0, label: '0px (Rõ nét)' },
                  { px: 2, label: '2px (Nhẹ)' },
                  { px: 6, label: '6px (Vừa)' },
                  { px: 12, label: '12px (Sâu)' },
                ].map((opt) => (
                  <button
                    key={opt.px}
                    onClick={() => setDraftConfig((prev) => ({ ...prev, blurAmount: opt.px }))}
                    className={`py-1.5 rounded-lg border text-center font-bold text-[11px] cursor-pointer transition-all ${
                      draftConfig.blurAmount === opt.px
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-2xs'
                        : isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                        : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: KHUNG XEM TRƯỚC (HÌNH ẢNH MÔ PHỎNG, ĐÃ BỎ CHỮ THEO YÊU CẦU) */}
        <div className="xl:col-span-2 space-y-4">
          <div
            className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-end">
              <button
                onClick={handleNextRandom}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Đổi ảnh ngẫu nhiên</span>
              </button>
            </div>

            {/* MOCKUP MÀN HÌNH MÁY TÍNH */}
            <div className="w-full aspect-[16/9] max-h-[380px] rounded-xl overflow-hidden border border-zinc-700 shadow-2xl relative flex flex-col select-none">
              {/* Lớp nền của Mockup */}
              {draftConfig.enabled ? (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                  style={{
                    backgroundImage: `url("${draftConfig.mode === 'custom' && draftConfig.customUrl ? draftConfig.customUrl : currentWallpaper.url}")`,
                    filter: draftConfig.blurAmount > 0 ? `blur(${draftConfig.blurAmount}px)` : 'none',
                  }}
                />
              ) : (
                <div className={`absolute inset-0 ${isDark ? 'bg-[#18191c]' : 'bg-[#f4f6f8]'}`} />
              )}

              {/* Lớp phủ Dim trên mockup */}
              {draftConfig.enabled && (
                <div
                  className={`absolute inset-0 transition-all ${isDark ? 'bg-black' : 'bg-slate-900'}`}
                  style={{ opacity: draftConfig.dimOpacity / 100 }}
                />
              )}

              {/* Thanh Header mô phỏng */}
              <div className="relative z-10 h-10 px-4 bg-zinc-900/70 backdrop-blur-md border-b border-white/10 flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="font-bold text-[11px] ml-2">PrintFlow 3D Hub</span>
                </div>
                <span className="text-[10px] font-mono opacity-80 truncate max-w-[200px]">
                  {draftConfig.mode === 'live'
                    ? 'online.bonjourr.fr'
                    : draftConfig.mode === 'custom'
                    ? 'Ảnh riêng của bạn'
                    : currentWallpaper.title}
                </span>
              </div>

              {/* Nội dung Dashboard mô phỏng */}
              <div className="relative z-10 flex-1 p-4 flex gap-4 overflow-hidden">
                {/* Thanh Sidebar mô phỏng */}
                <div className="w-12 rounded-xl bg-zinc-900/60 backdrop-blur-md border border-white/10 flex flex-col items-center py-2 gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                    P
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-white/10" />
                  <div className="w-6 h-6 rounded-lg bg-white/10" />
                  <div className="w-6 h-6 rounded-lg bg-white/10" />
                </div>

                {/* 2 Card Máy in mô phỏng */}
                <div className="flex-1 grid grid-cols-2 gap-3">
                  {/* Card Máy 1 */}
                  <div className="rounded-xl bg-zinc-900/75 backdrop-blur-md border border-white/10 p-3 flex flex-col justify-between text-white">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate">Bambu P1S - Máy 1 (QT)</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Đang in
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] opacity-70">
                        <span>Tiến trình</span>
                        <span className="font-bold text-indigo-400">78%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="w-[78%] h-full bg-gradient-to-r from-indigo-500 to-pink-500" />
                      </div>
                    </div>
                  </div>

                  {/* Card Máy 2 */}
                  <div className="rounded-xl bg-zinc-900/75 backdrop-blur-md border border-white/10 p-3 flex flex-col justify-between text-white">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate">Bambu P1S - Máy 2 (RF)</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Sẵn sàng
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] opacity-70">
                        <span>Nhiệt độ đầu in</span>
                        <span className="font-bold text-rose-400">220°C</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="w-[45%] h-full bg-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer info của Mockup */}
              <div className="relative z-10 px-4 py-1.5 bg-black/40 backdrop-blur-md text-[10px] text-zinc-300 flex items-center justify-between border-t border-white/10">
                <span>Nguồn: <strong>{draftConfig.mode === 'custom' ? (draftConfig.customUrl || 'Tùy chỉnh') : currentWallpaper.title}</strong></span>
                <span>Hiệu ứng: Blur {draftConfig.blurAmount}px • Dim {draftConfig.dimOpacity}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MỤC TẢI LÊN & LƯU VÀO THƯ MỤC NỘI BỘ (PUBLIC/WALLPAPERS) */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-400" />
              Tải Lên Ảnh Nền Riêng & Lưu Trữ Vào Thư Mục Máy Tính
            </h3>
          </div>

          <button
            onClick={handleOpenFolder}
            className={`self-start sm:self-auto px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              isDark
                ? 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-zinc-200'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700 shadow-2xs'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Mở thư mục <code>public/wallpapers</code></span>
          </button>
        </div>

        {/* Khung Kéo Thả Upload File */}
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const files = e.dataTransfer?.files;
            if (files && files[0]) {
              handleUploadFile(files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
              : isDark
              ? 'border-zinc-750 hover:border-indigo-500/60 bg-zinc-950/40 hover:bg-zinc-950/80'
              : 'border-slate-300 hover:border-indigo-500/60 bg-slate-50/70 hover:bg-slate-50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleUploadFile(e.target.files[0]);
                e.target.value = '';
              }
            }}
            accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-3 py-2 pointer-events-none select-none">
              <Loader2 className="w-9 h-9 text-indigo-400 animate-spin" />
              <p className="font-bold text-sm">Đang tải và ghi tệp vào thư mục <code>public/wallpapers</code>...</p>
              <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Hệ thống đang lưu trữ file ảnh trực tiếp trên ổ cứng
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5 pointer-events-none select-none">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <FileImage className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-sm">
                  Kéo thả ảnh vào đây, hoặc <span className="text-indigo-400 underline underline-offset-2">bấm để chọn từ máy tính</span>
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Hỗ trợ JPG, PNG, WEBP, GIF, SVG (Tối đa 25MB) • Tự động tạo thư viện riêng của bạn
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Danh sách các ảnh đã tải lên & lưu trong thư mục máy tính */}
        {customWallpapers.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" />
                Ảnh nền của bạn trong thư mục máy tính ({customWallpapers.length} ảnh):
              </h4>
              <button
                onClick={fetchCustomWallpapers}
                className={`text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Quét lại thư mục"
              >
                <RefreshCw className={`w-3 h-3 ${loadingWallpapers ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {customWallpapers.map((wp) => {
                const isSelected = draftConfig.mode === 'custom' && draftConfig.customUrl === wp.url;

                return (
                  <div
                    key={wp.id}
                    onClick={() => handleSelectCustomWallpaper(wp)}
                    className={`group rounded-2xl overflow-hidden border cursor-pointer relative transition-all duration-200 ${
                      isSelected
                        ? 'ring-3 ring-indigo-500 border-indigo-400 shadow-xl scale-[1.02]'
                        : isDark
                        ? 'border-zinc-800 hover:border-zinc-700 hover:shadow-lg'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    {/* Khung ảnh */}
                    <div className="aspect-[16/10] w-full overflow-hidden relative bg-black/40">
                      <img
                        src={wp.url}
                        alt={wp.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Badge Local */}
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600/90 text-white backdrop-blur-md flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        <span>Đã lưu trên máy</span>
                      </span>

                      {/* Nút xóa ảnh */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteWallpaper(wp, e);
                        }}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white transition-colors cursor-pointer shadow-md backdrop-blur-md z-10"
                        title="Xóa ảnh này khỏi thư mục wallpapers"
                      >
                        <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                      </button>

                      {/* Icon đã chọn */}
                      {isSelected && (
                        <div className="absolute bottom-10 right-2.5 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}

                      {/* Tiêu đề & Thông tin file */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                        <p className="font-bold text-xs truncate drop-shadow-md">{wp.title}</p>
                        <div className="flex items-center justify-between text-[10px] text-zinc-300 mt-0.5 opacity-90">
                          <span>{formatSize(wp.size)}</span>
                          <span className="truncate max-w-[120px] font-mono">{wp.filename}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer card */}
                    <div className={`p-2.5 px-3 flex items-center justify-between text-xs ${
                      isDark ? 'bg-zinc-900' : 'bg-white'
                    }`}>
                      <span className={`text-[11px] ${isSelected ? 'text-indigo-400 font-bold' : isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {isSelected ? 'Đang chọn' : 'Bấm để chọn'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(wp.url, '_blank');
                        }}
                        className={`p-1 rounded-md cursor-pointer ${
                          isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
                        }`}
                        title="Xem ảnh gốc"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. BỘ SƯU TẬP 12+ HÌNH NỀN 4K UNSPASH BONJOURR */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Image className="w-5 h-5 text-indigo-400" />
              Bộ Sưu Tập Hình Nền 4K Thiên Nhiên (Unsplash)
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Bộ ảnh chất lượng cao 4K độ nét cao chuẩn phong cách Bonjourr Startpage
            </p>
          </div>

          {/* Bộ lọc danh mục */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  activeFilter === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isDark
                    ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat === 'all' ? 'Tất cả' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lưới hình ảnh lớn (Large Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWallpapers.map((wp) => {
            const originalIndex = BONJOURR_WALLPAPERS.findIndex((item) => item.id === wp.id);
            const isSelected = draftConfig.mode === 'curated' && draftConfig.currentIndex === originalIndex;

            return (
              <div
                key={wp.id}
                onClick={() => handleSelectWallpaper(originalIndex)}
                className={`group rounded-2xl overflow-hidden border cursor-pointer relative transition-all duration-200 ${
                  isSelected
                    ? 'ring-3 ring-indigo-500 border-indigo-400 shadow-xl scale-[1.02]'
                    : isDark
                    ? 'border-zinc-800 hover:border-zinc-700 hover:shadow-lg'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Khung ảnh */}
                <div className="aspect-[16/10] w-full overflow-hidden relative">
                  <img
                    src={wp.url}
                    alt={wp.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Badge danh mục */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-md">
                    {wp.category}
                  </span>

                  {/* Icon đã chọn */}
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Tiêu đề ảnh */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                    <p className="font-bold text-xs truncate drop-shadow-md">{wp.title}</p>
                  </div>
                </div>

                {/* Footer card */}
                <div className={`p-2.5 px-3 flex items-center justify-between text-xs ${
                  isDark ? 'bg-zinc-900' : 'bg-white'
                }`}>
                  <span className={`text-[11px] ${isSelected ? 'text-indigo-400 font-bold' : isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    {isSelected ? 'Đang chọn' : 'Bấm để chọn'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(wp.url, '_blank');
                    }}
                    className={`p-1 rounded-md cursor-pointer ${
                      isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
                    }`}
                    title="Mở ảnh gốc 4K"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. LIÊN KẾT & TIỆN ÍCH MỞ RỘNG BONJOURR */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs ${
          isDark ? 'bg-zinc-900/40 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Cài đặt tiện ích Bonjourr Startpage cho trình duyệt của bạn:</h4>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Trải nghiệm tab mới tối giản, không quảng cáo, cảm hứng Apple trên Google Chrome, Mozilla Firefox, Microsoft Edge.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://bonjourr.fr"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 hover:text-indigo-400 border-indigo-500/30 bg-indigo-500/10"
          >
            <span>Trang chủ Bonjourr.fr</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
