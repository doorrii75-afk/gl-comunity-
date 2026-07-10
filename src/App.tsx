/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, FolderHeart, Search, PlusCircle, Compass, Gamepad2, Sparkles, Sliders, ChevronRight, Download, Eye, AlertCircle, Lock, KeyRound, ShieldAlert } from "lucide-react";

import { Addon, Comment } from "./types";
import AddonSlider from "./components/AddonSlider";
import AddonCard from "./components/AddonCard";
import AddonDetailModal from "./components/AddonDetailModal";
import AddonUploadForm from "./components/AddonUploadForm";

export default function App() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Navigation: "beranda" | "kategori" | "cari" | "tambah"
  const [activeTab, setActiveTab] = useState<"beranda" | "kategori" | "cari" | "tambah">("beranda");
  
  // Admin passcode verification
  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(() => {
    return localStorage.getItem("glcom_admin_verified") === "true";
  });
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [adminVerificationError, setAdminVerificationError] = useState("");

  // Modals / Filtering states
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["Semua", "Survival", "Kreatif", "Transportasi", "Petualangan", "Alat (Tools)", "Skin", "Lainnya"];

  // Fetch all addons from server
  const fetchAddons = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/addons");
      if (!response.ok) {
        let errMsg = "Gagal memuat daftar add-on.";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await response.json();
      setAddons(data);
      
      // Update selected addon if currently open to ensure real-time comments and download counts
      setSelectedAddon((curr) => {
        if (!curr) return null;
        const fresh = data.find((a: Addon) => a.id === curr.id);
        return fresh || curr;
      });

      setError("");
    } catch (err: any) {
      console.error(err);
      if (!silent) {
        setError(err.message || "Gagal tersambung ke server database.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddons();

    // Setup active real-time polling every 4 seconds to sync downloads, comments, and new uploads instantly
    const interval = setInterval(() => {
      fetchAddons(true);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Handle direct download counter and save
  const handleDownload = async (addon: Addon): Promise<void> => {
    // Optimistically increment count on client-side state
    setAddons((prev) =>
      prev.map((a) => {
        if (a.id === addon.id) {
          const updated = { ...a, downloads: a.downloads + 1 };
          if (selectedAddon && selectedAddon.id === addon.id) {
            setSelectedAddon(updated);
          }
          return updated;
        }
        return a;
      })
    );

    // Perform robust blob fetch and trigger direct browser download inside sandbox iframe
    try {
      const response = await fetch(addon.fileUrl);
      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || "Gagal mengunduh file.");
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = addon.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      console.error("Error downloading file:", err);
      alert("Gagal mengunduh berkas add-on: " + err.message);
      throw err;
    }
  };

  // Handle comment submit
  const handleAddComment = async (addonId: string, username: string, text: string): Promise<Comment | null> => {
    try {
      const response = await fetch(`/api/addons/${addonId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, text }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengirim komentar.");
      }

      const newComment = (await response.json()) as Comment;

      // Update local addons list state and selectedAddon details synchronously
      setAddons((prev) =>
        prev.map((a) => {
          if (a.id === addonId) {
            const updatedAddon = { ...a, comments: [...a.comments, newComment] };
            if (selectedAddon && selectedAddon.id === addonId) {
              setSelectedAddon(updatedAddon);
            }
            return updatedAddon;
          }
          return a;
        })
      );

      return newComment;
    } catch (err) {
      console.error("Comment submit error:", err);
      return null;
    }
  };

  // Handle deleting an addon
  const handleDeleteAddon = async (addonId: string): Promise<void> => {
    // 1. Save original state for backup
    const originalAddons = [...addons];
    const originalSelected = selectedAddon;

    // 2. Optimistically remove from state and close modal instantly
    setAddons((prev) => prev.filter((a) => a.id !== addonId));
    setSelectedAddon(null);

    try {
      const response = await fetch(`/api/addons/${addonId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Gagal menghapus add-on dari server database.");
      }
    } catch (err: any) {
      console.error(err);
      // Revert state on error
      setAddons(originalAddons);
      setSelectedAddon(originalSelected);
      alert(err.message || "Gagal menghapus add-on. Silakan coba lagi.");
      throw new Error(err.message || "Gagal menghapus.");
    }
  };

  // Handle editing/updating an addon
  const handleEditAddon = async (addonId: string, updatedFields: any): Promise<boolean> => {
    try {
      const response = await fetch(`/api/addons/${addonId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedFields)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal memperbarui add-on.");
      }
      const updatedAddon = await response.json();
      setAddons((prev) => prev.map((a) => (a.id === addonId ? updatedAddon : a)));
      setSelectedAddon(updatedAddon);
      return true;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || "Gagal memperbarui.");
    }
  };

  // Upload complete handler
  const handleUploadSuccess = () => {
    fetchAddons();
    setActiveTab("beranda");
  };

  // Category change wrapper
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setActiveTab("kategori");
  };

  // Quick tag searches
  const handleTagSearch = (tag: string) => {
    setSearchQuery(tag);
    setActiveTab("cari");
  };

  // Filtered addons for Categories Tab
  const filteredCategoryAddons = addons.filter((addon) => {
    if (selectedCategory === "Semua") return true;
    return addon.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Filtered addons for Search Tab
  const filteredSearchAddons = addons.filter((addon) => {
    const q = searchQuery.toLowerCase();
    return (
      addon.name.toLowerCase().includes(q) ||
      addon.description.toLowerCase().includes(q) ||
      addon.category.toLowerCase().includes(q) ||
      addon.compatibleVersion.toLowerCase().includes(q)
    );
  });

  // Recent/latest addons (excluding popular if they are on slider, or just showing newest first)
  const latestAddons = [...addons].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Quick popular search suggestion tags
  const popularTags = ["Ores", "Furniture", "Vehicles", "Creatures", "HUD", "Weapon", "Anime", "Skin"];

  return (
    <div id="glcom-root-layout" className="min-h-screen flex flex-col relative pb-32">
      
      {/* Background abstract glowing circles */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none -z-10" />

      {/* Main Content Area */}
      <main id="glcom-main-content" className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
        
        {loading && addons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <span className="text-sm font-mono text-slate-400">Menghubungkan ke GL COM Database...</span>
          </div>
        ) : error && addons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
            <AlertCircle size={48} className="text-rose-500 mb-4" />
            <h3 className="text-lg font-display font-bold text-slate-100">Koneksi Database Gagal</h3>
            <p className="text-sm text-slate-400 mt-2 mb-6">{error}</p>
            <button
              onClick={fetchAddons}
              className="bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-transform active:scale-95"
            >
              Coba Hubungkan Kembali
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* TAB 1: BERANDA (HOME) */}
            {activeTab === "beranda" && (
              <motion.div
                key="tab-beranda"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-10"
              >
                {/* 1. Featured Auto-Slider */}
                <section id="slider-section">
                  <AddonSlider
                    addons={addons}
                    onOpenDetails={setSelectedAddon}
                    onDownload={handleDownload}
                  />
                </section>

                {/* 2. Quick Category Circle Selection */}
                <section id="quick-category-section" className="py-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-2">
                      <Compass size={16} className="text-emerald-500" />
                      Jelajahi Kategori
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-1 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                    {categories.slice(1).map((cat) => (
                      <button
                        key={cat}
                        id={`quick-cat-btn-${cat}`}
                        onClick={() => handleCategorySelect(cat)}
                        className="shrink-0 bg-slate-900 hover:bg-slate-800 border border-slate-800/80 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 rounded-2xl px-5 py-3.5 flex flex-col items-center gap-2 text-center transition-all hover:shadow-lg hover:shadow-emerald-500/5 group/cat cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800/50 flex items-center justify-center group-hover/cat:scale-110 group-hover/cat:bg-emerald-500/10 group-hover/cat:text-emerald-400 transition-all text-slate-400">
                          <Gamepad2 size={18} />
                        </div>
                        <span className="text-xs font-semibold tracking-wide">{cat}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* 3. Latest Addons Grid */}
                <section id="latest-addons-section" className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <h3 className="text-lg font-display font-bold text-slate-100 flex items-center gap-2">
                      <Sparkles size={18} className="text-emerald-400" />
                      Rilisan Add-on Terbaru
                    </h3>
                    <button
                      onClick={() => handleCategorySelect("Semua")}
                      className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Lihat Semua
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {latestAddons.map((addon) => (
                      <AddonCard
                        key={addon.id}
                        addon={addon}
                        onOpenDetails={setSelectedAddon}
                        onDownload={handleDownload}
                      />
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {/* TAB 2: KATEGORI */}
            {activeTab === "kategori" && (
              <motion.div
                key="tab-kategori"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* Heading */}
                <div>
                  <h2 className="text-2xl font-display font-black text-slate-100 tracking-tight flex items-center gap-2">
                    <Sliders size={22} className="text-emerald-500" />
                    Kategori Add-on
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Saring berbagai add-on Minecraft berdasarkan kebutuhan bermainmu.</p>
                </div>

                {/* Categories Tabs Pill */}
                <div className="flex flex-wrap items-center gap-2 pb-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      id={`pill-cat-btn-${cat}`}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/10"
                          : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Category Grid Results */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500">
                      Menampilkan <span className="text-emerald-400 font-bold">{filteredCategoryAddons.length}</span> hasil untuk "{selectedCategory}"
                    </span>
                  </div>

                  {filteredCategoryAddons.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl max-w-md mx-auto">
                      <Gamepad2 size={36} className="text-slate-600 mx-auto mb-3" />
                      <h4 className="text-sm font-bold text-slate-300">Belum Ada Add-on</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-5">Belum ada add-on yang diupload dalam kategori "{selectedCategory}" ini.</p>
                      <button
                        onClick={() => setActiveTab("tambah")}
                        className="bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all"
                      >
                        Upload Pertama Kali
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredCategoryAddons.map((addon) => (
                        <AddonCard
                          key={addon.id}
                          addon={addon}
                          onOpenDetails={setSelectedAddon}
                          onDownload={handleDownload}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 3: CARI */}
            {activeTab === "cari" && (
              <motion.div
                key="tab-cari"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* Header title */}
                <div>
                  <h2 className="text-2xl font-display font-black text-slate-100 tracking-tight flex items-center gap-2">
                    <Search size={22} className="text-emerald-500" />
                    Pencarian Mudah
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Cari nama, deskripsi, versi, atau kategori add-on secara instan.</p>
                </div>

                {/* Big Search Input Panel */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                    <Search size={20} />
                  </div>
                  <input
                    type="text"
                    placeholder="Masukkan nama add-on, keyword atau kategori..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm md:text-base shadow-xl"
                    autoFocus
                  />
                </div>

                {/* Popular Keywords Chips */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider">Populer:</span>
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      id={`tag-chip-${tag}`}
                      onClick={() => handleTagSearch(tag)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all border cursor-pointer ${
                        searchQuery.toLowerCase() === tag.toLowerCase()
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                          : "bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-xs font-mono text-rose-400 hover:text-rose-300 ml-2"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Search Results Grid */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500">
                      {searchQuery ? (
                        <>Menemukan <span className="text-emerald-400 font-bold">{filteredSearchAddons.length}</span> add-on cocok</>
                      ) : (
                        <>Ketik sesuatu di atas untuk mulai mencari dari total {addons.length} add-on</>
                      )}
                    </span>
                  </div>

                  {searchQuery && filteredSearchAddons.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl max-w-md mx-auto">
                      <Search size={36} className="text-slate-600 mx-auto mb-3" />
                      <h4 className="text-sm font-bold text-slate-300">Hasil Tidak Ditemukan</h4>
                      <p className="text-xs text-slate-500 mt-1">Kami tidak menemukan hasil untuk "{searchQuery}". Coba kata kunci lainnya.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(searchQuery ? filteredSearchAddons : addons).map((addon) => (
                        <AddonCard
                          key={addon.id}
                          addon={addon}
                          onOpenDetails={setSelectedAddon}
                          onDownload={handleDownload}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 4: TAMBAH (ADMIN UPLOAD) */}
            {activeTab === "tambah" && (
              <motion.div
                key="tab-tambah"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                {isAdminVerified ? (
                  <AddonUploadForm onUploadSuccess={handleUploadSuccess} />
                ) : (
                  <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-center relative overflow-hidden">
                    {/* Decorative glow */}
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full filter blur-xl" />
                    
                    {/* Icon Shield lock */}
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-6 shadow-lg shadow-emerald-500/5">
                      <Lock size={28} className="animate-pulse" />
                    </div>

                    <h2 className="text-xl font-display font-black text-slate-100 tracking-tight mb-2">
                      Verifikasi Khusus Admin
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6">
                      Unggah berkas add-on Minecraft di GL COM dibatasi hanya untuk Admin yang sah. Silakan masukkan kode akses admin Anda.
                    </p>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (adminCodeInput === "1920") {
                          setIsAdminVerified(true);
                          localStorage.setItem("glcom_admin_verified", "true");
                          setAdminCodeInput("");
                          setAdminVerificationError("");
                        } else {
                          setAdminVerificationError("Kode Admin salah! Silakan coba lagi.");
                        }
                      }}
                      className="space-y-4"
                    >
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
                          <KeyRound size={18} />
                        </div>
                        <input
                          type="password"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          placeholder="Masukkan Kode Admin (4 digit)"
                          value={adminCodeInput}
                          onChange={(e) => {
                            setAdminCodeInput(e.target.value);
                            setAdminVerificationError("");
                          }}
                          maxLength={6}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-xl pl-11 pr-4 py-3.5 text-center text-slate-100 font-mono tracking-widest text-lg focus:outline-none transition-all placeholder:text-slate-700 placeholder:tracking-normal placeholder:text-sm"
                          autoFocus
                          required
                        />
                      </div>

                      {adminVerificationError && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-2 justify-center text-rose-400 text-xs font-semibold bg-rose-500/5 border border-rose-500/20 p-2.5 rounded-lg"
                        >
                          <ShieldAlert size={14} className="shrink-0" />
                          <span>{adminVerificationError}</span>
                        </motion.div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("beranda");
                            setAdminCodeInput("");
                            setAdminVerificationError("");
                          }}
                          className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold py-3.5 rounded-xl transition-all cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 text-xs font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
                        >
                          Verifikasi
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>

      {/* Floating Bottom Menu Glassmorphism Navigation Dock (Mobile-First / Super Modern) */}
      <nav id="floating-bottom-nav" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-45 w-[92%] max-w-md bg-slate-950/80 backdrop-blur-lg border border-slate-800/80 rounded-2xl px-4 py-2.5 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-around relative">
          
          {/* Menu Button: Beranda */}
          <button
            id="nav-btn-beranda"
            onClick={() => { setActiveTab("beranda"); setSelectedCategory("Semua"); }}
            className={`relative flex flex-col items-center gap-1.5 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === "beranda" ? "text-emerald-400 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {activeTab === "beranda" && (
              <motion.span
                layoutId="nav-glow-bubble"
                className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            <Home size={20} className={activeTab === "beranda" ? "scale-110 text-emerald-400" : ""} />
            <span className="text-[10px] tracking-wide uppercase font-semibold">Beranda</span>
          </button>

          {/* Menu Button: Kategori */}
          <button
            id="nav-btn-kategori"
            onClick={() => setActiveTab("kategori")}
            className={`relative flex flex-col items-center gap-1.5 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === "kategori" ? "text-emerald-400 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {activeTab === "kategori" && (
              <motion.span
                layoutId="nav-glow-bubble"
                className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            <FolderHeart size={20} className={activeTab === "kategori" ? "scale-110 text-emerald-400" : ""} />
            <span className="text-[10px] tracking-wide uppercase font-semibold">Kategori</span>
          </button>

          {/* Menu Button: Cari */}
          <button
            id="nav-btn-cari"
            onClick={() => setActiveTab("cari")}
            className={`relative flex flex-col items-center gap-1.5 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === "cari" ? "text-emerald-400 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {activeTab === "cari" && (
              <motion.span
                layoutId="nav-glow-bubble"
                className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            <Search size={20} className={activeTab === "cari" ? "scale-110 text-emerald-400" : ""} />
            <span className="text-[10px] tracking-wide uppercase font-semibold">Cari</span>
          </button>

          {/* Menu Button: Tambah */}
          <button
            id="nav-btn-tambah"
            onClick={() => setActiveTab("tambah")}
            className={`relative flex flex-col items-center gap-1.5 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === "tambah" ? "text-emerald-400 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {activeTab === "tambah" && (
              <motion.span
                layoutId="nav-glow-bubble"
                className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            <PlusCircle size={20} className={activeTab === "tambah" ? "scale-110 text-emerald-400" : ""} />
            <span className="text-[10px] tracking-wide uppercase font-semibold">Tambah</span>
          </button>

        </div>
      </nav>

      {/* Detail Overlay Modal */}
      <AnimatePresence>
        {selectedAddon && (
          <AddonDetailModal
            addon={selectedAddon}
            onClose={() => setSelectedAddon(null)}
            onDownload={handleDownload}
            onAddComment={handleAddComment}
            isAdminVerified={isAdminVerified}
            onEditAddon={handleEditAddon}
            onDeleteAddon={handleDeleteAddon}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
