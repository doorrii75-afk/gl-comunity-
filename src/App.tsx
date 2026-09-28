/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, FolderHeart, Search, PlusCircle, Compass, Gamepad2, Sparkles, Sliders, ChevronRight, Download, AlertCircle, Lock, KeyRound, ShieldAlert, Globe, Bell, Trash2, CheckCheck, X, Sun, Moon, TrendingUp } from "lucide-react";

import { Addon, Comment } from "./types";
import AddonSlider from "./components/AddonSlider";
import AddonCard from "./components/AddonCard";
import AddonDetailModal from "./components/AddonDetailModal";
import AddonUploadForm from "./components/AddonUploadForm";
import ModrinthExplore from "./components/ModrinthExplore";
import MACXXLogo from "./components/MACXXLogo";

const WhatsAppIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function App() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("hc-theme");
    return (saved as "dark" | "light") || "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") root.classList.add("light");
    else root.classList.remove("light");
    localStorage.setItem("hc-theme", theme);
  }, [theme]);

  const [activeTab, setActiveTab] = useState<"beranda" | "kategori" | "cari" | "tambah" | "modrinth">("beranda");

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMouseIn, setIsMouseIn] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; left: number; size: number; delay: number; duration: number }>>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isTabChanging, setIsTabChanging] = useState(false);

  useEffect(() => {
    const items = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.floor(Math.random() * 8) + 4,
      delay: Math.random() * 8,
      duration: Math.random() * 18 + 14,
    }));
    setParticles(items);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      setIsMouseIn(true);
    };
    const handleMouseLeave = () => setIsMouseIn(false);

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    setIsTabChanging(true);
    setLoadingProgress(15);
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) { clearInterval(interval); return 90; }
        return prev + Math.floor(Math.random() * 12) + 6;
      });
    }, 60);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setLoadingProgress(100);
      setTimeout(() => { setIsTabChanging(false); setLoadingProgress(0); }, 150);
    }, 250);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [activeTab]);

  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(() => localStorage.getItem("glcom_admin_verified") === "true");
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [adminVerificationError, setAdminVerificationError] = useState("");

  const [dbStatus, setDbStatus] = useState<{ isFirestoreExhausted: boolean; lastFirestoreError: string; projectId: string; databaseId: string } | null>(null);

  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["Semua", "Survival", "Kreatif", "Transportasi", "Petualangan", "Alat (Tools)", "Skin", "Lainnya"];

  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("heavencraft_notifications") || localStorage.getItem("glcom_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activeToasts, setActiveToasts] = useState<any[]>([]);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const seenAddonIdsRef = React.useRef<Set<string>>(new Set());
  const isInitialLoadRef = React.useRef(true);

  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (err) { console.warn("AudioContext failed:", err); }
  };

  const triggerNewAddonNotification = (addon: Addon) => {
    playNotificationSound();
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotif = {
      id: notifId, addonId: addon.id, title: "Add-on Baru Dirilis!",
      message: `"${addon.name}" baru saja diunggah oleh ${addon.author} di kategori ${addon.category}.`,
      category: addon.category, createdAt: new Date().toISOString(), read: false, addon: addon
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      localStorage.setItem("heavencraft_notifications", JSON.stringify(updated));
      return updated;
    });
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setActiveToasts(prev => [...prev, { id: toastId, title: "🎉 Add-on Baru!", message: `"${addon.name}" oleh ${addon.author}`, addon: addon }]);
    setTimeout(() => { setActiveToasts(prev => prev.filter(t => t.id !== toastId)); }, 5000);
  };

  const fetchDbStatus = async () => {
    try {
      const response = await fetch("/api/db-status");
      if (response.ok) { const data = await response.json(); setDbStatus(data); }
    } catch (err) { console.warn("Gagal mengambil status database:", err); }
  };

  const fetchAddons = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/addons");
      if (!response.ok) {
        let errMsg = "Gagal memuat daftar add-on.";
        try { const errData = await response.json(); if (errData && errData.error) errMsg = errData.error; } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await response.json();
      setAddons(data);
      if (data && Array.isArray(data)) {
        if (isInitialLoadRef.current) {
          const initialSet = new Set<string>();
          data.forEach((addon: Addon) => initialSet.add(addon.id));
          seenAddonIdsRef.current = initialSet;
          isInitialLoadRef.current = false;
        } else {
          const newItems = data.filter((addon: Addon) => !seenAddonIdsRef.current.has(addon.id));
          if (newItems.length > 0) {
            newItems.forEach((addon: Addon) => { seenAddonIdsRef.current.add(addon.id); triggerNewAddonNotification(addon); });
          }
        }
      }
      setSelectedAddon((curr) => { if (!curr) return null; const fresh = data.find((a: Addon) => a.id === curr.id); return fresh || curr; });
      setError("");
    } catch (err: any) {
      console.error(err);
      if (!silent) setError(err.message || "Gagal tersambung ke server database.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchBroadcasts = async () => {
    try {
      const response = await fetch("/api/broadcasts");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const processedRaw = localStorage.getItem("heavencraft_processed_broadcasts") || "[]";
          let processedIds: string[] = [];
          try { processedIds = JSON.parse(processedRaw); } catch { processedIds = []; }
          let hasNew = false;
          const newProcessed = [...processedIds];
          data.forEach((b: any) => {
            if (!processedIds.includes(b.id)) {
              hasNew = true; newProcessed.push(b.id); playNotificationSound();
              const notifId = `broadcast-${b.id}`;
              const newNotif = {
                id: notifId, addonId: null, title: b.title, message: b.message,
                category: b.type === "danger" ? "Darurat" : b.type === "warning" ? "Penting" : b.type === "success" ? "Sukses" : "Informasi",
                createdAt: b.createdAt || new Date().toISOString(), read: false, isBroadcast: true
              };
              setNotifications((prev: any[]) => { const filtered = prev.filter(n => n.id !== notifId); const updated = [newNotif, ...filtered]; localStorage.setItem("heavencraft_notifications", JSON.stringify(updated)); return updated; });
              const toastId = `toast-broadcast-${b.id}`;
              setActiveToasts((prev: any[]) => { const filtered = prev.filter(t => t.id !== toastId); return [...filtered, { id: toastId, title: b.title, message: b.message, isBroadcast: true, type: b.type }]; });
              setTimeout(() => { setActiveToasts((prev: any[]) => prev.filter(t => t.id !== toastId)); }, 7000);
            }
          });
          if (hasNew) localStorage.setItem("heavencraft_processed_broadcasts", JSON.stringify(newProcessed));
        }
      }
    } catch (err) { console.warn("Gagal mengambil update broadcast:", err); }
  };

  useEffect(() => {
    fetchAddons(); fetchDbStatus(); fetchBroadcasts();
    const interval = setInterval(() => { fetchAddons(true); fetchDbStatus(); fetchBroadcasts(); }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDownload = async (addon: Addon): Promise<void> => {
    setAddons((prev) => prev.map((a) => {
      if (a.id === addon.id) {
        const updated = { ...a, downloads: a.downloads + 1 };
        if (selectedAddon && selectedAddon.id === addon.id) setSelectedAddon(updated);
        return updated;
      }
      return a;
    }));
    try {
      const response = await fetch(addon.fileUrl);
      if (!response.ok) { const errorMsg = await response.text(); throw new Error(errorMsg || "Gagal mengunduh file."); }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl; link.download = addon.fileName;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      console.error("Error downloading file:", err);
      alert("Gagal mengunduh berkas add-on: " + err.message);
      throw err;
    }
  };

  const handleAddComment = async (addonId: string, username: string, text: string): Promise<Comment | null> => {
    try {
      const response = await fetch(`/api/addons/${addonId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, text }) });
      if (!response.ok) throw new Error("Gagal mengirim komentar.");
      const newComment = (await response.json()) as Comment;
      setAddons((prev) => prev.map((a) => {
        if (a.id === addonId) {
          const updatedAddon = { ...a, comments: [...a.comments, newComment] };
          if (selectedAddon && selectedAddon.id === addonId) setSelectedAddon(updatedAddon);
          return updatedAddon;
        }
        return a;
      }));
      return newComment;
    } catch (err) { console.error("Comment submit error:", err); return null; }
  };

  const handleAddRating = async (addonId: string, rating: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/addons/${addonId}/rate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating }) });
      if (!response.ok) throw new Error("Gagal mengirim rating.");
      const data = await response.json();
      setAddons((prev) => prev.map((a) => {
        if (a.id === addonId) {
          const updatedAddon = { ...a, ratingSum: data.ratingSum, ratingCount: data.ratingCount };
          if (selectedAddon && selectedAddon.id === addonId) setSelectedAddon(updatedAddon);
          return updatedAddon;
        }
        return a;
      }));
      return true;
    } catch (err) { console.error("Error adding rating:", err); return false; }
  };

  const handleDeleteAddon = async (addonId: string): Promise<void> => {
    const originalAddons = [...addons];
    const originalSelected = selectedAddon;
    setAddons((prev) => prev.filter((a) => a.id !== addonId));
    setSelectedAddon(null);
    try {
      const response = await fetch(`/api/addons/${addonId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Gagal menghapus add-on dari server database.");
    } catch (err: any) {
      console.error(err);
      setAddons(originalAddons); setSelectedAddon(originalSelected);
      alert(err.message || "Gagal menghapus add-on. Silakan coba lagi.");
      throw new Error(err.message || "Gagal menghapus.");
    }
  };

  const handleEditAddon = async (addonId: string, updatedFields: any): Promise<boolean> => {
    try {
      const response = await fetch(`/api/addons/${addonId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatedFields) });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || "Gagal memperbarui add-on."); }
      const updatedAddon = await response.json();
      setAddons((prev) => prev.map((a) => (a.id === addonId ? updatedAddon : a)));
      setSelectedAddon(updatedAddon);
      return true;
    } catch (err: any) { console.error(err); throw new Error(err.message || "Gagal memperbarui."); }
  };

  const handleUploadSuccess = () => { fetchAddons(); setActiveTab("beranda"); };
  const handleCategorySelect = (category: string) => { setSelectedCategory(category); setActiveTab("kategori"); };
  const handleTagSearch = (tag: string) => { setSearchQuery(tag); setActiveTab("cari"); };

  const filteredCategoryAddons = addons.filter((addon) => {
    if (selectedCategory === "Semua") return true;
    const cat = addon.category || "Survival";
    return cat.toLowerCase() === selectedCategory.toLowerCase();
  });

  const filteredSearchAddons = addons.filter((addon) => {
    const q = searchQuery.toLowerCase();
    const name = addon.name || "Add-on Tanpa Nama";
    const desc = addon.description || "Tidak ada deskripsi.";
    const cat = addon.category || "Survival";
    const version = addon.compatibleVersion || "1.21.x";
    return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || cat.toLowerCase().includes(q) || version.toLowerCase().includes(q);
  });

  const latestAddons = [...addons].sort((a, b) => {
    const dateA = new Date(a.createdAt || new Date().toISOString()).getTime();
    const dateB = new Date(b.createdAt || new Date().toISOString()).getTime();
    return dateB - dateA;
  });

  const popularTags = ["Ores", "Furniture", "Vehicles", "Creatures", "HUD", "Weapon", "Anime", "Skin"];
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col relative pb-28 premium-noise">
      {/* Top progress bar */}
      {isTabChanging && (
        <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-transparent z-50">
          <div className="h-full brand-grad-bg transition-all duration-150 ease-out" style={{ width: `${loadingProgress}%` }} />
        </div>
      )}

      {/* Cursor glow */}
      {isMouseIn && (
        <div className="pointer-events-none fixed z-40 w-[300px] h-[300px] rounded-full bg-emerald-500/[0.03] blur-[80px] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300" style={{ left: mousePos.x, top: mousePos.y }} />
      )}

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 select-none">
        <div className="absolute -top-[10%] left-[5%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/[0.05] blur-[120px] animate-aurora-1" />
        <div className="absolute -bottom-[15%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/[0.04] blur-[130px] animate-aurora-2" />
        <div className="absolute top-[30%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-teal-400/[0.03] blur-[100px] animate-aurora-3" />
        <div className="absolute inset-0 tech-grid opacity-75" />
        <div className="absolute inset-0 soft-vignette" />
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: "105vh", x: `${p.left}vw`, opacity: 0, rotate: 0 }}
            animate={{ y: "-10vh", opacity: [0, 0.3, 0.3, 0], rotate: [0, 90, 180, 270] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
            className="absolute bg-emerald-500/10 border border-emerald-500/10 rounded-xs"
            style={{ width: p.size, height: p.size }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full glass-header py-3 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <MACXXLogo size={38} className="rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-transform duration-300 hover:scale-110" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            <div>
              <h1 className="text-base font-display font-black tracking-tight brand-text leading-none">MACXX</h1>
              <p className="text-[10px] font-mono text-slate-500 mt-0.5">Add-on Hub</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2.5">
            <motion.a
              href="https://whatsapp.com/channel/0029VbDP78KHQbSDJWQp6H2n"
              target="_blank" rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="relative px-3 py-2 rounded-xl border bg-slate-950/60 border-emerald-500/25 text-emerald-400 hover:text-emerald-300 hover:border-emerald-400/50 transition-all cursor-pointer flex items-center gap-2 font-mono text-xs font-bold"
              title="Ikuti Saluran WhatsApp MACXX UPDATE"
            >
              <WhatsAppIcon size={15} />
              <span className="hidden sm:inline">Saluran WA</span>
            </motion.a>

            <motion.button
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl border bg-slate-900/60 border-slate-800 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer flex items-center justify-center"
              title={theme === "dark" ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </motion.button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  isNotifDropdownOpen ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
                title="Notifikasi"
              >
                <Bell size={17} className={unreadCount > 0 ? "animate-bounce" : ""} />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute top-1.5 right-1.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-slate-950" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <AnimatePresence>
                {isNotifDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsNotifDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 350, damping: 24 }}
                      className="absolute right-0 mt-3 z-40 w-80 sm:w-96 glass-premium border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden p-1 flex flex-col text-left"
                    >
                      <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold uppercase tracking-wide text-slate-400">Pemberitahuan</span>
                          {unreadCount > 0 && <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md">{unreadCount} Baru</span>}
                        </div>
                        {notifications.length > 0 && (
                          <button
                            onClick={() => { const updated = notifications.map(n => ({ ...n, read: true })); setNotifications(updated); localStorage.setItem("heavencraft_notifications", JSON.stringify(updated)); }}
                            className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <CheckCheck size={11} /> Baca Semua
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto no-scrollbar flex-1 divide-y divide-slate-900/50">
                        {notifications.length === 0 ? (
                          <div className="py-12 px-4 flex flex-col items-center justify-center text-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800/60 flex items-center justify-center text-slate-600"><Bell size={18} /></div>
                            <div>
                              <p className="text-xs font-bold text-slate-400">Belum ada notifikasi</p>
                              <p className="text-[10px] text-slate-600 mt-1">Anda akan menerima pemberitahuan instan saat add-on baru diunggah.</p>
                            </div>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div key={notif.id} className={`p-3.5 flex gap-3 transition-colors hover:bg-slate-900/40 relative ${!notif.read ? "bg-emerald-500/[0.02]" : ""}`}>
                              {!notif.read && <span className="absolute top-4 left-2.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-emerald-400"><Sparkles size={16} /></div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`text-[10px] font-mono uppercase font-bold tracking-wide ${notif.category === "Darurat" ? "text-rose-400" : notif.category === "Penting" ? "text-amber-400" : notif.category === "Sukses" ? "text-emerald-400" : notif.isSimulation ? "text-amber-400" : "text-emerald-500"}`}>{notif.category || "Addon baru"}</span>
                                  <span className="text-[9px] font-mono text-slate-600 shrink-0">{new Date(notif.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                                <h5 className="text-xs font-bold text-slate-200 leading-snug">{notif.title}</h5>
                                <p className="text-[11px] text-slate-400 leading-normal break-words">{notif.message}</p>
                                {notif.addon && (
                                  <button onClick={() => { const updated = notifications.map(n => n.id === notif.id ? { ...n, read: true } : n); setNotifications(updated); localStorage.setItem("heavencraft_notifications", JSON.stringify(updated)); setSelectedAddon(notif.addon); setIsNotifDropdownOpen(false); }} className="text-[10px] font-mono text-emerald-400 font-bold hover:underline transition-all pt-1 flex items-center gap-1 cursor-pointer">Lihat Detail Add-on &rarr;</button>
                                )}
                              </div>
                              <button onClick={() => { const updated = notifications.filter(n => n.id !== notif.id); setNotifications(updated); localStorage.setItem("heavencraft_notifications", JSON.stringify(updated)); }} className="text-slate-700 hover:text-slate-400 p-1 rounded-md self-start transition-colors cursor-pointer" title="Hapus"><X size={11} /></button>
                            </div>
                          ))
                        )}
                      </div>

                      {notifications.length > 0 && (
                        <div className="p-2 border-t border-slate-800/60 flex items-center justify-end">
                          <button onClick={() => { setNotifications([]); localStorage.setItem("heavencraft_notifications", JSON.stringify([])); }} className="text-[10px] font-mono text-rose-400 hover:text-rose-300 font-bold px-2.5 py-1.5 rounded-lg hover:bg-rose-500/5 transition-colors flex items-center gap-1 cursor-pointer"><Trash2 size={11} /> Bersihkan Semua</button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Toasts */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-[92%] sm:w-full">
        <AnimatePresence>
          {activeToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="pointer-events-auto glass-premium border border-slate-800/80 rounded-2xl p-4 shadow-2xl flex gap-3 relative overflow-hidden text-left"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${toast.isBroadcast && toast.type === "danger" ? "bg-rose-500" : toast.isBroadcast && toast.type === "warning" ? "bg-amber-400" : toast.isBroadcast && toast.type === "success" ? "bg-emerald-500" : toast.isBroadcast ? "bg-cyan-500" : toast.isSimulation ? "bg-amber-400" : "bg-emerald-500"}`} />
              <div className={`p-2 border rounded-xl shrink-0 self-start ${toast.isBroadcast && toast.type === "danger" ? "bg-rose-950/40 border-rose-500/30 text-rose-400" : toast.isBroadcast && toast.type === "warning" ? "bg-amber-950/40 border-amber-500/30 text-amber-400" : toast.isBroadcast && toast.type === "success" ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400" : toast.isBroadcast ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-400" : "bg-slate-900 border-slate-800 text-emerald-400"}`}>
                <Bell size={18} className="animate-bounce" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-xs font-mono font-bold tracking-wide uppercase text-slate-500">{toast.isBroadcast ? "📢 Broadcast Pengumuman" : toast.isSimulation ? "🔔 Simulasi Notifikasi" : "🎉 Rilisan Baru!"}</h4>
                <p className="text-xs font-bold text-slate-100 leading-snug">{toast.title}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">{toast.message}</p>
                {toast.addon && (
                  <button onClick={() => { setSelectedAddon(toast.addon); setActiveToasts(prev => prev.filter(t => t.id !== toast.id)); }} className="text-[10px] font-mono font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer">Buka Sekarang &rarr;</button>
                )}
              </div>
              <button onClick={() => setActiveToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-slate-600 hover:text-slate-400 p-1 rounded-lg self-start cursor-pointer"><X size={14} /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* DB Quota Warning */}
      {dbStatus?.isFirestoreExhausted && isAdminVerified && (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-4">
          <div className="bg-amber-950/30 border border-amber-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-start gap-4 shadow-xl backdrop-blur-md">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 shrink-0"><AlertCircle size={20} /></div>
            <div className="flex-1 space-y-1 text-left">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">Sistem Status: Mode Fail-safe Aktif</h4>
              <p className="text-xs leading-relaxed text-slate-300">Penyimpanan cloud Firestore telah mencapai limit. Sistem beralih ke mode cadangan lokal.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
        {loading && addons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <span className="text-sm font-mono text-slate-400">Loading...</span>
          </div>
        ) : error && addons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
            <AlertCircle size={48} className="text-rose-500 mb-4" />
            <h3 className="text-lg font-display font-bold text-slate-100">Koneksi Database Gagal</h3>
            <p className="text-sm text-slate-400 mt-2 mb-6">{error}</p>
            <button onClick={fetchAddons} className="brand-grad-bg text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-transform active:scale-95">Coba Hubungkan Kembali</button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* TAB: BERANDA */}
            {activeTab === "beranda" && (
              <motion.div key="tab-beranda" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-8">
                {/* Hero Search */}
                <section className="space-y-4 pt-2">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors"><Search size={20} /></div>
                    <input
                      type="text"
                      placeholder="Cari add-on Minecraft..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full glass-premium border border-slate-800/80 rounded-2xl pl-12 pr-4 py-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm md:text-base shadow-xl"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider">Populer:</span>
                    {popularTags.map((tag) => (
                      <button key={tag} onClick={() => handleTagSearch(tag)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all border cursor-pointer ${searchQuery.toLowerCase() === tag.toLowerCase() ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"}`}>#{tag}</button>
                    ))}
                    {searchQuery && <button onClick={() => setSearchQuery("")} className="text-xs font-mono text-rose-400 hover:text-rose-300 ml-2">Clear</button>}
                  </div>
                </section>

                {!searchQuery ? (
                  <>
                    <section><AddonSlider addons={addons} onOpenDetails={setSelectedAddon} onDownload={handleDownload} /></section>

                    <section className="py-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-2"><Compass size={15} className="text-emerald-500" /> Jelajahi Kategori</h3>
                      </div>
                      <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                        {categories.slice(1).map((cat) => (
                          <button key={cat} onClick={() => handleCategorySelect(cat)} className="shrink-0 glass-premium border border-slate-800/60 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 rounded-2xl px-4 py-3 flex flex-col items-center gap-2 text-center transition-all hover:shadow-lg hover:shadow-emerald-500/5 group/cat cursor-pointer">
                            <div className="w-9 h-9 rounded-xl bg-slate-950/50 border border-slate-800/50 flex items-center justify-center group-hover/cat:scale-110 group-hover/cat:bg-emerald-500/10 group-hover/cat:text-emerald-400 transition-all text-slate-400"><Gamepad2 size={16} /></div>
                            <span className="text-xs font-semibold tracking-wide">{cat}</span>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                        <h3 className="text-lg font-display font-bold text-slate-100 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-400" /> Rilisan Add-on Terbaru</h3>
                        <button onClick={() => handleCategorySelect("Semua")} className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer">Lihat Semua <ChevronRight size={14} /></button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {latestAddons.map((addon) => <AddonCard key={addon.id} addon={addon} onOpenDetails={setSelectedAddon} onDownload={handleDownload} />)}
                      </div>
                    </section>
                  </>
                ) : (
                  <section className="space-y-4 pt-1">
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                      <h3 className="text-lg font-display font-bold text-slate-100 flex items-center gap-2"><Search size={18} className="text-emerald-400 animate-pulse" /> Hasil Pencarian</h3>
                      <span className="text-xs font-mono text-slate-500">Menemukan <span className="text-emerald-400 font-bold">{filteredSearchAddons.length}</span> add-on</span>
                    </div>
                    {filteredSearchAddons.length === 0 ? (
                      <div className="text-center py-20 border border-dashed border-slate-800/60 rounded-3xl max-w-md mx-auto">
                        <Search size={36} className="text-slate-600 mx-auto mb-3 animate-bounce" />
                        <h4 className="text-sm font-bold text-slate-300">Hasil Tidak Ditemukan</h4>
                        <p className="text-xs text-slate-500 mt-1">Coba kata kunci lainnya.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredSearchAddons.map((addon) => <AddonCard key={addon.id} addon={addon} onOpenDetails={setSelectedAddon} onDownload={handleDownload} />)}
                      </div>
                    )}
                  </section>
                )}
              </motion.div>
            )}

            {/* TAB: KATEGORI */}
            {activeTab === "kategori" && (
              <motion.div key="tab-kategori" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-black text-slate-100 tracking-tight flex items-center gap-2"><Sliders size={22} className="text-emerald-500" /> Kategori Add-on</h2>
                  <p className="text-xs text-slate-400 mt-1">Saring add-on berdasarkan kebutuhan bermainmu.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 pb-1">
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${selectedCategory === cat ? "brand-grad-bg text-slate-950 font-bold shadow-lg shadow-emerald-500/10" : "glass-premium border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"}`}>{cat}</button>
                  ))}
                </div>
                <div className="space-y-4">
                  <span className="text-xs font-mono text-slate-500">Menampilkan <span className="text-emerald-400 font-bold">{filteredCategoryAddons.length}</span> hasil untuk "{selectedCategory}"</span>
                  {filteredCategoryAddons.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-slate-800/60 rounded-3xl max-w-md mx-auto">
                      <Gamepad2 size={36} className="text-slate-600 mx-auto mb-3" />
                      <h4 className="text-sm font-bold text-slate-300">Belum Ada Add-on</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-5">Belum ada add-on dalam kategori "{selectedCategory}".</p>
                      <button onClick={() => setActiveTab("tambah")} className="bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all">Upload Pertama Kali</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredCategoryAddons.map((addon) => <AddonCard key={addon.id} addon={addon} onOpenDetails={setSelectedAddon} onDownload={handleDownload} />)}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB: CARI */}
            {activeTab === "cari" && (
              <motion.div key="tab-cari" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-black text-slate-100 tracking-tight flex items-center gap-2"><Search size={22} className="text-emerald-500" /> Cari Add-on</h2>
                  <p className="text-xs text-slate-400 mt-1">Temukan add-on Minecraft Bedrock favoritmu.</p>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors"><Search size={20} /></div>
                  <input type="text" placeholder="Ketik nama, deskripsi, atau kategori..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full glass-premium border border-slate-800/80 rounded-2xl pl-12 pr-4 py-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm md:text-base shadow-xl" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {popularTags.map((tag) => <button key={tag} onClick={() => setSearchQuery(tag)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all border cursor-pointer ${searchQuery.toLowerCase() === tag.toLowerCase() ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"}`}>#{tag}</button>)}
                </div>
                {filteredSearchAddons.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-slate-800/60 rounded-3xl max-w-md mx-auto">
                    <Search size={36} className="text-slate-600 mx-auto mb-3 animate-bounce" />
                    <h4 className="text-sm font-bold text-slate-300">Hasil Tidak Ditemukan</h4>
                    <p className="text-xs text-slate-500 mt-1">Coba kata kunci lainnya.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredSearchAddons.map((addon) => <AddonCard key={addon.id} addon={addon} onOpenDetails={setSelectedAddon} onDownload={handleDownload} />)}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: TAMBAH */}
            {activeTab === "tambah" && (
              <motion.div key="tab-tambah" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                {isAdminVerified ? (
                  <AddonUploadForm onUploadSuccess={handleUploadSuccess} />
                ) : (
                  <div className="max-w-md mx-auto glass-premium border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl text-center relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full filter blur-xl" />
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-6 shadow-lg shadow-emerald-500/5"><Lock size={28} className="animate-pulse" /></div>
                    <h2 className="text-xl font-display font-black text-slate-100 tracking-tight mb-2">Verifikasi Khusus Admin</h2>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6">Unggah add-on di MACXX dibatasi hanya untuk Admin. Masukkan kode akses admin Anda.</p>
                    <form onSubmit={(e) => { e.preventDefault(); if (adminCodeInput === "2010") { setIsAdminVerified(true); localStorage.setItem("glcom_admin_verified", "true"); setAdminCodeInput(""); setAdminVerificationError(""); } else { setAdminVerificationError("Kode Admin salah! Silakan coba lagi."); } }} className="space-y-4">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500"><KeyRound size={18} /></div>
                        <input type="password" pattern="[0-9]*" inputMode="numeric" placeholder="Masukkan Kode Admin (4 digit)" value={adminCodeInput} onChange={(e) => { setAdminCodeInput(e.target.value); setAdminVerificationError(""); }} maxLength={6} className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-xl pl-11 pr-4 py-3.5 text-center text-slate-100 font-mono tracking-widest text-lg focus:outline-none transition-all placeholder:text-slate-700 placeholder:tracking-normal placeholder:text-sm" autoFocus required />
                      </div>
                      {adminVerificationError && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 justify-center text-rose-400 text-xs font-semibold bg-rose-500/5 border border-rose-500/20 p-2.5 rounded-lg"><ShieldAlert size={14} className="shrink-0" /><span>{adminVerificationError}</span></motion.div>
                      )}
                      <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => { setActiveTab("beranda"); setAdminCodeInput(""); setAdminVerificationError(""); }} className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold py-3.5 rounded-xl transition-all cursor-pointer">Batal</button>
                        <button type="submit" className="flex-1 brand-grad-bg text-slate-950 text-xs font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer">Verifikasi</button>
                      </div>
                    </form>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: MODRINTH */}
            {activeTab === "modrinth" && (
              <motion.div key="tab-modrinth" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                <ModrinthExplore />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-md glass-premium border border-white/10 rounded-2xl px-1.5 py-2 shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between gap-0.5">
          {[
            { id: "beranda", icon: Home, label: "Beranda", onClick: () => { setActiveTab("beranda"); setSelectedCategory("Semua"); } },
            { id: "kategori", icon: FolderHeart, label: "Kategori", onClick: () => setActiveTab("kategori") },
            { id: "modrinth", icon: Globe, label: "Modrinth", onClick: () => setActiveTab("modrinth") },
            { id: "tambah", icon: PlusCircle, label: "Tambah", onClick: () => setActiveTab("tambah") },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={item.onClick} className={`relative flex-1 flex flex-col items-center gap-1 py-1.5 px-0.5 sm:px-2 rounded-xl transition-all cursor-pointer ${active ? "text-emerald-400 font-bold" : "text-slate-500 hover:text-slate-300"}`}>
                {active && <motion.span layoutId="nav-glow-bubble" className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-xl -z-10" transition={{ type: "spring", stiffness: 350, damping: 25 }} />}
                <Icon size={18} className={active ? "scale-110" : ""} />
                <span className="responsive-nav-text uppercase font-semibold whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAddon && (
          <AddonDetailModal addon={selectedAddon} onClose={() => setSelectedAddon(null)} onDownload={handleDownload} onAddComment={handleAddComment} onAddRating={handleAddRating} isAdminVerified={isAdminVerified} onEditAddon={handleEditAddon} onDeleteAddon={handleDeleteAddon} />
        )}
      </AnimatePresence>
    </div>
  );
}
