import React from 'react';
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
import Toast from './components/Toast';

function MainContent() {
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

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
          <Navbar />
          <MainContent />
          <footer className="mt-auto py-6 border-t border-slate-900 text-center text-xs text-slate-400">
            <p>
              PrintFlow 3D Hub • Đồng bộ đám mây Supabase hoặc hoạt động Offline LocalStorage.
            </p>
          </footer>
        </div>
      </AppProvider>
    </AuthProvider>
  );
}

