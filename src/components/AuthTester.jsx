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
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AuthTester({ onEnterApp }) {
  const { user, signIn, signUp, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Supabase Live Ping & Test Data
  const [pingStatus, setPingStatus] = useState('checking');
  const [pingDetails, setPingDetails] = useState('');
  const [liveFilaments, setLiveFilaments] = useState([]);
  const [loadingFilaments, setLoadingFilaments] = useState(false);

  // 1. Kiểm tra kết nối Supabase
  const checkSupabasePing = async () => {
    setPingStatus('checking');
    setPingDetails('Đang kiểm tra kết nối...');
    const startTime = performance.now();

    try {
      if (!isSupabaseConfigured || !supabase) {
        setPingStatus('error');
        setPingDetails('Chưa cấu hình URL hoặc API Key');
        return;
      }

      const { data, error } = await supabase.from('filaments').select('id, name').limit(5);

      if (error) {
        setPingStatus('error');
        setPingDetails(`Lỗi: ${error.message}`);
      } else {
        const duration = Math.round(performance.now() - startTime);
        setPingStatus('connected');
        setPingDetails(`Đã kết nối! Phản hồi: ${duration}ms • Bảng filaments: OK`);
      }
    } catch (err) {
      setPingStatus('error');
      setPingDetails(`Lỗi: ${err.message}`);
    }
  };

  useEffect(() => {
    checkSupabasePing();
  }, []);

  // 2. Tải danh sách cuộn nhựa của user
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
        message: '🎉 Đăng nhập thành công! Kết nối Cloud đã sẵn sàng.',
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
    setLoading(true);

    try {
      const data = await signUp(email, password);
      if (data?.session) {
        setAlert({
          type: 'success',
          message: '🎉 Đăng ký thành công và đã tự động đăng nhập!',
        });
      } else {
        setAlert({
          type: 'success',
          message: '🎉 Tạo tài khoản thành công! Bây giờ bạn hãy bấm tab "Đăng Nhập" để vào ngay.',
        });
        setActiveTab('login');
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

  // 5. Thêm bản ghi test trực tiếp lên Supabase
  const handleCreateTestFilament = async () => {
    if (!user || !supabase) return;
    setLoading(true);
    try {
      const testItem = {
        id: 'fil-test-' + Date.now(),
        user_id: user.id,
        name: `Cuộn Nhựa Test (${new Date().toLocaleTimeString('vi-VN')})`,
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

      const { error } = await supabase.from('filaments').insert([testItem]);

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
      <div className="w-full max-w-xl space-y-5">
        {/* Tiêu đề ngắn gọn */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            PrintFlow 3D Cloud
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Đăng Nhập Tài Khoản Kho Nhựa
          </h1>
          <p className="text-xs text-slate-400">
            Dữ liệu đồng bộ trực tiếp lên Cloud Supabase cho bạn và người trong xưởng
          </p>
        </div>

        {/* Trạng thái Supabase */}
        <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                pingStatus === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              <Database className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Máy Chủ Cloud:</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.2 rounded-full ${
                    pingStatus === 'connected'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {pingStatus === 'connected' ? '● ĐÃ KẾT NỐI' : 'Đang kiểm tra...'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{pingDetails}</p>
            </div>
          </div>

          <button
            onClick={checkSupabasePing}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
            title="Kiểm tra lại kết nối"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Thông báo Alert */}
        {alert && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 ${
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

        {/* NẾU ĐÃ ĐĂNG NHẬP: Hiển thị bảng điều khiển & nút vào App */}
        {user ? (
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-slate-400">Đã đăng nhập tài khoản:</div>
                  <div className="text-sm font-bold text-white truncate">{user.email}</div>
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

            {/* Nút vào ứng dụng to, nổi bật */}
            <button
              onClick={onEnterApp}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Layers className="w-5 h-5" />
              <span>VÀO GIAO DIỆN QUẢN LÝ PRINTFLOW ĐẦY ĐỦ</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Test ghi dữ liệu Supabase */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  Dữ liệu test trên Supabase ({liveFilaments.length} bản ghi):
                </span>
                <button
                  onClick={handleCreateTestFilament}
                  disabled={loading}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ghi Thử 1 Cuộn Nhựa</span>
                </button>
              </div>

              {liveFilaments.length > 0 && (
                <div className="bg-slate-950 rounded-lg p-2.5 max-h-36 overflow-y-auto divide-y divide-slate-850 text-xs">
                  {liveFilaments.map((f) => (
                    <div key={f.id} className="py-1.5 flex items-center justify-between gap-2">
                      <span className="text-white font-medium truncate">{f.name}</span>
                      <button
                        onClick={() => handleDeleteFilament(f.id)}
                        className="text-slate-500 hover:text-rose-400 p-0.5"
                        title="Xóa"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* NẾU CHƯA ĐĂNG NHẬP: Form đăng nhập/đăng ký siêu gọn */
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
                  Tên Tài Khoản / Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-1"
              >
                {loading ? (
                  <span>Đang xử lý...</span>
                ) : activeTab === 'login' ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Đăng Nhập Ngay</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Tạo Tài Khoản &amp; Bắt Đầu</span>
                  </>
                )}
              </button>
            </form>

            {/* Chế độ Offline */}
            <div className="pt-2 text-center border-t border-slate-800/80">
              <button
                type="button"
                onClick={onEnterApp}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Bỏ qua, dùng chế độ <strong>Khách (Offline Local)</strong> →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
