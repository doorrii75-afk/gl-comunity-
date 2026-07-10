/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, MessageSquare, Tag, Calendar, User, FileText, CheckCircle2, ShieldCheck } from "lucide-react";
import { Addon, Comment } from "../types";

interface AddonDetailModalProps {
  addon: Addon;
  onClose: () => void;
  onDownload: (addon: Addon) => void;
  onAddComment: (addonId: string, username: string, text: string) => Promise<Comment | null>;
}

export default function AddonDetailModal({ addon, onClose, onDownload, onAddComment }: AddonDetailModalProps) {
  const [username, setUsername] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");

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
        // Save username to localstorage for convenience
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

  // Preset avatar colors for usernames
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

  // Fetch saved username if exists
  useState(() => {
    const saved = localStorage.getItem("glcom_username");
    if (saved) {
      setUsername(saved);
    }
  });

  return (
    <div id="detail-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      {/* Background click close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <motion.div
        id="detail-modal-card"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col my-8"
      >
        {/* Header/Close Button */}
        <button
          id="detail-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Modal Content container */}
        <div className="flex-1 overflow-y-auto max-h-[85vh]">
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
                  onClick={() => onDownload(addon)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
                >
                  <Download size={18} className="animate-bounce" />
                  Unduh Langsung
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
        </div>
      </motion.div>
    </div>
  );
}
