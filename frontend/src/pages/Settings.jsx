import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Key, 
  Eye, 
  EyeOff, 
  Check, 
  LogIn, 
  Wrench, 
  Lock,
  ChevronRight,
  Globe,
  Bell,
  Clock,
  QrCode,
  CheckCircle,
  HelpCircle,
  FileText,
  Calendar,
  AlertTriangle,
  Camera,
  UploadCloud,
  Trash2
} from 'lucide-react';
import { useAssetManager } from '../hooks/useAssetManager';
import Avatar from '../components/Avatar';

const Settings = () => {
  const { currentUser, updateEmployee, changePassword, logActivity, showToast } = useAssetManager();
  const fileInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Profile Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('Admin');
  const [dept, setDept] = useState('IT');

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility state
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Dynamic validation checks for password requirements
  const isMinLength = newPassword.length >= 8;
  const isUppercase = /[A-Z]/.test(newPassword);
  const isSpecialChar = /[!@#$%^&*(),.?":{}|<>\_\-\+\=\[\]\\\/~`']/.test(newPassword);

  // Preference states (initialized from localStorage if saved)
  const [language, setLanguage] = useState(() => localStorage.getItem('pref_language') || 'English');
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem('pref_date_format') || 'DD MMM YYYY (10 Jul 2026)');
  const [timeZone, setTimeZone] = useState(() => localStorage.getItem('pref_timezone') || '(UTC+05:30) Asia/Kolkata');
  const [itemsPerPage, setItemsPerPage] = useState(() => localStorage.getItem('pref_items_per_page') || '10');

  // Populate profile form state dynamically from logged-in user context
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setUsername(currentUser.username || (currentUser.email ? currentUser.email.split('@')[0] : ''));
      setRole(currentUser.role || 'Admin');
      setDept(currentUser.department || 'IT');
    }
  }, [currentUser]);

  // Handle Profile Picture Upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB.', 'error');
      return;
    }

    setAvatarUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const maxDim = 320;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

          const success = await updateEmployee({
            ...currentUser,
            avatar: compressedBase64
          });

          if (success) {
            showToast('Profile picture updated successfully!', 'success');
            logActivity('Update Profile', 'Updated profile picture');
          }
          setAvatarUploading(false);
        };
      };
      reader.readAsDataURL(file);
    } catch (err) {
      showToast('Failed to process image. Please try again.', 'error');
      setAvatarUploading(false);
    }
  };

  // Handle Remove Profile Picture
  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    try {
      const success = await updateEmployee({
        ...currentUser,
        avatar: null
      });
      if (success) {
        showToast('Profile picture removed successfully!', 'success');
        logActivity('Update Profile', 'Removed profile picture');
      }
    } catch (err) {
      showToast('Failed to remove profile picture.', 'error');
    }
    setAvatarUploading(false);
  };

  // Handle Profile Information Submission
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser || !currentUser.id) {
      showToast("No active logged-in user session found.", "error");
      return;
    }

    try {
      const success = await updateEmployee({
        id: currentUser.id,
        name: fullName,
        email: email,
        phone: phone,
        username: username,
        role: role,
        department: dept,
        avatar: currentUser.avatar
      });

      if (success) {
        showToast("Profile information updated successfully!", "success");
        logActivity("Update Profile", `Updated profile information for ${fullName}`);
      }
    } catch (err) {
      showToast(err.message || "Failed to update profile", "error");
    }
  };

  // Handle Change Password Submission
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast("Please enter your current password.", "error");
      return;
    }
    if (!newPassword) {
      showToast("Please enter a new password.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New password and confirm password do not match.", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast("New password must be at least 8 characters long.", "error");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      showToast("New password must contain at least one uppercase letter.", "error");
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>\_\-\+\=\[\]\\\/]/.test(newPassword)) {
      showToast("New password must contain at least one special character.", "error");
      return;
    }

    const success = await changePassword(currentPassword, newPassword);
    if (success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      logActivity("Change Password", "Password changed successfully");
    }
  };

  // Handle User Preferences Save
  const handleSavePreferences = () => {
    localStorage.setItem('pref_language', language);
    localStorage.setItem('pref_date_format', dateFormat);
    localStorage.setItem('pref_timezone', timeZone);
    localStorage.setItem('pref_items_per_page', itemsPerPage);
    showToast("User preferences saved successfully!", "success");
    logActivity("Update Preferences", "Saved user display preferences");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Sub-header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Settings</h2>
        <p className="text-xs text-slate-400 mt-1">Manage your profile, preferences and system configuration.</p>
      </div>

      {/* Top forms: Profile Info & Change Password */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information (2/3 width) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Profile Information</h3>
          
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
              <div className="relative group">
                <Avatar 
                  name={fullName || currentUser?.name || 'Admin'} 
                  avatar={currentUser?.avatar} 
                  className="h-24 w-24 rounded-2xl border shadow-sm" 
                  textSize="text-2xl" 
                />
                
                {/* Floating Camera Upload Button */}
                <button
                  type="button"
                  disabled={avatarUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full shadow-lg border-2 border-white cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
                  title="Upload Profile Picture"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                />
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{fullName || currentUser?.name || 'Logged-in Admin'}</h4>
                  <p className="text-xs text-slate-400">{email || currentUser?.email || 'admin@company.com'} &bull; {role || currentUser?.role || 'Admin'}</p>
                </div>

                {/* Profile Picture Actions */}
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    disabled={avatarUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>{avatarUploading ? 'Updating...' : currentUser?.avatar ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>
                  {currentUser?.avatar && (
                    <button
                      type="button"
                      disabled={avatarUploading}
                      onClick={handleRemoveAvatar}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      title="Remove Profile Picture"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="block font-bold text-slate-400 uppercase tracking-wider">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block font-bold text-slate-400 uppercase tracking-wider">Role</label>
                <select 
                  value={role} 
                  onChange={e => setRole(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-slate-50"
                >
                  <option value="Admin">Admin</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block font-bold text-slate-400 uppercase tracking-wider">Department</label>
                <select 
                  value={dept} 
                  onChange={e => setDept(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-slate-50"
                >
                  <option value="IT">IT</option>
                  <option value="Finance">Finance</option>
                  <option value="HR">HR</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                type="submit" 
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* Change Password (1/3 width) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Change Password</h3>
          
          <form onSubmit={handleUpdatePassword} className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4 text-xs">
              <div className="space-y-1 relative">
                <label className="block font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
                <input 
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none" 
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 bottom-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="space-y-1 relative">
                <label className="block font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                <input 
                  type={showNew ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none" 
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 bottom-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="space-y-1 relative">
                <label className="block font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                <input 
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none" 
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 bottom-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements Info Banner */}
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-1 text-[11px] text-blue-900 leading-normal">
              <p className="font-bold flex items-center gap-1.5 text-blue-800">
                <HelpCircle className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>Password Requirements:</span>
              </p>
              <ul className="list-disc pl-5 text-[10px] font-medium space-y-0.5 transition-colors">
                <li className={`transition-colors duration-200 ${isMinLength ? 'text-green-600 font-semibold' : 'text-red-500'}`}>
                  At least 8 characters long
                </li>
                <li className={`transition-colors duration-200 ${isUppercase ? 'text-green-600 font-semibold' : 'text-red-500'}`}>
                  At least one uppercase letter (caps)
                </li>
                <li className={`transition-colors duration-200 ${isSpecialChar ? 'text-green-600 font-semibold' : 'text-red-500'}`}>
                  At least one special character
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Key className="h-4 w-4" />
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Middle Grid: User Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Preferences */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-2">Preferences</h3>
          
          <div className="space-y-4 text-xs">
            {/* Language */}
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-slate-50 rounded-xl text-slate-400 mt-0.5">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700">Language</h4>
                  <p className="text-[10px] text-slate-400">Select your preferred language</p>
                </div>
              </div>
              <select 
                value={language} 
                onChange={e => setLanguage(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-slate-700"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>

            {/* Date format */}
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-slate-50 rounded-xl text-slate-400 mt-0.5">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700">Date Format</h4>
                  <p className="text-[10px] text-slate-400">Choose the date format</p>
                </div>
              </div>
              <select 
                value={dateFormat} 
                onChange={e => setDateFormat(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-slate-700"
              >
                <option value="DD MMM YYYY (10 Jul 2026)">DD MMM YYYY (10 Jul 2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            {/* Timezone */}
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-slate-50 rounded-xl text-slate-400 mt-0.5">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700">Time Zone</h4>
                  <p className="text-[10px] text-slate-400">Select your time zone</p>
                </div>
              </div>
              <select 
                value={timeZone} 
                onChange={e => setTimeZone(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-slate-700 max-w-[180px]"
              >
                <option value="(UTC+05:30) Asia/Kolkata">(UTC+05:30) Asia/Kolkata</option>
                <option value="(UTC-05:00) EST">(UTC-05:00) Eastern Time</option>
                <option value="(UTC+00:00) GMT">(UTC+00:00) GMT</option>
              </select>
            </div>

            {/* Items per page */}
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-slate-50 rounded-xl text-slate-400 mt-0.5">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700">Items Per Page</h4>
                  <p className="text-[10px] text-slate-400">Select default number of items per page</p>
                </div>
              </div>
              <select 
                value={itemsPerPage} 
                onChange={e => setItemsPerPage(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-slate-700"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={handleSavePreferences}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Settings;
