/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, Download, Eye, ExternalLink, ArrowLeft, Loader2, Sparkles, 
  AlertCircle, BookOpen, Clock, ShieldCheck, Compass, RefreshCw
} from "lucide-react";

interface MCPEDLItem {
  title: string;
  description: string;
  link: string;
  imageUrl: string;
  downloads?: string;
  date?: string;
}

export default function MCPEDLExplore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<MCPEDLItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Selected item modal details
  const [selectedItem, setSelectedItem] = useState<MCPEDLItem | null>(null);

  // Main search function
  const handleSearch = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        query: searchQuery
      });

      const response = await fetch(`/api/mcpedl/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Gagal mengambil data MCPEDL dari server cloud.");
      }
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal memuat daftar add-on dari MCPEDL.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger search on mount
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 md:px-0" id="mcpedl-explore-interactive">
      
      {/* Header Banner Section */}
      <div className="relative glass-premium card-hover-border border border-slate-800/80 rounded-3xl p-6 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[220px] h-[220px] bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none -z-10 animate-pulse" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-widest">
              <Compass size={11} />
              MCPEDL Global Integration
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-black text-slate-100 tracking-tight leading-tight">
              Eksplorasi Katalog MCPEDL
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Cari ribuan Modifikasi, Add-on, Map, dan Shader Minecraft Bedrock/PE terbaik yang disinkronkan langsung dari portal mcpedl.com.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80 shrink-0">
            <div className="relative group">
              <input
                type="text"
                id="mcpedl-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari add-on MCPEDL..."
                className="w-full bg-slate-950 border border-slate-800/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-slate-200 placeholder-slate-600 rounded-xl pl-11 pr-20 py-3 text-xs outline-none transition-all font-semibold shadow-inner"
              />
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all active:scale-95 cursor-pointer shadow-md"
              >
                CARI
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Hits status */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
        <div>
          Menampilkan <span className="text-slate-300 font-bold">{items.length}</span> add-on MCPEDL teratas
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-400">Live Scraper Sync Active</span>
        </div>
      </div>

      {/* Main Grid / Loaders / Errors */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-36 gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin" />
            <RefreshCw size={24} className="absolute text-emerald-400 animate-spin text-sm" />
          </div>
          <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">MENCARI DI DATABASE MCPEDL...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto bg-slate-950 border border-slate-900 rounded-3xl p-8">
          <AlertCircle size={44} className="text-rose-500 mb-4" />
          <h4 className="text-base font-bold text-slate-100">Koneksi Portal Gagal</h4>
          <p className="text-xs text-slate-400 mt-1 mb-6 leading-relaxed">{error}</p>
          <button
            onClick={handleSearch}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            Coba Hubungkan Kembali
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-slate-800 rounded-3xl max-w-md mx-auto">
          <Sparkles size={36} className="text-slate-600 mx-auto mb-3 animate-bounce" />
          <h4 className="text-sm font-bold text-slate-300">Hasil Tidak Ditemukan</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">Pencarian tidak mengembalikan hasil. Silakan coba kata kunci lain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item, idx) => (
            <motion.div
              key={idx + "-" + item.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
              className="bg-slate-950 border border-slate-900/80 hover:border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between gap-5 group/card hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 relative overflow-hidden"
            >
              <div className="space-y-3.5">
                {/* Project Image */}
                <div className="w-full h-36 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden relative shadow">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-350"
                      loading="lazy"
                    />
                  ) : (
                    <Sparkles size={24} className="text-emerald-500/30" />
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-100 line-clamp-1 group-hover/card:text-emerald-400 transition-colors" title={item.title}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Bottom stats and action button */}
              <div className="flex items-center justify-between pt-3.5 border-t border-slate-900/60">
                <div className="flex flex-col text-[10px] text-slate-500 font-mono">
                  {item.date && <span>📅 {item.date}</span>}
                  {item.downloads && <span>📥 {item.downloads}</span>}
                </div>

                <button
                  onClick={() => setSelectedItem(item)}
                  className="bg-slate-900 hover:bg-emerald-500 border border-slate-800/80 hover:border-emerald-500 text-slate-300 hover:text-slate-950 text-[11px] font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Eye size={12} />
                  <span>Detail</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* DETAILED DIALOG MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto no-scrollbar">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => setSelectedItem(null)} />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col my-8"
            >
              {/* Header block with close/back */}
              <div className="p-6 md:p-8 border-b border-slate-800/80 flex flex-col gap-4 bg-slate-950/40 relative">
                <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-emerald-500/10 rounded-full filter blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    Kembali ke Eksplorasi
                  </button>
                  <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider">MCPEDL Crawler Verified</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 items-start pt-2">
                  <div className="w-full sm:w-44 h-28 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                    {selectedItem.imageUrl ? (
                      <img
                        src={selectedItem.imageUrl}
                        alt={selectedItem.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Sparkles size={24} className="text-emerald-500/50" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <h2 className="text-lg md:text-xl font-display font-black text-slate-100 tracking-tight leading-tight">
                      {selectedItem.title}
                    </h2>
                    {selectedItem.date && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                        <Clock size={12} className="text-emerald-400" />
                        <span>Rilis: {selectedItem.date}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable details view */}
              <div className="p-6 md:p-8 overflow-y-auto max-h-[50vh] space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2 mb-2">
                    <BookOpen size={14} className="text-emerald-500" />
                    Ringkasan Konten
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/20 border border-slate-800/30 p-5 rounded-2xl whitespace-pre-line">
                    {selectedItem.description}
                  </p>
                </div>
              </div>

              {/* Download / Redirect original link */}
              <div className="p-6 bg-slate-950/60 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-bold font-mono">
                  <ShieldCheck size={14} />
                  <span>KONEKSI PROXY AMAN • MCPEDL ORIGINAL DIRECTORY</span>
                </div>

                <a
                  href={selectedItem.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/10 active:scale-95 transition-all text-sm select-none"
                >
                  <span>Kunjungi Halaman Unduh</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
