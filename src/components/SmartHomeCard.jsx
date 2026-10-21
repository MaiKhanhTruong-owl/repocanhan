import React, { useState, useEffect } from 'react';
import {
  Power,
  Zap,
  Lightbulb,
  Fish,
  Sparkles,
  Send,
  RefreshCw,
  LogOut,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Timer,
  Volume2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function SmartHomeCard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [authStatus, setAuthStatus] = useState({ connected: false, loading: true });
  const [devices, setDevices] = useState([]);
  const [loadingAction, setLoadingAction] = useState(null); // deviceId or 'custom'
  const [customCommand, setCustomCommand] = useState('');
  const [lastResponse, setLastResponse] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // 1. Kiểm tra trạng thái Google Auth
  const checkStatus = async () => {
    try {
      const res = await fetch('/api/google/status');
      if (res.ok) {
        const data = await res.json();
        setAuthStatus({ ...data, loading: false });
        if (data.connected) {
          fetchDevices();
        }
      }
    } catch (e) {
      console.error('Lỗi kiểm tra Google status:', e);
      setAuthStatus({ connected: false, loading: false });
    }
  };

  // 2. Lấy danh sách thiết bị
  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/google/devices');
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch (e) {
      console.error('Lỗi lấy thiết bị smarthome:', e);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // Polling trạng thái khi người dùng vừa mở tab xác thực Google
  useEffect(() => {
    let interval = null;
    if (isAuthenticating && !authStatus.connected) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/google/status');
          if (res.ok) {
            const data = await res.json();
            if (data.connected) {
              setAuthStatus({ ...data, loading: false });
              setIsAuthenticating(false);
              fetchDevices();
              setLastResponse({
                type: 'success',
                text: '🎉 Đã liên kết tài khoản Google Home thành công!',
              });
            }
          }
        } catch (_) {}
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticating, authStatus.connected]);

  // Bắt đầu quá trình đăng nhập Google
  const handleConnectGoogle = async () => {
    try {
      setIsAuthenticating(true);
      const res = await fetch('/api/google/auth-url');
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank', 'width=600,height=750');
      } else {
        alert(data.error || 'Không tạo được đường dẫn đăng nhập Google.');
        setIsAuthenticating(false);
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ: ' + e.message);
      setIsAuthenticating(false);
    }
  };

  // Đăng xuất Google
  const handleDisconnect = async () => {
    if (!confirm('Bạn có chắc chắn muốn ngắt kết nối Google Home?')) return;
    try {
      await fetch('/api/google/disconnect', { method: 'POST' });
      setAuthStatus({ connected: false, loading: false });
      setLastResponse(null);
    } catch (e) {
      console.error('Lỗi hủy liên kết:', e);
    }
  };

  // Điều khiển Bật / Tắt thiết bị
  const handleToggleDevice = async (device) => {
    const newState = !device.state;
    const query = `${newState ? 'bật' : 'tắt'} ${device.name}`;

    setLoadingAction(device.id);
    setLastResponse(null);

    try {
      const res = await fetch('/api/google/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          deviceId: device.id,
          newState,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setDevices((prev) =>
          prev.map((d) => (d.id === device.id ? { ...d, state: newState } : d))
        );
        if (data.audioUrl) {
          try {
            const snd = new Audio(data.audioUrl);
            snd.play().catch(() => {});
          } catch (_) {}
        }
        setLastResponse({
          type: 'success',
          text: data.response || `Đã gửi lệnh "${query}" tới Google Home`,
          audioUrl: data.audioUrl,
        });
      } else {
        setLastResponse({
          type: 'error',
          text: data.error || 'Lỗi gửi lệnh tới Google Assistant',
        });
      }
    } catch (err) {
      setLastResponse({
        type: 'error',
        text: 'Không thể kết nối đến server: ' + err.message,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Bật/tắt tự động ngắt điện khi in xong
  const handleToggleAutoOff = async (enabled) => {
    try {
      const res = await fetch('/api/google/devices/auto-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        setDevices((prev) =>
          prev.map((d) =>
            d.id === 'printer_plug' ? { ...d, autoOffOnFinish: enabled } : d
          )
        );
      }
    } catch (e) {
      console.error('Lỗi lưu cài đặt tự động ngắt:', e);
    }
  };

  // Gửi câu lệnh tùy biến bằng giọng nói / chữ
  const handleSendCustomCommand = async (e) => {
    if (e) e.preventDefault();
    if (!customCommand.trim()) return;

    setLoadingAction('custom');
    setLastResponse(null);

    try {
      const res = await fetch('/api/google/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customCommand.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.audioUrl) {
          try {
            const snd = new Audio(data.audioUrl);
            snd.play().catch(() => {});
          } catch (_) {}
        }
        setLastResponse({
          type: 'success',
          text: data.response || `Đã gửi lệnh "${customCommand}" tới Google Home`,
          audioUrl: data.audioUrl,
        });
        setCustomCommand('');
        fetchDevices();
      } else {
        setLastResponse({
          type: 'error',
          text: data.error || 'Lỗi gửi câu lệnh',
        });
      }
    } catch (err) {
      setLastResponse({
        type: 'error',
        text: 'Lỗi: ' + err.message,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const getDeviceIcon = (device) => {
    if (device.type === 'plug' || device.id === 'printer_plug') {
      return <Zap className="w-5 h-5 text-amber-500" />;
    }
    if (device.id === 'aquarium_light') {
      return <Fish className="w-5 h-5 text-sky-400" />;
    }
    return <Lightbulb className="w-5 h-5 text-amber-400" />;
  };

  const printerPlug = devices.find((d) => d.id === 'printer_plug');

  return (
    <div
      className={`w-full max-w-4xl rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
        isDark
          ? 'bg-[#1f2024] border-zinc-800 text-zinc-100'
          : 'bg-white border-slate-300 text-slate-800 shadow-slate-200/50'
      }`}
    >
      {/* 1. Header Card */}
      <div
        className={`p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b ${
          isDark ? 'border-zinc-800/80 bg-zinc-900/40' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold tracking-tight">
                Google Home & Thiết Bị Thông Minh
              </h3>
              {authStatus.connected ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Đã kết nối
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Chưa liên kết
                </span>
              )}
            </div>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Điều khiển từ xa không cùng mạng LAN • Ổ cắm máy in 3D, Đèn bàn, Đèn hồ cá
            </p>
          </div>
        </div>

        {/* Nút hành động trên Header */}
        <div className="flex items-center gap-2">
          {authStatus.connected ? (
            <button
              onClick={handleDisconnect}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'bg-zinc-800/60 hover:bg-rose-500/10 hover:text-rose-400 border-zinc-700 text-zinc-400'
                  : 'bg-white hover:bg-rose-50 hover:text-rose-600 border-slate-300 text-slate-600 shadow-2xs'
              }`}
              title="Ngắt liên kết tài khoản Google"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Ngắt kết nối</span>
            </button>
          ) : (
            <button
              onClick={handleConnectGoogle}
              disabled={isAuthenticating}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang đợi cấp quyền...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Đăng nhập Google Home</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. Body Card */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* Banner thông báo phản hồi từ Google Assistant */}
        {lastResponse && (
          <div
            className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-3 animate-fade-in ${
              lastResponse.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="font-medium">{lastResponse.text}</span>
            </div>
            <div className="flex items-center gap-2">
              {lastResponse.audioUrl && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const snd = new Audio(lastResponse.audioUrl);
                      snd.play().catch(() => {});
                    } catch (_) {}
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer flex items-center gap-1.5 transition-colors ${
                    isDark
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                  title="Nghe lại phản hồi âm thanh từ Google Assistant"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>🔊 Nghe Google trả lời</span>
                </button>
              )}
              <button
                onClick={() => setLastResponse(null)}
                className="text-[11px] opacity-70 hover:opacity-100 cursor-pointer px-1 py-0.5"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* NẾU CHƯA KẾT NỐI GOOGLE */}
        {!authStatus.connected ? (
          <div
            className={`p-6 sm:p-8 rounded-2xl border text-center space-y-4 ${
              isDark ? 'bg-zinc-900/30 border-zinc-800/80' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mx-auto flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h4 className="text-sm sm:text-base font-bold">
                Liên kết tài khoản Google Home của bạn
              </h4>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Cho phép PrintFlow gửi lệnh điều khiển trực tiếp tới các thiết bị{' '}
                <strong className={isDark ? 'text-zinc-200' : 'text-slate-700'}>
                  "máy in 3D"
                </strong>
                ,{' '}
                <strong className={isDark ? 'text-zinc-200' : 'text-slate-700'}>
                  "đèn bàn"
                </strong>{' '}
                và{' '}
                <strong className={isDark ? 'text-zinc-200' : 'text-slate-700'}>
                  "đèn hồ cá"
                </strong>
                .
              </p>
            </div>
            <button
              onClick={handleConnectGoogle}
              disabled={isAuthenticating}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang mở trình duyệt xác thực Google...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>Bấm vào đây để Đăng Nhập Cấp Quyền</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* NẾU ĐÃ KẾT NỐI GOOGLE: HIỂN THỊ CÁC THIẾT BỊ */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {devices.map((device) => {
                const isLoading = loadingAction === device.id;
                return (
                  <div
                    key={device.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      device.state
                        ? isDark
                          ? 'bg-indigo-950/20 border-indigo-500/40 shadow-sm'
                          : 'bg-indigo-50/50 border-indigo-200 shadow-xs'
                        : isDark
                        ? 'bg-zinc-900/40 border-zinc-800/90'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    {/* Top: Icon + Tên */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                            device.state
                              ? 'bg-indigo-500/20 border-indigo-500/30'
                              : isDark
                              ? 'bg-zinc-800/80 border-zinc-700/60'
                              : 'bg-slate-100 border-slate-200'
                          }`}
                        >
                          {getDeviceIcon(device)}
                        </div>
                        <div>
                          <div className="text-xs font-bold">{device.label}</div>
                          <div
                            className={`text-[10px] font-mono ${
                              isDark ? 'text-zinc-500' : 'text-slate-400'
                            }`}
                          >
                            "{device.name}"
                          </div>
                        </div>
                      </div>

                      {/* Badge trạng thái */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          device.state
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isDark
                            ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {device.state ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                      </span>
                    </div>

                    {/* Bottom: Nút Bật / Tắt */}
                    <button
                      onClick={() => handleToggleDevice(device)}
                      disabled={isLoading}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                        device.state
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang gửi lệnh...</span>
                        </>
                      ) : (
                        <>
                          <Power className="w-3.5 h-3.5" />
                          <span>{device.state ? 'Tắt Thiết Bị' : 'Bật Thiết Bị'}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Tính năng thông minh: Tự động ngắt điện máy in khi in xong */}
            {printerPlug && (
              <div
                className={`p-3.5 px-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                  isDark
                    ? 'bg-zinc-900/30 border-zinc-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                    <Timer className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold">
                      Tự động ngắt điện máy in khi in xong
                    </span>
                    <p
                      className={`text-[11px] ${
                        isDark ? 'text-zinc-400' : 'text-slate-500'
                      }`}
                    >
                      Chờ 3 phút để đầu in & bàn nhiệt hạ nhiệt an toàn rồi tự động tắt ổ cắm
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={printerPlug.autoOffOnFinish || false}
                    onChange={(e) => handleToggleAutoOff(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span
                    className={`font-semibold ${
                      printerPlug.autoOffOnFinish
                        ? 'text-indigo-500'
                        : isDark
                        ? 'text-zinc-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {printerPlug.autoOffOnFinish ? 'Đã kích hoạt' : 'Tắt'}
                  </span>
                </label>
              </div>
            )}

            {/* Ô gửi câu lệnh tùy ý tới Google Assistant */}
            <form
              onSubmit={handleSendCustomCommand}
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 ${
                isDark
                  ? 'bg-zinc-950/40 border-zinc-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <input
                type="text"
                value={customCommand}
                onChange={(e) => setCustomCommand(e.target.value)}
                placeholder="Gửi câu lệnh tới Google Assistant (ví dụ: bật quạt, tắt đèn bàn...)"
                className={`flex-1 px-3 py-1.5 rounded-xl border text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600'
                    : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
                }`}
              />
              <button
                type="submit"
                disabled={!customCommand.trim() || loadingAction === 'custom'}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingAction === 'custom' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Gửi lệnh</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
