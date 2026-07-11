/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Download,
  MessageSquare,
  Tag,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Edit,
  Trash2,
  Save,
  ArrowLeft,
  Upload,
  FileCode,
  Image as ImageIcon,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Addon, Comment } from "../types";

interface AddonDetailModalProps {
  addon: Addon;
  onClose: () => void;
  onDownload: (addon: Addon) => any;
  onAddComment: (addonId: string, username: string, text: string) => Promise<Comment | null>;
  isAdminVerified?: boolean;
  onEditAddon?: (addonId: string, updatedFields: any) => Promise<boolean>;
  onDeleteAddon?: (addonId: string) => Promise<void>;
}

export default function AddonDetailModal({
  addon,
  onClose,
  onDownload,
  onAddComment,
  isAdminVerified = false,
  onEditAddon,
  onDeleteAddon
}: AddonDetailModalProps) {
  const [username, setUsername] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [editName, setEditName] = useState(addon.name);
  const [editDescription, setEditDescription] = useState(addon.description);
  const [editCategory, setEditCategory] = useState(addon.category);
  const [editCompatibleVersion, setEditCompatibleVersion] = useState(addon.compatibleVersion);
  const [editAuthor, setEditAuthor] = useState(addon.author || "Admin");

  // Cover upload states
  const [editCoverBase64, setEditCoverBase64] = useState("");
  const [editCoverName, setEditCoverName] = useState("");
  const [editCoverPreview, setEditCoverPreview] = useState(addon.coverUrl);

  // File upload states
  const [editFileBase64, setEditFileBase64] = useState("");
  const [editFileName, setEditFileName] = useState(addon.fileName);
  const [editFileSize, setEditFileSize] = useState(addon.fileSize);

  // Statuses
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadClick = async () => {
    setIsDownloading(true);
    try {
      await onDownload(addon);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const editCoverInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const categories = ["Survival", "Kreatif", "Transportasi", "Petualangan", "Alat (Tools)", "Skin", "Lainnya"];

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const handleEditCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setEditErrorMsg("Cover harus berupa file gambar!");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setEditCoverBase64(base64);
      setEditCoverName(file.name);
      setEditCoverPreview(base64);
      setEditErrorMsg("");
    } catch (err) {
      setEditErrorMsg("Gagal membaca file gambar.");
    }
  };

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowed = ["mcaddon", "mcpack", "mctemplate", "zip", "rar"];
    if (ext && !allowed.includes(ext)) {
      setEditErrorMsg("Harap upload file Minecraft yang valid (.mcaddon, .mcpack, .zip)!");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setEditFileBase64(base64);
      setEditFileName(file.name);
      setEditFileSize(formatBytes(file.size));
      setEditErrorMsg("");
    } catch (err) {
      setEditErrorMsg("Gagal membaca file add-on.");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editDescription.trim() || !editCompatibleVersion.trim()) {
      setEditErrorMsg("Semua kolom wajib diisi!");
      return;
    }

    setIsSaving(true);
    setEditErrorMsg("");

    try {
      const fieldsToUpdate: any = {
        name: editName,
        description: editDescription,
        category: editCategory,
        compatibleVersion: editCompatibleVersion,
        author: editAuthor
      };

      if (editCoverBase64) {
        fieldsToUpdate.coverBase64 = editCoverBase64;
      }
      if (editFileBase64) {
        fieldsToUpdate.fileBase64 = editFileBase64;
        fieldsToUpdate.fileName = editFileName;
        fieldsToUpdate.fileSize = editFileSize;
      }

      if (onEditAddon) {
        const success = await onEditAddon(addon.id, fieldsToUpdate);
        if (success) {
          setIsEditing(false);
          setEditCoverBase64("");
          setEditFileBase64("");
        }
      }
    } catch (err: any) {
      setEditErrorMsg(err.message || "Gagal memperbarui add-on.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDeleteAddon) {
        await onDeleteAddon(addon.id);
      }
    } catch (err: any) {
      setEditErrorMsg(err.message || "Gagal menghapus add-on.");
      setIsDeleting(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError("");

    if (!username.trim()) {
      setCommentError("Username wajib diisi!");
      return;
    }
    if (!commentText.trim()) {
      setCommentError("Komentar tidak boleh kosong!");
      return;
    }

    setIsSubmitting(true);
    try {
      const newComment = await onAddComment(addon.id, username, commentText);
      if (newComment) {
        setCommentText("");
        localStorage.setItem("glcom_username", username);
      } else {
        setCommentError("Gagal mengirim komentar. Coba lagi.");
      }
    } catch (err: any) {
      setCommentError(err.message || "Gagal mengirim komentar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-emerald-500 text-slate-950",
      "bg-blue-500 text-white",
      "bg-amber-500 text-slate-950",
      "bg-purple-500 text-white",
      "bg-rose-500 text-white",
      "bg-cyan-500 text-slate-950",
      "bg-indigo-500 text-white"
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  useState(() => {
    const saved = localStorage.getItem("glcom_username");
    if (saved) {
      setUsername(saved);
    }
  });

  return (
    <div id="detail-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      {/* Background click close (disabled if saving or deleting) */}
      <div className="absolute inset-0" onClick={() => !isSaving && !isDeleting && onClose()} />

      {/* Modal Card */}
      <motion.div
        id="detail-modal-card"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="relative w-full max-w-4xl glass-premium card-hover-border border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col my-8 backdrop-blur-xl transition-all duration-300"
      >
        {/* Header/Close Button (Hidden when editing or deleting to prevent half-states) */}
        {!isEditing && !isConfirmingDelete && (
          <button
            id="detail-modal-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        )}

        {/* Modal Content container */}
        <div className="flex-1 overflow-y-auto max-h-[85vh]">
          {isConfirmingDelete ? (
            /* DELETE CONFIRMATION PANEL */
            <div className="p-8 md:p-12 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-6 shadow-lg shadow-rose-500/5">
                <AlertTriangle size={32} className="animate-bounce" />
              </div>

              <h2 className="text-xl font-display font-black text-slate-100 tracking-tight mb-2">
                Hapus Add-on?
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-8">
                Apakah Anda yakin ingin menghapus <span className="font-semibold text-slate-200">"{addon.name}"</span>? Tindakan ini tidak dapat dibatalkan dan file add-on akan dihapus selamanya dari server.
              </p>

              {editErrorMsg && (
                <div className="text-rose-400 text-xs bg-rose-500/5 border border-rose-500/20 p-3 rounded-xl mb-4 text-left">
                  {editErrorMsg}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setIsConfirmingDelete(false);
                    setEditErrorMsg("");
                  }}
                  className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold py-3.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="flex-1 bg-rose-500 hover:bg-rose-400 active:bg-rose-600 text-slate-950 text-xs font-bold py-3.5 rounded-xl shadow-lg shadow-rose-500/10 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    "Ya, Hapus"
                  )}
                </button>
              </div>
            </div>
          ) : isEditing ? (
            /* EDIT FORM VIEW */
            <form onSubmit={handleSaveEdit} className="p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditErrorMsg("");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  Kembali ke Detail
                </button>
                <h2 className="text-lg font-display font-black text-slate-100 uppercase tracking-wider">
                  Edit Informasi Add-on
                </h2>
              </div>

              {editErrorMsg && (
                <div className="text-rose-400 text-xs bg-rose-500/5 border border-rose-500/20 p-3.5 rounded-xl">
                  {editErrorMsg}
                </div>
              )}

              {/* Cover Preview & Change */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ganti Gambar Cover</span>
                  <div className="relative aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 group">
                    <img src={editCoverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => editCoverInputRef.current?.click()}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <ImageIcon size={14} />
                        Pilih Gambar
                      </button>
                    </div>
                  </div>
                  <input
                    ref={editCoverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditCoverChange}
                    className="hidden"
                  />
                  {editCoverName && (
                    <span className="block text-[10px] text-slate-500 font-mono mt-1.5 truncate">{editCoverName}</span>
                  )}
                </div>

                {/* Main Fields */}
                <div className="md:col-span-2 space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nama Add-on</label>
                    <input
                      type="text"
                      placeholder="Masukkan nama add-on Minecraft..."
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={50}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-700 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  {/* Creator / Author */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pembuat (Author)</label>
                    <input
                      type="text"
                      placeholder="Contoh: @GL_COM_Team"
                      value={editAuthor}
                      onChange={(e) => setEditAuthor(e.target.value)}
                      maxLength={30}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-700 focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Row Grid: Category & Version */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kategori</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-xl px-4 py-3 text-slate-300 focus:outline-none transition-all"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Versi Kompatibel</label>
                  <input
                    type="text"
                    placeholder="Contoh: 1.21.x / 1.20"
                    value={editCompatibleVersion}
                    onChange={(e) => setEditCompatibleVersion(e.target.value)}
                    maxLength={15}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-700 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Deskripsi</label>
                <textarea
                  placeholder="Ceritakan tentang fitur add-on Anda di sini secara detail..."
                  rows={5}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  maxLength={1500}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-700 focus:outline-none transition-all resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Update file on disk */}
              <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Update Berkas File Add-on (Opsional)</span>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 px-4 py-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Upload size={16} />
                    Unggah File Baru
                  </button>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept=".mcaddon,.mcpack,.mctemplate,.zip,.rar"
                    onChange={handleEditFileChange}
                    className="hidden"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <span className="block text-xs font-semibold text-slate-300 font-mono truncate">{editFileName}</span>
                    <span className="block text-[10px] text-slate-500 font-mono mt-0.5">Ukuran saat ini: {editFileSize}</span>
                  </div>
                </div>
              </div>

              {/* Submit / Cancel Footer Buttons */}
              <div className="flex gap-4 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    setIsEditing(false);
                    setEditErrorMsg("");
                  }}
                  className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold py-4 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 text-xs font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* NORMAL VIEW DETAILS */
            <>
              {/* Cover Header Image */}
              <div className="w-full aspect-[21/9] md:aspect-[3/1] relative bg-slate-950">
                <img
                  src={addon.coverUrl}
                  alt={addon.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                {/* Category floating badge */}
                <div className="absolute bottom-4 left-6 flex flex-wrap gap-2">
                  <span className="bg-emerald-500 text-slate-950 text-xs font-bold font-mono uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                    {addon.category}
                  </span>
                  <span className="bg-slate-950/85 text-slate-300 text-xs font-mono px-3 py-1 rounded-full shadow-md border border-slate-800">
                    Ver. {addon.compatibleVersion}
                  </span>
                </div>
              </div>

              {/* Body Information */}
              <div className="p-6 md:p-8">
                {/* Admin quick toggle buttons if verified */}
                {isAdminVerified && (
                  <div className="flex gap-2 mb-6 bg-slate-950/40 p-2 rounded-2xl border border-slate-800/80">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      <Edit size={14} />
                      Edit Add-on
                    </button>
                    <button
                      onClick={() => setIsConfirmingDelete(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                      Hapus Add-on
                    </button>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-800/80">
                  {/* Left Title details */}
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-100 mb-2">
                      {addon.name}
                    </h1>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User size={14} className="text-emerald-400" />
                        <span>Oleh: <span className="text-slate-200">{addon.author}</span></span>
                      </div>
                      <div className="h-1 w-1 bg-slate-700 rounded-full" />
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-500" />
                        <span>Diupload: {new Date(addon.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Download Controls */}
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <button
                      id={`modal-download-btn-${addon.id}`}
                      onClick={handleDownloadClick}
                      disabled={isDownloading}
                      className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:bg-emerald-800 disabled:text-slate-700 disabled:cursor-not-allowed text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer text-center select-none"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Mengunduh...
                        </>
                      ) : (
                        <>
                          <Download size={18} className="animate-bounce" />
                          Unduh Langsung
                        </>
                      )}
                    </button>
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-400 font-bold font-mono">
                      <ShieldCheck size={12} />
                      100% AMAN • BEBAS IKLAN
                    </div>
                  </div>
                </div>

                {/* Quick Metadata Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-slate-800/80">
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase">Jumlah Unduhan</span>
                    <span className="text-base font-bold text-slate-200 font-mono">{addon.downloads.toLocaleString("id-ID")}x</span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase">Ukuran File</span>
                    <span className="text-base font-bold text-slate-200 font-mono">{addon.fileSize}</span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase">Kompatibilitas</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">{addon.compatibleVersion}</span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase">Nama File</span>
                    <span className="text-xs font-bold text-slate-300 font-mono truncate block" title={addon.fileName}>{addon.fileName}</span>
                  </div>
                </div>

                {/* Main Details Panel (Description & Comments) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-6">
                  {/* Left Column: Description */}
                  <div className="md:col-span-7 flex flex-col gap-4">
                    <h3 className="text-lg font-display font-semibold text-slate-200 flex items-center gap-2">
                      <FileText size={18} className="text-emerald-400" />
                      Deskripsi Lengkap
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-slate-950/20 p-5 rounded-2xl border border-slate-800/30">
                      {addon.description}
                    </p>
                  </div>

                  {/* Right Column: Comments Section */}
                  <div className="md:col-span-5 flex flex-col gap-4">
                    <h3 className="text-lg font-display font-semibold text-slate-200 flex items-center gap-2">
                      <MessageSquare size={18} className="text-emerald-400" />
                      Diskusi ({addon.comments.length})
                    </h3>

                    {/* Form to post new comment */}
                    <form onSubmit={handleSubmitComment} className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/40 flex flex-col gap-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Kirim Komentar</span>

                      {/* Name Input */}
                      <input
                        type="text"
                        placeholder="Nama Pengguna"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        maxLength={20}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />

                      {/* Comment Body */}
                      <textarea
                        placeholder="Tulis pendapat atau pertanyaanmu di sini..."
                        rows={3}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        maxLength={300}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                      />

                      {commentError && (
                        <span className="text-rose-400 text-xs font-medium">{commentError}</span>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="self-end bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? "Mengirim..." : "Kirim Komentar"}
                      </button>
                    </form>

                    {/* List of comments */}
                    <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                      {addon.comments.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                          Belum ada komentar. Jadilah yang pertama memberikan ulasan!
                        </div>
                      ) : (
                        [...addon.comments].reverse().map((comment) => (
                          <div key={comment.id} className="bg-slate-950/20 p-3.5 rounded-xl border border-slate-800/40 flex gap-3">
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none ${getAvatarColor(comment.username)}`}>
                              {comment.username.charAt(0).toUpperCase()}
                            </div>
                            {/* Comment detail */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-bold text-slate-200 truncate">{comment.username}</span>
                                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                  {new Date(comment.createdAt).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed break-words">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
