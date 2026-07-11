/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { Upload, FileCode, Image, CheckCircle, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";

interface AddonUploadFormProps {
  onUploadSuccess: () => void;
}

export default function AddonUploadForm({ onUploadSuccess }: AddonUploadFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Survival");
  const [compatibleVersion, setCompatibleVersion] = useState("1.21.x");
  const [author, setAuthor] = useState("Admin");

  // Cover state
  const [coverBase64, setCoverBase64] = useState("");
  const [coverName, setCoverName] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  // File state
  const [fileBase64, setFileBase64] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const coverInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to convert File to Base64 Data URL
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Format file size helper
  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Handle Cover File selection
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Cover harus berupa file gambar!");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setCoverBase64(base64);
      setCoverName(file.name);
      setCoverPreview(base64);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg("Gagal membaca file gambar.");
    }
  };

  // Handle Addon File selection
  const handleAddonChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check extension
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowed = ["mcaddon", "mcpack", "mctemplate", "zip", "rar"];
    if (ext && !allowed.includes(ext)) {
      setErrorMsg("Harap upload file Minecraft yang valid (.mcaddon, .mcpack, .zip)!");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setFileBase64(base64);
      setFileName(file.name);
      setFileSize(formatBytes(file.size));
      setErrorMsg("");
    } catch (err) {
      setErrorMsg("Gagal membaca file add-on.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCoverDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Cover harus berupa file gambar!");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setCoverBase64(base64);
      setCoverName(file.name);
      setCoverPreview(base64);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg("Gagal membaca file gambar.");
    }
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowed = ["mcaddon", "mcpack", "mctemplate", "zip", "rar"];
    if (ext && !allowed.includes(ext)) {
      setErrorMsg("Harap upload file Minecraft yang valid (.mcaddon, .mcpack, .zip)!");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setFileBase64(base64);
      setFileName(file.name);
      setFileSize(formatBytes(file.size));
      setErrorMsg("");
    } catch (err) {
      setErrorMsg("Gagal membaca file add-on.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim()) {
      setErrorMsg("Nama Add-on wajib diisi.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Deskripsi wajib diisi.");
      return;
    }
    if (!fileBase64) {
      setErrorMsg("Harap upload file add-on (.mcaddon/.zip)!");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/addons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          category,
          compatibleVersion,
          author,
          coverBase64,
          fileBase64,
          fileName,
          fileSize,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengupload add-on");
      }

      setSuccessMsg(`Add-on "${data.name}" berhasil dibagikan secara langsung tanpa iklan!`);
      
      // Reset form
      setName("");
      setDescription("");
      setCategory("Survival");
      setCompatibleVersion("1.21.x");
      setCoverBase64("");
      setCoverName("");
      setCoverPreview("");
      setFileBase64("");
      setFileName("");
      setFileSize("");

      setTimeout(() => {
        onUploadSuccess();
        setSuccessMsg("");
      }, 2500);

    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengunggah file. Silakan periksa ukuran file Anda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="addon-upload-container" className="max-w-3xl mx-auto glass-premium card-hover-border border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-slate-100">Bagikan Add-on Minecraft</h2>
          <p className="text-xs text-slate-400">Unggah add-on buatanmu sendiri agar bisa diunduh langsung tanpa iklan.</p>
        </div>
      </div>

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3"
        >
          <CheckCircle className="text-emerald-400 shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-emerald-300 font-medium">{successMsg}</div>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3"
        >
          <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-rose-300 font-medium">{errorMsg}</div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Name and Author */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nama Add-on <span className="text-rose-400">*</span></label>
            <input
              type="text"
              placeholder="Contoh: More Swords Add-on"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nama Pembuat / Author</label>
            <input
              type="text"
              placeholder="Contoh: SteveCraft"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Row 2: Category and Version */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kategori <span className="text-rose-400">*</span></label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
            >
              <option value="Survival">Survival</option>
              <option value="Kreatif">Kreatif</option>
              <option value="Transportasi">Transportasi</option>
              <option value="Petualangan">Petualangan</option>
              <option value="Alat (Tools)">Alat (Tools)</option>
              <option value="Skin">Skin</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Versi Minecraft Kompatibel <span className="text-rose-400">*</span></label>
            <input
              type="text"
              placeholder="Contoh: 1.21.x - 1.22.x"
              value={compatibleVersion}
              onChange={(e) => setCompatibleVersion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              required
            />
          </div>
        </div>

        {/* Row 3: Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deskripsi Lengkap <span className="text-rose-400">*</span></label>
          <textarea
            rows={5}
            placeholder="Jelaskan fitur-fitur, cara pemakaian, item apa saja yang ditambahkan dalam add-on ini..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
            required
          />
        </div>

        {/* Row 4: File Uploads (Cover and Addon File) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cover Upload Zone */}
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cover Gambar (Opsional)</label>
            <div
              onDragOver={handleDragOver}
              onDrop={handleCoverDrop}
              onClick={() => coverInputRef.current?.click()}
              className="flex-1 min-h-[140px] bg-slate-950 hover:bg-slate-950/70 border border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center group"
            >
              <input
                type="file"
                ref={coverInputRef}
                onChange={handleCoverChange}
                accept="image/*"
                className="hidden"
              />
              {coverPreview ? (
                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-800">
                  <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-white font-bold font-mono">UBAH GAMBAR</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors">
                    <Image size={18} />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">Pilih atau Seret Cover</span>
                  <span className="text-[10px] text-slate-500">Mendukung PNG, JPG, WebP</span>
                </>
              )}
              {coverName && !coverPreview && (
                <span className="text-xs text-emerald-400 font-mono truncate max-w-full px-2">{coverName}</span>
              )}
            </div>
          </div>

          {/* Addon File Upload Zone */}
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">File Addon (.mcaddon / .zip) <span className="text-rose-400">*</span></label>
            <div
              onDragOver={handleDragOver}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 min-h-[140px] bg-slate-950 hover:bg-slate-950/70 border border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAddonChange}
                accept=".mcaddon,.mcpack,.zip,.rar"
                className="hidden"
              />
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors">
                <FileCode size={18} />
              </div>
              {fileName ? (
                <div className="flex flex-col items-center max-w-full px-2">
                  <span className="text-xs font-bold text-emerald-400 font-mono truncate max-w-full">{fileName}</span>
                  <span className="text-[10px] text-slate-400 font-mono mt-1">{fileSize}</span>
                </div>
              ) : (
                <>
                  <span className="text-xs font-semibold text-slate-300">Pilih atau Seret File</span>
                  <span className="text-[10px] text-slate-500">Mendukung .mcaddon, .mcpack, .zip</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-4 border-t border-slate-800/60 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 active:scale-95 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>Mengunggah Add-on...</>
            ) : (
              <>
                Bagikan Sekarang
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
