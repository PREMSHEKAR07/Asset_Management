import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Lock, Eye, EyeOff, LogIn, ShieldAlert, KeyRound, 
  Mail, ArrowLeft, CheckCircle2, RefreshCw, Sparkles, Check, X,
  UserPlus
} from 'lucide-react';
import { useAssetManager } from '../hooks/useAssetManager';
import QuadrantLogo from '../components/QuadrantLogo';
import loginBg from '../assets/login-bg.jpg';

const Login = () => {
  const { 
    loginUser, 
    requestPasswordResetOtp, 
    resetPasswordWithOtp, 
    requestSignUpOtp, 
    verifySignUpOtp, 
    signUpEmployee,
    getSignUpDepartments,
    showToast 
  } = useAssetManager();
  const navigate = useNavigate();

  // Background slideshow state
  const bgImages = [loginBg];
  const [activeBgIndex, setActiveBgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBgIndex((prev) => (prev + 1) % bgImages.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState('signin');

  // Sign-In Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Forgot Password modal/view states
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState('request'); // 'request' | 'reset' | 'success'
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPass, setShowForgotNewPass] = useState(false);
  const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sign-Up Form states
  const [signupStep, setSignupStep] = useState('request'); // 'request' | 'verify' | 'profile'
  const [signupEmpId, setSignupEmpId] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupOtp, setSignupOtp] = useState('');
  const [signupMaskedEmail, setSignupMaskedEmail] = useState('');
  const [signupName, setSignupName] = useState('');
  const [dbDepartments, setDbDepartments] = useState([]);
  const [signupDepartment, setSignupDepartment] = useState('');
  const [signupDesignation, setSignupDesignation] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupLocation, setSignupLocation] = useState('Hyderabad, India');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [showSignupConfirmPass, setShowSignupConfirmPass] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupCooldown, setSignupCooldown] = useState(0);

  // Fetch departments from database on mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const depts = await getSignUpDepartments();
        if (Array.isArray(depts) && depts.length > 0) {
          setDbDepartments(depts);
          setSignupDepartment((prev) => prev || depts[0]);
        }
      } catch (err) {
        console.error("Failed to load departments from DB:", err);
      }
    };
    loadDepartments();
  }, []);

  // Countdown timer for OTP resend (Forgot Password)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Countdown timer for OTP resend (Sign-Up)
  useEffect(() => {
    if (signupCooldown <= 0) return;
    const timer = setInterval(() => {
      setSignupCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [signupCooldown]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setErrorMsg('Email or username is required.');
      return;
    }

    if (!password) {
      setErrorMsg('Password is required.');
      return;
    }

    setIsLoggingIn(true);

    setTimeout(async () => {
      try {
        const result = await loginUser(trimmedUser, password);
        if (result.success) {
          if (result.user.role === 'Admin') {
            navigate('/');
          } else {
            navigate('/employee');
          }
        } else {
          setErrorMsg(result.message || 'Invalid credentials');
          setIsLoggingIn(false);
        }
      } catch (err) {
        setErrorMsg("Network error or server offline");
        setIsLoggingIn(false);
      }
    }, 600);
  };

  // Open Forgot Password Flow
  const openForgotPassword = () => {
    setForgotIdentifier(username.trim());
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
    setForgotStep('request');
    setIsForgotMode(true);
    setAuthMode('signin');
  };

  // Switch back to Login
  const closeForgotPassword = () => {
    setIsForgotMode(false);
    setForgotStep('request');
    setForgotError('');
  };

  // Step 1: Request Forgot Password OTP
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setForgotError('');

    const trimmed = forgotIdentifier.trim();
    if (!trimmed) {
      setForgotError('Please enter your work email, username, or Employee ID.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await requestPasswordResetOtp(trimmed);
      if (res.success) {
        setMaskedEmail(res.maskedEmail || 'your registered email');
        setForgotStep('reset');
        setResendCooldown(60); 
        if (showToast) showToast('Verification code sent to your Outlook email!', 'success');
      } else {
        setForgotError(res.message || 'Failed to send OTP code. Please check your identifier.');
      }
    } catch (err) {
      setForgotError(err.message || 'Server error occurred while requesting OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');

    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setForgotError('Please enter the valid 6-digit verification code.');
      return;
    }

    if (forgotNewPassword.length < 8) {
      setForgotError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(forgotNewPassword)) {
      setForgotError('Password must contain at least one uppercase letter (A-Z).');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>\_\-\+\=\[\]\\\/]/.test(forgotNewPassword)) {
      setForgotError('Password must contain at least one special character (!@#$%^&*...).');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match. Please re-enter both fields.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await resetPasswordWithOtp(forgotIdentifier.trim(), cleanOtp, forgotNewPassword);
      if (res.success) {
        setForgotStep('success');
        if (showToast) showToast('Password reset successfully! You can now log in.', 'success');
      } else {
        setForgotError(res.message || 'Failed to reset password. Check verification code.');
      }
    } catch (err) {
      setForgotError(err.message || 'Error occurred while resetting password.');
    } finally {
      setForgotLoading(false);
    }
  };

  // --- SIGN UP HANDLERS ---
  const openSignUp = () => {
    setAuthMode('signup');
    setIsForgotMode(false);
    setSignupStep('request');
    setSignupEmpId('');
    setSignupEmail('');
    setSignupOtp('');
    setSignupName('');
    setSignupDesignation('');
    setSignupPhone('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setShowSignupPass(false);
    setShowSignupConfirmPass(false);
    setSignupError('');
  };

  const openSignIn = () => {
    setAuthMode('signin');
    setIsForgotMode(false);
    setErrorMsg('');
  };

  // Sign-Up Step 1: Request OTP (Email Only)
  const handleSignUpRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setSignupError('');

    const cleanMail = signupEmail.trim().toLowerCase();

    if (!cleanMail) {
      setSignupError('Official work email is required.');
      return;
    }
    if (!cleanMail.endsWith('@quadrantitservices.com')) {
      setSignupError('Registration is restricted to company emails ending with @quadrantitservices.com');
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@quadrantitservices\.com$/;
    if (!emailRegex.test(cleanMail)) {
      setSignupError('Please enter a valid company email address (e.g. employee@quadrantitservices.com).');
      return;
    }

    setSignupLoading(true);
    try {
      const res = await requestSignUpOtp(cleanMail);
      if (res.success) {
        setSignupMaskedEmail(res.maskedEmail || cleanMail);
        setSignupStep('verify');
        setSignupCooldown(60);
        if (showToast) showToast('Verification code sent to your Outlook email!', 'success');
      } else {
        setSignupError(res.message || 'Failed to send OTP code. Please check your email.');
      }
    } catch (err) {
      setSignupError(err.message || 'Server error while requesting registration OTP.');
    } finally {
      setSignupLoading(false);
    }
  };

  // Sign-Up Step 2: Verify OTP
  const handleSignUpVerifyOtp = async (e) => {
    e.preventDefault();
    setSignupError('');

    const cleanOtp = signupOtp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setSignupError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setSignupLoading(true);
    try {
      const res = await verifySignUpOtp(signupEmail.trim().toLowerCase(), cleanOtp);
      if (res.success) {
        setSignupStep('profile');
        if (showToast) showToast('Email verified! Please complete your employee profile.', 'success');
      } else {
        setSignupError(res.message || 'Invalid or expired OTP code.');
      }
    } catch (err) {
      setSignupError(err.message || 'Error occurred while verifying OTP.');
    } finally {
      setSignupLoading(false);
    }
  };

  // Sign-Up Step 3: Complete Registration
  const handleSignUpComplete = async (e) => {
    e.preventDefault();
    setSignupError('');

    if (!signupName.trim()) {
      setSignupError('Full Name is required.');
      return;
    }
    if (signupPassword.length < 8) {
      setSignupError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(signupPassword)) {
      setSignupError('Password must contain at least one uppercase letter (A-Z).');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>\_\-\+\=\[\]\\\/]/.test(signupPassword)) {
      setSignupError('Password must contain at least one special character.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    setSignupLoading(true);
    try {
      const cleanEmpId = signupEmpId.trim().toUpperCase();
      const payload = {
        id: cleanEmpId || null,
        name: signupName.trim(),
        email: signupEmail.trim().toLowerCase(),
        otp: signupOtp.trim(),
        password: signupPassword,
        department: 'Unassigned',
        designation: 'Unassigned',
        phone: signupPhone.trim() || null,
        location: signupLocation.trim() || 'Hyderabad, India'
      };

      const res = await signUpEmployee(payload);
      if (res.success) {
        navigate('/employee');
      } else {
        setSignupError(res.message || 'Registration failed. Please check form details.');
      }
    } catch (err) {
      setSignupError(err.message || 'Server error occurred during registration.');
    } finally {
      setSignupLoading(false);
    }
  };

  // Validation flags for forgot password
  const hasMinLength = forgotNewPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(forgotNewPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>\_\-\+\=\[\]\\\/]/.test(forgotNewPassword);
  const isPassMatch = forgotNewPassword && forgotNewPassword === forgotConfirmPassword;

  return (
    <div className="min-h-screen flex flex-col justify-center lg:justify-start items-center lg:items-end p-4 lg:pr-72 lg:pt-8 relative overflow-hidden font-sans">
      {/* Background Slideshow Images */}
      {bgImages.map((src, index) => (
        <div
          key={index}
          className="absolute inset-0 bg-cover transition-opacity duration-1000 ease-in-out pointer-events-none"
          style={{
            backgroundImage: `url(${src})`,
            backgroundPosition: 'center bottom',
            opacity: activeBgIndex === index ? 1.0 : 0
          }}
        />
      ))}
      <div className="absolute inset-0 bg-white/10 z-0 pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md backdrop-blur-xl bg-white/85 border border-white/60 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-300/40 space-y-5 relative z-10 animate-fade-in transition-all duration-300">
        
        <div className="flex flex-col items-center space-y-2">
          <div className="shrink-0 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/60 p-0.5">
            <QuadrantLogo className="h-14 w-14 object-cover" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Quadrant IT Services</h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Asset Management Portal</p>
          </div>
        </div>

        {/* FORGOT PASSWORD MODE */}
        {isForgotMode ? (
          <div className="space-y-4 animate-fade-in">
            {forgotStep === 'request' && (
              <>
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center justify-center p-2.5 bg-blue-50 text-blue-600 rounded-2xl mb-1">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Forgot Password</h3>
                  <p className="text-xs text-slate-500 font-medium">Enter your registered work email, username, or Employee ID.</p>
                </div>

                {forgotError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-xs text-rose-600 animate-shake">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="font-semibold">{forgotError}</span>
                  </div>
                )}

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 text-slate-400 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      id="forgot-identifier"
                      name="identifier"
                      type="text"
                      autoFocus
                      autoComplete="username"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="e.g. employee@company.com"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-white rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-medium shadow-sm"
                    />
                  </div>
                  <button type="submit" disabled={forgotLoading} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-75">
                    {forgotLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <> <Mail className="h-4 w-4" /> Send Verification Code</>}
                  </button>
                  <button type="button" onClick={closeForgotPassword} className="w-full text-xs text-slate-500 hover:text-slate-700 font-semibold flex items-center justify-center gap-1">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                  </button>
                </form>
              </>
            )}

            {forgotStep === 'reset' && (
              <>
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center justify-center p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl mb-1">
                    <Lock className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Enter OTP & Set Password</h3>
                  <p className="text-xs text-slate-500 font-medium">We sent a 6-digit code to <span className="font-bold text-slate-700">{maskedEmail}</span></p>
                </div>

                {forgotError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-xs text-rose-600 animate-shake">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="font-semibold">{forgotError}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-3.5" autoComplete="off">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 text-slate-400 flex items-center pointer-events-none">
                      <KeyRound className="h-4 w-4" />
                    </span>
                    <input
                      id="forgot-otp"
                      name="otp"
                      type="text"
                      maxLength={6}
                      autoFocus
                      autoComplete="one-time-code"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-white rounded-2xl text-base tracking-widest font-mono text-center font-bold text-slate-800 placeholder-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all shadow-sm"
                    />
                  </div>
                  
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 text-slate-400 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      id="forgot-new-password"
                      name="newPassword"
                      type={showForgotNewPass ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-200 bg-white rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all font-medium shadow-sm"
                    />
                    <button type="button" onClick={() => setShowForgotNewPass(!showForgotNewPass)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600">
                      {showForgotNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 text-slate-400 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      id="forgot-confirm-password"
                      name="confirmPassword"
                      type={showForgotConfirmPass ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-200 bg-white rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all font-medium shadow-sm"
                    />
                    <button type="button" onClick={() => setShowForgotConfirmPass(!showForgotConfirmPass)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600">
                      {showForgotConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="p-2.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-1 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {hasMinLength ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {hasUppercase ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      <span>At least one uppercase letter (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {hasSpecialChar ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      <span>At least one special character (!@#$...)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${isPassMatch ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {isPassMatch ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      <span>Passwords match</span>
                    </div>
                  </div>

                  <button type="submit" disabled={forgotLoading} className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-75 mt-2">
                    {forgotLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4" /> Reset & Save Password</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotStep('request')}
                    className="w-full py-1 text-xs text-slate-500 hover:text-slate-700 font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Change Identifier / Back</span>
                  </button>
                </form>
              </>
            )}

            {forgotStep === 'success' && (
              <div className="text-center py-4 space-y-4">
                <div className="inline-flex items-center justify-center p-3 bg-emerald-50 text-emerald-600 rounded-3xl">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Password Changed!</h3>
                <button type="button" onClick={closeForgotPassword} className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-2xl">
                  Proceed to Sign In
                </button>
              </div>
            )}
          </div>
        ) : authMode === 'signup' ? (
          /* EMPLOYEE SIGN UP FORM */
          <div className="space-y-4 animate-fade-in">
            {signupStep === 'request' && (
              <>
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center justify-center p-2.5 bg-blue-50 text-blue-600 rounded-2xl mb-1">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Create Employee Account</h3>
                  <p className="text-xs text-slate-500 font-medium">Enter your official @quadrantitservices.com email to verify and sign up.</p>
                </div>
                {signupError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-xs text-rose-600 animate-shake">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="font-semibold">{signupError}</span>
                  </div>
                )}
                <form onSubmit={handleSignUpRequestOtp} className="space-y-3.5">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 text-slate-400 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      id="signup-email"
                      name="email"
                      type="email"
                      autoFocus
                      autoComplete="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="e.g. employee@quadrantitservices.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-white rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-medium shadow-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={signupLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-75"
                  >
                    {signupLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Sending OTP to Mail...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        <span>Send Verification Code</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={openSignIn}
                    className="w-full py-1 text-xs text-slate-500 hover:text-slate-700 font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Already have an account? Sign In</span>
                  </button>
                </form>
              </>
            )}
            {signupStep === 'verify' && (
              <>
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center justify-center p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl mb-1">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Verify Your Email</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    We sent a 6-digit code to <span className="font-bold text-slate-700">{signupMaskedEmail}</span>
                  </p>
                </div>
                {signupError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-xs text-rose-600 animate-shake">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="font-semibold">{signupError}</span>
                  </div>
                )}
                <form onSubmit={handleSignUpVerifyOtp} className="space-y-3.5">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 text-slate-400 flex items-center pointer-events-none">
                      <KeyRound className="h-4 w-4" />
                    </span>
                    <input
                      id="signup-otp"
                      name="otp"
                      type="text"
                      maxLength={6}
                      autoFocus
                      autoComplete="one-time-code"
                      value={signupOtp}
                      onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-white rounded-2xl text-base tracking-widest font-mono text-center font-bold text-slate-800 placeholder-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all shadow-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={signupLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-75"
                  >
                    {signupLoading ? 'Verifying...' : 'Verify & Continue'}
                  </button>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      disabled={signupCooldown > 0 || signupLoading}
                      onClick={handleSignUpRequestOtp}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold disabled:text-slate-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {signupCooldown > 0 ? `Resend code in ${signupCooldown}s` : 'Resend Code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupStep('request')}
                      className="text-xs text-slate-500 hover:text-slate-700 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Change Email</span>
                    </button>
                  </div>
                </form>
              </>
            )}
            {signupStep === 'profile' && (
              <form onSubmit={handleSignUpComplete} className="space-y-3 max-h-[58vh] overflow-y-auto pr-1">
                <div className="text-center space-y-0.5 mb-2">
                  <h3 className="text-sm font-bold text-slate-800">Complete Profile</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{signupEmail}</p>
                </div>
                {signupError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 flex items-start gap-1.5 animate-shake">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="font-semibold">{signupError}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    autoFocus
                    autoComplete="name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Full Name *"
                    className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-medium shadow-sm"
                  />
                  <input
                    id="signup-empid"
                    name="employeeId"
                    type="text"
                    value={signupEmpId}
                    onChange={(e) => setSignupEmpId(e.target.value.toUpperCase())}
                    placeholder="Employee ID (e.g. 1405)"
                    className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-medium shadow-sm uppercase font-mono"
                  />
                </div>
                
                {/* Create Password with Eye Toggle */}
                <div className="relative">
                  <input
                    id="signup-password"
                    name="signupPassword"
                    type={showSignupPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Create Password (min 8 chars, 1 uppercase, 1 special) *"
                    className="w-full pl-4 pr-10 py-2.5 border border-slate-200 bg-white rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-medium shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPass(!showSignupPass)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showSignupPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Confirm Password with Eye Toggle */}
                <div className="relative">
                  <input
                    id="signup-confirm-password"
                    name="signupConfirmPassword"
                    type={showSignupConfirmPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="Confirm Password *"
                    className="w-full pl-4 pr-10 py-2.5 border border-slate-200 bg-white rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-medium shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupConfirmPass(!showSignupConfirmPass)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showSignupConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-2xl shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-75 mt-1"
                >
                  {signupLoading ? 'Creating Account...' : 'Complete Sign Up'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* STANDARD LOGIN FORM */
          <>
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-600 animate-shake">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMsg}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <input type="text" style={{ display: 'none' }} tabIndex="-1" />
              <input type="password" style={{ display: 'none' }} tabIndex="-1" autoComplete="new-password" />
              <div className="space-y-1">
                <label htmlFor="login-username" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Email / Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 text-slate-400 flex items-center pointer-events-none"><User className="h-4 w-4" /></span>
                  <input
                    id="login-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Email or Username"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-white rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center pl-1 pr-1">
                  <label htmlFor="login-password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                  <button type="button" onClick={openForgotPassword} className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold hover:underline">Forgot Password?</button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 text-slate-400 flex items-center pointer-events-none"><Lock className="h-4 w-4" /></span>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-10 pr-10 py-3 border border-slate-200 bg-white rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/30"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <button type="submit" disabled={isLoggingIn} className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all mt-6 active:scale-95 disabled:opacity-80">
                {isLoggingIn ? <span>Signing in...</span> : <><LogIn className="h-4 w-4" /> Sign In</>}
              </button>
              <div className="pt-2 text-center border-t border-slate-100">
                <p className="text-xs text-slate-500">New employee? <button type="button" onClick={openSignUp} className="text-blue-600 hover:text-blue-700 font-bold hover:underline ml-1">Sign Up</button></p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
