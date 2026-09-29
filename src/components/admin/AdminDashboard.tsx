import React, { useState } from 'react';
import { 
  Users, 
  MessageSquareHeart, 
  QrCode, 
  Settings, 
  ShieldCheck, 
  Crown, 
  LogOut, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Clock, 
  LayoutDashboard, 
  UserCheck, 
  ArrowLeft,
  Sparkles,
  Radio,
  Images,
  Database,
  Palette
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { GuestManagementTab } from './GuestManagementTab.tsx';
import { WishesManagementTab } from './WishesManagementTab.tsx';
import { ReceptionCheckinTab } from './ReceptionCheckinTab.tsx';
import { SettingsTab } from './SettingsTab.tsx';
import { AdminUsersTab } from './AdminUsersTab.tsx';
import { GalleryManagementTab } from './GalleryManagementTab.tsx';
import { DatabaseSettingsTab } from './DatabaseSettingsTab.tsx';
import { ThemeTemplatesTab } from './ThemeTemplatesTab.tsx';
import { GuestQrModal } from '../invitation/GuestQrModal.tsx';
import type { Guest } from '../../types.ts';
import { getThemeById } from '../../utils/themeTemplates.ts';

interface AdminDashboardProps {
  onBackToInvitation: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToInvitation }) => {
  const { user, isAuthenticated, isSuperAdmin, isOwner, logout } = useAuth();
  const { 
    guests, 
    wishes, 
    settings, 
    onlineCount, 
    isConnected, 
    refreshAll 
  } = useRealtime();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'themes' | 'guests' | 'checkin' | 'wishes' | 'gallery' | 'settings' | 'users' | 'database'
  >(() => isOwner ? 'users' : 'overview');

  const currentActiveTheme = getThemeById(settings?.themeTemplateId);

  const [selectedQrGuest, setSelectedQrGuest] = useState<Guest | null>(null);

  // Tab database eksklusif hanya untuk pemilik website
  React.useEffect(() => {
    if (activeTab === 'database' && !isOwner) {
      setActiveTab('overview');
    }
    if ((activeTab === 'themes' || activeTab === 'settings' || activeTab === 'users') && !isSuperAdmin && !isOwner) {
      setActiveTab('overview');
    }
  }, [activeTab, isOwner, isSuperAdmin]);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      refreshAll();
    }
  }, [isAuthenticated, user?.id, user?.weddingSlug, refreshAll]);

  if (!isAuthenticated || !user) {
    return null;
  }

  // Computed summary metrics
  const coupleTitle =
    settings && (isOwner || !user.weddingSlug || settings.slug === user.weddingSlug)
      ? settings.coupleNames || `${settings.groom.nickname} & ${settings.bride.nickname}`
      : user.coupleNames || 'Rizky & Siti';
  const totalGuests = guests.length;
  const attendingGuests = guests.filter((g: Guest) => g.rsvpStatus === 'attending');
  const notAttendingGuests = guests.filter((g: Guest) => g.rsvpStatus === 'not_attending');
  const tentativeGuests = guests.filter((g: Guest) => g.rsvpStatus === 'tentative');
  const unconfirmedGuests = guests.filter((g: Guest) => g.rsvpStatus === 'unconfirmed');

  const totalPaxConfirmed = attendingGuests.reduce(
    (sum: number, g: Guest) => sum + (g.paxConfirmed || g.paxAllocated || 1),
    0
  );

  const checkedInGuests = guests.filter((g: Guest) => g.checkedIn);
  const totalPaxPresent = checkedInGuests.reduce(
    (sum: number, g: Guest) => sum + (g.paxConfirmed || g.paxAllocated || 1),
    0
  );

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-stone-900 pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onBackToInvitation}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 text-xs cursor-pointer shadow-sm border border-amber-400/50 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="text-white">Buka Undangan</span>
            </button>

            <div className="h-6 w-px bg-stone-700 mx-0.5 hidden sm:block" />

            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif-wedding text-lg sm:text-xl font-bold text-amber-200">
                  {isOwner ? 'Platform Master Undangan' : coupleTitle}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  {isOwner ? (
                    <>
                      <Crown className="w-3 h-3 text-amber-400" />
                      <span>Pemilik Website</span>
                    </>
                  ) : isSuperAdmin ? (
                    <>
                      <Crown className="w-3 h-3 text-amber-400" />
                      <span>Super Admin</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3 h-3" />
                      <span>Admin WO</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right Live Info & User info */}
          <div className="flex items-center gap-3">
            {/* Live Indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-stone-800 rounded-full text-xs border border-stone-700">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-stone-300">WebSocket:</span>
              <strong className="text-amber-300">{onlineCount} Online</strong>
            </div>

            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-1.5">
                <p className="text-xs font-semibold text-stone-200">{user?.name}</p>
                {isOwner && (
                  <span className="text-[9px] px-1.5 py-0.2 bg-amber-400/25 text-amber-300 rounded font-bold uppercase tracking-wider border border-amber-400/40">
                    Owner
                  </span>
                )}
              </div>
              <p className="text-[10px] text-amber-400 font-mono font-medium">{user?.username ? `@${user.username}` : user?.email}</p>
            </div>

            <button
              onClick={logout}
              title="Keluar"
              className="p-2 text-stone-400 hover:text-rose-400 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-stone-800/80 overflow-x-auto">
          <div className="flex items-center space-x-1 py-1">
            {isOwner ? (
              <>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'users'
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Crown className="w-4 h-4 text-amber-900" />
                  <span>Master Super Admin (Ribuan Mempelai)</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/20 text-stone-900 font-bold uppercase tracking-wider">
                    Utama
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Monitoring Platform</span>
                </button>

                <button
                  onClick={() => setActiveTab('guests')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'guests'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Buku Tamu Template ({guests.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('checkin')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'checkin'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Meja Resepsi (Check-In)</span>
                </button>

                <button
                  onClick={() => setActiveTab('wishes')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'wishes'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <MessageSquareHeart className="w-4 h-4" />
                  <span>Moderasi Ucapan ({wishes.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('gallery')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'gallery'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Images className="w-4 h-4" />
                  <span>Galeri Foto</span>
                </button>

                <button
                  onClick={() => setActiveTab('themes')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'themes'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  <span>Tema Desain (12)</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Pengaturan Acara</span>
                </button>

                <button
                  onClick={() => setActiveTab('database')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'database'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>Database &amp; Supabase</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold uppercase tracking-wider border border-amber-400/30">
                    Pemilik
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Ringkasan Acara</span>
                </button>

                <button
                  onClick={() => setActiveTab('guests')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'guests'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Buku Tamu ({guests.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('checkin')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'checkin'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Meja Resepsi (Check-In)</span>
                </button>

                <button
                  onClick={() => setActiveTab('wishes')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'wishes'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <MessageSquareHeart className="w-4 h-4" />
                  <span>Moderasi Ucapan ({wishes.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('gallery')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'gallery'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Images className="w-4 h-4" />
                  <span>Galeri Foto ({settings?.galleries?.length || 0})</span>
                </button>

                {isSuperAdmin && (
                  <>
                    <button
                      onClick={() => setActiveTab('themes')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                        activeTab === 'themes'
                          ? 'bg-amber-500 text-stone-950 font-bold'
                          : 'text-stone-300 hover:text-white hover:bg-stone-800'
                      }`}
                    >
                      <Palette className="w-4 h-4 text-amber-300" />
                      <span>Tema Desain (12)</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                        activeTab === 'settings'
                          ? 'bg-amber-500 text-stone-950 font-bold'
                          : 'text-stone-300 hover:text-white hover:bg-stone-800'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Pengaturan Acara</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('users')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                        activeTab === 'users'
                          ? 'bg-amber-500 text-stone-950 font-bold'
                          : 'text-stone-300 hover:text-white hover:bg-stone-800'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Tim Staf WO</span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Top Banner */}
            {isOwner ? (
              <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-amber-500/20">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pusat Kendali Pemilik Website</span>
                    </span>
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30 font-semibold">
                      Multi-Tenant Engine
                    </span>
                  </div>
                  <h2 className="font-serif-wedding text-2xl sm:text-4xl font-bold mt-2 text-white">
                    Platform Master Pengelola Undangan
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-300 mt-2 max-w-2xl leading-relaxed">
                    Anda berkuasa penuh mengelola ribuan akun Super Admin (Klien Mempelai). Setiap Super Admin hanya berhak mengelola 1 URL undangan pernikahan mereka sendiri.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => setActiveTab('users')}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs tracking-wide transition-colors flex items-center gap-2 cursor-pointer shadow-md border border-amber-400/40"
                  >
                    <Crown className="w-4 h-4 text-white" />
                    <span className="text-white">Kelola Klien Super Admin</span>
                  </button>
                  <button
                    onClick={onBackToInvitation}
                    className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer border border-stone-600"
                  >
                    <span className="text-white">Buka Undangan</span>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
                    Dashboard Operasional
                  </span>
                  <h2 className="font-serif-wedding text-3xl sm:text-4xl font-bold mt-1">
                    Wedding of {coupleTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-300 mt-2 max-w-xl">
                    Pantau reservasi tamu, tingkat kehadiran fisik di meja resepsi, serta moderasi ucapan selamat secara real-time via WebSocket.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onBackToInvitation}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs tracking-wide transition-colors flex items-center gap-2 cursor-pointer shadow-md border border-amber-400/50"
                  >
                    <span className="text-white">Buka Undangan Publik</span>
                    <ExternalLink className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            )}

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
                <div className="flex items-center justify-between text-stone-500 mb-2">
                  <span className="text-xs font-medium">Total Undangan</span>
                  <Users className="w-4 h-4 text-amber-700" />
                </div>
                <h3 className="text-3xl font-bold text-stone-900">{totalGuests}</h3>
                <p className="text-[11px] text-stone-400 mt-1">Tamu Terdaftar</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
                <div className="flex items-center justify-between text-emerald-600 mb-2">
                  <span className="text-xs font-medium">Konfirmasi Hadir</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-3xl font-bold text-emerald-800">{attendingGuests.length}</h3>
                <p className="text-[11px] text-emerald-600/80 mt-1">
                  Estimasi: {totalPaxConfirmed} Pax
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
                <div className="flex items-center justify-between text-stone-500 mb-2">
                  <span className="text-xs font-medium">Hadir di Lokasi</span>
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-3xl font-bold text-stone-900">
                  {checkedInGuests.length} <span className="text-sm font-normal text-stone-400">({totalPaxPresent} Pax)</span>
                </h3>
                <p className="text-[11px] text-stone-400 mt-1">
                  {totalGuests > 0 ? Math.round((checkedInGuests.length / totalGuests) * 100) : 0}% Tingkat Check-In
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
                <div className="flex items-center justify-between text-stone-500 mb-2">
                  <span className="text-xs font-medium">Ucapan Masuk</span>
                  <MessageSquareHeart className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="text-3xl font-bold text-stone-900">{wishes.length}</h3>
                <p className="text-[11px] text-stone-400 mt-1">
                  {onlineCount} Tamu Online Saat Ini
                </p>
              </div>
            </div>

            {/* RSVP Breakdown Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs">
              <h3 className="font-serif-wedding text-xl font-bold text-stone-800 mb-6">
                Status RSVP Tamu Undangan
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Hadir ({attendingGuests.length})</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-950">
                    {totalGuests > 0 ? Math.round((attendingGuests.length / totalGuests) * 100) : 0}%
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    {totalPaxConfirmed} Orang akan datang
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase mb-1">
                    <XCircle className="w-4 h-4" />
                    <span>Tidak Hadir ({notAttendingGuests.length})</span>
                  </div>
                  <p className="text-2xl font-bold text-rose-950">
                    {totalGuests > 0 ? Math.round((notAttendingGuests.length / totalGuests) * 100) : 0}%
                  </p>
                  <p className="text-[11px] text-rose-700 mt-1">Mengirim doa restu</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase mb-1">
                    <HelpCircle className="w-4 h-4" />
                    <span>Masih Ragu ({tentativeGuests.length})</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-950">
                    {totalGuests > 0 ? Math.round((tentativeGuests.length / totalGuests) * 100) : 0}%
                  </p>
                  <p className="text-[11px] text-amber-700 mt-1">Menunggu kepastian</p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center gap-2 text-stone-600 font-bold text-xs uppercase mb-1">
                    <Clock className="w-4 h-4" />
                    <span>Belum Konfirmasi ({unconfirmedGuests.length})</span>
                  </div>
                  <p className="text-2xl font-bold text-stone-800">
                    {totalGuests > 0 ? Math.round((unconfirmedGuests.length / totalGuests) * 100) : 0}%
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">Belum membuka link / mengisi</p>
                </div>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isSuperAdmin && (
                <div
                  onClick={() => setActiveTab('themes')}
                  className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs hover:border-amber-500 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Palette className="w-5 h-5 text-amber-800" />
                    </div>
                    <span className="text-[11px] font-semibold text-amber-800">
                      12 Template
                    </span>
                  </div>
                  <h4 className="font-serif-wedding text-lg font-bold text-stone-900 mb-1">
                    Tema Desain Website
                  </h4>
                  <p className="text-xs text-stone-500">
                    Aktif: <strong>{currentActiveTheme.name}</strong>. Pilih dari 12 tema warna &amp; gaya undangan.
                  </p>
                </div>
              )}

              <div 
                onClick={() => setActiveTab('guests')}
                className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs hover:border-amber-400 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5 text-amber-700" />
                </div>
                <h4 className="font-serif-wedding text-lg font-bold text-stone-900 mb-1">
                  Kelola Buku Tamu
                </h4>
                <p className="text-xs text-stone-500">
                  Tambah data undangan, atur kuota pax, salin tautan personal tamu, dan bagikan ke WhatsApp.
                </p>
              </div>

              <div 
                onClick={() => setActiveTab('checkin')}
                className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs hover:border-emerald-400 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <QrCode className="w-5 h-5 text-emerald-700" />
                </div>
                <h4 className="font-serif-wedding text-lg font-bold text-stone-900 mb-1">
                  Mode Meja Resepsi
                </h4>
                <p className="text-xs text-stone-500">
                  Pindai QR Pass tamu atau cari nama seketika saat tamu hadir di gedung resepsi.
                </p>
              </div>

              <div 
                onClick={() => setActiveTab('wishes')}
                className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs hover:border-rose-400 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquareHeart className="w-5 h-5 text-rose-600" />
                </div>
                <h4 className="font-serif-wedding text-lg font-bold text-stone-900 mb-1">
                  Moderasi Ucapan
                </h4>
                <p className="text-xs text-stone-500">
                  Sematkan (pin) ucapan penting di atas, balas ucapan atas nama mempelai, atau sembunyikan pesan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* GUESTS TAB */}
        {activeTab === 'guests' && (
          <GuestManagementTab
            guests={guests}
            onRefresh={refreshAll}
            onOpenQr={(g) => setSelectedQrGuest(g)}
          />
        )}

        {/* CHECKIN TAB */}
        {activeTab === 'checkin' && (
          <ReceptionCheckinTab
            guests={guests}
            onRefresh={refreshAll}
          />
        )}

        {/* WISHES TAB */}
        {activeTab === 'wishes' && (
          <WishesManagementTab
            wishes={wishes}
            onRefresh={refreshAll}
          />
        )}

        {/* GALLERY TAB */}
        {activeTab === 'gallery' && (
          <GalleryManagementTab />
        )}

        {/* THEMES TAB (Super Admin) */}
        {activeTab === 'themes' && isSuperAdmin && (
          <ThemeTemplatesTab
            settings={settings}
            onRefresh={refreshAll}
            onOpenPublicInvitation={onBackToInvitation}
          />
        )}

        {/* SETTINGS TAB (Super Admin) */}
        {activeTab === 'settings' && isSuperAdmin && (
          <SettingsTab
            settings={settings}
            onRefresh={refreshAll}
            onOpenPublicInvitation={onBackToInvitation}
          />
        )}

        {/* USERS TAB (Super Admin) */}
        {activeTab === 'users' && isSuperAdmin && (
          <AdminUsersTab />
        )}

        {/* DATABASE & SUPABASE TAB (Eksklusif Pemilik Website / Owner) */}
        {activeTab === 'database' && isOwner && (
          <DatabaseSettingsTab />
        )}
      </main>

      {/* QR Modal preview for any guest */}
      <GuestQrModal
        isOpen={Boolean(selectedQrGuest)}
        onClose={() => setSelectedQrGuest(null)}
        guest={selectedQrGuest}
      />
    </div>
  );
};
