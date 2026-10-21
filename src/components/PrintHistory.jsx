import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  History,
  Camera,
  Calendar,
  Clock,
  Layers,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Maximize2,
  RefreshCw,
  Square,
} from 'lucide-react';

export default function PrintHistory({ onSnapshotTaken }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [capturing, setCapturing] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/bambu/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (e) {
      console.error('Lỗi lấy lịch sử in:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleManualSnapshot = async () => {
    setCapturing(true);
    try {
      const res = await fetch('/api/bambu/history/snapshot', { method: 'POST' });
      if (res.ok) {
        await fetchHistory();
        if (onSnapshotTaken) onSnapshotTaken();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCapturing(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc muốn xóa bản ghi in này khỏi lịch sử?')) return;
    try {
      const res = await fetch(`/api/bambu/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '--';
    const d = new Date(isoString);
    return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  };

  return (
    <div
      className={`w-full max-w-5xl rounded-2xl border transition-all shadow-sm overflow-hidden ${
        isDark
          ? 'bg-[#1f2024] border-zinc-800 text-zinc-100'
          : 'bg-white border-slate-300 text-slate-800'
      }`}
    >
      {/* Header */}
      <div
        className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b ${
          isDark ? 'border-zinc-800/80 bg-zinc-900/40' : 'border-slate-200 bg-slate-50/70'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-zinc-800 text-indigo-400' : 'bg-white text-indigo-600 shadow-xs border border-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Lịch Sử In & Thành Phẩm</h3>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Tự động chụp ảnh camera khi in xong ({history.length} lượt in)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút chụp ảnh lưu thủ công */}
          <button
            onClick={handleManualSnapshot}
            disabled={capturing}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isDark
                ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/30'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
            } disabled:opacity-50`}
            title="Chụp ngay 1 ảnh từ camera và lưu vào lịch sử"
          >
            <Camera className={`w-3.5 h-3.5 ${capturing ? 'animate-bounce' : ''}`} />
            <span>{capturing ? 'Đang chụp...' : 'Chụp ảnh lưu ngay'}</span>
          </button>

          <button
            onClick={fetchHistory}
            className={`p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              isDark
                ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-xs'
            }`}
            title="Làm mới lịch sử"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Danh sách các lượt in */}
      <div className="p-6">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-zinc-500 gap-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Đang tải lịch sử...</span>
          </div>
        ) : history.length === 0 ? (
          <div
            className={`py-12 rounded-xl border border-dashed text-center flex flex-col items-center justify-center gap-3 ${
              isDark ? 'border-zinc-800 text-zinc-500' : 'border-slate-300 text-slate-400'
            }`}
          >
            <Camera className="w-8 h-8 opacity-40" />
            <div className="max-w-md">
              <p className="text-sm font-semibold">Chưa có lượt in nào trong lịch sử</p>
              <p className="text-xs mt-1 opacity-80">
                Mỗi khi máy in P1S hoàn tất tệp in, hệ thống sẽ tự động chụp 1 tấm ảnh từ camera và lưu trữ tại đây.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => item.snapshotUrl && setSelectedImage(item.snapshotUrl)}
                className={`group rounded-xl border overflow-hidden flex flex-col transition-all cursor-pointer hover:shadow-md ${
                  isDark
                    ? 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Ảnh chụp thành phẩm */}
                <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden flex items-center justify-center">
                  {item.snapshotUrl ? (
                    <>
                      <img
                        src={item.snapshotUrl}
                        alt={item.taskName}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="p-2 rounded-full bg-black/60 text-white backdrop-blur-sm">
                          <Maximize2 className="w-4 h-4" />
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-600 gap-1.5 p-4 text-center">
                      <Camera className="w-6 h-6" />
                      <span className="text-[11px]">Không có ảnh chụp</span>
                    </div>
                  )}

                  {/* Badge trạng thái trên ảnh */}
                  <div className="absolute top-2.5 left-2.5">
                    {item.status === 'SUCCESS' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/90 text-white flex items-center gap-1 shadow-sm backdrop-blur-xs">
                        <CheckCircle2 className="w-3 h-3" /> Hoàn tất
                      </span>
                    ) : item.status === 'STOPPED' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600/90 text-white flex items-center gap-1 shadow-sm backdrop-blur-xs">
                        <Square className="w-2.5 h-2.5 fill-white" /> Đã dừng ({item.progress || 0}%)
                      </span>
                    ) : item.status === 'IN_PROGRESS' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/90 text-white flex items-center gap-1 shadow-sm backdrop-blur-xs">
                        Đang in
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-700/90 text-white flex items-center gap-1 shadow-sm backdrop-blur-xs">
                        Thủ công
                      </span>
                    )}
                  </div>

                  {/* Nút xóa */}
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-zinc-300 hover:text-white transition-colors cursor-pointer shadow-sm"
                    title="Xóa mục này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Chi tiết lượt in */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold truncate group-hover:text-indigo-400 transition-colors">
                      {item.taskName}
                    </h4>
                    <p className={`text-[11px] flex items-center gap-1.5 mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      {formatDateTime(item.completedAt)}
                    </p>
                  </div>

                  <div className={`pt-2.5 border-t flex items-center justify-between text-xs ${isDark ? 'border-zinc-800/80 text-zinc-400' : 'border-slate-100 text-slate-600'}`}>
                    {item.status === 'STOPPED' && item.currentLayer > 0 ? (
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        Dừng ở lớp {item.currentLayer}/{item.totalLayers || '?'}
                      </span>
                    ) : item.totalLayers > 0 ? (
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        {item.totalLayers} lớp
                      </span>
                    ) : null}
                    {item.durationMinutes > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        {item.durationMinutes} phút
                      </span>
                    )}
                    {item.nozzleTemp > 0 && (
                      <span>
                        🔥 {item.nozzleTemp}°C / {item.bedTemp}°C
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal phóng to ảnh thành phẩm */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-zinc-900 flex items-center justify-between border-b border-zinc-800">
              <span className="text-xs font-bold text-zinc-200">Ảnh Thành Phẩm P1S</span>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={selectedImage}
              alt="Ảnh phóng to thành phẩm"
              className="max-h-[80vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
