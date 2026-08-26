import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import QRScannerModal from '../components/QRScannerModal';
import { useAssetManager } from '../hooks/useAssetManager';
import { CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react';
import logoImg from '../assets/logo.png';

const DashboardLayout = () => {
  const { currentUser, toast, hideToast } = useAssetManager();
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleScanSuccess = (assetId) => {
    console.log("QR Code read asset ID:", assetId);
  };

  const isEmployee = currentUser?.role === 'Employee';

  return (
    <div className="flex bg-[#f4f1ee] min-h-screen font-sans relative overflow-hidden">
      {/* Light transparent watermark centered in background across all pages */}
      <div className={`fixed inset-0 pointer-events-none opacity-[0.12] z-0 select-none flex items-center justify-center ${isEmployee ? '' : 'translate-x-16 md:translate-x-32'}`}>
        <img src={logoImg} alt="Watermark Background Logo" className="w-[500px] h-[500px] md:w-[700px] md:h-[700px] object-contain" />
      </div>

      {/* Left Sidebar */}
      {!isEmployee && (
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-40">
        {/* Top Header */}
        <Header />

        {/* Inner Scrollable Page Views */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>

          {/* Footer matches mockup */}
          <footer className="max-w-7xl mx-auto mt-8 pb-6 text-center text-xs text-slate-400 font-semibold">
            &copy; 2026 Quadrant IT Services. All rights reserved.
          </footer>
        </main>
      </div>

      {/* Scanning Dialog Overlay */}
      <QRScannerModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Custom Toast Notification Overlay */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-4 min-w-[320px] max-w-sm animate-slide-in-right">
          <div className={`p-2 rounded-xl shrink-0 ${toast.type === 'error' ? 'bg-red-50 text-red-600' :
            toast.type === 'warning' ? 'bg-amber-50 text-amber-600' :
              'bg-green-50 text-green-600'
            }`}>
            {toast.type === 'error' ? <AlertCircle className="h-5 w-5" /> :
              toast.type === 'warning' ? <AlertTriangle className="h-5 w-5" /> :
                <CheckCircle className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
              {toast.type === 'error' ? 'Error' : toast.type === 'warning' ? 'Warning' : 'Success'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 font-semibold leading-relaxed">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={hideToast}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 -mr-1"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
