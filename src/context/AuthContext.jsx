import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Lấy session hiện tại
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Lắng nghe thay đổi trạng thái đăng nhập
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Đăng ký tài khoản mới bằng Email + Mật khẩu
  const signUp = async (email, password) => {
    if (!supabase) throw new Error('Supabase chưa được cấu hình');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      if (error.message.includes('User already registered')) {
        throw new Error('Email này đã được đăng ký trước đó. Vui lòng chuyển sang tab Đăng Nhập!');
      }
      throw error;
    }
    return data;
  };

  // Đăng nhập bằng Email + Mật khẩu
  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Supabase chưa được cấu hình');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email hoặc Mật khẩu không chính xác.');
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Email này chưa được xác nhận. Mẹo: Hãy vào Supabase -> Authentication -> Providers -> Email -> Tắt "Confirm email" để vào được ngay!');
      }
      throw error;
    }
    return data;
  };

  // Đăng xuất
  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
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
