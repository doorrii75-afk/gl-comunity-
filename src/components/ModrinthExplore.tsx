/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Download, Eye, Globe, ArrowLeft, Loader2, Sparkles, AlertCircle, BookOpen, Clock, Tag } from "lucide-react";

interface ModrinthProject {
  project_id: string;
  project_type: string;
  slug: string;
  author: string;
  title: string;
  description: string;
  categories: string[];
  display_categories: string[];
  versions: string[];
  downloads: number;
  icon_url: string | null;
  date_created: string;
  date_modified: string;
}

interface ModrinthVersionFile {
  url: string;
  filename: string;
  size: number;
  primary: boolean;
}

interface ModrinthVersion {
  id: string;
  name: string;
  version_number: string;
  game_versions: string[];
  loaders: string[];
  files: ModrinthVersionFile[];
  date_published: string;
}

export default function ModrinthExplore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<ModrinthProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Selected project for detailed modal
  const [selectedProject, setSelectedProject] = useState<ModrinthProject | null>(null);
  const [versions, setVersions] = useState<ModrinthVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [downloadingVersionId, setDownloadingVersionId] = useState<string | null>(null);

  // Fetch projects from our backend proxy
  const handleSearch = async (queryStr = "") => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/modrinth/search?query=${encodeURIComponent(queryStr)}&limit=24`);
      if (!response.ok) {
        throw new Error("Gagal mengambil data dari server Modrinth.");
      }
      const data = await response.json();
      if (data && data.hits) {
        setProjects(data.hits);
      } else {
        setProjects([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal memuat daftar add-on online.");
    } finally {
      setLoading(false);
    }
  };

  // Initial load with empty query (fetches popular)
  useEffect(() => {
    handleSearch("");
  }, []);

  // Fetch versions when a project is selected
  const handleSelectProject = async (project: ModrinthProject) => {
    setSelectedProject(project);
    setVersions([]);
    setLoadingVersions(true);
    try {
      const response = await fetch(`/api/modrinth/project/${project.project_id}/version`);
      if (!response.ok) {
        throw new Error("Gagal mengambil daftar versi.");
      }
      const data = await response.json();
      setVersions(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingVersions(false);
    }
  };

  // Handle direct file download via proxy
  const handleDownloadFile = async (fileUrl: string, filename: string, versionId: string) => {
    setDownloadingVersionId(versionId);
    try {
      const proxyUrl = `/api/modrinth/download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error("Gagal mengunduh file.");
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengunduh berkas: " + err.message);
    } finally {
      setDownloadingVersionId(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  // Helper to format large download counts (e.g. 1500000 -> 1.5M)
  const formatDownloads = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  // Helper to format file size in MB/KB
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-8" id="modrinth-explore-container">
      {/* Heading section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-black text-slate-100 tracking-tight flex items-center gap-2">
            <Globe size={22} className="text-emerald-500 animate-spin-slow" />
            Eksplor Add-on & Mod Online
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Unduh langsung ratusan ribu modifikasi Minecraft secara gratis dan aman, bersumber langsung dari database Modrinth!
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
          <input
            type="text"
            id="modrinth-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari mod, tekstur, shader, addon..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-xs outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-semibold"
          />
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
          <button
            type="submit"
            className="absolute right-2 top-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all"
          >
            CARI
          </button>
        </form>
      </div>

      {/* Main Grid display / Loaders / Error handlers */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={36} className="text-emerald-500 animate-spin" />
          <p className="text-xs font-mono text-slate-400">Menghubungi Modrinth API...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
          <AlertCircle size={40} className="text-rose-500 mb-3" />
          <h4 className="text-sm font-bold text-slate-100">Koneksi API Gagal</h4>
          <p className="text-xs text-slate-400 mt-1 mb-4">{error}</p>
          <button
            onClick={() => handleSearch(searchQuery)}
            className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 hover:border-emerald-500 px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >
            Coba Lagi
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-slate-800 rounded-3xl">
          <Sparkles size={32} className="text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-300">Tidak ada hasil</h4>
          <p className="text-xs text-slate-500 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {projects.map((project) => (
            <motion.div
              key={project.project_id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-slate-950 border border-slate-900/80 hover:border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between gap-4 group/card hover:shadow-xl hover:shadow-emerald-500/2 transition-all duration-300 relative overflow-hidden"
            >
              {/* Card Header Info */}
              <div className="flex gap-3">
                {/* Project Icon */}
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden relative">
                  {project.icon_url ? (
                    <img
                      src={project.icon_url}
                      alt={project.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <Sparkles size={18} className="text-emerald-500/50" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="bg-slate-900 text-slate-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border border-slate-800/80 uppercase">
                      {project.project_type}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 truncate group-hover/card:text-emerald-400 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-[10px] text-slate-500">Oleh <span className="text-slate-400 font-semibold">{project.author}</span></p>
                </div>
              </div>

              {/* Short description */}
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {project.description}
              </p>

              {/* Bottom stats and action button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-900/60">
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                  <Download size={12} className="text-emerald-500" />
                  <span>{formatDownloads(project.downloads)}</span>
                </div>

                <button
                  onClick={() => handleSelectProject(project)}
                  className="bg-emerald-500/10 group-hover/card:bg-emerald-500 border border-emerald-500/20 group-hover/card:border-emerald-500 text-emerald-400 group-hover/card:text-slate-950 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
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
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl max-h-[85vh] bg-slate-950 border border-slate-800 rounded-3xl overflow-y-auto no-scrollbar shadow-2xl flex flex-col"
            >
              {/* Header block with close/back */}
              <div className="p-6 md:p-8 border-b border-slate-900 flex flex-col gap-5 shrink-0">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Kembali ke Eksplorasi
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono">Modrinth API Verified</span>
                </div>

                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    {selectedProject.icon_url ? (
                      <img
                        src={selectedProject.icon_url}
                        alt={selectedProject.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Sparkles size={24} className="text-emerald-500/50" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border border-emerald-500/20 uppercase">
                        {selectedProject.project_type}
                      </span>
                      {selectedProject.display_categories?.slice(0, 3).map((cat) => (
                        <span key={cat} className="bg-slate-900 text-slate-400 text-[9px] font-mono px-2 py-0.5 rounded-md border border-slate-800">
                          {cat}
                        </span>
                      ))}
                    </div>
                    <h2 className="text-xl md:text-2xl font-display font-black text-slate-100 tracking-tight">
                      {selectedProject.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Oleh <span className="text-emerald-400 font-bold">{selectedProject.author}</span></p>
                  </div>
                </div>
              </div>

              {/* Scrollable details view */}
              <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2 mb-2">
                    <BookOpen size={14} className="text-emerald-500" />
                    Deskripsi Singkat
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/30 border border-slate-900/60 p-4 rounded-2xl">
                    {selectedProject.description}
                  </p>
                </div>

                {/* Versions download list */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2 mb-3">
                    <Clock size={14} className="text-emerald-500" />
                    Daftar Rilisan File & Versi
                  </h3>

                  {loadingVersions ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 border border-slate-900 rounded-2xl">
                      <Loader2 size={24} className="text-emerald-500 animate-spin" />
                      <span className="text-[10px] text-slate-500 font-mono">Memuat file dari Modrinth...</span>
                    </div>
                  ) : versions.length === 0 ? (
                    <div className="text-center py-8 border border-slate-900 rounded-2xl text-slate-500 text-xs">
                      Tidak ada file rilis yang tersedia untuk diunduh.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {versions.slice(0, 6).map((version) => {
                        // Find primary file or fallback to first file
                        const fileToDownload = version.files.find(f => f.primary) || version.files[0];
                        if (!fileToDownload) return null;

                        return (
                          <div
                            key={version.id}
                            className="bg-slate-900/20 border border-slate-900 hover:border-emerald-500/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-300"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-slate-200">
                                  {version.name}
                                </span>
                                <span className="bg-slate-900 text-[9px] font-mono text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                                  v{version.version_number}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 font-mono">
                                <div className="flex items-center gap-1">
                                  <Tag size={10} />
                                  <span>{version.loaders.join(", ") || "Client/Server"}</span>
                                </div>
                                <span>•</span>
                                <span>Minecraft {version.game_versions.join(", ")}</span>
                                <span>•</span>
                                <span>{formatBytes(fileToDownload.size)}</span>
                              </div>
                            </div>

                            <button
                              disabled={downloadingVersionId !== null}
                              onClick={() => handleDownloadFile(fileToDownload.url, fileToDownload.filename, version.id)}
                              className="sm:self-center shrink-0 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 disabled:text-slate-700 disabled:cursor-not-allowed text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95 transition-all cursor-pointer"
                            >
                              {downloadingVersionId === version.id ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  <span>Mengunduh...</span>
                                </>
                              ) : (
                                <>
                                  <Download size={14} />
                                  <span>Unduh File</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
