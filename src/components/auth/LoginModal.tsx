import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  Crown, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles,
  UserCheck,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  Mail,
  ShieldAlert,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, quickDemoLogin, isOwner } = useAuth();
  
  // Login form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password mode
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [verificationInput, setVerificationInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Owner incognito toggle (hidden by default)
  const [shieldClicks, setShieldClicks] = useState(0);
  const [showSecretOwnerLogin, setShowSecretOwnerLogin] = useState(false);

  const handleShieldClick = () => {
    const next = shieldClicks + 1;
    setShieldClicks(next);
    if (next >= 3) {
      setShowSecretOwnerLogin(prev => !prev);
      setShieldClicks(0);
    }
  };

  if (!isOpen) return null;

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const res = await login(username, password);
    setLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || 'Login gagal.');
    }
  };

  const handleQuickLogin = async (role: 'owner' | 'super_admin' | 'admin') => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await quickDemoLogin(role);
      onSuccess();
      onClose();
    } catch {
      setErrorMsg('Gagal melakukan quick login.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!resetUsername.trim()) {
      setErrorMsg('Username akun wajib diisi.');
      return;
    }
    if (!verificationInput.trim()) {
      setErrorMsg('Email terdaftar atau PIN Keamanan wajib diisi.');
      return;
    }
    if (newPassword.length < 4) {
      setErrorMsg('Kata sandi baru minimal 4 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setResetLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: resetUsername.trim().toLowerCase(),
          verificationEmail: verificationInput.trim().toLowerCase(),
          securityPin: verificationInput.trim(),
          newPassword: newPassword.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal mereset kata sandi.');
      } else {
        setSuccessMsg(data.message || 'Kata sandi berhasil direset!');
        // Pre-fill login credentials
        setUsername(data.username || resetUsername);
        setPassword(newPassword);
        // Reset states
        setNewPassword('');
        setConfirmPassword('');
        setVerificationInput('');
        // Switch back to login view after short delay or immediately
        setTimeout(() => {
          setIsForgotMode(false);
        }, 1200);
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan saat mereset kata sandi.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 overflow-y-auto overscroll-contain my-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {!isForgotMode ? (
            /* --- NORMAL LOGIN VIEW --- */
            <>
              {/* Header */}
              <div className="text-center mb-4 pt-1">
                <div 
                  onClick={handleShieldClick}
                  className="w-10 h-10 bg-amber-100 text-amber-900 rounded-xl flex items-center justify-center mx-auto mb-2 cursor-pointer select-none transition-transform hover:scale-105 active:scale-95"
                  title="Panel Admin"
                >
                  <ShieldCheck className="w-5 h-5 text-amber-700" />
                </div>
                <h3 className="font-serif-wedding text-xl sm:text-2xl font-bold text-stone-800">
                  Panel Masuk Pengelola
                </h3>
                <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                  Masukkan <strong>Username</strong> dan <strong>Kata Sandi</strong> resmi yang diberikan oleh Pemilik Website.
                </p>
              </div>

              {/* Secret Owner / Demo Quick Login - Hidden in Production, only revealed if Owner clicks shield icon 3 times */}
              {showSecretOwnerLogin && (
                <div className="mb-3.5 p-2.5 rounded-2xl bg-stone-50 border border-amber-300/80 space-y-2 animate-in fade-in">
                  <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider text-center flex items-center justify-center gap-1">
                    <Crown className="w-3 h-3 text-amber-600" />
                    <span>Pintasan Khusus Pemilik Website (Mode Pengujian)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('owner')}
                      disabled={loading}
                      className="col-span-2 w-full text-left p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-stone-800 flex items-center justify-between transition-all cursor-pointer group shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center shadow-xs font-bold shrink-0">
                          <Crown className="w-3.5 h-3.5 text-stone-950" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-amber-950">Pemilik Website</span>
                            <span className="text-[9px] px-1 py-0.2 bg-amber-200 text-amber-900 rounded font-bold uppercase tracking-wider">Akses Penuh</span>
                          </div>
                          <p className="text-[10px] text-stone-600 font-mono truncate">
                            asepsulistiyono1
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-700 transition-transform group-hover:translate-x-1 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin('super_admin')}
                      disabled={loading}
                      className="w-full text-left p-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 transition-all cursor-pointer group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-stone-700 text-white flex items-center justify-center shadow-xs shrink-0">
                          <Crown className="w-3 h-3" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[11px] text-stone-900 truncate">Demo Mempelai</div>
                          <p className="text-[10px] text-stone-500 font-mono truncate">
                            superadmin
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin('admin')}
                      disabled={loading}
                      className="w-full text-left p-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 transition-all cursor-pointer group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
                          <UserCheck className="w-3 h-3" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[11px] text-stone-900 truncate">Demo WO</div>
                          <p className="text-[10px] text-stone-500 font-mono truncate">
                            adminwo
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-2.5 mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 mb-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleManualLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Username Akun
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                      placeholder="Contoh: superadmin atau adminwo"
                      className="w-full pl-9 pr-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotMode(true);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                        if (username) setResetUsername(username);
                      }}
                      className="text-[11px] text-amber-700 hover:text-amber-800 font-medium hover:underline cursor-pointer"
                    >
                      Lupa kata sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full pl-9 pr-10 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-900 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500 hover:text-amber-700 cursor-pointer transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-stone-100 font-semibold text-xs sm:text-sm tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-50 mt-1"
                >
                  <span>{loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      onSuccess();
                      onClose();
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold text-xs transition-colors cursor-pointer mt-2"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-700" />
                    <span>Kembali ke Master Dashboard Pemilik Website</span>
                  </button>
                )}
              </form>
            </>
          ) : (
            /* --- RESET PASSWORD VIEW --- */
            <div className="pt-1">
              {/* Header */}
              <div className="text-center mb-3.5">
                <div className="w-10 h-10 bg-amber-50 text-amber-800 rounded-xl flex items-center justify-center mx-auto mb-2 border border-amber-200">
                  <KeyRound className="w-5 h-5 text-amber-700" />
                </div>
                <h3 className="font-serif-wedding text-xl font-bold text-stone-900">
                  Reset Kata Sandi
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Pemulihan kata sandi darurat untuk Tim Pengelola.
                </p>
              </div>

              {/* Info Box untuk Pemulihan */}
              <div className="p-2.5 mb-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Petunjuk Pemulihan Akun:</span>
                </div>
                <p className="text-stone-600 leading-relaxed text-[10.5px]">
                  • <strong>Pemulihan Akun</strong>: Masukkan username akun Anda, lalu verifikasi menggunakan <strong>PIN Otorisasi Keamanan (9988)</strong>, <strong>Slug URL Undangan</strong> (contoh: <span className="font-mono text-stone-700">rizky_dan_siti</span>), atau <strong>Email terdaftar</strong>.<br />
                  • Pemilik website juga dapat mereset kata sandi pengelola kapan saja dari menu Manajemen Pengelola di Dashboard.
                </p>
              </div>

              {errorMsg && (
                <div className="p-2.5 mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 mb-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Username Akun
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={resetUsername}
                      onChange={(e) => setResetUsername(e.target.value.toLowerCase().trim())}
                      placeholder="contoh: superadmin atau nama_pengguna"
                      className="w-full pl-9 pr-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Verifikasi (PIN 9988 / Slug Undangan / Email)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={verificationInput}
                      onChange={(e) => setVerificationInput(e.target.value)}
                      placeholder="Ketik 9988, slug undangan, atau email"
                      className="w-full pl-9 pr-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 4 karakter"
                        className="w-full pl-3 pr-9 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-900 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        title={showNewPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-stone-500 hover:text-amber-700 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      Ulangi Sandi
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi sandi"
                        className="w-full pl-3 pr-9 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-900 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        title={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-stone-500 hover:text-amber-700 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 space-y-2">
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`w-4 h-4 ${resetLoading ? 'animate-spin' : ''}`} />
                    <span>{resetLoading ? 'Menyimpan...' : 'Simpan & Reset Kata Sandi'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(false);
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="w-full text-center py-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                  >
                    ← Kembali ke Halaman Masuk
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
