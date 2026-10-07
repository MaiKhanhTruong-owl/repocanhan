import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import FilamentKanban from './components/FilamentKanban';
import FileKanban from './components/FileKanban';
import AmsManager from './components/AmsManager';
import FilamentModal from './components/FilamentModal';
import FileModal from './components/FileModal';
import AuthModal from './components/AuthModal';
import AuthTester from './components/AuthTester';
import Toast from './components/Toast';

function MainContent({ onOpenTester }) {
  const { activeTab } = useApp();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {activeTab === 'overview' && <StatsOverview />}
      {activeTab === 'filaments' && <FilamentKanban />}
      {activeTab === 'files' && <FileKanban />}
      {activeTab === 'ams' && <AmsManager />}

      {/* Global Modals & Toast */}
      <FilamentModal />
      <FileModal />
      <AuthModal />
      <Toast />
    </main>
  );
}

function AppContent() {
  const [showAuthTester, setShowAuthTester] = useState(true);

  if (showAuthTester) {
    return <AuthTester onEnterApp={() => setShowAuthTester(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar onOpenTester={() => setShowAuthTester(true)} />
      <MainContent onOpenTester={() => setShowAuthTester(true)} />
      <footer className="mt-auto py-6 border-t border-slate-900 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-4">
          <span>PrintFlow 3D Hub • Đồng bộ đám mây Supabase hoặc Offline LocalStorage</span>
          <button
            onClick={() => setShowAuthTester(true)}
            className="text-indigo-400 hover:underline font-semibold"
          >
            Quay lại màn hình Kiểm Tra Supabase &amp; Đăng Nhập
          </button>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
