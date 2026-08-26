import React, { useState, useEffect } from 'react';
import { X, QrCode, CheckCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [scanState, setScanState] = useState('scanning'); // scanning | success
  const [scannedAssetId, setScannedAssetId] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setScanState('scanning');
    setScannedAssetId('');

    // Simulate scanning for 3 seconds, then succeed
    const timer = setTimeout(() => {
      const mockIds = ["LT0001", "MS0001", "KB0001", "MN0001", "HD0001", "PR0001", "DT0001", "DS0001"];
      const randomId = mockIds[Math.floor(Math.random() * mockIds.length)];
      setScannedAssetId(randomId);
      setScanState('success');
      if (onScanSuccess) {
        onScanSuccess(randomId);
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Dark Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col items-center p-8 z-10"
        >
          {/* Close Trigger */}
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
          >
            <X className="h-5 w-5" />
          </button>

          {scanState === 'scanning' ? (
            <div className="flex flex-col items-center w-full">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl mb-4">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Scan QR / Barcode</h3>
              <p className="text-xs text-slate-500 text-center mt-1">
                Position the barcode inside the camera frame to scan.
              </p>

              {/* Scanning Target frame */}
              <div className="relative w-64 h-64 border-2 border-slate-300 rounded-3xl my-8 overflow-hidden flex items-center justify-center bg-slate-50">
                {/* Visual corners */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />

                {/* Blinking camera icon */}
                <QrCode className="h-20 w-20 text-slate-300 animate-pulse" />

                {/* Laser Line */}
                <motion.div 
                  animate={{ y: [-100, 100] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.8, 
                    ease: "easeInOut" 
                  }}
                  className="absolute w-56 h-1 bg-red-500 rounded shadow-[0_0_10px_#ef4444]"
                />
              </div>

              {/* Camera Scanning Status */}
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                <span>Simulating camera stream input...</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full text-center">
              <div className="p-3 bg-green-50 text-green-600 rounded-full mb-4">
                <CheckCircle className="h-12 w-12 animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Scan Successful!</h3>
              <p className="text-sm text-slate-500 mt-2">
                Successfully recognized barcode symbol for asset:
              </p>
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono font-bold text-lg text-blue-600 tracking-wider">
                {scannedAssetId}
              </div>

              <div className="mt-8 flex gap-3 w-full">
                <button 
                  onClick={() => setScanState('scanning')}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-sm text-slate-700 transition-all"
                >
                  Scan Another
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QRScannerModal;
