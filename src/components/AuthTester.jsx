import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  UserCheck,
  UserPlus,
  LogOut,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AuthTester({ onEnterApp }) {
  const { user, signIn, signUp, signInWithGoogle, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error' | 'info', message: string }

  // Supabase Live Ping & Test Data
  const [pingStatus, setPingStatus] = useState('checking'); // 'connected' | 'error' | 'checking'
  const [pingDetails, setPingDetails] = useState('');
  const [liveFilaments, setLiveFilaments] = useState([]);
  const [loadingFilaments, setLoadingFilaments] = useState(false);

  // 1. Kiểm tra kết nối Supabase khi mở màn hình
  const checkSupabasePing = async () => {
    setPingStatus('checking');
    setPingDetails('Đang kết nối tới Supabase...');
    const startTime = performance.now();

    try {
      if (!isSupabaseConfigured || !supabase) {
        setPingStatus('error');
        setPingDetails('Chưa cấu hình URL hoặc API Key trong file .env');
        return;
      }

      // Query thử bảng filaments
      const { data, error } = await supabase.from('filaments').select('id, name, created_at').limit(5);

      if (error) {
        setPingStatus('error');
        setPingDetails(`Lỗi: ${error.message} (Code: ${error.code})`);
      } else {
        const duration = Math.round(performance.now() - startTime);
        setPingStatus('connected');
        setPingDetails(`Kết nối thành công! Phản hồi: ${duration}ms • Số bản ghi: ${data?.length || 0}`);
      }
    } catch (err) {
      setPingStatus('error');
      setPingDetails(`Lỗi ngoại lệ: ${err.message}`);
    }
  };

  useEffect(() => {
    checkSupabasePing();
  }, []);

  // 2. Tải danh sách cuộn nhựa trực tiếp từ Supabase của tài khoản đang đăng nhập
  const fetchUserFilaments = async () => {
    if (!user || !supabase) return;
    setLoadingFilaments(true);
    try {
      const { data, error } = await supabase
        .from('filaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setAlert({ type: 'error', message: `Lỗi đọc dữ liệu: ${error.message}` });
      } else {
        setLiveFilaments(data || []);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoadingFilaments(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserFilaments();
    }
  }, [user]);

  // 3. Xử lý Đăng Nhập
  const handleLogin = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    try {
      await signIn(email, password);
      setAlert({
        type: 'success',
        message: '🎉 Đăng nhập thành công! Phiên làm việc đã được kích hoạt.',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại Email và Mật khẩu.',
      });
    } finally {
      setLoading(false);
    }
  };

  // 4. Xử lý Đăng Ký
  const handleRegister = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (password !== confirmPassword) {
      setAlert({ type: 'error', message: 'Mật khẩu xác nhận không khớp!' });
      return;
    }

    setLoading(true);
    try {
      const data = await signUp(email, password);
      if (data?.session) {
        setAlert({
          type: 'success',
          message: '🎉 Đăng ký và đăng nhập thành công!',
        });
      } else {
        setAlert({
          type: 'success',
          message:
            'Tài khoản đã tạo thành công! (Nếu Supabase bật Email Confirmation, bạn có thể kiểm tra email hoặc đăng nhập ngay).',
        });
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Đăng ký thất bại.',
      });
    } finally {
      setLoading(false);
    }
  };

  // 4b. Xử lý Đăng Nhập bằng Google
  const handleGoogleLogin = async () => {
    setAlert(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Lỗi đăng nhập Google. Hãy kiểm tra xem bạn đã bật Google Provider trên trang Supabase chưa.',
      });
      setLoading(false);
    }
  };

  // 5. Thêm bản ghi test trực tiếp lên Supabase
  const handleCreateTestFilament = async () => {
    if (!user || !supabase) return;
    setLoading(true);
    try {
      const testItem = {
        id: 'fil-test-' + Date.now(),
        user_id: user.id,
        name: `Cuộn Nhựa Test ${new Date().toLocaleTimeString('vi-VN')}`,
        brand: 'Bambu Lab',
        material: 'PLA',
        color_name: 'Xanh Lá Neon',
        color_hex: '#22c55e',
        initial_weight: 1000,
        remaining_weight: 850,
        status: 'loaded',
        slot: 'AMS Slot 1',
        notes: 'Bản ghi thử nghiệm trực tiếp trên Supabase',
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('filaments').insert([testItem]).select();

      if (error) {
        setAlert({ type: 'error', message: `Lỗi ghi Supabase: ${error.message}` });
      } else {
        setAlert({
          type: 'success',
          message: `✅ ĐÃ GHI THÀNH CÔNG VÀO SUPABASE! ID: ${testItem.id}`,
        });
        fetchUserFilaments();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 6. Xóa bản ghi test
  const handleDeleteFilament = async (id) => {
    try {
      const { error } = await supabase.from('filaments').delete().eq('id', id);
      if (error) {
        setAlert({ type: 'error', message: `Lỗi xóa: ${error.message}` });
      } else {
        setAlert({ type: 'success', message: 'Đã xóa bản ghi khỏi Supabase' });
        fetchUserFilaments();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            PrintFlow 3D • Trung Tâm Kiểm Thử Kết Nối Supabase
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Xác Thực &amp; Kiểm Tra Dữ Liệu Cloud
          </h1>
          <p className="text-sm text-slate-400">
            Kiểm tra trạng thái kết nối máy chủ Supabase và đăng nhập tài khoản thực tế
          </p>
        </div>

        {/* 1. Supabase Connection Status Card */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                pingStatus === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : pingStatus === 'checking'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Trạng Thái Supabase Cloud:
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    pingStatus === 'connected'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : pingStatus === 'checking'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {pingStatus === 'connected'
                    ? '● ĐÃ KẾT NỐI SẴN SÀNG'
                    : pingStatus === 'checking'
                    ? 'Đang kiểm tra...'
                    : 'CHƯA KẾT NỐI'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono truncate max-w-md">
                {pingDetails}
              </p>
            </div>
          </div>

          <button
            onClick={checkSupabasePing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all active:scale-95 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Ping Lại</span>
          </button>
        </div>

        {/* Global Alert Notification */}
        {alert && (
          <div
            className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200 ${
              alert.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                : alert.type === 'error'
                ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span className="flex-1">{alert.message}</span>
            <button
              onClick={() => setAlert(null)}
              className="text-slate-400 hover:text-white text-xs font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2. NẾU ĐÃ ĐĂNG NHẬP: Hiển thị Live Data Test Console */}
        {user ? (
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6">
            {/* User Info Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Đang Đăng Nhập</h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Cloud Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">{user.email}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-sm">
                    UID: {user.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => signOut()}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-xs font-semibold text-slate-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng Xuất</span>
                </button>
              </div>
            </div>

            {/* Test Actions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  Dữ Liệu Bảng filaments Trên Supabase ({liveFilaments.length} bản ghi)
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreateTestFilament}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ghi Thử 1 Cuộn Nhựa</span>
                  </button>
                  <button
                    onClick={fetchUserFilaments}
                    disabled={loadingFilaments}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Tải lại danh sách"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingFilaments ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Data Table Preview */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                {liveFilaments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    Chưa có cuộn nhựa nào trên tài khoản Supabase này.
                    <br />
                    Hãy bấm nút <strong className="text-emerald-400">&quot;Ghi Thử 1 Cuộn Nhựa&quot;</strong> ở trên để test ghi dữ liệu!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-850 max-h-60 overflow-y-auto">
                    {liveFilaments.map((f) => (
                      <div
                        key={f.id}
                        className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-900/50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-4 h-4 rounded-full border border-slate-700 shrink-0"
                            style={{ backgroundColor: f.color_hex }}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">{f.name}</div>
                            <div className="text-[11px] text-slate-400">
                              {f.brand} • {f.material} • Còn {f.remaining_weight}g • Slot: {f.slot || 'N/A'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(f.created_at).toLocaleTimeString('vi-VN')}
                          </span>
                          <button
                            onClick={() => handleDeleteFilament(f.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                            title="Xóa bản ghi này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Enter Full App Button */}
            <div className="pt-2">
              <button
                onClick={onEnterApp}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white text-sm font-bold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Layers className="w-5 h-5" />
                <span>Vào Giao Diện Quản Lý PrintFlow Đầy Đủ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* 3. NẾU CHƯA ĐĂNG NHẬP: Hiển thị Form Đăng Nhập / Đăng Ký Chuẩn */
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Tabs Switcher */}
            <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setAlert(null);
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'login'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Đăng Nhập</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setAlert(null);
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'register'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Tạo Tài Khoản Mới</span>
              </button>
            </div>

            {/* Nút Đăng Nhập Bằng Google */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-700 hover:border-slate-500 text-white text-xs font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 shadow-md"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Đăng Nhập Nhanh Bằng Tài Khoản Google</span>
              </button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                  <span className="bg-slate-900 px-3 text-slate-500 font-semibold">Hoặc Dùng Email &amp; Mật Khẩu</span>
                </div>
              </div>
            </div>

            {/* Form Container */}
            <form onSubmit={activeTab === 'login' ? handleLogin : handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Địa Chỉ Email <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ví dụ: admin@printflow.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mật Khẩu <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Xác Nhận Lại Mật Khẩu <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu ở trên"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span>Đang xử lý kết nối tới Supabase...</span>
                ) : activeTab === 'login' ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Đăng Nhập Ngay</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Đăng Ký Tài Khoản Mới</span>
                  </>
                )}
              </button>
            </form>

            {/* Offline Guest Option */}
            <div className="pt-2 text-center border-t border-slate-800/80">
              <button
                type="button"
                onClick={onEnterApp}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Hoặc tiếp tục sử dụng ở chế độ <strong>Khách (Offline / LocalStorage)</strong> →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
