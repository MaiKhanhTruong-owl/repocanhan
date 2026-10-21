import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Printer,
  Flame,
  Layers,
  Clock,
  Lightbulb,
  RotateCw,
  Gauge,
  WifiOff,
  CheckCircle2,
  PauseCircle,
  Play,
  Square,
  Sparkles,
  Thermometer,
  Video,
  VideoOff,
  Maximize2,
  Camera as CameraIcon,
  RefreshCw,
  Ban,
  X,
  Info,
  ChevronDown,
  Check,
  Box,
} from 'lucide-react';

function formatTime(minutes) {
  if (!minutes || minutes <= 0) return '0 phút';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} phút`;
}

// ================= CARD ĐIỀU KHIỂN RIÊNG CHO 1 MÁY IN =================
function PrinterCard({ printerInfo, isLeft, onStatusRefresh }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const printerId = printerInfo?.id;
  const printer = printerInfo?.printer || {};
  const isConnected = printerInfo?.connected && printer?.connected;
  const isRunning = printer?.gcode_state?.toUpperCase() === 'RUNNING';
  const isPaused = printer?.gcode_state?.toUpperCase() === 'PAUSE';
  const currentSpeedLevel = printer?.spd_lvl || 2;
  const skippedList = printer?.s_obj || [];

  // Trạng thái Camera
  const [showCamera, setShowCamera] = useState(false);
  const [cameraKey, setCameraKey] = useState(Date.now());
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef(null);

  const reloadCamera = () => {
    setCameraLoading(true);
    setCameraError(false);
    setCameraKey(Date.now());
  };

  const handleFullscreenCamera = () => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  // Trạng thái thao tác điều khiển
  const [controlling, setControlling] = useState(false);
  const [togglingLight, setTogglingLight] = useState(false);

  // Menu tốc độ in
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const speedMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target)) {
        setSpeedMenuOpen(false);
      }
    };
    if (speedMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [speedMenuOpen]);

  const speedOptions = [
    { lvl: 1, label: '50% (Yên tĩnh)' },
    { lvl: 2, label: '100% (Chuẩn)' },
    { lvl: 3, label: '124% (Nhanh)' },
    { lvl: 4, label: '166% (Tên lửa)' },
  ];
  const currentSpeedOption = speedOptions.find((o) => o.lvl === currentSpeedLevel) || speedOptions[1];

  // Trạng thái Skip Objects
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [plateObjects, setPlateObjects] = useState([]);
  const [loadingObjects, setLoadingObjects] = useState(false);
  const [manualObjId, setManualObjId] = useState('');
  const [skippingId, setSkippingId] = useState(null);

  // Thao tác tác vụ: pause / resume / stop
  const handleControlJob = async (action) => {
    if (action === 'stop' && !window.confirm(`Bạn có chắc muốn DỪNG & HỦY lượt in trên ${printerInfo?.name}?`)) {
      return;
    }
    setControlling(true);
    try {
      await fetch('/api/bambu/job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerId, action }),
      });
      if (onStatusRefresh) onStatusRefresh();
    } catch (e) {
      console.error('Lỗi điều khiển tác vụ in:', e);
    } finally {
      setControlling(false);
    }
  };

  // Điều chỉnh tốc độ in
  const handleSetSpeed = async (level) => {
    setControlling(true);
    try {
      await fetch('/api/bambu/speed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerId, level }),
      });
      if (onStatusRefresh) onStatusRefresh();
    } catch (e) {
      console.error('Lỗi đổi tốc độ:', e);
    } finally {
      setControlling(false);
    }
  };

  // Bật / tắt đèn buồng in
  const handleToggleLight = async () => {
    setTogglingLight(true);
    const nextMode = printer.chamber_light === 'on' ? 'off' : 'on';
    try {
      await fetch('/api/bambu/light', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerId, mode: nextMode }),
      });
      if (onStatusRefresh) onStatusRefresh();
    } catch (e) {
      console.error('Lỗi điều khiển đèn:', e);
    } finally {
      setTogglingLight(false);
    }
  };


  // Lấy danh sách chi tiết có trên bàn in
  const fetchObjects = async () => {
    setLoadingObjects(true);
    try {
      const res = await fetch(`/api/bambu/objects?printerId=${printerId}`);
      if (res.ok) {
        const json = await res.json();
        setPlateObjects(json.objects || []);
      }
    } catch (e) {
      console.error('Lỗi lấy danh sách chi tiết:', e);
    } finally {
      setLoadingObjects(false);
    }
  };

  // Bỏ qua chi tiết in
  const handleSkipObject = async (objId) => {
    if (objId === undefined || objId === null || objId === '') return;
    const numId = Number(objId);
    if (isNaN(numId)) return;

    if (!window.confirm(`Bạn có chắc muốn bỏ qua chi tiết #${numId} trên ${printerInfo?.name}?`)) {
      return;
    }

    setSkippingId(numId);
    try {
      const res = await fetch('/api/bambu/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerId, id: numId }),
      });
      if (res.ok) {
        if (onStatusRefresh) onStatusRefresh();
        await fetchObjects();
        setManualObjId('');
      }
    } catch (e) {
      console.error('Lỗi gửi lệnh skip object:', e);
    } finally {
      setSkippingId(null);
    }
  };

  const renderStateBadge = () => {
    if (!isConnected) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <WifiOff className="w-3.5 h-3.5" /> Ngoại tuyến
        </span>
      );
    }

    const state = printer.gcode_state?.toUpperCase();
    if (state === 'RUNNING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          Đang in
        </span>
      );
    }
    if (state === 'PAUSE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <PauseCircle className="w-3.5 h-3.5" /> Tạm dừng
        </span>
      );
    }
    if (state === 'FINISH') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" /> Đã xong
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-500 border border-slate-500/20">
        <Sparkles className="w-3.5 h-3.5" /> Sẵn sàng
      </span>
    );
  };

  return (
    <div
      className={`w-full rounded-2xl border transition-all shadow-sm overflow-hidden flex flex-col backdrop-blur-md ${
        isDark ? 'bg-[#1f2024]/90 border-zinc-800 text-zinc-100' : 'bg-white/90 border-slate-300 text-slate-800'
      }`}
    >
      {/* 1. Header Card - Phân biệt Máy 1 (Trái) & Máy 2 (Phải) */}
      <div
        className={`px-4 sm:px-5 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 border-b ${
          isDark
            ? isLeft
              ? 'bg-zinc-900/70 border-zinc-800/90'
              : 'bg-zinc-900/50 border-zinc-800/90'
            : isLeft
            ? 'bg-indigo-50/50 border-slate-200'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isLeft
                ? isDark
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'bg-indigo-100 text-indigo-700 shadow-2xs'
                : isDark
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-purple-100 text-purple-700 shadow-2xs'
            }`}
          >
            <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold tracking-tight truncate">
                {printerInfo?.name || printer?.model || 'Bambu Lab P1S'}
              </h3>
              {renderStateBadge()}
            </div>
            <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              IP: <strong className="font-mono text-zinc-300 dark:text-zinc-200">{printerInfo?.ip}</strong> • Serial: {printerInfo?.serial}
            </p>
          </div>
        </div>

        {/* Nút công cụ trên header */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Bật/Tắt Camera */}
          <button
            onClick={() => {
              if (!showCamera) {
                setCameraLoading(true);
                setCameraError(false);
                setCameraKey(Date.now());
              }
              setShowCamera(!showCamera);
            }}
            className={`p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              showCamera
                ? isDark
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-2xs ring-1 ring-indigo-500/30'
                  : 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs ring-1 ring-indigo-500/30'
                : isDark
                ? 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900 shadow-2xs'
            }`}
            title={showCamera ? 'Camera: Đang mở (Bấm để tắt)' : 'Camera: Đang tắt (Bấm để bật)'}
            aria-label="Bật/Tắt camera"
          >
            {showCamera ? (
              <Video className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <VideoOff className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Bật/Tắt Đèn buồng in */}
          <button
            onClick={handleToggleLight}
            disabled={!isConnected || togglingLight}
            className={`p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              printer?.chamber_light === 'on'
                ? isDark
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-2xs ring-1 ring-amber-500/30'
                  : 'bg-amber-50 border-amber-300 text-amber-600 shadow-2xs ring-1 ring-amber-500/30'
                : isDark
                ? 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900 shadow-2xs'
            } disabled:opacity-50`}
            title={printer?.chamber_light === 'on' ? 'Đèn: Đang bật (Bấm để tắt)' : 'Đèn: Đang tắt (Bấm để bật)'}
            aria-label="Bật/Tắt đèn buồng in"
          >
            <Lightbulb
              className={`w-3.5 h-3.5 ${
                printer?.chamber_light === 'on' ? 'fill-amber-400 text-amber-400' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. Nội dung chi tiết */}
      <div className="p-4 sm:p-5 space-y-4">
          {/* CAMERA TRỰC TIẾP */}
          {showCamera && (
            <div
              className={`relative rounded-xl overflow-hidden border transition-all ${
                isDark ? 'bg-black border-zinc-800' : 'bg-slate-900 border-slate-300 shadow-sm'
              }`}
            >
              <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600/90 text-white backdrop-blur-md flex items-center gap-1 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 text-zinc-300 backdrop-blur-md">
                  {printerInfo?.name} (6000)
                </span>
              </div>

              <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                <button
                  onClick={() => setShowCamera(false)}
                  className="px-2 py-1 rounded-lg bg-black/60 hover:bg-rose-900/80 text-zinc-300 hover:text-white backdrop-blur-md text-[11px] font-medium transition-all cursor-pointer shadow-md flex items-center gap-1"
                  title="Tắt Camera"
                >
                  <VideoOff className="w-3 h-3" />
                  <span>Tắt</span>
                </button>
                <button
                  onClick={reloadCamera}
                  className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer shadow-md"
                  title="Tải lại luồng"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
                <button
                  onClick={handleFullscreenCamera}
                  className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer shadow-md"
                  title="Toàn màn hình"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>

              <div
                ref={videoRef}
                className="w-full aspect-video max-h-[360px] bg-zinc-950 flex items-center justify-center relative overflow-hidden"
              >
                {cameraLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 z-5 text-zinc-400 gap-1.5">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[11px]">Đang nạp luồng camera...</span>
                  </div>
                )}

                {cameraError ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400 gap-1.5">
                    <CameraIcon className="w-6 h-6 text-zinc-600" />
                    <p className="text-xs">Không thể kết nối camera</p>
                    <button
                      onClick={reloadCamera}
                      className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 mt-1 cursor-pointer"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : (
                  <img
                    key={cameraKey}
                    src={`/api/bambu/camera/mjpeg?printerId=${printerId}&t=${cameraKey}`}
                    alt={`${printerInfo?.name} Camera Stream`}
                    className="w-full h-full object-contain"
                    onLoad={() => setCameraLoading(false)}
                    onError={() => {
                      setCameraLoading(false);
                      setCameraError(true);
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* ĐIỀU KHIỂN TÁC VỤ IN & TỐC ĐỘ (KHI ĐANG IN) */}
          {isConnected && (isRunning || isPaused) && (
            <div
              className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-2">
                {/* Tạm dừng / Tiếp tục */}
                {isRunning ? (
                  <button
                    onClick={() => handleControlJob('pause')}
                    disabled={controlling}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                      isDark
                        ? 'bg-zinc-800 hover:bg-zinc-750 text-amber-400 border-zinc-700'
                        : 'bg-white hover:bg-amber-50 text-amber-600 border-slate-300 shadow-2xs'
                    }`}
                    title="Tạm dừng in"
                  >
                    <PauseCircle className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleControlJob('resume')}
                    disabled={controlling}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 text-xs font-semibold flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs"
                    title="Tiếp tục in"
                  >
                    <Play className="w-4 h-4 fill-white" />
                  </button>
                )}

                {/* Hủy in */}
                <button
                  onClick={() => handleControlJob('stop')}
                  disabled={controlling}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                    isDark
                      ? 'bg-zinc-800 hover:bg-rose-950/40 text-rose-400 border-zinc-700 hover:border-rose-800/40'
                      : 'bg-white hover:bg-rose-50 text-rose-600 border-slate-300 hover:border-rose-300 shadow-2xs'
                  }`}
                  title="Hủy lượt in"
                >
                  <Square className="w-4 h-4 fill-rose-500 text-rose-500" />
                </button>

                {/* Bỏ qua vật thể */}
                <button
                  onClick={() => {
                    setShowSkipModal(true);
                    fetchObjects();
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs ${
                    skippedList.length > 0
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      : isDark
                      ? 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-zinc-300'
                      : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                  title="Bỏ qua chi tiết bị hỏng"
                >
                  <Ban className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bỏ qua {skippedList.length > 0 ? `(${skippedList.length})` : ''}</span>
                </button>
              </div>

              {/* Chỉnh tốc độ in (Dropdown) */}
              <div className="relative" ref={speedMenuRef}>
                <button
                  type="button"
                  onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
                  disabled={controlling}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isDark
                      ? 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-zinc-200'
                      : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-2xs'
                  }`}
                >
                  <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{currentSpeedOption.label}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                {speedMenuOpen && (
                  <div
                    className={`absolute right-0 top-full mt-1.5 w-44 rounded-xl border shadow-2xl z-40 p-1.5 space-y-1 ${
                      isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Tốc độ in
                    </div>
                    {speedOptions.map((opt) => (
                      <button
                        key={opt.lvl}
                        onClick={() => {
                          handleSetSpeed(opt.lvl);
                          setSpeedMenuOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                          currentSpeedLevel === opt.lvl
                            ? isDark
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-indigo-50 text-indigo-700 font-bold'
                            : isDark
                            ? 'hover:bg-zinc-800 text-zinc-300'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {currentSpeedLevel === opt.lvl && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TIẾN TRÌNH IN & TÊN FILE */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Tệp đang in
                </span>
                <p className="font-bold text-xs sm:text-sm truncate mt-0.5">
                  {printer?.subtask_name || (isConnected ? 'Không có tác vụ in nào' : 'Mất kết nối máy in')}
                </p>
              </div>

              {isConnected && isRunning && (
                <div className="text-right shrink-0">
                  <span className="text-xl sm:text-2xl font-extrabold text-indigo-500">
                    {printer?.progress || 0}%
                  </span>
                </div>
              )}
            </div>

            {/* Thanh tiến trình */}
            <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`}>
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isRunning
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
                    : isPaused
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, printer?.progress || 0))}%` }}
              />
            </div>

            {/* Thông số lớp in và thời gian còn lại */}
            <div className={`flex flex-wrap items-center justify-between text-xs pt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  Lớp: <strong className={isDark ? 'text-zinc-200' : 'text-slate-800'}>{printer?.layer_num || 0}</strong> / {printer?.total_layer_num || 0}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Còn lại: <strong className={isDark ? 'text-zinc-200' : 'text-slate-800'}>{formatTime(printer?.remaining_time)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* CÁC THÔNG SỐ NHIỆT ĐỘ & QUẠT */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* Đầu phun Nozzle */}
            <div
              className={`p-3 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-zinc-900/30 border-zinc-800/80' : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] font-semibold flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  <Flame className="w-3.5 h-3.5 text-rose-500" /> Đầu phun
                </span>
                <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Mục tiêu: {printer?.nozzle_target_temper || 0}°C
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-extrabold text-rose-500">
                  {printer?.nozzle_temper || 0}°
                </span>
                <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>C</span>
              </div>
            </div>

            {/* Bàn nhiệt Heatbed */}
            <div
              className={`p-3 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-zinc-900/30 border-zinc-800/80' : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] font-semibold flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  <Layers className="w-3.5 h-3.5 text-amber-500" /> Bàn in
                </span>
                <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Mục tiêu: {printer?.bed_target_temper || 0}°C
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-extrabold text-amber-500">
                  {printer?.bed_temper || 0}°
                </span>
                <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>C</span>
              </div>
            </div>

            {/* Buồng in */}
            <div
              className={`p-3 rounded-xl border flex flex-col justify-between col-span-2 sm:col-span-1 ${
                isDark ? 'bg-zinc-900/30 border-zinc-800/80' : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] font-semibold flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  <Thermometer className="w-3.5 h-3.5 text-indigo-400" /> Khoang in
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-extrabold text-indigo-400">
                  {printer?.chamber_temper || 0}°
                </span>
                <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>C</span>
              </div>
            </div>
          </div>

          {/* QUẠT LÀM MÁT */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              isDark ? 'bg-zinc-900/20 border-zinc-800/60 text-zinc-400' : 'bg-slate-50/60 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-sky-400" />
              <span>Quạt chi tiết: <strong className={isDark ? 'text-zinc-200' : 'text-slate-800'}>{printer?.cooling_fan_speed || 0}%</strong></span>
            </div>
            <span>Quạt buồng: <strong className={isDark ? 'text-zinc-200' : 'text-slate-800'}>{printer?.big_fan1_speed || 0}%</strong></span>
            <span>Quạt phụ: <strong className={isDark ? 'text-zinc-200' : 'text-slate-800'}>{printer?.big_fan2_speed || 0}%</strong></span>
          </div>

          {/* HỆ THỐNG AMS (NẾU CÓ DỮ LIỆU) */}
          {printer?.ams?.trays && printer.ams.trays.length > 0 && (
            <div
              className={`p-3.5 rounded-xl border space-y-2.5 ${
                isDark ? 'bg-zinc-900/30 border-zinc-800/80' : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5" /> Khay AMS 4 Cuộn
                </span>
                <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Nhiệt độ: {printer.ams.temp}°C • Độ ẩm: {printer.ams.humidity}%
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {printer.ams.trays.map((tray, idx) => {
                  const isActiveTray = Number(printer.ams.active_tray) === Number(tray.id);
                  return (
                    <div
                      key={tray.id || idx}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-between text-center transition-all ${
                        isActiveTray
                          ? isDark
                            ? 'bg-indigo-950/30 border-indigo-500/50 ring-1 ring-indigo-500/30'
                            : 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-400/30'
                          : isDark
                          ? 'bg-zinc-900/50 border-zinc-800/60'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-black/20 shadow-xs mb-1"
                        style={{ backgroundColor: tray.colorHex || '#888' }}
                      />
                      <span className="text-[10px] font-bold truncate max-w-full">
                        Slot {Number(tray.id) + 1}
                      </span>
                      <span className={`text-[9px] truncate max-w-full ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {tray.type || 'Unknown'}
                      </span>
                      {isActiveTray && (
                        <span className="mt-1 px-1 py-0.2 rounded-full text-[8px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Đang dùng
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      {/* MODAL SKIP OBJECTS CỦA MÁY NÀY */}
      {showSkipModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
              isDark ? 'bg-[#1f2024] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-sm">Bỏ qua chi tiết in - {printerInfo?.name}</h3>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Ngừng đùn nhựa tại chi tiết bị hỏng
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSkipModal(false)}
                className={`p-1 rounded-lg cursor-pointer ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Khi có 1 chi tiết bị bung đáy hoặc mạng nhện, bấm <strong>Bỏ qua</strong>. Máy in sẽ hoàn thành lớp hiện tại và <strong>ngừng in chi tiết đó</strong> ở các lớp tiếp theo.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Danh sách chi tiết trên bàn in ({plateObjects.length})
                </h4>

                {loadingObjects ? (
                  <div className="py-6 flex items-center justify-center text-xs text-zinc-500 gap-2">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    Đang quét bàn in...
                  </div>
                ) : plateObjects.length === 0 ? (
                  <div className={`p-4 rounded-xl border border-dashed text-center text-xs ${isDark ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-500'}`}>
                    <p className="font-medium">Chưa đọc được sơ đồ bàn in từ file .3mf.</p>
                    <p className="text-[11px] mt-1 opacity-70">
                      Bạn có thể nhập ID chi tiết thủ công bên dưới.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {plateObjects.map((obj) => {
                      const isSkipped = skippedList.includes(obj.id);
                      return (
                        <div
                          key={obj.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                            isSkipped
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                              : isDark
                              ? 'bg-zinc-900 border-zinc-800'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div>
                            <span className="font-bold">Chi tiết #{obj.id}: {obj.name}</span>
                            {isSkipped && <span className="ml-2 text-[10px] font-bold text-rose-400">(Đã bỏ qua)</span>}
                          </div>
                          {!isSkipped && (
                            <button
                              onClick={() => handleSkipObject(obj.id)}
                              disabled={skippingId === obj.id}
                              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                            >
                              {skippingId === obj.id ? 'Đang gửi...' : 'Bỏ qua'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Nhập ID thủ công */}
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-zinc-950/40 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                <label className="block text-xs font-bold mb-1.5">
                  Bỏ qua theo mã ID vật thể (Thủ công)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={manualObjId}
                    onChange={(e) => setManualObjId(e.target.value)}
                    placeholder="Ví dụ: 1572"
                    className={`flex-1 px-3 py-1.5 rounded-xl border text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 ${
                      isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  />
                  <button
                    onClick={() => handleSkipObject(manualObjId)}
                    disabled={!manualObjId || skippingId !== null}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    Bỏ qua
                  </button>
                </div>
              </div>
            </div>

            <div className={`p-3 px-5 border-t flex justify-end ${isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-slate-200 bg-slate-50'}`}>
              <button
                onClick={() => setShowSkipModal(false)}
                className={`px-4 py-1.5 rounded-xl border text-xs font-medium cursor-pointer ${
                  isDark ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                }`}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= TRANG GIÁM SÁT CHÍNH: 2 CỘT SONG SONG =================
export default function PrinterMonitor({ onJobFinished }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/bambu/status');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Lỗi lấy dữ liệu máy in:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const printers = data?.printers || [];
  // Máy 1 (QT): IP 192.168.0.105 (Bên trái)
  const printer1 = printers.find((p) => p.ip === '192.168.0.105') || printers[0] || {
    id: 'p1s_1',
    name: 'Bambu P1S - Máy 1 (QT)',
    ip: '192.168.0.105',
    serial: '01P00C591301162',
    connected: false,
    printer: {},
  };

  // Máy 2 (RF): IP 192.168.0.107 (Bên phải)
  const printer2 = printers.find((p) => p.ip === '192.168.0.107') || printers[1] || {
    id: 'p1s_2',
    name: 'Bambu P1S - Máy 2 (RF)',
    ip: '192.168.0.107',
    serial: '01P199611800016',
    connected: false,
    printer: {},
  };

  return (
    <div className="w-full max-w-[1700px] flex flex-col items-center px-1 sm:px-2">
      {/* BỐ CỤC 2 CỘT SONG SONG: MÁY 1 (QT) BÊN TRÁI • MÁY 2 (RF) BÊN PHẢI */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6 w-full items-start">
        {/* CỘT TRÁI: MÁY 1 (QT) */}
        <div className="w-full flex flex-col">
          <PrinterCard
            printerInfo={printer1}
            isLeft={true}
            onStatusRefresh={fetchStatus}
          />
        </div>

        {/* CỘT PHẢI: MÁY 2 (RF) */}
        <div className="w-full flex flex-col">
          <PrinterCard
            printerInfo={printer2}
            isLeft={false}
            onStatusRefresh={fetchStatus}
          />
        </div>
      </div>
    </div>
  );
}
