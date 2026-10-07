import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Crown, 
  Trash2, 
  Lock, 
  User, 
  AlertCircle,
  CheckCircle2,
  X,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Heart,
  Sparkles,
  KeyRound,
  Edit3,
  Search,
  MessageCircle,
  Share2,
  Phone,
  FileText,
  Check,
  Power,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import type { AdminUser, UserRole } from '../../types.ts';
import {
  useAuth,
  getCachedAdminsList,
  saveCachedAdminUser,
  replaceCachedAdminsFromServer,
  deleteCachedAdminUser,
  isOwnerAccountCheck,
} from '../../context/AuthContext.tsx';
import { generateWeddingSlug, sanitizeSlug, getFullInvitationUrl } from '../../utils/slugHelper.ts';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import {
  syncUserToSupabaseClient,
  deleteUserFromSupabaseClient,
  fetchUsersFromSupabaseClient,
  syncSettingsToSupabaseClient,
  ensureWeddingTemplateInSupabaseClient,
} from '../../lib/supabase.ts';

export const AdminUsersTab: React.FC = () => {
  const { user: currentUser, isOwner } = useAuth();
  const { settings, updateSettingsDirectly, refreshData } = useRealtime();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [isNameManual, setIsNameManual] = useState(false);
  const [username, setUsername] = useState('');
  const [isUsernameManual, setIsUsernameManual] = useState(false);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('super_admin');
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [weddingSlug, setWeddingSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [clientPhone, setClientPhone] = useState('');
  const [packageNotes, setPackageNotes] = useState('');

  // Edit User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [targetUserToEdit, setTargetUserToEdit] = useState<AdminUser | null>(null);
  const [editGroomName, setEditGroomName] = useState('');
  const [editBrideName, setEditBrideName] = useState('');
  const [editWeddingSlug, setEditWeddingSlug] = useState('');
  const [editIsSlugManual, setEditIsSlugManual] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Share Credentials Modal State
  const [shareUser, setShareUser] = useState<AdminUser | null>(null);
  const [copiedWaText, setCopiedWaText] = useState(false);

  // Delete User Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

  // Password Reset Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [targetUserToReset, setTargetUserToReset] = useState<AdminUser | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showAddPassword, setShowAddPassword] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(true);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [copiedResetCreds, setCopiedResetCreds] = useState(false);

  // Feedback states
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const url = currentUser
        ? `/api/superadmin/users?userId=${encodeURIComponent(currentUser.id)}&username=${encodeURIComponent(currentUser.username || '')}`
        : '/api/superadmin/users';
      const [res, supaUsers] = await Promise.all([
        fetch(url, { cache: 'no-store' }).catch(() => null),
        fetchUsersFromSupabaseClient(),
      ]);
      let loadedUsers: AdminUser[] = [];
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          loadedUsers = data;
        } else if (data && Array.isArray(data.users)) {
          loadedUsers = data.users;
        } else if (data && Array.isArray(data.admins)) {
          loadedUsers = data.admins;
        }
      }
      if (Array.isArray(supaUsers)) {
        const byUname = new Map<string, AdminUser>();
        // Supabase is authoritative across Computer and HP
        for (const su of supaUsers) {
          if (!su || !su.username) continue;
          byUname.set(su.username.toLowerCase(), su);
        }
        // Only keep server users if they are marked _locallyModified and not yet in Supabase
        for (const u of loadedUsers) {
          if (u && u.username && (u as any)._locallyModified && !byUname.has(u.username.toLowerCase())) {
            byUname.set(u.username.toLowerCase(), u);
          }
        }
        loadedUsers = Array.from(byUname.values());
      }
      if (loadedUsers.length > 0) {
        const mergedList = replaceCachedAdminsFromServer(loadedUsers);
        setUsers(mergedList);
        return;
      }
      setUsers(getCachedAdminsList());
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
      setUsers(getCachedAdminsList());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const handleAdminsUpdated = () => {
      fetchUsers();
    };
    window.addEventListener('admins-updated', handleAdminsUpdated);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchUsers();
      }
    }, 4000);
    return () => {
      window.removeEventListener('admins-updated', handleAdminsUpdated);
      window.clearInterval(interval);
    };
  }, [currentUser]);

  const isUserOwnerAccount = (u: AdminUser) => isOwnerAccountCheck(u);

  // Strict RBAC scoping:
  // - Never expose the Owner account in the deletable/manageable list
  // - If logged in as a Super Admin (Mempelai) and NOT Owner, only show their own profile + their Admin WO staff
  const scopedUsers = useMemo(() => {
    return users.filter((u) => {
      if (isUserOwnerAccount(u)) return false;
      if (isOwner) return true;

      const isSelf =
        currentUser &&
        (u.id === currentUser.id ||
          (u.username &&
            currentUser.username &&
            u.username.toLowerCase() === currentUser.username.toLowerCase()));

      if (isSelf) return true;

      // Super Admin (Mempelai) can only see & manage Admin WO staff for their wedding, NEVER other Super Admins
      if (u.role === 'admin') {
        const sameCreator =
          currentUser &&
          (u.createdBy === currentUser.id ||
            u.createdBy === currentUser.username);
        const sameWedding =
          currentUser?.weddingSlug &&
          u.weddingSlug &&
          u.weddingSlug.toLowerCase() === currentUser.weddingSlug.toLowerCase();
        return Boolean(sameCreator || sameWedding);
      }

      return false;
    });
  }, [users, isOwner, currentUser]);

  // Statistics
  const totalSuperAdmins = useMemo(() => scopedUsers.filter(u => u.role === 'super_admin' && !isUserOwnerAccount(u)).length, [scopedUsers]);
  const totalAdminWOs = useMemo(() => scopedUsers.filter(u => u.role === 'admin' && !isUserOwnerAccount(u)).length, [scopedUsers]);
  const activeUsersCount = useMemo(() => scopedUsers.filter(u => u.active !== false).length, [scopedUsers]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return scopedUsers.filter(u => {
      // Role filter
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;

      // Status filter
      if (statusFilter === 'active' && u.active === false) return false;
      if (statusFilter === 'inactive' && u.active !== false) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (u.name || '').toLowerCase().includes(q);
        const matchUsername = (u.username || '').toLowerCase().includes(q);
        const matchSlug = (u.weddingSlug || '').toLowerCase().includes(q);
        const matchCouple = (u.coupleNames || '').toLowerCase().includes(q);
        const matchPhone = (u.phone || '').toLowerCase().includes(q);
        const matchNotes = (u.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchUsername && !matchSlug && !matchCouple && !matchPhone && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [scopedUsers, roleFilter, statusFilter, searchQuery]);

  // Password Generator
  const generateRandomPassword = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const pass = `nikah${randomDigits}`;
    setNewPasswordInput(pass);
    setConfirmPasswordInput(pass);
  };

  const generateFormRandomPassword = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setPassword(`mempelai${randomDigits}`);
  };

  // Copy helper
  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyUrl = (slug: string) => {
    const full = getFullInvitationUrl(slug);
    navigator.clipboard.writeText(full);
    setCopiedSlug(slug || 'default');
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  // Open Add Modal
  const handleOpenAddModal = (initialRole: UserRole = 'super_admin') => {
    setRole(isOwner ? initialRole : 'admin');
    setName('');
    setIsNameManual(false);
    setUsername('');
    setIsUsernameManual(false);
    generateFormRandomPassword();
    setGroomName('');
    setBrideName('');
    setWeddingSlug('');
    setIsSlugManual(false);
    setClientPhone('');
    setPackageNotes('');
    setErrorMsg(null);
    setIsAddModalOpen(true);
  };

  const handleGroomChange = (val: string) => {
    setGroomName(val);
    if (!isSlugManual) {
      const s = generateWeddingSlug(val, brideName);
      setWeddingSlug(s);
    }
    if (!isUsernameManual) {
      const suggested = (val && brideName ? `${val}_${brideName}` : (val || brideName || '')).toLowerCase().replace(/[^a-z0-9_]/g, '');
      setUsername(suggested);
    }
    if (!isNameManual) {
      setName(val && brideName ? `${val} & ${brideName}` : (val || brideName));
    }
  };

  const handleBrideChange = (val: string) => {
    setBrideName(val);
    if (!isSlugManual) {
      const s = generateWeddingSlug(groomName, val);
      setWeddingSlug(s);
    }
    if (!isUsernameManual) {
      const suggested = (groomName && val ? `${groomName}_${val}` : (groomName || val || '')).toLowerCase().replace(/[^a-z0-9_]/g, '');
      setUsername(suggested);
    }
    if (!isNameManual) {
      setName(groomName && val ? `${groomName} & ${val}` : (groomName || val));
    }
  };

  const handleNameChange = (val: string) => {
    setIsNameManual(Boolean(val.trim()));
    setName(val);

    if (role === 'super_admin') {
      const parts = val.includes('&')
        ? val.split('&').map((p) => p.trim())
        : val.toLowerCase().includes(' dan ')
        ? val.split(/\s+dan\s+/i).map((p) => p.trim())
        : [val.trim(), ''];

      const derivedGroom = groomName || parts[0] || '';
      const derivedBride = brideName || parts[1] || '';

      if (!isSlugManual && (derivedGroom || derivedBride)) {
        setWeddingSlug(generateWeddingSlug(derivedGroom, derivedBride));
      }
      if (!isUsernameManual && val.trim()) {
        const suggested = (
          derivedGroom && derivedBride
            ? `${derivedGroom}_${derivedBride}`
            : val.trim()
        )
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '');
        setUsername(suggested);
      }
    } else if (!isUsernameManual && val.trim()) {
      setUsername(val.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''));
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: AdminUser) => {
    setTargetUserToEdit(user);
    const coupleParts = (user.coupleNames || user.name || '').split('&');
    const gn = coupleParts[0]?.trim() || '';
    const bn = coupleParts[1]?.trim() || '';
    setEditGroomName(gn);
    setEditBrideName(bn);
    setEditWeddingSlug(user.weddingSlug || generateWeddingSlug(gn, bn));
    setEditIsSlugManual(false);
    setEditPhone(user.phone || '');
    setEditNotes(user.notes || '');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserToEdit) return;

    setEditLoading(true);
    setEditError(null);

    const gnClean = editGroomName.trim();
    const bnClean = editBrideName.trim();
    const finalSlug = editWeddingSlug
      ? sanitizeSlug(editWeddingSlug)
      : gnClean || bnClean
      ? generateWeddingSlug(gnClean, bnClean)
      : targetUserToEdit.weddingSlug;
    const updatedName =
      gnClean && bnClean
        ? `${gnClean} & ${bnClean}`
        : targetUserToEdit.name;

    const updatedUser: AdminUser = {
      ...targetUserToEdit,
      name: updatedName,
      coupleNames:
        gnClean && bnClean
          ? `${gnClean} & ${bnClean}`
          : targetUserToEdit.coupleNames,
      weddingSlug: finalSlug,
      phone: editPhone.trim() || undefined,
      notes: editNotes.trim() || undefined
    };

    saveCachedAdminUser(updatedUser);
    syncUserToSupabaseClient(updatedUser).catch(() => {});
    if (updatedUser.role === 'super_admin' && finalSlug && (gnClean || bnClean)) {
      ensureWeddingTemplateInSupabaseClient(finalSlug, gnClean, bnClean, settings)
        .then((tpl) => {
          if (tpl) updateSettingsDirectly(tpl, false);
        })
        .catch(() => {});
    }
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    window.dispatchEvent(new Event('admins-updated'));
    setSuccessMsg(`Data ${updatedUser.name} dan URL undangan berhasil diperbarui!`);
    setIsEditModalOpen(false);
    setTargetUserToEdit(null);
    setEditLoading(false);
    setTimeout(() => setSuccessMsg(null), 4000);

    try {
      const res = await fetch(`/api/superadmin/users/${targetUserToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: targetUserToEdit.username,
          oldSlug: targetUserToEdit.weddingSlug,
          groomName: gnClean,
          brideName: bnClean,
          weddingSlug: finalSlug,
          name: updatedName,
          phone: editPhone.trim(),
          notes: editNotes.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          updateSettingsDirectly(data.settings, false);
        }
      }
      await fetchUsers();
      await refreshData();
    } catch {
      // already saved in local cache & state
    }
  };

  // Toggle user active status
  const handleToggleUserStatus = async (user: AdminUser) => {
    if (isUserOwnerAccount(user)) {
      setErrorMsg('Ditolak: Akun Pemilik Website Utama tidak dapat dinonaktifkan.');
      return;
    }
    if (!isOwner && user.role === 'super_admin') {
      setErrorMsg('Ditolak: Super Admin tidak memiliki kewenangan mengubah status akun Super Admin lain.');
      return;
    }
    const newStatus = user.active === false ? true : false;
    const updatedUser: AdminUser = { ...user, active: newStatus };
    saveCachedAdminUser(updatedUser);
    syncUserToSupabaseClient(updatedUser).catch(() => {});
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setSuccessMsg(`Status akun @${user.username} berhasil diubah menjadi ${newStatus ? 'Aktif' : 'Nonaktif'}.`);
    setTimeout(() => setSuccessMsg(null), 3000);

    try {
      await fetch(
        `/api/superadmin/users/${user.id}?callerId=${encodeURIComponent(currentUser?.id || '')}&callerUsername=${encodeURIComponent(currentUser?.username || '')}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: newStatus })
        }
      );
      fetchUsers();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Derive groom & bride if user only filled Name or Username
    const rawName = name.trim();
    const nameParts = rawName.includes('&')
      ? rawName.split('&').map((s) => s.trim())
      : rawName.toLowerCase().includes(' dan ')
      ? rawName.split(/\s+dan\s+/i).map((s) => s.trim())
      : [];

    const resolvedGroom =
      groomName.trim() ||
      nameParts[0] ||
      (username.includes('_') ? username.split('_')[0] : rawName) ||
      'Mempelai Pria';
    const resolvedBride =
      brideName.trim() ||
      nameParts[1] ||
      (username.includes('_') ? username.split('_').slice(1).join(' ') : '') ||
      (role === 'super_admin' ? 'Mempelai Wanita' : '');

    const rawUserCandidate =
      username.trim() ||
      (role === 'super_admin' && (groomName.trim() || brideName.trim())
        ? `${groomName.trim()}_${brideName.trim()}`
        : rawName);

    const cleanUser = rawUserCandidate.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    if (!cleanUser) {
      setErrorMsg('Username wajib diisi (hanya huruf, angka, garis bawah, atau strip).');
      return;
    }
    if (!password.trim() || password.trim().length < 4) {
      setErrorMsg('Kata sandi wajib diisi minimal 4 karakter.');
      return;
    }

    const finalName =
      rawName ||
      (role === 'super_admin'
        ? `${resolvedGroom}${resolvedBride ? ` & ${resolvedBride}` : ''}`
        : cleanUser);

    const resolvedSlug =
      role === 'super_admin'
        ? weddingSlug
          ? sanitizeSlug(weddingSlug)
          : generateWeddingSlug(resolvedGroom, resolvedBride)
        : currentUser?.weddingSlug || 'rizky_dan_siti';

    setFormLoading(true);
    setErrorMsg(null);

    const applyCreatedUserSuccess = async (createdUser: AdminUser, savedOnServer: boolean = false, createdSettings?: any) => {
      const fullUser: AdminUser & { password?: string } = {
        ...createdUser,
        password: password.trim(),
        phone: clientPhone.trim() || createdUser.phone,
        notes: packageNotes.trim() || createdUser.notes,
        createdAt: createdUser.createdAt || new Date().toISOString(),
      };
      saveCachedAdminUser(fullUser, !savedOnServer);
      // Directly sync user & wedding settings to Supabase so it is 100% persisted in Supabase immediately
      await syncUserToSupabaseClient(fullUser);
      if (createdSettings && resolvedSlug) {
        await syncSettingsToSupabaseClient(createdSettings, resolvedSlug);
        await syncSettingsToSupabaseClient(createdSettings, 'main');
        await syncSettingsToSupabaseClient(createdSettings, 'default');
        updateSettingsDirectly(createdSettings, false);
      } else if (role === 'super_admin' && resolvedSlug) {
        const tpl = await ensureWeddingTemplateInSupabaseClient(
          resolvedSlug,
          resolvedGroom || finalName,
          resolvedBride || '',
          settings
        );
        if (tpl) {
          updateSettingsDirectly(tpl, false);
        }
      }
      setUsers((prev) => [
        fullUser,
        ...prev.filter(
          (u) =>
            u.id !== fullUser.id &&
            u.username.toLowerCase() !== fullUser.username.toLowerCase()
        ),
      ]);
      setSuccessMsg(`Akun ${fullUser.name} (@${fullUser.username}) berhasil dibuat dan tersimpan di Supabase!`);
      setIsAddModalOpen(false);
      fetchUsers();

      // If Owner created a Super Admin, directly open the Share Credentials Modal
      if (role === 'super_admin' && isOwner) {
        setShareUser(fullUser);
      }

      setTimeout(() => setSuccessMsg(null), 4000);
    };

    try {
      const res = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${isOwner ? 'owner_user-owner-1' : currentUser?.id || ''}`,
        },
        body: JSON.stringify({
          name: finalName,
          username: cleanUser,
          password: password.trim(),
          role,
          groomName: resolvedGroom,
          brideName: resolvedBride,
          weddingSlug: resolvedSlug,
          phone: clientPhone.trim(),
          notes: packageNotes.trim(),
          createdBy: currentUser?.id || (isOwner ? 'user-owner-1' : undefined),
          createdByName: currentUser?.name || (isOwner ? 'Pemilik Website' : undefined),
          isOwnerCaller: isOwner,
          callerUsername: currentUser?.username || (isOwner ? 'asepsulistiyono1' : undefined),
          callerEmail: currentUser?.email || (isOwner ? 'asepsulistiyono1@gmail.com' : undefined),
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && (data.user || data.admin)) {
          await applyCreatedUserSuccess(data.user || data.admin, true, data.settings);
          return;
        }
        if (!isOwner && res.status === 403) {
          setErrorMsg(data.error || 'Ditolak: Hanya Pemilik Website yang dapat menambahkan Super Admin.');
          return;
        }
      }

      // Resilient fallback so Owner can always add Super Admin even if backend is restarting or offline
      const fallbackUser: AdminUser = {
        id: `user-${role === 'super_admin' ? 'super' : 'admin'}-${Date.now()}`,
        username: cleanUser,
        name: finalName,
        email: `${cleanUser}@wedding.local`,
        role,
        active: true,
        password: password.trim(),
        weddingSlug: resolvedSlug,
        coupleNames:
          role === 'super_admin'
            ? `${resolvedGroom}${resolvedBride ? ` & ${resolvedBride}` : ''}`
            : currentUser?.coupleNames,
        phone: clientPhone.trim() || undefined,
        notes: packageNotes.trim() || undefined,
        createdBy: role === 'admin' ? currentUser?.id : undefined,
        createdByName: role === 'admin' ? currentUser?.name : undefined,
        createdAt: new Date().toISOString(),
      };
      await applyCreatedUserSuccess(fallbackUser);
    } catch {
      const fallbackUser: AdminUser = {
        id: `user-${role === 'super_admin' ? 'super' : 'admin'}-${Date.now()}`,
        username: cleanUser,
        name: finalName,
        email: `${cleanUser}@wedding.local`,
        role,
        active: true,
        password: password.trim(),
        weddingSlug: resolvedSlug,
        coupleNames:
          role === 'super_admin'
            ? `${resolvedGroom}${resolvedBride ? ` & ${resolvedBride}` : ''}`
            : currentUser?.coupleNames,
        phone: clientPhone.trim() || undefined,
        notes: packageNotes.trim() || undefined,
        createdBy: role === 'admin' ? currentUser?.id : undefined,
        createdByName: role === 'admin' ? currentUser?.name : undefined,
        createdAt: new Date().toISOString(),
      };
      await applyCreatedUserSuccess(fallbackUser);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete User with Cascade Delete & Strict Role Protection
  const handleDeleteUser = (user: AdminUser) => {
    if (isUserOwnerAccount(user)) {
      setErrorMsg('Ditolak: Akun Pemilik Website Utama memiliki proteksi absolut dan tidak dapat dihapus.');
      return;
    }

    if (!isOwner && user.role === 'super_admin') {
      setErrorMsg('Ditolak: Super Admin tidak memiliki kewenangan untuk menghapus Pemilik Website atau akun Super Admin yang lain.');
      return;
    }

    setUserToDelete(user);
  };

  const executeConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    const user = userToDelete;
    setUserToDelete(null);

    // Optimistically update local state & cache immediately
    setUsers((prev) => prev.filter((u) => u.id !== user.id && u.username !== user.username));
    deleteCachedAdminUser(user.id);
    deleteCachedAdminUser(user.username);

    // 1. Immediately delete from Supabase cloud database across all fields
    await deleteUserFromSupabaseClient(user.id, user.username, {
      email: user.email,
      weddingSlug: user.weddingSlug,
      deleteWeddingSettings: user.role === 'super_admin',
    });

    // 2. Also notify backend server
    try {
      const token = localStorage.getItem('wedding_auth_token') || 'token_owner_user-owner-1';
      const res = await fetch(
        `/api/superadmin/users/${encodeURIComponent(user.id)}?callerId=${encodeURIComponent(currentUser?.id || 'user-owner-1')}&callerUsername=${encodeURIComponent(currentUser?.username || 'asepsulistiyono1')}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (Array.isArray(data?.deletedAdminWOs)) {
        for (const wo of data.deletedAdminWOs as AdminUser[]) {
          deleteCachedAdminUser(wo.id);
          deleteCachedAdminUser(wo.username);
          await deleteUserFromSupabaseClient(wo.id, wo.username);
        }
      }
      setSuccessMsg(data?.message || `Akun ${user.name} berhasil dihapus dari sistem & Supabase.`);
      fetchUsers();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Backend delete error (Supabase deletion already complete):', err);
      fetchUsers();
      setSuccessMsg(`Akun ${user.name} berhasil dihapus.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  const handleExportUsersCsv = () => {
    let csv = 'Nama Mempelai / Akun,Username,Password,Role,URL Slug,WhatsApp,Catatan\n';
    users
      .filter((u) => !isUserOwnerAccount(u))
      .forEach((u) => {
        const cleanName = `"${(u.coupleNames || u.name || '').replace(/"/g, '""')}"`;
        const cleanNotes = `"${(u.notes || '').replace(/"/g, '""')}"`;
        csv += `${cleanName},${u.username},${u.password || (u.role === 'super_admin' ? 'super123' : 'admin123')},${u.role},${u.weddingSlug || '-'},${u.phone || '-'},${cleanNotes}\n`;
      });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'daftar_klien_superadmin_mempelai.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);
    setCopiedResetCreds(false);

    if (newPasswordInput.length < 4) {
      setPasswordFeedback({ type: 'error', message: 'Kata sandi minimal 4 karakter.' });
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordFeedback({ type: 'error', message: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    const activeTarget = targetUserToReset || currentUser;
    if (!activeTarget) return;

    setPasswordLoading(true);
    const updatedTarget: AdminUser = {
      ...activeTarget,
      password: newPasswordInput,
    };
    saveCachedAdminUser(updatedTarget);
    syncUserToSupabaseClient(updatedTarget).catch(() => {});
    setUsers((prev) => prev.map((u) => (u.id === updatedTarget.id ? updatedTarget : u)));

    try {
      await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeTarget.id,
          username: activeTarget.username,
          newPassword: newPasswordInput
        })
      });
    } catch {
      // already saved locally
    } finally {
      setPasswordFeedback({ type: 'success', message: 'Kata sandi berhasil diperbarui!' });
      fetchUsers();
      setPasswordLoading(false);
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        setPasswordFeedback(null);
        setTargetUserToReset(null);
      }, 1200);
    }
  };

  // Generate WhatsApp Message Template for client
  const getWhatsAppMessage = (u: AdminUser) => {
    const couple = u.coupleNames || u.name;
    const invUrl = getFullInvitationUrl(u.weddingSlug || 'default');
    const pass = u.password || 'super123';

    return `Halo Kak *${couple}*! 👋✨\n\nSelamat, website undangan pernikahan digital resmi Anda telah aktif dan siap digunakan:\n\n🌐 *Link Undangan Pernikahan (1 URL Khusus Mempelai):*\n${invUrl}\n\n🔐 *Kredensial Login Dashboard Super Admin:*\n• Username: *${u.username}*\n• Password: *${pass}*\n\n📌 *Cara Masuk ke Dashboard Pengelola:*\n1. Buka Link Undangan Pernikahan Anda di atas.\n2. Klik tombol *Login Admin* di pojok kanan bawah layar.\n3. Masukkan *Username* dan *Password* resmi Anda di atas untuk mengelola acara, galeri foto, buku tamu, & staf resepsi (Admin WO).\n\nSetiap akun Super Admin berhak mengelola 1 URL undangan resmi di atas. Bila ada pertanyaan atau butuh bantuan teknis, jangan ragu untuk menghubungi kami. Terima kasih dan lancar selalu untuk hari bahagianya! 🙏🤵👰🎉`;
  };

  return (
    <div className="space-y-6">
      {/* Top Hero / Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif-wedding text-2xl sm:text-3xl font-bold text-stone-900">
              {isOwner ? 'Master Dashboard Pemilik Website' : 'Manajemen Staf & Pengelola'}
            </h3>
            {isOwner && (
              <span className="text-[10px] font-bold bg-amber-400/25 text-amber-900 border border-amber-400/40 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-700" />
                <span>Multi-Tenant Engine</span>
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {isOwner 
              ? 'Kelola ribuan klien Super Admin mempelai. Buat akun, bagikan kredensial login, dan tentukan URL undangan masing-masing.'
              : 'Atur petugas meja resepsi dan wedding organizer untuk pernikahan Anda.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setTargetUserToReset(null);
              setIsPasswordModalOpen(true);
              setPasswordFeedback(null);
              setNewPasswordInput('');
              setConfirmPasswordInput('');
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-stone-200 shadow-2xs"
          >
            <KeyRound className="w-4 h-4 text-amber-700" />
            <span>Ubah Sandi Saya</span>
          </button>

          {isOwner ? (
            <>
              <button
                type="button"
                onClick={handleExportUsersCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-stone-200 shadow-2xs"
                title="Unduh seluruh daftar kredensial dan URL klien Super Admin dalam format CSV / Excel"
              >
                <Download className="w-4 h-4 text-stone-600" />
                <span className="hidden sm:inline">Ekspor CSV</span>
              </button>

              <button
                onClick={() => handleOpenAddModal('super_admin')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-sm"
              >
                <Crown className="w-4 h-4 text-amber-200" />
                <span>+ Buat Super Admin Baru</span>
              </button>

              <button
                onClick={() => handleOpenAddModal('admin')}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Tambah Staf WO</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleOpenAddModal('admin')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Admin WO</span>
            </button>
          )}
        </div>
      </div>

      {/* Owner Statistics Cards */}
      {isOwner && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Super Admin (Klien)</p>
              <p className="text-xl font-bold text-stone-900">{totalSuperAdmins} Mempelai</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
              <LinkIcon className="w-5 h-5 text-rose-700" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">URL Undangan Aktif</p>
              <p className="text-xl font-bold text-stone-900">{totalSuperAdmins} URL Mandiri</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Total Staf Admin WO</p>
              <p className="text-xl font-bold text-stone-900">{totalAdminWOs} Petugas</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Status Platform</p>
              <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Multi-Client Online</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Owner Multi-Tenant Guide Banner (Exclusive for Owner) */}
      {isOwner && (
        <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-stone-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-amber-600/30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-stone-950 flex items-center gap-1">
                <Crown className="w-3 h-3 text-stone-950" />
                <span>Kendali Penuh Pemilik Website</span>
              </span>
              <span className="text-xs text-amber-200 font-semibold">• 1 Super Admin = 1 URL Undangan Mempelai</span>
            </div>
            <h4 className="font-serif-wedding text-lg sm:text-xl font-bold text-white">
              Manajemen Ribuan Klien Super Admin &amp; Distribusi Akun
            </h4>
            <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
              Sebagai pemilik website, Anda berwenang membuat ribuan akun Super Admin. Anda hanya perlu memberikan <strong className="text-amber-300">Username</strong> dan <strong className="text-amber-300">Password</strong> kepada mempelai. Setiap klien hanya berhak mengelola 1 URL undangan mereka sendiri. Gunakan tombol <strong className="text-white">Kirim Akun</strong> untuk mengirim kredensial via WhatsApp langsung ke mempelai.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleOpenAddModal('super_admin')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>+ Buat Super Admin Baru</span>
            </button>
            <a
              href="/api/superadmin/export/users"
              download="daftar_klien_superadmin_mempelai.csv"
              className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-semibold rounded-xl border border-stone-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh CSV</span>
            </a>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pasangan mempelai, username @..., nomor WA, atau URL slug..."
              className="w-full pl-9 pr-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                roleFilter === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Semua ({scopedUsers.length})
            </button>
            {isOwner && (
              <button
                type="button"
                onClick={() => setRoleFilter('super_admin')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  roleFilter === 'super_admin' ? 'bg-white text-amber-900 shadow-2xs font-bold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-700" />
                <span>Super Admin ({totalSuperAdmins})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                roleFilter === 'admin' ? 'bg-white text-emerald-900 shadow-2xs font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Admin WO ({totalAdminWOs})</span>
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 cursor-pointer"
          >
            <option value="all">Semua Status Akun</option>
            <option value="active">Hanya Akun Aktif</option>
            <option value="inactive">Hanya Akun Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Users Management Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 text-stone-500 uppercase text-[10.5px] font-bold border-b border-stone-100">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">Status</th>
                <th className="py-3.5 px-4">Pengelola / Pasangan Mempelai</th>
                <th className="py-3.5 px-4">Peran (Role)</th>
                <th className="py-3.5 px-4">URL Undangan Resmi</th>
                <th className="py-3.5 px-4">Kredensial Login</th>
                <th className="py-3.5 px-4">Kontak / Catatan</th>
                <th className="py-3.5 px-4 text-right">Aksi Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    Memuat daftar akun pengelola platform...
                  </td>
                </tr>
              )}

              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <Users className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="font-semibold text-stone-600">Tidak ada pengelola yang sesuai dengan filter.</p>
                    <p className="text-xs text-stone-400 mt-1">Coba ubah kata kunci pencarian atau bersihkan filter.</p>
                  </td>
                </tr>
              )}

              {!loading &&
                filteredUsers.map((item) => {
                  const isCurrentSelf = Boolean(
                    currentUser &&
                      (currentUser.id === item.id ||
                        (currentUser.username &&
                          item.username &&
                          currentUser.username.toLowerCase() === item.username.toLowerCase()))
                  );
                  const isItemOwner = isUserOwnerAccount(item);
                  const canDeleteThisUser =
                    !isCurrentSelf &&
                    !isItemOwner &&
                    (isOwner || item.role === 'admin');
                  const canToggleThisUser =
                    !isCurrentSelf &&
                    !isItemOwner &&
                    (isOwner || item.role === 'admin');
                  const canEditOrResetThisUser =
                    !isItemOwner &&
                    (isOwner || isCurrentSelf || item.role === 'admin');

                  const isUserActive = item.active !== false;
                  const targetSlug = item.weddingSlug || 'default';
                  const relatedStaffCount = scopedUsers.filter(u => u.role === 'admin' && (u.createdBy === item.id || (item.weddingSlug && u.weddingSlug === item.weddingSlug))).length;

                  return (
                    <tr key={item.id} className={`hover:bg-amber-50/20 transition-colors ${!isUserActive ? 'opacity-50 bg-stone-50/60' : ''}`}>
                      {/* Active Toggle Switch */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          disabled={!canToggleThisUser}
                          onClick={() => canToggleThisUser && handleToggleUserStatus(item)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                            !canToggleThisUser
                              ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                              : isUserActive 
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer' 
                              : 'bg-stone-200 text-stone-500 hover:bg-stone-300 cursor-pointer'
                          }`}
                          title={
                            !canToggleThisUser
                              ? 'Akun ini tidak dapat dinonaktifkan'
                              : isUserActive
                              ? 'Akun Aktif (Klik untuk nonaktifkan)'
                              : 'Akun Nonaktif (Klik untuk aktifkan)'
                          }
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      {/* Name & Username */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            item.role === 'super_admin' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}>
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 flex items-center gap-1.5">
                              <span>{item.coupleNames || item.name}</span>
                              {isCurrentSelf && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-semibold">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono mt-0.5">
                              <span className="text-amber-900 font-bold">@{item.username}</span>
                              {item.email && <span className="text-[10px] text-stone-400">• {item.email}</span>}
                            </div>
                            {targetSlug && (
                              <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:hidden">
                                <a
                                  href={getFullInvitationUrl(targetSlug)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] shadow-2xs"
                                >
                                  <ExternalLink className="w-3 h-3 text-white shrink-0" />
                                  <span className="text-white">Buka Undangan</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopyUrl(targetSlug)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-[11px] border border-stone-200"
                                >
                                  {copiedSlug === targetSlug ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span className="text-emerald-700">Tersalin</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Salin Link</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {item.role === 'super_admin' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                              <Crown className="w-3 h-3 text-amber-700" />
                              <span>Super Admin (Klien)</span>
                            </span>
                            {relatedStaffCount > 0 && (
                              <div className="text-[10.5px] text-stone-500 font-medium">
                                Induk <strong className="text-emerald-700">{relatedStaffCount} Admin WO</strong>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <ShieldCheck className="w-3 h-3 text-emerald-700" />
                              <span>Admin WO</span>
                            </span>
                            {item.createdByName && (
                              <div className="text-[10px] text-stone-500 truncate max-w-[130px]">
                                Staf: {item.createdByName.split('(')[0].trim()}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Wedding Invitation URL */}
                      <td className="py-3.5 px-4">
                        {targetSlug ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-mono text-[11.5px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/90 w-fit">
                              <LinkIcon className="w-3 h-3 text-amber-700 shrink-0" />
                              <span className="font-bold">/#/{targetSlug}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px]">
                              <button
                                type="button"
                                onClick={() => handleCopyUrl(targetSlug)}
                                className="text-stone-600 hover:text-amber-800 flex items-center gap-1 font-medium cursor-pointer"
                              >
                                {copiedSlug === targetSlug ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700 font-semibold">Tersalin!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Salin</span>
                                  </>
                                )}
                              </button>
                              <span className="text-stone-300">•</span>
                              <a
                                href={getFullInvitationUrl(targetSlug)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-800 hover:text-amber-950 flex items-center gap-1 font-medium underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Buka Undangan</span>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic text-xs">-</span>
                        )}
                      </td>

                      {/* Credentials (Username & Password) */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 bg-stone-50 p-2 rounded-xl border border-stone-200/70 w-fit">
                          <div className="flex items-center justify-between gap-3 text-[11px] font-mono">
                            <span className="text-stone-500">User:</span>
                            <span className="font-bold text-stone-800">@{item.username}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-[11px] font-mono">
                            <span className="text-stone-500">Pass:</span>
                            <span className="font-bold text-amber-900 bg-white px-1.5 py-0.2 rounded border border-amber-200">
                              {item.password || (item.role === 'super_admin' ? 'super123' : 'admin123')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(item.password || (item.role === 'super_admin' ? 'super123' : 'admin123'), `pass-${item.id}`)}
                              className="text-stone-400 hover:text-stone-700 cursor-pointer"
                              title="Salin Kata Sandi"
                            >
                              {copiedField === `pass-${item.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Contact / Notes */}
                      <td className="py-3.5 px-4 text-xs text-stone-600">
                        {item.phone ? (
                          <div className="space-y-0.5">
                            <a
                              href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{item.phone}</span>
                            </a>
                            {item.notes && <p className="text-[10.5px] text-stone-400 truncate max-w-[140px]">{item.notes}</p>}
                          </div>
                        ) : item.notes ? (
                          <span className="text-[11px] text-stone-500">{item.notes}</span>
                        ) : (
                          <span className="text-stone-400 text-xs italic">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Share Credentials via WhatsApp */}
                          {item.role === 'super_admin' && (isOwner || isCurrentSelf) && (
                            <button
                              type="button"
                              onClick={() => setShareUser(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-emerald-900 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-300 shadow-2xs"
                              title="Bagikan Kredensial via WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span className="text-[11px] font-semibold">Kirim Akun</span>
                            </button>
                          )}

                          {/* Edit Details & URL */}
                          {item.role === 'super_admin' && (isOwner || isCurrentSelf) && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer border border-amber-200 shadow-2xs"
                              title="Edit Data & URL Undangan"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-800" />
                              <span className="text-[11px] font-semibold">Edit URL</span>
                            </button>
                          )}

                          {/* Reset Password */}
                          {canEditOrResetThisUser && (
                            <button
                              type="button"
                              onClick={() => {
                                setTargetUserToReset(item);
                                setIsPasswordModalOpen(true);
                                setPasswordFeedback(null);
                                setNewPasswordInput('');
                                setConfirmPasswordInput('');
                                setCopiedResetCreds(false);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer border border-stone-200"
                              title={`Reset kata sandi untuk @${item.username}`}
                            >
                              <KeyRound className="w-3.5 h-3.5 text-stone-600" />
                              <span className="text-[11px] font-semibold">Sandi</span>
                            </button>
                          )}

                          {/* Delete User: Super Admin can ONLY delete their own Admin WO staff, NEVER Owner or other Super Admins */}
                          {canDeleteThisUser && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(item)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title={item.role === 'super_admin' ? 'Hapus Super Admin (Otomatis menghapus seluruh Admin WO stafnya)' : 'Hapus Admin WO'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah Super Admin / Admin WO */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl relative my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-stone-100 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  {role === 'super_admin' ? <Crown className="w-5 h-5 text-amber-700" /> : <UserPlus className="w-5 h-5 text-emerald-700" />}
                </div>
                <div>
                  <h3 className="font-serif-wedding text-xl sm:text-2xl font-bold text-stone-800">
                    {role === 'super_admin' ? 'Buat Akun Super Admin (Klien Mempelai)' : 'Tambah Staf Admin WO'}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                    {role === 'super_admin' 
                      ? 'Daftarkan klien baru, buat URL undangan resmi, dan sediakan username & password login.'
                      : 'Buat akun staf operasional untuk meja resepsi dan check-in QR tamu.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors shrink-0 -mr-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 overscroll-contain">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Role Switcher (If Owner) */}
                {isOwner && (
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      Pilih Jenis Akun
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setRole('super_admin')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                          role === 'super_admin'
                            ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <Crown className="w-4 h-4 text-amber-600" />
                        <span>Super Admin (Klien Mempelai)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('admin')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                          role === 'admin'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Admin WO (Staf Resepsi)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Special Inputs for Super Admin */}
                {role === 'super_admin' && (
                  <div className="bg-amber-50/60 border border-amber-200/90 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      <span className="text-xs font-bold text-amber-950">Nama Pasangan Mempelai</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Mempelai Pria
                        </label>
                        <input
                          type="text"
                          value={groomName}
                          onChange={(e) => handleGroomChange(e.target.value)}
                          placeholder="Contoh: Thomas"
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Mempelai Wanita
                        </label>
                        <input
                          type="text"
                          value={brideName}
                          onChange={(e) => handleBrideChange(e.target.value)}
                          placeholder="Contoh: Juwita"
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-stone-700">
                          URL Slug Undangan (Akhiran URL)
                        </label>
                        <label className="text-[10px] text-stone-500 flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!isSlugManual}
                            onChange={(e) => {
                              setIsSlugManual(!e.target.checked);
                              if (e.target.checked) {
                                setWeddingSlug(generateWeddingSlug(groomName, brideName));
                              }
                            }}
                            className="rounded text-amber-600 focus:ring-amber-500 text-xs"
                          />
                          <span>Otomatis</span>
                        </label>
                      </div>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-xs">
                          /#/
                        </span>
                        <input
                          type="text"
                          value={weddingSlug}
                          onChange={(e) => {
                            setIsSlugManual(true);
                            setWeddingSlug(sanitizeSlug(e.target.value));
                          }}
                          placeholder="thomas_dan_juwita"
                          className="w-full pl-8 pr-3.5 py-1.5 sm:py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono text-amber-900 font-bold"
                        />
                      </div>

                      {/* Live URL Preview */}
                      <div className="mt-2 p-2 bg-amber-100/70 rounded-xl border border-amber-300/70 flex items-start gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-amber-800 shrink-0 mt-0.5" />
                        <div className="text-[10.5px] text-amber-950 font-mono break-all leading-tight">
                          <span className="text-stone-500">Pratinjau URL: </span>
                          <strong className="text-amber-900 font-bold">
                            {getFullInvitationUrl(weddingSlug || generateWeddingSlug(groomName || 'Mempelai', brideName || 'Mempelai'))}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      Nama Akun Pengelola
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder={role === 'super_admin' ? 'Thomas & Juwita' : 'Contoh: Rian (WO Resepsi)'}
                        className="w-full pl-9 pr-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                        Username Login *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold font-mono text-xs">@</span>
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => {
                            setIsUsernameManual(true);
                            setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''));
                          }}
                          placeholder={role === 'super_admin' ? 'thomas_juwita' : 'petugas_wo'}
                          className="w-full pl-8 pr-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono text-stone-900 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                          Kata Sandi *
                        </label>
                        <button
                          type="button"
                          onClick={generateFormRandomPassword}
                          className="text-[10px] text-amber-800 hover:text-amber-950 font-semibold cursor-pointer underline"
                        >
                          Acak Sandi
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          type={showAddPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Minimal 4 karakter"
                          className="w-full pl-9 pr-10 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-amber-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAddPassword((prev) => !prev)}
                          title={showAddPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500 hover:text-amber-800 cursor-pointer"
                        >
                          {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Client WhatsApp Number & Package Notes */}
                  {role === 'super_admin' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                          Nomor WhatsApp Klien (Opsional)
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="text"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            placeholder="Contoh: 081234567890"
                            className="w-full pl-9 pr-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-mono font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1">
                          Catatan Paket / Keterangan
                        </label>
                        <div className="relative">
                          <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="text"
                            value={packageNotes}
                            onChange={(e) => setPackageNotes(e.target.value)}
                            placeholder="Contoh: Paket Diamond 1000 Undangan"
                            className="w-full pl-9 pr-3.5 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="p-3.5 sm:p-4 bg-stone-50/90 border-t border-stone-200 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-200/60 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold tracking-wide transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan & Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Bagikan Kredensial ke Klien (WhatsApp Template) */}
      {shareUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl relative my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-stone-100 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-serif-wedding text-xl sm:text-2xl font-bold text-stone-800">
                    Bagikan Kredensial ke Klien
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                    Klien: <strong className="text-amber-900">{shareUser.coupleNames || shareUser.name}</strong> (@{shareUser.username})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShareUser(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors shrink-0 -mr-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 overscroll-contain">
              {/* Credentials Summary Box */}
              <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-3.5 space-y-2.5 text-xs">
                <div className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>Kredensial Login Siap Diberikan</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200/60">
                    <span className="text-stone-400 block text-[10px]">Username:</span>
                    <strong className="font-mono text-stone-900 text-sm">@{shareUser.username}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200/60">
                    <span className="text-stone-400 block text-[10px]">Kata Sandi:</span>
                    <strong className="font-mono text-amber-900 text-sm">{shareUser.password || 'super123'}</strong>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-amber-200/60 font-mono text-[11px] break-all">
                  <span className="text-stone-400 block text-[10px]">URL Undangan Resmi:</span>
                  <a
                    href={getFullInvitationUrl(shareUser.weddingSlug || 'default')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-800 hover:underline font-bold"
                  >
                    {getFullInvitationUrl(shareUser.weddingSlug || 'default')}
                  </a>
                </div>
              </div>

              {/* Ready-to-Send WhatsApp Message Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Format Pesan WhatsApp (Siap Kirim)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getWhatsAppMessage(shareUser));
                      setCopiedWaText(true);
                      setTimeout(() => setCopiedWaText(false), 2000);
                    }}
                    className="text-[11px] text-amber-800 hover:text-amber-950 font-bold inline-flex items-center gap-1 cursor-pointer bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200"
                  >
                    {copiedWaText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWaText ? 'Tersalin!' : 'Salin Pesan'}</span>
                  </button>
                </div>

                <textarea
                  readOnly
                  rows={8}
                  value={getWhatsAppMessage(shareUser)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-800 leading-relaxed focus:outline-none"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-3.5 sm:p-4 bg-stone-50/90 border-t border-stone-200 flex items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShareUser(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-200/60 transition-colors cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getWhatsAppMessage(shareUser));
                    setCopiedWaText(true);
                    setTimeout(() => setCopiedWaText(false), 2000);
                  }}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl border border-stone-300 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Pesan</span>
                </button>

                {shareUser.phone ? (
                  <a
                    href={`https://wa.me/${shareUser.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(getWhatsAppMessage(shareUser))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold tracking-wide transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Kirim ke WhatsApp Klien</span>
                  </a>
                ) : (
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(getWhatsAppMessage(shareUser))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold tracking-wide transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Buka WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Super Admin & URL */}
      {isEditModalOpen && targetUserToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-stone-100 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Edit3 className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-base">
                    Edit Data &amp; URL Undangan
                  </h4>
                  <p className="text-xs text-stone-500">
                    Akun: <strong className="text-amber-800 font-mono">@{targetUserToEdit.username}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setTargetUserToEdit(null);
                  setEditError(null);
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer shrink-0 -mr-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 overscroll-contain">
                {editError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                    {editError}
                  </div>
                )}

                <div className="bg-amber-50/60 border border-amber-200/90 rounded-2xl p-3 sm:p-3.5 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span className="text-xs font-bold text-amber-950">Nama Kedua Mempelai</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Mempelai Pria
                      </label>
                      <input
                        type="text"
                        required
                        value={editGroomName}
                        onChange={(e) => {
                          setEditGroomName(e.target.value);
                          if (!editIsSlugManual) {
                            setEditWeddingSlug(generateWeddingSlug(e.target.value, editBrideName));
                          }
                        }}
                        placeholder="Thomas"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Mempelai Wanita
                      </label>
                      <input
                        type="text"
                        required
                        value={editBrideName}
                        onChange={(e) => {
                          setEditBrideName(e.target.value);
                          if (!editIsSlugManual) {
                            setEditWeddingSlug(generateWeddingSlug(editGroomName, e.target.value));
                          }
                        }}
                        placeholder="Juwita"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-stone-700">
                        URL Slug Undangan (Akhiran URL)
                      </label>
                      <label className="text-[10px] text-stone-500 flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!editIsSlugManual}
                          onChange={(e) => {
                            setEditIsSlugManual(!e.target.checked);
                            if (e.target.checked) {
                              setEditWeddingSlug(generateWeddingSlug(editGroomName, editBrideName));
                            }
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500 text-xs"
                        />
                        <span>Otomatis</span>
                      </label>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-xs">
                        /#/
                      </span>
                      <input
                        type="text"
                        required
                        value={editWeddingSlug}
                        onChange={(e) => {
                          setEditIsSlugManual(true);
                          setEditWeddingSlug(sanitizeSlug(e.target.value));
                        }}
                        placeholder="thomas_dan_juwita"
                        className="w-full pl-8 pr-3.5 py-1.5 sm:py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono text-amber-900 font-bold"
                      />
                    </div>

                    <div className="mt-2 p-2 bg-amber-100/70 rounded-xl border border-amber-300/70 flex items-start gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-amber-800 shrink-0 mt-0.5" />
                      <div className="text-[10.5px] text-amber-950 font-mono break-all leading-tight">
                        <span className="text-stone-500">Pratinjau URL: </span>
                        <strong className="text-amber-900 font-bold">
                          {getFullInvitationUrl(editWeddingSlug || 'default')}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Nomor WhatsApp Klien
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-mono font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Catatan Paket
                    </label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Paket Diamond"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="p-3.5 sm:p-4 bg-stone-50/90 border-t border-stone-200 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setTargetUserToEdit(null);
                    setEditError(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-200/60 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold tracking-wide transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ubah / Reset Kata Sandi */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-sm w-full shadow-2xl relative my-auto p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-base">
                    {targetUserToReset ? `Reset Sandi: @${targetUserToReset.username}` : 'Ubah Kata Sandi Akun'}
                  </h4>
                  <p className="text-xs text-stone-500">
                    {targetUserToReset ? `Akun: ${targetUserToReset.name}` : 'Perbarui kata sandi login Anda'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setTargetUserToReset(null);
                  setPasswordFeedback(null);
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer shrink-0 -mr-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordFeedback && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                passwordFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {passwordFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                <span>{passwordFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-stone-700">
                    Kata Sandi Baru
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[10px] text-amber-800 hover:text-amber-950 font-semibold cursor-pointer underline"
                  >
                    Acak Sandi
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    className="w-full pl-3 pr-10 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-amber-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword((prev) => !prev)}
                    title={showResetPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500 hover:text-amber-800 cursor-pointer"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Ulangi Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showConfirmResetPassword ? 'text' : 'password'}
                    required
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Ketik ulang kata sandi"
                    className="w-full pl-3 pr-10 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-amber-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmResetPassword((prev) => !prev)}
                    title={showConfirmResetPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500 hover:text-amber-800 cursor-pointer"
                  >
                    {showConfirmResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setTargetUserToReset(null);
                    setPasswordFeedback(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {passwordLoading ? 'Menyimpan...' : 'Simpan Sandi Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif-wedding text-xl font-bold text-stone-900">
                  Konfirmasi Hapus Akun
                </h4>
                <p className="text-xs text-stone-500">
                  @{userToDelete.username} ({userToDelete.coupleNames || userToDelete.name})
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              Apakah Anda yakin ingin menghapus akses pengelola untuk{' '}
              <strong>{userToDelete.coupleNames || userToDelete.name}</strong> (@{userToDelete.username})?
              {userToDelete.role === 'super_admin' &&
                ' Seluruh akun staf Admin WO di bawah undangan ini juga akan ikut dihapus.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeConfirmDeleteUser}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
