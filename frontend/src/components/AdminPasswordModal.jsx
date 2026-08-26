import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, X } from 'lucide-react';
import { useAssetManager } from '../hooks/useAssetManager';

const AdminPasswordModal = ({ isOpen, onClose, onSuccess, title = "Admin Verification Required", actionLabel = "Confirm Action" }) => {
  const { currentUser, verifyAdminPassword } = useAssetManager();
  const [adminPassword, setAdminPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!adminPassword) {
      setErrorMsg('Please enter your admin password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const isValid = await verifyAdminPassword(adminPassword);
      if (isValid) {
        setAdminPassword('');
        setErrorMsg('');
        onSuccess();
      } else {
        setErrorMsg('Incorrect admin password. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Incorrect admin password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-5 relative">
        <button
          onClick={() => {
            setAdminPassword('');
            setErrorMsg('');
            onClose();
          }}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-xl hover:bg-slate-100 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Enter admin password for <span className="font-bold text-slate-700">{currentUser?.name || 'Admin'}</span> to complete <span className="font-bold text-blue-600">{actionLabel}</span>.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Admin Password *</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                autoFocus
                required
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                placeholder="Enter admin password..."
                className="w-full pl-3 pr-10 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setAdminPassword('');
                setErrorMsg('');
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Verifying...' : 'Confirm & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPasswordModal;
