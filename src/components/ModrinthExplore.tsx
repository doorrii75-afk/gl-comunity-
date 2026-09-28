import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Download, Eye, Globe, ArrowLeft, Loader2, Sparkles, AlertCircle, BookOpen, Clock, Tag, ShieldCheck, Filter, ChevronDown, Check, ArrowUpDown, Layers, Compass, Cpu } from "lucide-react";
import { use3DTilt } from "../hooks/use3DTilt";

interface ModrinthProject {
  project_id: string; project_type: string; slug: string; author: string;
  title: string; description: string; categories: string[]; display_categories: string[];
  versions: string[]; downloads: number; icon_url: string | null;
  date_created: string; date_modified: string;
}
interface ModrinthVersionFile { url: string; filename: string; size: number; primary: boolean; }
interface ModrinthVersion { id: string; name: string; version_number: string; game_versions: string[]; loaders: string[]; files: ModrinthVersionFile[]; date_published: string; }

const PROJECT_TYPES = [
  { id: "all", label: "Semua", icon: Layers },
  { id: "mod", label: "Mod", icon: Cpu },
  { id: "resourcepack", label: "Resource", icon: Sparkles },
  { id: "shader", label: "Shader", icon: Globe },
  { id: "datapack", label: "Datapack", icon: Compass }
];
const CATEGORIES = [
  { id: "all", label: "Semua Tema" }, { id: "adventure", label: "RPG & Petualangan" },
  { id: "technology", label: "Teknologi" }, { id: "magic", label: "Sihir & Fantasi" },
  { id: "decoration", label: "Dekorasi" }, { id: "optimization", label: "Optimasi" },
  { id: "utility", label: "Utilitas" }, { id: "worldgen", label: "Dunia" }, { id: "storage", label: "Storage" }
];
const SORT_OPTIONS = [
  { id: "downloads", label: "Populer" }, { id: "newest", label: "Terbaru" },
  { id: "updated", label: "Diupdate" }, { id: "relevance", label: "Relevan" }, { id: "follows", label: "Diikuti" }
];

function ModrinthCard({ project, idx, onSelect, formatDownloads }: { project: ModrinthProject; idx: number; onSelect: (p: ModrinthProject) => void; formatDownloads: (n: number) => string }) {
  const { ref, tilt, glare, isHovered, handleMouseMove, handleMouseEnter, handleMouseLeave, maxGlare } = use3DTilt(10, 0.12);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 180, damping: 18, mass: 0.6, delay: Math.min(idx * 0.03, 0.3) }}
      animate={{ rotateX: isHovered ? tilt.x : 0, rotateY: isHovered ? tilt.y : 0, scale: isHovered ? 1.025 : 1, boxShadow: isHovered ? "0 30px 60px -15px rgba(16, 185, 129, 0.18), 0 0 45px 0px rgba(16, 185, 129, 0.08)" : "0 8px 22px -5px rgba(0, 0, 0, 0.35)" }}
      onMouseMove={handleMouseMove} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
      className="glass-premium border border-slate-800/60 hover:border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between gap-5 group/card transition-colors duration-300 relative overflow-hidden h-full"
    >
      <div className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300" style={{ background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, ${maxGlare}) 0%, transparent 65%)`, opacity: isHovered ? 1 : 0, mixBlendMode: "overlay" }} />
      <div className="space-y-3.5" style={{ transform: "translateZ(15px)" }}>
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden relative shadow">
            {project.icon_url ? <img src={project.icon_url} alt={project.title} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-350" loading="lazy" /> : <Sparkles size={18} className="text-emerald-500/30" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1"><span className="bg-slate-900 text-slate-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-800/80 uppercase tracking-wider whitespace-nowrap">{project.project_type}</span></div>
            <h3 className="text-sm font-bold text-slate-100 truncate group-hover/card:text-emerald-400 transition-colors" title={project.title}>{project.title}</h3>
            <p className="text-[10px] text-slate-500 truncate">Oleh <span className="text-slate-400 font-semibold">{project.author}</span></p>
          </div>
        </div>
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{project.description}</p>
      </div>
      <div className="flex items-center justify-between pt-3.5 border-t border-slate-800/60" style={{ transform: "translateZ(10px)" }}>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400"><Download size={12} className="text-emerald-500" /><span className="font-semibold">{formatDownloads(project.downloads)} Unduhan</span></div>
        <button onClick={() => onSelect(project)} className="bg-slate-900 hover:bg-emerald-500 border border-slate-800/80 hover:border-emerald-500 text-slate-300 hover:text-slate-950 text-[11px] font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"><Eye size={12} /><span>Detail</span></button>
      </div>
    </motion.div>
  );
}

export default function ModrinthExplore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectType, setSelectedProjectType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSort, setSelectedSort] = useState("downloads");
  const [projects, setProjects] = useState<ModrinthProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [totalHits, setTotalHits] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ModrinthProject | null>(null);
  const [versions, setVersions] = useState<ModrinthVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [downloadingVersionId, setDownloadingVersionId] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  const observerTargetRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (isAppend = false) => {
    if (isAppend) setLoadingMore(true); else { setLoading(true); setError(""); }
    try {
      const limit = 24;
      const currentOffset = isAppend ? offset + limit : 0;
      if (!isAppend) setOffset(0); else setOffset(currentOffset);
      const params = new URLSearchParams({ query: searchQuery, limit: limit.toString(), offset: currentOffset.toString(), index: selectedSort, project_type: selectedProjectType, category: selectedCategory });
      const response = await fetch(`/api/modrinth/search?${params.toString()}`);
      if (!response.ok) throw new Error("Gagal mengambil data dari server.");
      const data = await response.json();
      if (data && data.hits) {
        if (isAppend) setProjects(prev => [...prev, ...data.hits]); else setProjects(data.hits);
        setTotalHits(data.total_hits || 0);
        setHasMore(data.hits.length >= limit);
      } else { if (!isAppend) setProjects([]); setHasMore(false); }
    } catch (err: any) { console.error(err); setError(err.message || "Gagal memuat daftar add-on."); }
    finally { setLoading(false); setLoadingMore(false); }
  };

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; handleSearch(false); return; }
    handleSearch(false);
  }, [selectedProjectType, selectedCategory, selectedSort]);

  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); handleSearch(false); };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading && projects.length > 0) handleSearch(true);
    }, { threshold: 0.1, rootMargin: "300px" });
    const currentTarget = observerTargetRef.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => { if (currentTarget) observer.unobserve(currentTarget); };
  }, [hasMore, loadingMore, loading, projects.length]);

  const handleSelectProject = async (project: ModrinthProject) => {
    setSelectedProject(project); setVersions([]); setLoadingVersions(true);
    try { const response = await fetch(`/api/modrinth/project/${project.project_id}/version`); if (!response.ok) throw new Error("Gagal mengambil versi."); const data = await response.json(); setVersions(data || []); } catch (err) { console.error(err); } finally { setLoadingVersions(false); }
  };

  const handleDownloadFile = async (fileUrl: string, filename: string, versionId: string) => {
    setDownloadingVersionId(versionId);
    try {
      const proxyUrl = `/api/modrinth/download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Gagal mengunduh file.");
      const blob = await response.blob(); const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = blobUrl; link.download = filename;
      document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(blobUrl);
    } catch (err: any) { console.error(err); alert("Gagal mengunduh berkas: " + err.message); }
    finally { setDownloadingVersionId(null); }
  };

  const formatDownloads = (num: number) => { if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"; if (num >= 1000) return (num / 1000).toFixed(1) + "K"; return num.toString(); };
  const formatBytes = (bytes: number) => { if (bytes === 0) return "0 B"; const k = 1024; const sizes = ["B", "KB", "MB", "GB"]; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]; };

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-1 md:px-0">
      <div className="relative glass-premium card-hover-border border border-slate-800/60 rounded-2xl p-4 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none -z-10" />
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="relative group">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari shader, mob, modpack online..." className="w-full bg-slate-950 border border-slate-800/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-slate-200 placeholder-slate-600 rounded-xl pl-11 pr-20 py-3.5 text-xs outline-none transition-all font-semibold" />
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 brand-grad-bg text-slate-950 px-4 py-2 rounded-lg text-[11px] font-bold font-mono transition-all active:scale-95 cursor-pointer shadow-lg">CARI</button>
          </div>
        </form>
      </div>

      <div className="glass-premium border border-slate-800/60 rounded-2xl p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0">
            {PROJECT_TYPES.map((type) => {
              const Icon = type.icon; const isSelected = selectedProjectType === type.id;
              return <button key={type.id} onClick={() => setSelectedProjectType(type.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${isSelected ? "brand-grad-bg text-slate-950 shadow-lg" : "bg-slate-900/60 text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-slate-800/50"}`}><Icon size={13} /><span>{type.label}</span></button>;
            })}
          </div>
          <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
            <div className="relative">
              <button onClick={() => setShowSortDropdown(!showSortDropdown)} className="bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-slate-100 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"><ArrowUpDown size={13} className="text-emerald-500" /><span>Sort: {SORT_OPTIONS.find(o => o.id === selectedSort)?.label}</span><ChevronDown size={12} /></button>
              <AnimatePresence>
                {showSortDropdown && (
                  <><div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} /><motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute right-0 mt-2 w-48 glass-premium border border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">{SORT_OPTIONS.map((opt) => <button key={opt.id} onClick={() => { setSelectedSort(opt.id); setShowSortDropdown(false); }} className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-slate-100 flex items-center justify-between transition-colors"><span>{opt.label}</span>{selectedSort === opt.id && <Check size={12} className="text-emerald-500" />}</button>)}</motion.div></>
                )}
              </AnimatePresence>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`md:hidden px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${showFilters ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-slate-900/80 border-slate-800 text-slate-400"}`}><Filter size={13} /><span>Tema</span></button>
          </div>
        </div>
        <div className={`md:flex flex-wrap items-center gap-2 ${showFilters ? "flex" : "hidden"}`}>
          <div className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider mr-2 w-full md:w-auto">PILIH TEMA:</div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${selectedCategory === cat.id ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-slate-900/40 text-slate-400 hover:text-slate-200 border border-slate-900 hover:border-slate-800"}`}>{cat.label}</button>)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
        <div>Menampilkan <span className="text-slate-300 font-bold">{projects.length}</span> dari <span className="text-slate-300 font-bold">{totalHits.toLocaleString()}+</span> hasil</div>
        <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-36 gap-4">
          <div className="relative flex items-center justify-center"><div className="w-16 h-16 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin" /><Globe size={24} className="absolute text-emerald-400 animate-pulse" /></div>
          <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">Loading...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto glass-premium border border-slate-800 rounded-3xl p-8">
          <AlertCircle size={44} className="text-rose-500 mb-4" /><h4 className="text-base font-bold text-slate-100">Koneksi API Gagal</h4>
          <p className="text-xs text-slate-400 mt-1 mb-6 leading-relaxed">{error}</p>
          <button onClick={() => handleSearch(false)} className="w-full brand-grad-bg text-slate-950 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg">Coba Hubungkan Kembali</button>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-slate-800 rounded-3xl max-w-md mx-auto">
          <Sparkles size={36} className="text-slate-600 mx-auto mb-3 animate-bounce" /><h4 className="text-sm font-bold text-slate-300">Hasil Tidak Ditemukan</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">Coba ubah kata kunci atau kategori.</p>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {projects.map((project, idx) => <ModrinthCard key={project.project_id + "-" + idx} project={project} idx={idx} onSelect={handleSelectProject} formatDownloads={formatDownloads} />)}
          </div>
          <div ref={observerTargetRef} className="w-full flex flex-col items-center justify-center py-8 gap-3">
            {loadingMore && <div className="flex items-center gap-2 glass-premium border border-slate-800/60 rounded-2xl px-6 py-3.5 shadow-xl"><Loader2 size={16} className="animate-spin text-emerald-400" /><span className="text-xs font-semibold text-slate-300 font-mono tracking-wide">Loading...</span></div>}
            {!hasMore && projects.length > 0 && <div className="glass-premium border border-slate-800/50 rounded-2xl px-6 py-4 text-center"><span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block">🎉 Semua add-on ditampilkan!</span><span className="text-[10px] text-slate-600 font-mono block mt-1">Total {projects.length} berkas</span></div>}
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto no-scrollbar">
            <div className="absolute inset-0" onClick={() => setSelectedProject(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", stiffness: 350, damping: 28 }} className="relative w-full max-w-2xl glass-premium border border-slate-800 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col my-8">
              <div className="p-6 md:p-8 border-b border-slate-800/80 flex flex-col gap-4 bg-slate-950/40 relative">
                <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-emerald-500/10 rounded-full filter blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <button onClick={() => setSelectedProject(null)} className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"><ArrowLeft size={14} /> Kembali</button>
                  <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Cloud Verified</span>
                </div>
                <div className="flex gap-4 items-start pt-2">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                    {selectedProject.icon_url ? <img src={selectedProject.icon_url} alt={selectedProject.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <Sparkles size={24} className="text-emerald-500/50" />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="brand-grad-bg text-slate-950 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{selectedProject.project_type}</span>
                      {selectedProject.display_categories?.slice(0, 3).map((cat) => <span key={cat} className="bg-slate-950 text-slate-300 text-[9px] font-mono px-2 py-0.5 rounded-md border border-slate-800/80 uppercase">{cat}</span>)}
                    </div>
                    <h2 className="text-xl md:text-2xl font-display font-black text-slate-100 tracking-tight leading-tight">{selectedProject.title}</h2>
                    <p className="text-xs text-slate-400 font-medium">Kreator: <span className="text-emerald-400 font-bold">{selectedProject.author}</span></p>
                  </div>
                </div>
              </div>
              <div className="p-6 md:p-8 overflow-y-auto max-h-[50vh] space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2 mb-2"><BookOpen size={14} className="text-emerald-500" /> Deskripsi</h3>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/20 border border-slate-800/30 p-5 rounded-2xl whitespace-pre-line">{selectedProject.description}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2 mb-3"><Clock size={14} className="text-emerald-500" /> Daftar Rilisan</h3>
                  {loadingVersions ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 border border-slate-800/80 rounded-2xl bg-slate-950/20"><Loader2 size={24} className="text-emerald-500 animate-spin" /><span className="text-[10px] text-slate-500 font-mono">Mengambil data rilis...</span></div>
                  ) : versions.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">Tidak ada file rilis tersedia.</div>
                  ) : (
                    <div className="space-y-3">
                      {versions.slice(0, 10).map((version) => {
                        const fileToDownload = version.files.find(f => f.primary) || version.files[0];
                        if (!fileToDownload) return null;
                        return (
                          <div key={version.id} className="bg-slate-950/40 border border-slate-800 hover:border-emerald-500/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all">
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-slate-200 truncate block max-w-[280px]">{version.name}</span><span className="bg-slate-900 text-[9px] font-mono text-slate-400 px-1.5 py-0.5 rounded border border-slate-800/80 font-bold whitespace-nowrap">v{version.version_number}</span></div>
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-slate-500 font-mono">
                                <div className="flex items-center gap-1 text-slate-400 font-bold"><Tag size={10} className="text-emerald-400" /><span>{version.loaders.join(", ") || "Client/Server"}</span></div>
                                <span>•</span><span className="text-slate-400 font-medium">MC {version.game_versions.slice(0, 3).join(", ")}</span>
                                <span>•</span><span className="text-emerald-400 font-bold">{formatBytes(fileToDownload.size)}</span>
                              </div>
                            </div>
                            <button disabled={downloadingVersionId !== null} onClick={() => handleDownloadFile(fileToDownload.url, fileToDownload.filename, version.id)} className="sm:self-center shrink-0 brand-grad-bg text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap">
                              {downloadingVersionId === version.id ? <><Loader2 size={13} className="animate-spin" /><span>Mengunduh...</span></> : <><Download size={13} className="animate-bounce" /><span>Unduh</span></>}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-emerald-400 font-bold font-mono"><ShieldCheck size={14} /><span>100% AMAN • VERIFIKASI CLOUD • PROXY AMAN</span></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
