import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Download, MessageSquare, Eye, Star, Check, AlertCircle } from "lucide-react";
import { Addon } from "../types";
import { use3DTilt } from "../hooks/use3DTilt";

interface AddonCardProps {
  key?: React.Key;
  addon: Addon;
  onOpenDetails: (addon: Addon) => void;
  onDownload: (addon: Addon) => void;
}

export default function AddonCard({ addon, onOpenDetails, onDownload }: AddonCardProps) {
  const { ref, tilt, glare, isHovered, handleMouseMove, handleMouseEnter, handleMouseLeave, maxGlare } = use3DTilt(10, 0.15);

  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "completed" | "error">("idle");
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (downloadStatus === "downloading") {
      setDownloadProgress(10);
      interval = setInterval(() => {
        setDownloadProgress((prev) => prev >= 90 ? prev + (95 - prev) * 0.08 : prev + (90 - prev) * 0.12);
      }, 120);
    } else if (downloadStatus === "completed") {
      setDownloadProgress(100);
    } else if (downloadStatus === "idle") {
      setDownloadProgress(0);
    }
    return () => clearInterval(interval);
  }, [downloadStatus]);

  const handleDirectDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadStatus !== "idle") return;
    setDownloadStatus("downloading");
    try {
      await onDownload(addon);
      setDownloadStatus("completed");
      setTimeout(() => setDownloadStatus("idle"), 1600);
    } catch (err) {
      console.error(err);
      setDownloadStatus("error");
      setTimeout(() => setDownloadStatus("idle"), 2000);
    }
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{
        opacity: 1, y: 0,
        rotateX: isHovered ? tilt.x : 0, rotateY: isHovered ? tilt.y : 0,
        scale: isHovered ? 1.025 : 1,
        boxShadow: isHovered ? "0 25px 55px -15px rgba(16, 185, 129, 0.2), 0 0 45px 0px rgba(16, 185, 129, 0.12)" : "0 8px 22px -5px rgba(0, 0, 0, 0.35)",
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      transition={{ type: "spring", stiffness: 180, damping: 18, mass: 0.6, layout: { type: "spring", stiffness: 300, damping: 25 } }}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
      className="glass-premium card-hover-border rounded-2xl overflow-hidden hover:border-emerald-500/40 group flex flex-col h-full transition-colors duration-300 relative"
    >
      <div className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300" style={{ background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, ${maxGlare}) 0%, transparent 65%)`, opacity: isHovered ? 1 : 0, mixBlendMode: "overlay" }} />

      <div onClick={() => onOpenDetails(addon)} style={{ transform: "translateZ(25px)" }} className="aspect-video w-full relative overflow-hidden bg-slate-950 cursor-pointer group">
        <img src={addon.coverUrl} alt={addon.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
        <span className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-sm border border-slate-800 text-emerald-400 text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-1 rounded-md">{addon.category || "Survival"}</span>
        <span className="absolute bottom-3 right-3 brand-grad-bg text-slate-950 text-[10px] font-bold font-mono px-2 py-0.5 rounded shadow">{addon.compatibleVersion || "1.21.x"}</span>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="mb-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono text-slate-500 mb-2">
            <span>Oleh {addon.author || "Admin"}</span>
            <span>•</span>
            <span>{new Date(addon.createdAt || new Date().toISOString()).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}</span>
            {addon.ratingCount && addon.ratingCount > 0 ? (
              <><span>•</span><span className="flex items-center gap-0.5 text-amber-400 font-bold"><Star size={11} className="fill-amber-400 stroke-amber-400" /><span>{(addon.ratingSum! / addon.ratingCount).toFixed(1)}</span><span className="text-[10px] text-slate-500 font-normal">({addon.ratingCount})</span></span></>
            ) : (
              <><span>•</span><span className="flex items-center gap-0.5 text-slate-500"><Star size={11} /><span>Belum dinilai</span></span></>
            )}
          </div>
          <h3 onClick={() => onOpenDetails(addon)} className="text-base font-display font-bold text-slate-200 line-clamp-1 hover:text-emerald-400 cursor-pointer transition-colors">{addon.name || "Add-on Tanpa Nama"}</h3>
          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{addon.description || "Tidak ada deskripsi."}</p>
        </div>

        <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1 hover:text-emerald-400 transition-colors"><Download size={13} className="text-slate-500" />{addon.downloads || 0}</span>
            <span className="flex items-center gap-1 hover:text-blue-400 transition-colors"><MessageSquare size={13} className="text-slate-500" />{(addon.comments || []).length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => onOpenDetails(addon)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-all cursor-pointer" title="Lihat Detail"><Eye size={14} /></button>
            <motion.button
              onClick={handleDirectDownload}
              disabled={downloadStatus !== "idle"}
              animate={downloadStatus === "downloading" ? { boxShadow: ["0 0 0 0px rgba(16, 185, 129, 0.4)", "0 0 0 10px rgba(16, 185, 129, 0)"], transition: { repeat: Infinity, duration: 1.2, ease: "easeOut" } } : {}}
              className={`inline-flex items-center gap-1.5 font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all active:scale-95 text-center select-none cursor-pointer relative ${downloadStatus === "downloading" ? "bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 pointer-events-none" : downloadStatus === "completed" ? "brand-grad-bg border border-emerald-500 text-slate-950 pointer-events-none" : downloadStatus === "error" ? "bg-rose-500/20 border border-rose-500/40 text-rose-400 pointer-events-none" : "bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-slate-950"}`}
            >
              {downloadStatus === "downloading" ? (
                <><svg className="w-3.5 h-3.5 shrink-0 -rotate-90" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.5" className="stroke-emerald-500/20 fill-none" strokeWidth="2.5" /><circle cx="10" cy="10" r="7.5" className="stroke-emerald-400 fill-none transition-all duration-150 ease-out" strokeWidth="2.5" strokeDasharray={47.12} strokeDashoffset={47.12 - (47.12 * downloadProgress) / 100} strokeLinecap="round" /></svg><span>{Math.round(downloadProgress)}%</span></>
              ) : downloadStatus === "completed" ? (<><Check size={12} className="stroke-[3]" /><span>Selesai</span></>) : downloadStatus === "error" ? (<><AlertCircle size={12} /><span>Gagal</span></>) : (<><Download size={12} /><span>Unduh</span></>)}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
