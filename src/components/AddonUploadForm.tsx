import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { Upload, FileCode, Image, CheckCircle, AlertTriangle, ArrowRight, Megaphone, Send } from "lucide-react";

interface AddonUploadFormProps {
  onUploadSuccess: () => void;
}

export default function AddonUploadForm({ onUploadSuccess }: AddonUploadFormProps) {
  const [activeFormTab, setActiveFormTab] = useState<"addon" | "broadcast">("addon");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Survival");
  const [compatibleVersion, setCompatibleVersion] = useState("1.21.x");
  const [author, setAuthor] = useState("Admin");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState<"info" | "warning" | "success" | "danger">("info");
  const [broadcastAuthor, setBroadcastAuthor] = useState("Admin");
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [coverBase64, setCoverBase64] = useState("");
  const [coverName, setCoverName] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [fileBase64, setFileBase64] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const coverInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = (error) => reject(error); reader.readAsDataURL(file); });
  const formatBytes = (bytes: number, decimals = 1) => { if (bytes === 0) return "0 Bytes"; const k = 1024; const dm = decimals < 0 ? 0 : decimals; const sizes = ["Bytes", "KB", "MB", "GB"]; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]; };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { setErrorMsg("Cover harus berupa file gambar!"); return; }
    try { const base64 = await fileToBase64(file); setCoverBase64(base64); setCoverName(file.name); setCoverPreview(base64); setErrorMsg(""); } catch { setErrorMsg("Gagal membaca file gambar."); }
  };

  const handleAddonChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowed = ["mcaddon", "mcpack", "mctemplate", "zip", "rar"];
    if (ext && !allowed.includes(ext)) { setErrorMsg("Harap upload file Minecraft yang valid!"); return; }
    try { const base64 = await fileToBase64(file); setFileBase64(base64); setFileName(file.name); setFileSize(formatBytes(file.size)); setErrorMsg(""); } catch { setErrorMsg("Gagal membaca file add-on."); }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleCoverDrop = async (e: React.DragEvent) => {
    e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { setErrorMsg("Cover harus berupa file gambar!"); return; }
    try { const base64 = await fileToBase64(file); setCoverBase64(base64); setCoverName(file.name); setCoverPreview(base64); setErrorMsg(""); } catch { setErrorMsg("Gagal membaca file gambar."); }
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowed = ["mcaddon", "mcpack", "mctemplate", "zip", "rar"];
    if (ext && !allowed.includes(ext)) { setErrorMsg("Harap upload file Minecraft yang valid!"); return; }
    try { const base64 = await fileToBase64(file); setFileBase64(base64); setFileName(file.name); setFileSize(formatBytes(file.size)); setErrorMsg(""); } catch { setErrorMsg("Gagal membaca file add-on."); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg(""); setSuccessMsg("");
    if (!name.trim()) { setErrorMsg("Nama Add-on wajib diisi."); return; }
    if (!description.trim()) { setErrorMsg("Deskripsi wajib diisi."); return; }
    if (!fileBase64) { setErrorMsg("Harap upload file add-on!"); return; }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/addons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description, category, compatibleVersion, author, coverBase64, fileBase64, fileName, fileSize }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal mengupload add-on");
      setSuccessMsg(`Add-on "${data.name}" berhasil dibagikan!`);
      setName(""); setDescription(""); setCategory("Survival"); setCompatibleVersion("1.21.x"); setCoverBase64(""); setCoverName(""); setCoverPreview(""); setFileBase64(""); setFileName(""); setFileSize("");
      setTimeout(() => { onUploadSuccess(); setSuccessMsg(""); }, 2500);
    } catch (err: any) { setErrorMsg(err.message || "Gagal mengunggah file."); }
    finally { setIsSubmitting(false); }
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg(""); setSuccessMsg("");
    if (!broadcastTitle.trim()) { setErrorMsg("Judul notifikasi wajib diisi."); return; }
    if (!broadcastMessage.trim()) { setErrorMsg("Pesan notifikasi wajib diisi."); return; }
    setIsSendingBroadcast(true);
    try {
      const response = await fetch("/api/broadcasts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: broadcastTitle, message: broadcastMessage, type: broadcastType, author: broadcastAuthor }) });
      if (!response.ok) throw new Error("Gagal mengirim broadcast.");
      const data = await response.json();
      setSuccessMsg(`Notifikasi "${data.title}" berhasil disebarkan!`);
      setBroadcastTitle(""); setBroadcastMessage(""); setBroadcastType("info");
    } catch (err: any) { setErrorMsg(err.message || "Gagal mengirim broadcast."); }
    finally { setIsSendingBroadcast(false); }
  };

  return (
    <div className="max-w-3xl mx-auto glass-premium card-hover-border border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">{activeFormTab === "addon" ? <Upload size={20} /> : <Megaphone size={20} />}</div>
        <div>
          <h2 className="text-xl font-display font-bold text-slate-100">{activeFormTab === "addon" ? "Bagikan Add-on Minecraft" : "Kirim Broadcast Notifikasi"}</h2>
          <p className="text-xs text-slate-400">{activeFormTab === "addon" ? "Unggah add-on buatanmu untuk diunduh langsung." : "Kirim pengumuman realtime ke semua pengguna."}</p>
        </div>
      </div>

      <div className="flex border-b border-slate-800 mb-6 gap-2">
        <button type="button" onClick={() => { setActiveFormTab("addon"); setErrorMsg(""); setSuccessMsg(""); }} className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 px-4 transition-all cursor-pointer ${activeFormTab === "addon" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}><span className="flex items-center gap-1.5"><Upload size={14} /> Unggah Add-on</span></button>
        <button type="button" onClick={() => { setActiveFormTab("broadcast"); setErrorMsg(""); setSuccessMsg(""); }} className={`pb-3 text-xs font-bold tracking-wider uppercase border-b-2 px-4 transition-all cursor-pointer ${activeFormTab === "broadcast" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}><span className="flex items-center gap-1.5"><Megaphone size={14} /> Kirim Broadcast</span></button>
      </div>

      {successMsg && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3"><CheckCircle className="text-emerald-400 shrink-0 mt-0.5" size={18} /><div className="text-sm text-emerald-300 font-medium">{successMsg}</div></motion.div>}
      {errorMsg && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3"><AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={18} /><div className="text-sm text-rose-300 font-medium">{errorMsg}</div></motion.div>}

      {activeFormTab === "broadcast" ? (
        <form onSubmit={handleBroadcastSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Judul <span className="text-rose-400">*</span></label>
              <input type="text" placeholder="Contoh: Pemeliharaan Selesai!" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pengirim</label>
              <input type="text" placeholder="Admin" value={broadcastAuthor} onChange={(e) => setBroadcastAuthor(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tipe Notifikasi</label>
            <select value={broadcastType} onChange={(e) => setBroadcastType(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all">
              <option value="info">Info</option><option value="success">Sukses (Hijau)</option><option value="warning">Penting (Kuning)</option><option value="danger">Darurat (Merah)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Isi Pesan <span className="text-rose-400">*</span></label>
            <textarea rows={4} placeholder="Masukkan isi pesan pengumuman..." value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all resize-none" required />
          </div>
          <div className="pt-4 border-t border-slate-800/60 flex items-center justify-end">
            <button type="submit" disabled={isSendingBroadcast} className="w-full md:w-auto inline-flex items-center justify-center gap-2 brand-grad-bg text-slate-950 font-bold px-8 py-3.5 rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50">{isSendingBroadcast ? "Mengirim..." : <>Kirim Notifikasi <Send size={14} /></>}</button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nama Add-on <span className="text-rose-400">*</span></label>
              <input type="text" placeholder="Contoh: More Swords Add-on" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pembuat</label>
              <input type="text" placeholder="Contoh: SteveCraft" value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kategori <span className="text-rose-400">*</span></label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all">
                <option value="Survival">Survival</option><option value="Kreatif">Kreatif</option><option value="Transportasi">Transportasi</option><option value="Petualangan">Petualangan</option><option value="Alat (Tools)">Alat (Tools)</option><option value="Skin">Skin</option><option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Versi Minecraft <span className="text-rose-400">*</span></label>
              <input type="text" placeholder="Contoh: 1.21.x" value={compatibleVersion} onChange={(e) => setCompatibleVersion(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deskripsi <span className="text-rose-400">*</span></label>
            <textarea rows={5} placeholder="Jelaskan fitur add-on..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all resize-none" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cover Gambar (Opsional)</label>
              <div onDragOver={handleDragOver} onDrop={handleCoverDrop} onClick={() => coverInputRef.current?.click()} className="flex-1 min-h-[140px] bg-slate-950 hover:bg-slate-950/70 border border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center group">
                <input type="file" ref={coverInputRef} onChange={handleCoverChange} accept="image/*" className="hidden" />
                {coverPreview ? (
                  <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-800"><img src={coverPreview} alt="Preview" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] text-white font-bold font-mono">UBAH</span></div></div>
                ) : (
                  <><div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors"><Image size={18} /></div><span className="text-xs font-semibold text-slate-300">Pilih atau Seret Cover</span><span className="text-[10px] text-slate-500">PNG, JPG, WebP</span></>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">File Addon <span className="text-rose-400">*</span></label>
              <div onDragOver={handleDragOver} onDrop={handleFileDrop} onClick={() => fileInputRef.current?.click()} className="flex-1 min-h-[140px] bg-slate-950 hover:bg-slate-950/70 border border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center group">
                <input type="file" ref={fileInputRef} onChange={handleAddonChange} accept=".mcaddon,.mcpack,.zip,.rar" className="hidden" />
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors"><FileCode size={18} /></div>
                {fileName ? (<div className="flex flex-col items-center max-w-full px-2"><span className="text-xs font-bold text-emerald-400 font-mono truncate max-w-full">{fileName}</span><span className="text-[10px] text-slate-400 font-mono mt-1">{fileSize}</span></div>) : (<><span className="text-xs font-semibold text-slate-300">Pilih atau Seret File</span><span className="text-[10px] text-slate-500">.mcaddon, .mcpack, .zip</span></>)}
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-800/60 flex items-center justify-end">
            <button type="submit" disabled={isSubmitting} className="w-full md:w-auto inline-flex items-center justify-center gap-2 brand-grad-bg text-slate-950 font-bold px-8 py-3.5 rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50">{isSubmitting ? "Mengunggah..." : <>Bagikan Sekarang <ArrowRight size={16} /></>}</button>
          </div>
        </form>
      )}
    </div>
  );
}
