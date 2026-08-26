import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Phone,
  Briefcase,
  User as UserIcon,
  Calendar,
  MapPin,
  Pencil,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Save,
  X,
  CheckCircle,
  Shield,
  Info,
  Trash2,
  UploadCloud,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { useAssetManager } from '../hooks/useAssetManager';
import Avatar from '../components/Avatar';

const EmployeeSettings = () => {
  const navigate = useNavigate();
  const { currentUser, employees, departments, updateEmployee, changePassword, getSignUpDepartments, showToast, logoutUser } = useAssetManager();
  const fileInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Personal Information editing state
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [dept, setDept] = useState(currentUser?.department || '');
  const [designation, setDesignation] = useState(currentUser?.designation || '');
  const [employeeId, setEmployeeId] = useState(currentUser?.id || '');
  const [joiningDate, setJoiningDate] = useState(currentUser?.joiningDate || currentUser?.joining_date || '10 May 2024');
  const [location, setLocation] = useState(currentUser?.location || 'Hyderabad, India');
  const standardDepartments = ["IT", "HR", "Marketing", "Sales", "Finance"];
  const availableDepartments = Array.from(new Set([...standardDepartments, ...(departments || []), ...employees.map(e => e.department).filter(Boolean)]));
  const [customDept, setCustomDept] = useState('');

  // Sync inputs with session data when loaded
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || '');
      setUsername(currentUser.username || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      const userDept = currentUser.department === 'Unassigned' ? '' : (currentUser.department || '');
      const isKnown = availableDepartments.some(d => d.toLowerCase() === userDept.toLowerCase());
      const matched = isKnown ? (availableDepartments.find(d => d.toLowerCase() === userDept.toLowerCase()) || userDept) : 'Other';
      setDept(userDept ? (isKnown ? matched : 'Other') : (availableDepartments[0] || 'IT'));
      setCustomDept(isKnown ? '' : userDept);
      setDesignation(currentUser.designation === 'Unassigned' ? '' : (currentUser.designation || ''));
      setEmployeeId(currentUser.id || '');
      setJoiningDate(currentUser.joiningDate || currentUser.joining_date || '10 May 2024');
      setLocation(currentUser.location || 'Hyderabad, India');
    }
  }, [currentUser, departments]);

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
          // Compress and resize using canvas
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
    const success = await updateEmployee({
      ...currentUser,
      avatar: null
    });
    if (success) {
      showToast('Profile picture removed.', 'success');
    }
    setAvatarUploading(false);
  };

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Dynamic validation checks for password requirements
  const isMinLength = newPassword.length >= 8;
  const isUpperAndLower = /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword);
  const isNumberAndSpecial = /[0-9]/.test(newPassword) && /[!@#$%^&*(),.?":{}|<>\_\-\+\=\[\]\\\/~`']/.test(newPassword);

  // Redirect guard (must be after all hooks are declared)
  if (!currentUser) return null;

  const handleSaveChanges = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim()) {
      showToast("Name and Email are required fields.", "error");
      return;
    }

    const finalDept = dept === 'Other' ? (customDept.trim() || 'Other') : dept;

    const updatedInfo = {
      ...currentUser,
      id: employeeId.trim() || currentUser.id,
      name: fullName.trim(),
      username: username.trim(),
      email: email.trim(),
      phone: phone.trim(),
      department: finalDept,
      designation: designation,
      joiningDate: joiningDate.trim(),
      joining_date: joiningDate.trim(),
      location: location.trim()
    };

    const success = await updateEmployee(updatedInfo);
    if (success) {
      setIsEditing(false);
      showToast("Profile information updated successfully!", "success");
    }
  };

  const handleCancel = () => {
    // Reset to current user state
    setFullName(currentUser.name || '');
    setUsername(currentUser.username || '');
    setEmail(currentUser.email || '');
    setPhone(currentUser.phone || '');
    const userDept = currentUser.department === 'Unassigned' ? '' : (currentUser.department || '');
    const isKnown = availableDepartments.some(d => d.toLowerCase() === userDept.toLowerCase());
    const matched = isKnown ? (availableDepartments.find(d => d.toLowerCase() === userDept.toLowerCase()) || userDept) : 'Other';
    setDept(userDept ? (isKnown ? matched : 'Other') : (availableDepartments[0] || 'IT'));
    setCustomDept(isKnown ? '' : userDept);
    setDesignation(currentUser.designation === 'Unassigned' ? '' : (currentUser.designation || ''));
    setEmployeeId(currentUser.id || '');
    setJoiningDate(currentUser.joiningDate || currentUser.joining_date || '10 May 2024');
    setLocation(currentUser.location || 'Hyderabad, India');
    setIsEditing(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      showToast("Please enter your current password.", "error");
      return;
    }

    if (!isMinLength) {
      showToast("New password must be at least 8 characters long.", "error");
      return;
    }

    if (!isUpperAndLower) {
      showToast("New password must include uppercase and lowercase letters.", "error");
      return;
    }

    if (!isNumberAndSpecial) {
      showToast("New password must include at least one number and one special character.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }

    const success = await changePassword(currentPassword, newPassword);
    if (success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">

      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-400">
          <span
            onClick={() => navigate('/employee')}
            className="hover:text-slate-600 hover:underline cursor-pointer transition-colors"
            title="Go to Dashboard"
          >
            Home
          </span>
          <span className="mx-2">&gt;</span>
          <span className="text-slate-600 font-bold">Settings</span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/employee')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          title="Back to Dashboard"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: Profile Overview Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col items-center text-center space-y-5">
            <h3 className="text-xs font-bold text-slate-800 self-start">Profile Overview</h3>

            {/* Avatar wrapper with edit/upload controls */}
            <div className="relative group">
              <Avatar
                name={currentUser.name}
                avatar={currentUser.avatar}
                className="h-32 w-32 rounded-full border-4 border-slate-50 shadow-md animate-fade-in"
                textSize="text-3xl"
              />

              {/* Floating Camera Upload Button */}
              <button
                type="button"
                disabled={avatarUploading}
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full shadow-lg border-2 border-white cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
                title="Upload Profile Picture"
              >
                <Camera className="h-4 w-4" />
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

            {/* Profile Picture Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={avatarUploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>{avatarUploading ? 'Updating...' : currentUser.avatar ? 'Change Photo' : 'Upload Photo'}</span>
              </button>
              {currentUser.avatar && (
                <button
                  type="button"
                  disabled={avatarUploading}
                  onClick={handleRemoveAvatar}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  title="Remove Profile Picture"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-800">{currentUser.name}</h4>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{currentUser.designation || 'Employee'}</p>
            </div>

            {/* Profile fields details grid */}
            <div className="w-full pt-4 border-t border-slate-100 text-left space-y-3.5 text-xs text-slate-700">

              {/* Field 1: Email */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Email</p>
                  <p className="text-[11px] font-semibold text-slate-700 mt-0.5 truncate">{currentUser.email}</p>
                </div>
              </div>

              {/* Field 2: Phone */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Phone</p>
                  <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{currentUser.phone || '+91 98765 43210'}</p>
                </div>
              </div>

              {/* Field 3: Department */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Department</p>
                  <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{currentUser.department || 'Not Specified'}</p>
                </div>
              </div>

              {/* Field 4: Employee ID */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Employee ID</p>
                  <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{currentUser.id}</p>
                </div>
              </div>

              {/* Field 5: Joining Date */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Joining Date</p>
                  <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{currentUser.joiningDate || currentUser.joining_date || '10 May 2024'}</p>
                </div>
              </div>

              {/* Field 6: Location */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Location</p>
                  <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{currentUser.location || 'Hyderabad, India'}</p>
                </div>
              </div>

            </div>

            {/* Logout Panel at Bottom of Profile Overview */}
            <div className="w-full pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  logoutUser();
                  navigate('/login');
                }}
                className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-600 border border-rose-200/70 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
                title="Log Out of Portal"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Personal Information & Password Modification (Span 2) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Personal Information card */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800">Personal Information</h3>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-wide transition-all shadow-sm"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wide transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    className="flex items-center gap-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wide rounded-lg transition-all shadow-md shadow-blue-500/10"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              )}
            </div>

            {/* Input grid */}
            <form onSubmit={handleSaveChanges} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Full Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold ${isEditing
                    ? 'border-slate-300 text-slate-700 bg-white'
                    : 'border-slate-200 text-slate-500 bg-slate-50/50 cursor-not-allowed'
                    }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Username</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold ${isEditing
                    ? 'border-slate-300 text-slate-700 bg-white'
                    : 'border-slate-200 text-slate-500 bg-slate-50/50 cursor-not-allowed'
                    }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Email Address</label>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold ${isEditing
                    ? 'border-slate-300 text-slate-700 bg-white'
                    : 'border-slate-200 text-slate-500 bg-slate-50/50 cursor-not-allowed'
                    }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Phone Number</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold ${isEditing
                    ? 'border-slate-300 text-slate-700 bg-white'
                    : 'border-slate-200 text-slate-500 bg-slate-50/50 cursor-not-allowed'
                    }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Department</label>
                {isEditing ? (
                  <>
                    <select
                      value={dept}
                      onChange={e => setDept(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer"
                    >
                      {[...availableDepartments, "Other"].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    {dept === 'Other' && (
                      <input
                        type="text"
                        required
                        value={customDept}
                        onChange={e => setCustomDept(e.target.value)}
                        placeholder="Enter custom department name..."
                        className="w-full mt-2 p-2 border border-blue-200 bg-blue-50/30 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-blue-900 animate-fade-in"
                      />
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={currentUser?.department || 'Not Specified'}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 text-slate-500 font-semibold cursor-not-allowed"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Designation</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold ${isEditing
                    ? 'border-slate-300 text-slate-700 bg-white'
                    : 'border-slate-200 text-slate-500 bg-slate-50/50 cursor-not-allowed'
                    }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Employee ID</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  placeholder="e.g. QEMP001"
                  className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold ${isEditing
                    ? 'border-slate-300 text-slate-700 bg-white'
                    : 'border-slate-200 text-slate-500 bg-slate-50/50 cursor-not-allowed'
                    }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Joining Date</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={joiningDate}
                  onChange={e => setJoiningDate(e.target.value)}
                  placeholder="e.g. 24 Aug 2026"
                  className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold ${isEditing
                    ? 'border-slate-300 text-slate-700 bg-white'
                    : 'border-slate-200 text-slate-500 bg-slate-50/50 cursor-not-allowed'
                    }`}
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Location</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold ${isEditing
                    ? 'border-slate-300 text-slate-700 bg-white'
                    : 'border-slate-200 text-slate-500 bg-slate-50/50 cursor-not-allowed'
                    }`}
                />
              </div>

            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Shield className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-800">Change Password</h3>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full p-2.5 pr-9 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-700 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-slate-650"
                    >
                      {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full p-2.5 pr-9 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-700 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-slate-650"
                    >
                      {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full p-2.5 pr-9 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-700 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-slate-650"
                    >
                      {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

              </div>

              {/* Password Requirement Checklist Banner */}
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-2 text-[11px] text-blue-900 leading-normal">
                <p className="font-bold flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Password Requirements:</span>
                </p>
                <ul className="list-disc pl-5 text-[10px] font-semibold space-y-0.5 transition-colors">
                  <li className={`transition-colors duration-200 ${isMinLength ? 'text-emerald-600' : 'text-red-500'}`}>
                    At least 8 characters long
                  </li>
                  <li className={`transition-colors duration-200 ${isUpperAndLower ? 'text-emerald-600' : 'text-red-500'}`}>
                    Include uppercase and lowercase letters
                  </li>
                  <li className={`transition-colors duration-200 ${isNumberAndSpecial ? 'text-emerald-600' : 'text-red-500'}`}>
                    Include at least one number and one special character
                  </li>
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/10"
                >
                  <Lock className="h-4 w-4" />
                  <span>Update Password</span>
                </button>
              </div>

            </form>
          </div>

        </div>

      </div>

    </div>
  );
};

export default EmployeeSettings;
