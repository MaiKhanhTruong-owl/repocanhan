import React, { useState, useEffect } from 'react';
import {
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
  Users,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AuthTester({ onEnterApp }) {
  const { user, signIn, signUp, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');

  // Trạng thái xử lý & thông báo
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Ping kiểm tra kết nối & danh sách tài khoản
  const [pingStatus, setPingStatus] = useState('checking');
  const [pingDetails, setPingDetails] = useState('');
  const [liveAccounts, setLiveAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // 1. Kiểm tra kết nối tới bảng accounts
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

      const { data, error } = await supabase.from('accounts').select('username').limit(5);

      if (error) {
        setPingStatus('error');
        setPingDetails(`Lỗi: ${error.message}`);
      } else {
        const duration = Math.round(performance.now() - startTime);
        setPingStatus('connected');
        setPingDetails(`Kết nối thành công! Phản hồi: ${duration}ms • Bảng accounts: SẴN SÀNG`);
      }
    } catch (err) {
      setPingStatus('error');
      setPingDetails(`Lỗi: ${err.message}`);
    }
  };

  // 2. Tải danh sách tất cả tài khoản hiện có trên Supabase
  const fetchAllAccounts = async () => {
    if (!supabase) return;
    setLoadingAccounts(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('username, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        setAlert({ type: 'error', message: `Lỗi đọc bảng accounts: ${error.message}` });
      } else {
        setLiveAccounts(data || []);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    checkSupabasePing();
    fetchAllAccounts();
  }, []);

  // 3. Xử lý Đăng Nhập
  const handleLogin = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    try {
      await signIn(username, password);
      setAlert({
        type: 'success',
        message: `🎉 ĐĂNG NHẬP THÀNH CÔNG TÀI KHOẢN "${username.trim().toLowerCase()}"!`,
      });
      fetchAllAccounts();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Đăng nhập thất bại.',
      });
    } finally {
      setLoading(false);
    }
  };

  // 4. Xử lý Đăng Ký Tài Khoản Mới
  const handleRegister = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    try {
      await signUp(username, password);
      setAlert({
        type: 'success',
        message: `🎉 TẠO TÀI KHOẢN THÀNH CÔNG VÀ ĐÃ ĐĂNG NHẬP: "${username.trim().toLowerCase()}"!`,
      });
      fetchAllAccounts();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Đăng ký thất bại.',
      });
    } finally {
      setLoading(false);
    }
  };

  // 5. Xóa tài khoản test khỏi Supabase
  const handleDeleteAccount = async (targetUsername) => {
    if (!window.confirm(`Xác nhận xóa tài khoản "${targetUsername}" khỏi Supabase?`)) return;
    try {
      const { error } = await supabase.from('accounts').delete().eq('username', targetUsername);
      if (error) {
        setAlert({ type: 'error', message: `Lỗi xóa: ${error.message}` });
      } else {
        setAlert({ type: 'success', message: `Đã xóa tài khoản "${targetUsername}" khỏi Supabase!` });
        if (user?.username === targetUsername) {
          signOut();
        }
        fetchAllAccounts();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-xl space-y-5">
        {/* Tiêu đề */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Kiểm Tra Chức Năng Đăng Nhập &amp; Đăng Ký
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Xác Thực Tài Khoản Supabase
          </h1>
          <p className="text-xs text-slate-400">
            Dữ liệu tài khoản lưu trữ trực tiếp trên bảng <code className="text-indigo-300 font-mono">accounts</code>
          </p>
        </div>

        {/* Thẻ trạng thái kết nối Supabase */}
        <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                pingStatus === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              <Database className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Kết Nối Supabase:</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.2 rounded-full ${
                    pingStatus === 'connected'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {pingStatus === 'connected' ? '● ĐÃ KẾT NỐI' : 'CHƯA KẾT NỐI'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{pingDetails}</p>
            </div>
          </div>

          <button
            onClick={() => {
              checkSupabasePing();
              fetchAllAccounts();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
            title="Kiểm tra lại kết nối"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Thông báo Alert */}
        {alert && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200 ${
              alert.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
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
              className="text-slate-400 hover:text-white text-xs font-bold ml-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* NẾU ĐÃ ĐĂNG NHẬP: Hiển thị trạng thái thành công */}
        {user ? (
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-slate-400">Đang đăng nhập tài khoản:</div>
                  <div className="text-base font-bold text-emerald-400 truncate">{user.username}</div>
                </div>
              </div>

              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-xs font-semibold text-slate-300 transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng Xuất</span>
              </button>
            </div>

            {/* Danh sách tài khoản đang có trên Supabase */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-400" />
                  Các Tài Khoản Đang Có Trên Supabase ({liveAccounts.length})
                </span>
                <button
                  onClick={fetchAllAccounts}
                  disabled={loadingAccounts}
                  className="text-slate-400 hover:text-indigo-400 p-1"
                  title="Tải lại danh sách"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAccounts ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="bg-slate-950 rounded-xl border border-slate-800 p-2 divide-y divide-slate-850 max-h-48 overflow-y-auto">
                {liveAccounts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">Chưa có tài khoản nào</div>
                ) : (
                  liveAccounts.map((acc) => (
                    <div
                      key={acc.username}
                      className="py-2 px-2.5 flex items-center justify-between text-xs hover:bg-slate-900/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-bold text-white">{acc.username}</span>
                        {acc.username === user.username && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Hiện tại
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-500 font-mono">
                          {new Date(acc.created_at).toLocaleTimeString('vi-VN')}
                        </span>
                        {acc.username !== 'admin' && (
                          <button
                            onClick={() => handleDeleteAccount(acc.username)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                            title="Xóa tài khoản này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Nút vào ứng dụng */}
            <button
              onClick={onEnterApp}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Layers className="w-5 h-5" />
              <span>VÀO GIAO DIỆN QUẢN LÝ PRINTFLOW</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* NẾU CHƯA ĐĂNG NHẬP: Form đăng nhập / đăng ký */
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5">
            {/* Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setAlert(null);
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'login'
                    ? 'bg-indigo-600 text-white shadow-md'
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
                  setUsername('');
                  setPassword('');
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'register'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Tạo Tài Khoản Mới</span>
              </button>
            </div>

            <form onSubmit={activeTab === 'login' ? handleLogin : handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên Tài Khoản
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ví dụ: admin hoặc tên của bạn"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mật Khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {activeTab === 'login' && (
                <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300">
                  💡 Tài khoản mẫu có sẵn: Tên: <strong className="text-white">admin</strong> | Mật khẩu: <strong className="text-white">123456</strong>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-1"
              >
                {loading ? (
                  <span>Đang xử lý trên Supabase...</span>
                ) : activeTab === 'login' ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Đăng Nhập Ngay</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Tạo Tài Khoản &amp; Đăng Nhập</span>
                  </>
                )}
              </button>
            </form>

            {/* Danh sách các tài khoản hiện có */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Tài khoản trên Supabase:</span>
                <span className="text-slate-300 font-bold">{liveAccounts.length} tài khoản</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
