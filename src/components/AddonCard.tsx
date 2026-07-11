/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { Download, MessageSquare, Tag, Eye, Star } from "lucide-react";
import { Addon } from "../types";

interface AddonCardProps {
  key?: React.Key;
  addon: Addon;
  onOpenDetails: (addon: Addon) => void;
  onDownload: (addon: Addon) => void;
}

export default function AddonCard({ addon, onOpenDetails, onDownload }: AddonCardProps) {
  return (
    <motion.div
      id={`addon-card-${addon.id}`}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="glass-premium card-hover-border glaze-reflection glow-emerald hover:glow-emerald-active rounded-2xl overflow-hidden shadow-xl hover:border-emerald-500/40 group flex flex-col h-full transition-all duration-300"
    >
      {/* Cover Image Container */}
      <div 
        id={`card-cover-container-${addon.id}`}
        onClick={() => onOpenDetails(addon)}
        className="aspect-video w-full relative overflow-hidden bg-slate-950 cursor-pointer group"
      >
        <img
          src={addon.coverUrl}
          alt={addon.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
        
        {/* Category Floating Badge */}
        <span className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-sm border border-slate-800 text-emerald-400 text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-1 rounded-md">
          {addon.category || "Survival"}
        </span>
        
        {/* Version Floating Badge */}
        <span className="absolute bottom-3 right-3 bg-emerald-500 text-slate-950 text-[10px] font-bold font-mono px-2 py-0.5 rounded shadow">
          {addon.compatibleVersion || "1.21.x"}
        </span>
      </div>

      {/* Details Container */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="mb-4">
          {/* Creator and date with rating */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono text-slate-500 mb-2">
            <span>Oleh {addon.author || "Admin"}</span>
            <span>•</span>
            <span>{new Date(addon.createdAt || new Date().toISOString()).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}</span>
            {addon.ratingCount && addon.ratingCount > 0 ? (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-amber-400 font-bold" title={`Rating: ${(addon.ratingSum! / addon.ratingCount).toFixed(1)} dari 5`}>
                  <Star size={11} className="fill-amber-400 stroke-amber-400" />
                  <span>{(addon.ratingSum! / addon.ratingCount).toFixed(1)}</span>
                  <span className="text-[10px] text-slate-500 font-normal">({addon.ratingCount})</span>
                </span>
              </>
            ) : (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-slate-500" title="Belum ada penilaian">
                  <Star size={11} />
                  <span>Belum dinilai</span>
                </span>
              </>
            )}
          </div>

          {/* Addon Name */}
          <h3 
            onClick={() => onOpenDetails(addon)}
            className="text-lg font-display font-bold text-slate-200 line-clamp-1 hover:text-emerald-400 cursor-pointer transition-colors"
          >
            {addon.name || "Add-on Tanpa Nama"}
          </h3>

          {/* Addon Description Snippet */}
          <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {addon.description || "Tidak ada deskripsi."}
          </p>
        </div>

        {/* Action Row */}
        <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between gap-2 mt-auto">
          {/* Statistics Info */}
          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1 hover:text-emerald-400 transition-colors" title="Jumlah unduhan">
              <Download size={13} className="text-slate-500" />
              {addon.downloads || 0}
            </span>
            <span className="flex items-center gap-1 hover:text-blue-400 transition-colors" title="Komentar">
              <MessageSquare size={13} className="text-slate-500" />
              {(addon.comments || []).length}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            <button
              id={`card-quick-view-${addon.id}`}
              onClick={() => onOpenDetails(addon)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-all cursor-pointer"
              title="Lihat Detail"
            >
              <Eye size={14} />
            </button>
            <button
              id={`card-direct-download-${addon.id}`}
              onClick={async (e) => {
                e.stopPropagation();
                const target = e.currentTarget;
                target.disabled = true;
                const originalContent = target.innerHTML;
                target.innerHTML = `<span class="animate-pulse">Loading...</span>`;
                try {
                  await onDownload(addon);
                } catch (err) {
                  console.error(err);
                } finally {
                  target.disabled = false;
                  target.innerHTML = originalContent;
                }
              }}
              className="inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer text-center select-none"
            >
              <Download size={12} />
              Unduh
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
