import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2,
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
  const { login } = useAuth();
  
  // Login form states — always start empty
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [inputUnlocked, setInputUnlocked] = useState(false);

  // Reset all fields whenever modal opens or closes so no previous user/owner credentials remain
  useEffect(() => {
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setLoading(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    setInputUnlocked(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCloseModal = () => {
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    onClose();
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await login(username, password);
    setLoading(false);

    if (res.success) {
      setUsername('');
      setPassword('');
      setShowPassword(false);
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || 'Login gagal.');
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
            type="button"
            onClick={handleCloseModal}
            className="absolute top-3.5 right-3.5 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-4 pt-1">
            <div 
              className="w-10 h-10 bg-amber-100 text-amber-900 rounded-xl flex items-center justify-center mx-auto mb-2 select-none"
              title="Panel Admin"
            >
              <ShieldCheck className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="font-serif-wedding text-xl sm:text-2xl font-bold text-stone-800">
              Panel Masuk Pengelola
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
              Masukkan <strong>Username</strong> dan <strong>Kata Sandi</strong> resmi untuk mengakses Dashboard.
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

          {/* Form */}
          <form onSubmit={handleManualLogin} autoComplete="off" className="space-y-3">
            {/* Hidden decoy inputs to prevent browser password manager from auto-filling owner credentials */}
            <input type="text" name="decoy_user" autoComplete="username" className="hidden" tabIndex={-1} readOnly />
            <input type="password" name="decoy_pass" autoComplete="current-password" className="hidden" tabIndex={-1} readOnly />

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Username atau Email Akun
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="wedding_manager_login_id"
                  required
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  readOnly={!inputUnlocked}
                  onFocus={() => setInputUnlocked(true)}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                  placeholder="Masukkan username atau email"
                  className="w-full pl-9 pr-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-800 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="wedding_manager_login_secret"
                  required
                  autoComplete="new-password"
                  readOnly={!inputUnlocked}
                  onFocus={() => setInputUnlocked(true)}
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
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2,
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
  const { login } = useAuth();
  
  // Login form states — always start empty
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [inputUnlocked, setInputUnlocked] = useState(false);

  // Reset all fields whenever modal opens or closes so no previous user/owner credentials remain
  useEffect(() => {
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setLoading(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    setInputUnlocked(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCloseModal = () => {
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    onClose();
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await login(username, password);
    setLoading(false);

    if (res.success) {
      setUsername('');
      setPassword('');
      setShowPassword(false);
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || 'Login gagal.');
    }
  };

  
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-4 pt-1">
            <div 
              className="w-10 h-10 bg-amber-100 text-amber-900 rounded-xl flex items-center justify-center mx-auto mb-2 select-none"
              title="Panel Admin"
            >
              <ShieldCheck className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="font-serif-wedding text-xl sm:text-2xl font-bold text-stone-800">
              Panel Masuk Pengelola
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
              Masukkan <strong>Username</strong> dan <strong>Kata Sandi</strong> resmi untuk mengakses Dashboard.
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

          {/* Form */}
          <form onSubmit={handleManualLogin} autoComplete="off" className="space-y-3">
            {/* Hidden decoy inputs to prevent browser password manager from auto-filling owner credentials */}
            <input type="text" name="decoy_user" autoComplete="username" className="hidden" tabIndex={-1} readOnly />
            <input type="password" name="decoy_pass" autoComplete="current-password" className="hidden" tabIndex={-1} readOnly />

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Username atau Email Akun
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="wedding_manager_login_id"
                  required
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  readOnly={!inputUnlocked}
                  onFocus={() => setInputUnlocked(true)}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                  placeholder="Masukkan username atau email"
                  className="w-full pl-9 pr-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-800 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="wedding_manager_login_secret"
                  required
                  autoComplete="new-password"
                  readOnly={!inputUnlocked}
                  onFocus={() => setInputUnlocked(true)}
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
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
