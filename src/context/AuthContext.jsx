import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext();

const LOCAL_USER_KEY = 'printflow_current_user_v1';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Lưu phiên đăng nhập vào LocalStorage
  const persistUser = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  };

  // 1. Đăng ký tài khoản trực tiếp (Không cần gửi email)
  const signUp = async (username, password) => {
    if (!supabase) throw new Error('Chưa cấu hình Supabase');
    const cleanUser = username.trim().toLowerCase();

    if (!cleanUser || cleanUser.length < 3) {
      throw new Error('Tên tài khoản phải có ít nhất 3 ký tự');
    }
    if (!password || password.length < 4) {
      throw new Error('Mật khẩu phải có ít nhất 4 ký tự');
    }

    // Kiểm tra xem username đã tồn tại chưa
    const { data: existing, error: checkError } = await supabase
      .from('accounts')
      .select('username')
      .eq('username', cleanUser)
      .maybeSingle();

    if (existing) {
      throw new Error(`Tên tài khoản "${cleanUser}" đã tồn tại. Vui lòng bấm Đăng Nhập hoặc chọn tên khác!`);
    }

    // Tạo tài khoản mới vào bảng accounts
    const { error: insertError } = await supabase
      .from('accounts')
      .insert([{ username: cleanUser, password: password }]);

    if (insertError) {
      throw new Error(`Lỗi tạo tài khoản: ${insertError.message}`);
    }

    const userData = { id: cleanUser, username: cleanUser, email: cleanUser };
    persistUser(userData);
    return userData;
  };

  // 2. Đăng nhập tài khoản trực tiếp
  const signIn = async (username, password) => {
    if (!supabase) throw new Error('Chưa cấu hình Supabase');
    const cleanUser = username.trim().toLowerCase();

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('username', cleanUser)
      .eq('password', password)
      .maybeSingle();

    if (error) {
      throw new Error(`Lỗi đăng nhập: ${error.message}`);
    }

    if (!data) {
      throw new Error('Tên tài khoản hoặc Mật khẩu không chính xác!');
    }

    const userData = { id: cleanUser, username: cleanUser, email: cleanUser };
    persistUser(userData);
    return userData;
  };

  // 3. Đăng xuất
  const signOut = async () => {
    persistUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isSupabaseConfigured,
        isAuthModalOpen,
        setIsAuthModalOpen,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
