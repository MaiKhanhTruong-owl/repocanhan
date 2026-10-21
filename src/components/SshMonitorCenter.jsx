import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Cpu,
  HardDrive,
  Zap,
  Activity,
  Clock,
  Trash2,
  Pause,
  Play,
  Monitor,
  Maximize2,
  Minimize2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Làm sạch mã điều khiển ANSI phức tạp để hiển thị mượt trên khung Terminal React
function cleanAnsiText(raw) {
  if (!raw) return '';
  return raw
    .replace(/\x1b\][^\x07\x1b]*(\x07|\x1b\\)/g, '')
    .replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

export default function SshMonitorCenter() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [stats, setStats] = useState(null);
  const [ptyLog, setPtyLog] = useState(
    '=== ĐÃ KẾT NỐI TRUNG TÂM GIÁM SÁT SSH TRỰC TIẾP TRÊN UBUNTU (owl189) ===\nĐang lắng nghe mọi thao tác từ phiên SSH máy Windows (192.168.0.100)...\n\n'
  );
  const [autoScroll, setAutoScroll] = useState(true);
  const [error, setError] = useState(null);

  // Chế độ hiển thị: 'desktop' (Chiếu màn hình Ubuntu điều khiển trực tiếp) hoặc 'ssh' (Terminal SSH)
  const [viewMode, setViewMode] = useState('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [vncKey, setVncKey] = useState(1);

  const lastSeqRef = useRef(0);
  const termBoxRef = useRef(null);
  const eventsBoxRef = useRef(null);
  const desktopContainerRef = useRef(null);

  const vncUrl = '/novnc/vnc.html?autoconnect=true&resize=scale&reconnect=true&reconnect_delay=2000&path=websockify';

  const toggleFullscreen = () => {
    if (!desktopContainerRef.current) return;
    if (!document.fullscreenElement) {
      desktopContainerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function pollStatus() {
      try {
        const res = await fetch(`/api/ssh-monitor?since=${lastSeqRef.current}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!isMounted) return;

        if (data.stats) {
          setStats(data.stats);
          setError(null);
        }

        if (Array.isArray(data.pty) && data.pty.length > 0) {
          let appended = '';
          for (const item of data.pty) {
            if (item.seq > lastSeqRef.current) {
              lastSeqRef.current = item.seq;
            }
            appended += cleanAnsiText(item.data);
          }
          if (appended) {
            setPtyLog((prev) => {
              const combined = prev + appended;
              return combined.length > 24000
                ? combined.slice(combined.length - 24000)
                : combined;
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Đang kết nối lại dịch vụ giám sát SSH...');
        }
      }
    }

    pollStatus();
    const timer = setInterval(pollStatus, 1000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (autoScroll && termBoxRef.current) {
      termBoxRef.current.scrollTop = termBoxRef.current.scrollHeight;
    }
  }, [ptyLog, autoScroll]);

  useEffect(() => {
    if (autoScroll && eventsBoxRef.current) {
      eventsBoxRef.current.scrollTop = eventsBoxRef.current.scrollHeight;
    }
  }, [stats?.agy_events, stats?.bash_cmds, autoScroll]);

  const cardClass = isDark
    ? 'bg-zinc-900/85 border border-zinc-800/90 text-zinc-100 shadow-lg'
    : 'bg-white/90 border border-slate-300 text-slate-800 shadow-sm';

  const subCardClass = isDark
    ? 'bg-zinc-950/80 border border-zinc-800/80'
    : 'bg-slate-50 border border-slate-200';

  return (
    <div className="w-full max-w-7xl space-y-4 sm:space-y-5 pb-8">
      {/* 1. Banner Trạng thái kết nối & Chuyển đổi chế độ Màn hình Ubuntu / Terminal SSH */}
      <div className={`rounded-2xl p-4 sm:p-5 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 ${cardClass}`}>
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Trung Tâm Điều Khiển
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                HEADLESS READY
              </span>
            </div>
            <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Máy chủ: <span className="font-semibold text-indigo-400">{stats?.hostname || 'owl189'}</span> (HP Z2 Mini G3 • Xeon E3-1245 v5 • 16GB RAM)
            </p>
          </div>
        </div>

        {/* Nút chuyển đổi giữa Màn hình Desktop Ubuntu (Chuột/Phím) và Giám sát SSH */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setViewMode('desktop')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
              viewMode === 'desktop'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : isDark
                ? 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>🖥️ Màn Hình Ubuntu Trực Tiếp (Chuột & Phím)</span>
          </button>

          <button
            onClick={() => setViewMode('ssh')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
              viewMode === 'ssh'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                : isDark
                ? 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>📺 Giám Sát Lệnh SSH & Nhật Ký</span>
          </button>

          {stats?.time && (
            <div className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-1.5 ${subCardClass}`}>
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{stats.time}</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl p-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium">
          {error}
        </div>
      )}

      {/* 2. Hàng 4 Thẻ Tài nguyên Phần cứng & Điện năng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* CPU */}
        <div className={`rounded-2xl p-4 backdrop-blur-xl ${cardClass}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4" /> CPU Xeon E3-1245 v5
            </span>
            <span className="text-sm font-extrabold">{stats ? `${stats.cpu_pct}%` : '--%'}</span>
          </div>
          <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${Math.min(100, stats?.cpu_pct || 0)}%` }}
            />
          </div>
          <div className={`text-[11px] flex justify-between ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            <span>8 Luồng @ 3.50GHz</span>
            <span>Load: {stats?.load || '0.00'}</span>
          </div>
        </div>

        {/* RAM */}
        <div className={`rounded-2xl p-4 backdrop-blur-xl ${cardClass}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Bộ nhớ RAM (16GB)
            </span>
            <span className="text-sm font-extrabold">{stats ? `${stats.mem_pct}%` : '--%'}</span>
          </div>
          <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${Math.min(100, stats?.mem_pct || 0)}%` }}
            />
          </div>
          <div className={`text-[11px] flex justify-between ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            <span>Đã dùng: {stats?.mem_used_gb ?? '--'} GB</span>
            <span>Tổng: {stats?.mem_total_gb ?? '15.5'} GB</span>
          </div>
        </div>

        {/* 2 Ổ cứng: sdb (Ubuntu/Docker) & sda2 (1TB Web) */}
        <div className={`rounded-2xl p-4 backdrop-blur-xl ${cardClass}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4" /> Lưu trữ Server
            </span>
            <span className="text-[11px] font-semibold text-emerald-400">2 Ổ Hoạt Động</span>
          </div>
          <div className="space-y-2 text-[11px]">
            <div>
              <div className="flex justify-between mb-0.5">
                <span>SSD Ubuntu/Docker (sdb):</span>
                <span className="font-bold">
                  {stats ? `${stats.disk_used_gb}/${stats.disk_total_gb} GB (${stats.disk_pct}%)` : '--'}
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, stats?.disk_pct || 0)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <span>Ổ Web 1TB (sda2):</span>
                <span className="font-bold">
                  {stats ? `${stats.web_used_gb}/${stats.web_total_gb} GB (${stats.web_disk_pct}%)` : '--'}
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500 transition-all duration-300"
                  style={{ width: `${Math.max(2, Math.min(100, stats?.web_disk_pct || 1))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Công suất điện & Chi phí 24/7 */}
        <div className={`rounded-2xl p-4 backdrop-blur-xl ${cardClass}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Công suất Điện (RAPL)
            </span>
            <span className="text-sm font-extrabold text-amber-400">
              ~{stats?.power?.total_w ?? '23.0'} W
            </span>
          </div>
          <div className="text-xs font-semibold text-emerald-400 mb-1">
            Ước tính chạy 24/7: ~{stats?.power?.monthly_vnd ?? '46.500'} đ/tháng
          </div>
          <div className={`text-[11px] flex justify-between ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            <span>CPU Package: {stats?.power?.cpu_w ?? '8.0'} W</span>
            <span>~{stats?.power?.monthly_kwh ?? '16.6'} kWh/tháng</span>
          </div>
        </div>
      </div>

      {/* 3A. CHẾ ĐỘ CHIẾU MÀN HÌNH DESKTOP UBUNTU TRỰC TIẾP (noVNC Headless Desktop) */}
      {viewMode === 'desktop' && (
        <div
          ref={desktopContainerRef}
          className={`rounded-2xl p-3 sm:p-4 backdrop-blur-xl flex flex-col ${
            isFullscreen ? 'w-screen h-screen bg-zinc-950 fixed inset-0 z-50 rounded-none' : `h-[680px] ${cardClass}`
          }`}
        >
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800/80 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-indigo-400">
                🖥️ Màn Hình Desktop Ubuntu
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setVncKey((k) => k + 1)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 cursor-pointer"
                title="Kết nối lại màn hình"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tải lại</span>
              </button>
              <a
                href={vncUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-zinc-700"
                title="Mở màn hình Ubuntu trong Tab riêng"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mở Tab Riêng</span>
              </a>
              <button
                onClick={toggleFullscreen}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
              </button>
            </div>
          </div>

          <div className="flex-1 w-full bg-black rounded-xl overflow-hidden border border-zinc-800 relative">
            <iframe
              key={vncKey}
              src={vncUrl}
              title="Ubuntu Live Remote Desktop"
              className="w-full h-full border-0"
              allow="clipboard-read; clipboard-write; fullscreen"
            />
          </div>
        </div>
      )}

      {/* 3B. CHẾ ĐỘ GIÁM SÁT TERMINAL SSH & TIẾN TRÌNH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cột trái (7/12): Màn hình Đồng bộ Terminal SSH Trực Tiếp + Tiến trình SSH */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className={`rounded-2xl p-4 backdrop-blur-xl flex flex-col h-[420px] ${cardClass}`}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-emerald-400">
                  Màn hình Đồng bộ Terminal SSH Trực Tiếp
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAutoScroll((v) => !v)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 border cursor-pointer ${
                    autoScroll
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}
                  title="Bật/Tắt tự động cuộn"
                >
                  {autoScroll ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{autoScroll ? 'Tự cuộn: BẬT' : 'Tự cuộn: TẮT'}</span>
                </button>
                <button
                  onClick={() => setPtyLog('=== Đã xóa lịch sử hiển thị màn hình Terminal ===\n')}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 cursor-pointer"
                  title="Xóa màn hình Terminal"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>

            <pre
              ref={termBoxRef}
              className="flex-1 bg-[#060911] text-emerald-300 font-mono text-xs leading-relaxed p-3.5 rounded-xl border border-zinc-800 overflow-y-auto whitespace-pre-wrap break-all select-text"
            >
              {ptyLog}
            </pre>
          </div>

          {/* Bảng Tiến trình đang chạy trên các phiên SSH (pts/*) */}
          <div className={`rounded-2xl p-4 backdrop-blur-xl ${cardClass}`}>
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-800/80">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-cyan-400 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Tiến trình Đang Chạy Trên Phiên SSH (pts/*)
              </span>
              <span className="text-xs text-zinc-400">
                {stats?.pts_procs?.length || 0} tiến trình
              </span>
            </div>
            <div className="overflow-x-auto max-h-48">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="py-1.5 px-2">TTY</th>
                    <th className="py-1.5 px-2">PID</th>
                    <th className="py-1.5 px-2">CPU%</th>
                    <th className="py-1.5 px-2">MEM%</th>
                    <th className="py-1.5 px-2">Lệnh đang thực thi</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.pts_procs?.map((p) => (
                    <tr key={p.pid} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-1.5 px-2 text-cyan-400 font-bold">{p.tty}</td>
                      <td className="py-1.5 px-2 text-zinc-300">{p.pid}</td>
                      <td className="py-1.5 px-2 text-amber-300">{p.cpu}%</td>
                      <td className="py-1.5 px-2 text-emerald-300">{p.mem}%</td>
                      <td className="py-1.5 px-2 truncate max-w-xs" title={p.cmd}>
                        {p.cmd}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Cột phải (5/12): Nhật ký Thao tác từ Máy Win */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Nhật ký Thao tác từ Máy Win & Lệnh Thực thi */}
          <div className={`rounded-2xl p-4 backdrop-blur-xl flex flex-col h-[420px] ${cardClass}`}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-amber-400 flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Nhật ký Thao tác từ Máy Win & Lệnh Thực thi
              </span>
            </div>

            <div
              ref={eventsBoxRef}
              className="flex-1 bg-[#070a12] rounded-xl border border-zinc-800 p-3 overflow-y-auto space-y-2 font-mono text-xs"
            >
              {stats?.agy_events?.map((ev, idx) => (
                <div
                  key={`ev-${idx}`}
                  className={`p-2 rounded-lg border-l-2 leading-relaxed break-words ${
                    ev.role === 'WIN_USER'
                      ? 'bg-amber-500/10 border-amber-400 text-amber-200 font-semibold'
                      : 'bg-cyan-500/10 border-cyan-400 text-cyan-200'
                  }`}
                >
                  {ev.text}
                </div>
              ))}

              {stats?.bash_cmds?.slice(-12).map((cmd, idx) => (
                <div
                  key={`bash-${idx}`}
                  className="p-2 rounded-lg border-l-2 border-emerald-400 bg-emerald-500/10 text-emerald-200 break-words"
                >
                  💻 [SSH Bash] {cmd}
                </div>
              ))}

              {!stats?.agy_events?.length && !stats?.bash_cmds?.length && (
                <div className="text-zinc-500 text-center py-8">
                  Đang chờ thao tác điều khiển mới từ máy Windows...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
