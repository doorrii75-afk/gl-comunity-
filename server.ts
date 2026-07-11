/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { Addon, Comment } from "./src/types.js";

const app = express();
const PORT = 3000;

// Set higher limits for base64 file uploads (covers and add-on files)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Firebase Client SDK
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let db: any = null;

// Helper to generate custom SVGs as cover page base64 images
function generateSvgCoverBase64(title: string, color: string): string {
  const svg = `<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
        <stop offset="100%" style="stop-color:${color};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" />
    <circle cx="400" cy="180" r="70" fill="#020617" opacity="0.6" />
    <path d="M375 145 L425 145 L425 195 L375 195 Z" fill="${color}" opacity="0.9" />
    <path d="M385 195 L415 195 L415 225 L385 225 Z" fill="#10b981" opacity="0.8" />
    <text x="50%" y="320" font-family="'Inter', sans-serif" font-weight="bold" font-size="32" fill="#ffffff" text-anchor="middle">${title}</text>
    <text x="50%" y="360" font-family="'JetBrains Mono', monospace" font-size="16" fill="#94a3b8" text-anchor="middle">MINECRAFT ADD-ON</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const DEFAULT_ADDONS = [
  {
    id: "addon-1",
    name: "More Ores & Armor Ultimate",
    description: "Menambahkan lebih dari 15 jenis bijih tambang baru di bawah tanah Minecraft! Mulai dari Ruby, Sapphire, Amethyst, Cobalt, hingga Vibranium kuno. Setiap bijih dapat ditempa menjadi set armor lengkap dan peralatan perang (pedang, kapak, beliung) dengan efek pasif unik seperti ketahanan api, kecepatan gerak, atau penglihatan malam.",
    category: "Survival",
    compatibleVersion: "1.21.x - 1.22.x",
    coverUrl: "/api/addons/addon-1/cover",
    fileUrl: "/api/addons/addon-1/download",
    fileName: "more_ores_ultimate.mcaddon",
    fileSize: "4.2 MB",
    downloads: 1450,
    comments: [
      {
        id: "c1-1",
        username: "StevePro",
        text: "Addon ini keren banget! Akhirnya grinding mining jadi seru lagi karena banyak mineral baru.",
        createdAt: "2026-07-08T14:30:00Z"
      },
      {
        id: "c1-2",
        username: "AlexMinecraft",
        text: "Apakah armor Vibranium benar-benar kebal dari ledakan Creeper? Udah nyoba dan gila kuat banget!",
        createdAt: "2026-07-09T09:15:00Z"
      }
    ],
    createdAt: "2026-07-01T12:00:00Z",
    author: "GL Admin",
    color: "#3b82f6"
  },
  {
    id: "addon-2",
    name: "Modern Furniture DecoCraft",
    description: "Hiasi rumah modern impianmu dengan ratusan furnitur interaktif! Dilengkapi kulkas fungsional yang bisa menyimpan makanan, sofa empuk untuk bersantai, TV LED yang bisa dinyalakan, lampu tidur dengan tingkat kecerahan dinamis, hingga set wastafel dan toilet modern. Sangat cocok untuk pemain kreatif maupun survival dekoratif.",
    category: "Kreatif",
    compatibleVersion: "1.20.x - 1.21.x",
    coverUrl: "/api/addons/addon-2/cover",
    fileUrl: "/api/addons/addon-2/download",
    fileName: "modern_furniture_deco.mcaddon",
    fileSize: "8.7 MB",
    downloads: 2890,
    comments: [
      {
        id: "c2-1",
        username: "BuilderCraft",
        text: "Akhirnya bisa bikin ruang tamu yang kelihatan mewah! Sofa birunya mantap.",
        createdAt: "2026-07-07T11:20:00Z"
      }
    ],
    createdAt: "2026-07-03T10:00:00Z",
    author: "GL Admin",
    color: "#ec4899"
  },
  {
    id: "addon-3",
    name: "Advanced Super Vehicles Pack",
    description: "Kendarai kendaraan berkecepatan tinggi di dunia kotak-kokakmu! Paket ini menghadirkan mobil sport mewah, helikopter tempur, sepeda motor trail, jet ski, dan truk tangki air. Semua kendaraan memiliki animasi roda berputar, speedometer di HUD, bagasi penyimpanan terintegrasi, dan membutuhkan bahan bakar batu bara atau bensin.",
    category: "Transportasi",
    compatibleVersion: "1.21.x",
    coverUrl: "/api/addons/addon-3/cover",
    fileUrl: "/api/addons/addon-3/download",
    fileName: "super_vehicles_pack.mcaddon",
    fileSize: "12.4 MB",
    downloads: 3200,
    comments: [
      {
        id: "c3-1",
        username: "RacerX",
        text: "Kecepatan mobil sportnya luar biasa! Tapi helikopternya agak susah dikendalikan di HP.",
        createdAt: "2026-07-08T18:45:00Z"
      }
    ],
    createdAt: "2026-07-04T08:30:00Z",
    author: "GL Admin",
    color: "#f59e0b"
  },
  {
    id: "addon-4",
    name: "Fantasy Mythical Creatures",
    description: "Dunia Minecraft-mu sekarang dihuni oleh makhluk-makhluk mitologi legendaris! Temui naga api di gunung berapi, Pegasus terbang tinggi di langit savana, peri hutan yang ramah di biome bunga, hingga Minotaur raksasa yang menjaga labirin bawah tanah. Beberapa makhluk dapat dijinakkan dan dijadikan tunggangan tempur!",
    category: "Petualangan",
    compatibleVersion: "1.20.x - 1.22.x",
    coverUrl: "/api/addons/addon-4/cover",
    fileUrl: "/api/addons/addon-4/download",
    fileName: "mythical_creatures.mcaddon",
    fileSize: "15.1 MB",
    downloads: 1980,
    comments: [],
    createdAt: "2026-07-05T15:10:00Z",
    author: "GL Admin",
    color: "#10b981"
  },
  {
    id: "addon-5",
    name: "Waypoints & Dynamic Minimap HUD",
    description: "Alat navigasi esensial untuk para petualang sejati! Addon ini menambahkan HUD minimap melingkar di sudut layar yang mendeteksi musuh di sekitar secara real-time. Kamu juga bisa membuat kustom waypoint (titik penanda) dengan warna berbeda, dan melakukan teleportasi langsung ke koordinat tersebut melalui menu GUI kompas khusus.",
    category: "Alat (Tools)",
    compatibleVersion: "1.19.x - 1.21.x",
    coverUrl: "/api/addons/addon-5/cover",
    fileUrl: "/api/addons/addon-5/download",
    fileName: "waypoints_minimap.mcaddon",
    fileSize: "1.8 MB",
    downloads: 4120,
    comments: [
      {
        id: "c5-1",
        username: "ExplorerNoob",
        text: "Sangat membantu biar gak tersesat pas nyari Nether Fortress! Fitur teleportasinya juara.",
        createdAt: "2026-07-09T03:40:00Z"
      }
    ],
    createdAt: "2026-07-06T09:00:00Z",
    author: "GL Admin",
    color: "#8b5cf6"
  }
];

const LOCAL_DB_PATH = path.join(process.cwd(), "addons_local.json");

interface LocalAddon extends Addon {
  coverBase64?: string;
  chunks?: { [key: string]: string };
}

let localAddons: { [id: string]: LocalAddon } = {};

function saveLocalDb() {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localAddons, null, 2), "utf-8");
  } catch (err: any) {
    console.error("Gagal menyimpan local DB fallback:", err.message);
  }
}

function seedLocalDbDefaults() {
  localAddons = {};
  for (const item of DEFAULT_ADDONS) {
    const coverBase64 = generateSvgCoverBase64(item.name, item.color);
    const { color, ...addonData } = item;
    
    const dummyData = `// GL COM Minecraft Add-on File\n// Name: ${item.name}\n// Direct download without ads!\n// ID: ${item.id}`;
    
    localAddons[item.id] = {
      ...addonData,
      coverBase64,
      chunks: {
        "chunk-0": Buffer.from(dummyData).toString("base64")
      }
    };
  }
  saveLocalDb();
  console.log("Local DB fallback berhasil diseed dengan default.");
}

function loadLocalDb() {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      localAddons = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf-8"));
      console.log(`Loaded ${Object.keys(localAddons).length} addons from local fallback DB.`);
    } else {
      seedLocalDbDefaults();
    }
  } catch (err: any) {
    console.error("Gagal membaca local DB fallback, membuat ulang:", err.message);
    seedLocalDbDefaults();
  }
}

// Load local database
loadLocalDb();

async function seedDatabaseIfEmpty() {
  if (!db) return;
  try {
    for (const item of DEFAULT_ADDONS) {
      const docRef = doc(db, "addons", item.id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.log(`Seeding metadata for missing addon: ${item.name}`);
        const coverBase64 = generateSvgCoverBase64(item.name, item.color);
        const { color, ...addonData } = item;
        await setDoc(docRef, {
          ...addonData,
          coverBase64
        });
      }

      const chunkRef = doc(db, "addons", item.id, "chunks", "chunk-0");
      const chunkSnap = await getDoc(chunkRef);
      if (!chunkSnap.exists()) {
        console.log(`Seeding missing file chunk for addon: ${item.name}`);
        const dummyData = `// GL COM Minecraft Add-on File\n// Name: ${item.name}\n// Direct download without ads!\n// ID: ${item.id}`;
        await setDoc(chunkRef, {
          index: 0,
          data: Buffer.from(dummyData).toString("base64")
        });
      }
    }
    console.log("Database seed validation and repair completed.");
  } catch (err: any) {
    console.warn("Gagal seeding database Firestore (kemungkinan besar karena batas kuota):", err.message);
  }
}

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase initialized successfully on server. DB ID:", firebaseConfig.firestoreDatabaseId);
    seedDatabaseIfEmpty();
  } catch (err: any) {
    console.error("Error initializing Firebase:", err.message);
  }
}

// Helper to format/send cover response
function sendCoverResponse(res: any, coverBase64: string) {
  const matches = coverBase64.match(/^data:image\/([A-Za-z-+]+);base64,(.+)$/);
  let buffer: Buffer;
  let contentType = "image/png";

  if (matches && matches.length === 3) {
    contentType = `image/${matches[1]}`;
    buffer = Buffer.from(matches[2], "base64");
  } else {
    buffer = Buffer.from(coverBase64, "base64");
  }

  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=86400"); // cache for 1 day
  return res.send(buffer);
}

// API: Get all addons
app.get("/api/addons", async (req, res) => {
  try {
    if (!db) {
      throw new Error("Database tidak terhubung.");
    }
    const addonsRef = collection(db, "addons");
    const querySnap = await getDocs(addonsRef);
    
    const addons = querySnap.docs.map((d) => {
      const data = d.data() as Addon;
      const id = d.id;
      
      // Update local fallback DB cache to stay in sync with remote
      if (!localAddons[id]) {
        localAddons[id] = { ...data } as LocalAddon;
      } else {
        localAddons[id] = {
          ...localAddons[id],
          ...data
        };
      }

      // Exclude heavy coverBase64 field to keep GET response lightweight and ultra-fast
      const { coverBase64, chunks, ...rest } = data as any;
      return rest;
    });

    saveLocalDb();

    // Sort by createdAt descending
    addons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(addons);
  } catch (err: any) {
    console.warn("Firestore error, falling back to local DB cache:", err.message);
    
    // Fallback to local
    const list = Object.values(localAddons).map(({ coverBase64, chunks, ...rest }) => rest);
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(list);
  }
});

// API: Serve custom cover from Firestore database
app.get("/api/addons/:id/cover", async (req, res) => {
  const { id } = req.params;
  try {
    if (!db) throw new Error("Database tidak aktif");
    
    const docRef = doc(db, "addons", id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error("Gambar cover tidak ditemukan");
    }

    const data = docSnap.data();
    if (!data.coverBase64) {
      throw new Error("Data cover tidak tersedia");
    }

    // Sync to local cache
    if (localAddons[id]) {
      localAddons[id].coverBase64 = data.coverBase64;
      saveLocalDb();
    }

    return sendCoverResponse(res, data.coverBase64);
  } catch (err: any) {
    console.warn(`Firestore cover fetch failed for ${id}, using local fallback:`, err.message);
    const addon = localAddons[id];
    if (addon && addon.coverBase64) {
      return sendCoverResponse(res, addon.coverBase64);
    }
    return res.status(404).send("Gambar cover tidak ditemukan");
  }
});

// API: Upload a new addon (chunked inside Firestore)
app.post("/api/addons", async (req, res) => {
  const {
    name,
    description,
    category,
    compatibleVersion,
    author,
    coverBase64,
    fileBase64,
    fileName,
    fileSize
  } = req.body;

  if (!name || !description || !category || !compatibleVersion || !fileName) {
    return res.status(400).json({ error: "Kolom nama, deskripsi, kategori, versi kompatibel, dan file wajib diisi." });
  }

  const id = "addon-" + Date.now();

  let finalCoverBase64 = coverBase64;
  if (!finalCoverBase64) {
    finalCoverBase64 = generateSvgCoverBase64(name, "#10b981");
  }

  const newAddon: Addon = {
    id,
    name,
    description,
    category,
    compatibleVersion,
    coverUrl: `/api/addons/${id}/cover`,
    fileUrl: `/api/addons/${id}/download`,
    fileName,
    fileSize: fileSize || "1.0 MB",
    downloads: 0,
    comments: [],
    createdAt: new Date().toISOString(),
    author: author || "Admin"
  };

  // 1. Store locally immediately
  const localChunks: { [key: string]: string } = {};
  if (fileBase64) {
    const CHUNK_SIZE = 500 * 1024;
    let index = 0;
    for (let i = 0; i < fileBase64.length; i += CHUNK_SIZE) {
      localChunks[`chunk-${index}`] = fileBase64.slice(i, i + CHUNK_SIZE);
      index++;
    }
  } else {
    const dummyData = `// GL COM Minecraft Add-on File\n// Name: ${name}\n// Direct download without ads!\n// ID: ${id}`;
    localChunks["chunk-0"] = Buffer.from(dummyData).toString("base64");
  }

  localAddons[id] = {
    ...newAddon,
    coverBase64: finalCoverBase64,
    chunks: localChunks
  };
  saveLocalDb();

  // 2. Optimistically try Firestore sync
  try {
    if (!db) throw new Error("Database tidak terhubung.");
    
    const addonRef = doc(db, "addons", id);
    await setDoc(addonRef, {
      ...newAddon,
      coverBase64: finalCoverBase64
    });

    if (fileBase64) {
      const CHUNK_SIZE = 500 * 1024;
      let index = 0;
      const writePromises = [];
      for (let i = 0; i < fileBase64.length; i += CHUNK_SIZE) {
        const chunkData = fileBase64.slice(i, i + CHUNK_SIZE);
        const chunkRef = doc(db, "addons", id, "chunks", `chunk-${index}`);
        writePromises.push(setDoc(chunkRef, { index, data: chunkData }));
        index++;
      }
      await Promise.all(writePromises);
    } else {
      const dummyData = `// GL COM Minecraft Add-on File\n// Name: ${name}\n// Direct download without ads!\n// ID: ${id}`;
      const chunkRef = doc(db, "addons", id, "chunks", `chunk-0`);
      await setDoc(chunkRef, {
        index: 0,
        data: Buffer.from(dummyData).toString("base64")
      });
    }
    console.log(`Addon ${name} successfully synced to Firestore.`);
  } catch (error: any) {
    console.warn("Gagal sinkronisasi ke Firestore (disimpan secara lokal):", error.message);
  }

  res.status(201).json(newAddon);
});

// API: Direct direct direct download
app.get("/api/addons/:id/download", async (req, res) => {
  const { id } = req.params;
  let addon: Addon | null = null;
  let base64Content = "";

  try {
    if (!db) throw new Error("Database tidak aktif");

    const docRef = doc(db, "addons", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Add-on tidak ditemukan");
    }

    addon = docSnap.data() as Addon;

    // Increment downloads count in Firestore (background/fire-and-forget)
    updateDoc(docRef, {
      downloads: (addon.downloads || 0) + 1
    }).catch((err) => console.warn("Failed to increment download count in Firestore:", err.message));

    // Fetch all binary chunks from Firestore subcollection
    const chunksRef = collection(db, "addons", id, "chunks");
    const querySnap = await getDocs(chunksRef);
    const chunks = querySnap.docs.map((d) => d.data());

    if (chunks.length === 0) {
      throw new Error("File chunks empty in Firestore");
    }

    chunks.sort((a, b) => a.index - b.index);
    const fullBase64 = chunks.map((c) => c.data).join("");
    
    if (fullBase64.startsWith("data:")) {
      const commaIndex = fullBase64.indexOf(",");
      if (commaIndex !== -1) {
        base64Content = fullBase64.substring(commaIndex + 1);
      }
    } else {
      base64Content = fullBase64;
    }

    // Sync back to local cache
    if (localAddons[id]) {
      localAddons[id].downloads = (localAddons[id].downloads || 0) + 1;
      const localChunks: { [key: string]: string } = {};
      chunks.forEach((c) => {
        localChunks[`chunk-${c.index}`] = c.data;
      });
      localAddons[id].chunks = localChunks;
      saveLocalDb();
    }

  } catch (error: any) {
    console.warn(`Firestore download fetch failed for ${id}, using local fallback:`, error.message);
    const localAddon = localAddons[id];
    if (!localAddon) {
      return res.status(404).send("Add-on tidak ditemukan");
    }
    addon = localAddon;
    localAddon.downloads = (localAddon.downloads || 0) + 1;
    saveLocalDb();

    if (localAddon.chunks) {
      const sortedKeys = Object.keys(localAddon.chunks).sort((a, b) => {
        const idxA = parseInt(a.replace("chunk-", ""));
        const idxB = parseInt(b.replace("chunk-", ""));
        return idxA - idxB;
      });
      const fullBase64 = sortedKeys.map((k) => localAddon.chunks![k]).join("");
      if (fullBase64.startsWith("data:")) {
        const commaIndex = fullBase64.indexOf(",");
        if (commaIndex !== -1) {
          base64Content = fullBase64.substring(commaIndex + 1);
        }
      } else {
        base64Content = fullBase64;
      }
    } else {
      const dummyData = `// GL COM Minecraft Add-on File\n// Name: ${addon.name}\n// Direct download without ads!\n// ID: ${addon.id}`;
      base64Content = Buffer.from(dummyData).toString("base64");
    }
  }

  if (!addon) {
    return res.status(404).send("Add-on tidak ditemukan");
  }

  const buffer = Buffer.from(base64Content, "base64");
  res.setHeader("Content-Disposition", `attachment; filename="${addon.fileName}"`);
  res.setHeader("Content-Type", "application/octet-stream");
  return res.send(buffer);
});

// API: Add comment to an addon
app.post("/api/addons/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { username, text } = req.body;

  if (!username || !text) {
    return res.status(400).json({ error: "Username dan isi komentar wajib diisi." });
  }

  const newComment: Comment = {
    id: "comment-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
    username,
    text,
    createdAt: new Date().toISOString()
  };

  // 1. Save locally first
  const localAddon = localAddons[id];
  if (localAddon) {
    localAddon.comments = localAddon.comments || [];
    localAddon.comments.push(newComment);
    saveLocalDb();
  }

  // 2. Try to sync to Firestore
  try {
    if (!db) throw new Error("Database tidak terhubung.");
    const addonRef = doc(db, "addons", id);
    const docSnap = await getDoc(addonRef);
    if (docSnap.exists()) {
      const addonData = docSnap.data();
      const comments = addonData.comments || [];
      comments.push(newComment);
      await updateDoc(addonRef, { comments });
    }
  } catch (error: any) {
    console.warn("Gagal sinkronisasi komentar ke Firestore (disimpan secara lokal):", error.message);
  }

  res.status(201).json(newComment);
});

// API: Update an existing addon
app.put("/api/addons/:id", async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    category,
    compatibleVersion,
    author,
    coverBase64,
    fileBase64,
    fileName,
    fileSize
  } = req.body;

  // 1. Update local cache FIRST
  const localAddon = localAddons[id];
  if (!localAddon) {
    return res.status(404).json({ error: "Add-on tidak ditemukan." });
  }

  if (name) localAddon.name = name;
  if (description) localAddon.description = description;
  if (category) localAddon.category = category;
  if (compatibleVersion) localAddon.compatibleVersion = compatibleVersion;
  if (author !== undefined) localAddon.author = author || "Admin";

  if (coverBase64) {
    localAddon.coverBase64 = coverBase64;
    localAddon.coverUrl = `/api/addons/${id}/cover`;
  }

  if (fileBase64 && fileName) {
    localAddon.fileName = fileName;
    localAddon.fileSize = fileSize || "1.0 MB";
    localAddon.fileUrl = `/api/addons/${id}/download`;

    const localChunks: { [key: string]: string } = {};
    const CHUNK_SIZE = 500 * 1024;
    let index = 0;
    for (let i = 0; i < fileBase64.length; i += CHUNK_SIZE) {
      localChunks[`chunk-${index}`] = fileBase64.slice(i, i + CHUNK_SIZE);
      index++;
    }
    localAddon.chunks = localChunks;
  }
  saveLocalDb();

  // 2. Try syncing to Firestore
  try {
    if (!db) throw new Error("Database tidak terhubung.");
    const addonRef = doc(db, "addons", id);
    const updates: any = {};

    if (name) updates.name = name;
    if (description) updates.description = description;
    if (category) updates.category = category;
    if (compatibleVersion) updates.compatibleVersion = compatibleVersion;
    if (author !== undefined) updates.author = author || "Admin";

    if (coverBase64) {
      updates.coverBase64 = coverBase64;
      updates.coverUrl = `/api/addons/${id}/cover`;
    }

    if (fileBase64 && fileName) {
      updates.fileName = fileName;
      updates.fileSize = fileSize || "1.0 MB";
      updates.fileUrl = `/api/addons/${id}/download`;

      // Clean old chunks in parallel
      const chunksRef = collection(db, "addons", id, "chunks");
      const chunksSnap = await getDocs(chunksRef);
      const deletePromises = chunksSnap.docs.map((chunkDoc) => deleteDoc(chunkDoc.ref));
      await Promise.all(deletePromises);

      // Write new chunks
      const CHUNK_SIZE = 500 * 1024;
      let index = 0;
      const writePromises = [];
      for (let i = 0; i < fileBase64.length; i += CHUNK_SIZE) {
        const chunkData = fileBase64.slice(i, i + CHUNK_SIZE);
        const chunkRef = doc(db, "addons", id, "chunks", `chunk-${index}`);
        writePromises.push(setDoc(chunkRef, { index, data: chunkData }));
        index++;
      }
      await Promise.all(writePromises);
    }

    await updateDoc(addonRef, updates);
  } catch (error: any) {
    console.warn("Gagal sinkronisasi update ke Firestore (disimpan secara lokal):", error.message);
  }

  // Clean response representation
  const { coverBase64: c, chunks: ch, ...rest } = localAddon;
  res.json(rest);
});

// API: Delete an existing addon
app.delete("/api/addons/:id", async (req, res) => {
  const { id } = req.params;

  // 1. Delete from local FIRST
  if (!localAddons[id]) {
    return res.status(404).json({ error: "Add-on tidak ditemukan." });
  }
  delete localAddons[id];
  saveLocalDb();

  // 2. Try syncing to Firestore
  try {
    if (!db) throw new Error("Database tidak terhubung.");
    const addonRef = doc(db, "addons", id);
    
    // First delete all file chunks subcollection in parallel
    const chunksRef = collection(db, "addons", id, "chunks");
    const chunksSnap = await getDocs(chunksRef);
    const deletePromises = chunksSnap.docs.map((chunkDoc) => deleteDoc(chunkDoc.ref));
    await Promise.all(deletePromises);

    // Delete parent addon metadata document
    await deleteDoc(addonRef);
  } catch (error: any) {
    console.warn("Gagal sinkronisasi hapus ke Firestore (dihapus secara lokal):", error.message);
  }

  res.json({ success: true, message: "Add-on berhasil dihapus." });
});

// ==========================================
// MODRINTH PROXY ENDPOINTS (ONLINE ADD-ONS)
// ==========================================

// API: Search projects on Modrinth
app.get("/api/modrinth/search", async (req, res) => {
  const { query, limit } = req.query;
  const searchQuery = query ? encodeURIComponent(query as string) : "";
  const searchLimit = limit ? parseInt(limit as string, 10) : 20;

  try {
    // Search mods/datapacks/addons on Modrinth
    let url = `https://api.modrinth.com/v2/search?limit=${searchLimit}`;
    if (searchQuery) {
      url += `&query=${searchQuery}`;
    } else {
      url += `&index=downloads`;
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "doorrii75/minecraft-addon-hub/1.0.0 (contact: doorrii75@gmail.com)"
      }
    });

    if (!response.ok) {
      throw new Error(`Modrinth search returned HTTP ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    console.error("Gagal mencari di Modrinth:", err.message);
    res.status(500).json({ error: "Gagal mencari di Modrinth: " + err.message });
  }
});

// API: Get version lists for a project (to fetch the latest download link)
app.get("/api/modrinth/project/:id/version", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await fetch(`https://api.modrinth.com/v2/project/${id}/version`, {
      headers: {
        "User-Agent": "doorrii75/minecraft-addon-hub/1.0.0 (contact: doorrii75@gmail.com)"
      }
    });

    if (!response.ok) {
      throw new Error(`Modrinth version fetch returned HTTP ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    console.error(`Gagal mengambil versi Modrinth untuk project ${id}:`, err.message);
    res.status(500).json({ error: "Gagal mengambil versi Modrinth: " + err.message });
  }
});

// API: Secure download proxy to bypass iframe sandbox/mixed-content restrictions
app.get("/api/modrinth/download", async (req, res) => {
  const { url, filename } = req.query;
  if (!url) {
    return res.status(400).send("Parameter url wajib disertakan.");
  }

  try {
    const fileResponse = await fetch(url as string, {
      headers: {
        "User-Agent": "doorrii75/minecraft-addon-hub/1.0.0 (contact: doorrii75@gmail.com)"
      }
    });

    if (!fileResponse.ok) {
      throw new Error(`Modrinth file download returned HTTP ${fileResponse.status}`);
    }

    const contentType = fileResponse.headers.get("content-type") || "application/octet-stream";
    const fileBuffer = await fileResponse.arrayBuffer();

    res.setHeader("Content-Disposition", `attachment; filename="${filename || "addon.mrpack"}"`);
    res.setHeader("Content-Type", contentType);
    return res.send(Buffer.from(fileBuffer));
  } catch (err: any) {
    console.error("Gagal mendownload file dari Modrinth:", err.message);
    res.status(500).send("Gagal mengunduh file dari Modrinth: " + err.message);
  }
});

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

