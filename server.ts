/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Addon, Comment } from "./src/types.js";

const app = express();
const PORT = 3000;

// Set higher limits for base64 file uploads (covers and add-on files)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const DB_FILE = path.join(process.cwd(), "addons_db.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const COVERS_DIR = path.join(UPLOADS_DIR, "covers");
const FILES_DIR = path.join(UPLOADS_DIR, "files");

// Ensure directories exist
[UPLOADS_DIR, COVERS_DIR, FILES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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

// Initial/Seed Add-ons Data
const DEFAULT_ADDONS: Addon[] = [
  {
    id: "addon-1",
    name: "More Ores & Armor Ultimate",
    description: "Menambahkan lebih dari 15 jenis bijih tambang baru di bawah tanah Minecraft! Mulai dari Ruby, Sapphire, Amethyst, Cobalt, hingga Vibranium kuno. Setiap bijih dapat ditempa menjadi set armor lengkap dan peralatan perang (pedang, kapak, beliung) dengan efek pasif unik seperti ketahanan api, kecepatan gerak, atau penglihatan malam.",
    category: "Survival",
    compatibleVersion: "1.21.x - 1.22.x",
    coverUrl: "", // Will be populated with SVG base64
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
    author: "GL Admin"
  },
  {
    id: "addon-2",
    name: "Modern Furniture DecoCraft",
    description: "Hiasi rumah modern impianmu dengan ratusan furnitur interaktif! Dilengkapi kulkas fungsional yang bisa menyimpan makanan, sofa empuk untuk bersantai, TV LED yang bisa dinyalakan, lampu tidur dengan tingkat kecerahan dinamis, hingga set wastafel dan toilet modern. Sangat cocok untuk pemain kreatif maupun survival dekoratif.",
    category: "Kreatif",
    compatibleVersion: "1.20.x - 1.21.x",
    coverUrl: "", // Will be populated
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
    author: "GL Admin"
  },
  {
    id: "addon-3",
    name: "Advanced Super Vehicles Pack",
    description: "Kendarai kendaraan berkecepatan tinggi di dunia kotak-kotakmu! Paket ini menghadirkan mobil sport mewah, helikopter tempur, sepeda motor trail, jet ski, dan truk tangki air. Semua kendaraan memiliki animasi roda berputar, speedometer di HUD, bagasi penyimpanan terintegrasi, dan membutuhkan bahan bakar batu bara atau bensin.",
    category: "Transportasi",
    compatibleVersion: "1.21.x",
    coverUrl: "", // Will be populated
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
    author: "GL Admin"
  },
  {
    id: "addon-4",
    name: "Fantasy Mythical Creatures",
    description: "Dunia Minecraft-mu sekarang dihuni oleh makhluk-makhluk mitologi legendaris! Temui naga api di gunung berapi, Pegasus terbang tinggi di langit savana, peri hutan yang ramah di biome bunga, hingga Minotaur raksasa yang menjaga labirin bawah tanah. Beberapa makhluk dapat dijinakkan dan dijadikan tunggangan tempur!",
    category: "Petualangan",
    compatibleVersion: "1.20.x - 1.22.x",
    coverUrl: "", // Will be populated
    fileUrl: "/api/addons/addon-4/download",
    fileName: "mythical_creatures.mcaddon",
    fileSize: "15.1 MB",
    downloads: 1980,
    comments: [],
    createdAt: "2026-07-05T15:10:00Z",
    author: "GL Admin"
  },
  {
    id: "addon-5",
    name: "Waypoints & Dynamic Minimap HUD",
    description: "Alat navigasi esensial untuk para petualang sejati! Addon ini menambahkan HUD minimap melingkar di sudut layar yang mendeteksi musuh di sekitar secara real-time. Kamu juga bisa membuat kustom waypoint (titik penanda) dengan warna berbeda, dan melakukan teleportasi langsung ke koordinat tersebut melalui menu GUI kompas khusus.",
    category: "Alat (Tools)",
    compatibleVersion: "1.19.x - 1.21.x",
    coverUrl: "", // Will be populated
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
    author: "GL Admin"
  }
];

// Ensure database is initialized empty on startup if not present
function initDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
  }
}

initDatabase();

// Load Database Helper
function getAddons(): Addon[] {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch (e) {
    return [];
  }
}

// Save Database Helper
function saveAddons(addons: Addon[]) {
  fs.writeFileSync(DB_FILE, JSON.stringify(addons, null, 2));
}

// Serve uploaded covers statically
app.use("/uploads", express.static(UPLOADS_DIR));

// API: Get all addons
app.get("/api/addons", (req, res) => {
  const addons = getAddons();
  res.json(addons);
});

// API: Upload a new addon (with Base64 payload)
app.post("/api/addons", (req, res) => {
  try {
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

    const addons = getAddons();
    const id = "addon-" + Date.now();

    let coverUrl = "";
    if (coverBase64) {
      // Decode and save custom cover
      const matches = coverBase64.match(/^data:image\/([A-Za-z-+]+);base64,(.+)$/);
      let ext = "png";
      let buffer: Buffer;

      if (matches && matches.length === 3) {
        ext = matches[1];
        buffer = Buffer.from(matches[2], "base64");
      } else {
        buffer = Buffer.from(coverBase64, "base64");
      }

      const coverFilename = `cover-${id}.${ext}`;
      fs.writeFileSync(path.join(COVERS_DIR, coverFilename), buffer);
      coverUrl = `/uploads/covers/${coverFilename}`;
    } else {
      // Generate standard cover
      const coverBase64 = generateSvgCoverBase64(name, "#10b981");
      const coverFilename = `cover-${id}.svg`;
      const base64Data = coverBase64.replace(/^data:image\/svg\+xml;base64,/, "");
      fs.writeFileSync(path.join(COVERS_DIR, coverFilename), Buffer.from(base64Data, "base64"));
      coverUrl = `/uploads/covers/${coverFilename}`;
    }

    let fileUrl = "";
    if (fileBase64) {
      // Decode and save addon file
      const matches = fileBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;

      if (matches && matches.length === 3) {
        buffer = Buffer.from(matches[2], "base64");
      } else {
        buffer = Buffer.from(fileBase64, "base64");
      }

      // Safe filename sanitation
      const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      fs.writeFileSync(path.join(FILES_DIR, `${id}-${safeFileName}`), buffer);
      fileUrl = `/api/addons/${id}/download`;
    } else {
      // Create a dummy file if not supplied, though client will supply it
      const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      fs.writeFileSync(path.join(FILES_DIR, `${id}-${safeFileName}`), `// MOCK ADDON FILE ${name}`);
      fileUrl = `/api/addons/${id}/download`;
    }

    const newAddon: Addon = {
      id,
      name,
      description,
      category,
      compatibleVersion,
      coverUrl,
      fileUrl,
      fileName,
      fileSize: fileSize || "1.0 MB",
      downloads: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      author: author || "Admin"
    };

    addons.unshift(newAddon);
    saveAddons(addons);

    res.status(201).json(newAddon);
  } catch (error: any) {
    console.error("Error creating addon:", error);
    res.status(500).json({ error: "Gagal menyimpan add-on: " + error.message });
  }
});

// API: Direct Direct direct direct ad-free download
// Also increments download count!
app.get("/api/addons/:id/download", (req, res) => {
  try {
    const { id } = req.params;
    const addons = getAddons();
    const addon = addons.find((a) => a.id === id);

    if (!addon) {
      return res.status(404).send("Add-on tidak ditemukan");
    }

    // Increment downloads count on the server
    addon.downloads += 1;
    saveAddons(addons);

    // Look for the file on disk
    // In seed data: file is addon.fileName
    // In user uploaded data: file is `${addon.id}-${addon.fileName}`
    let filePath = path.join(FILES_DIR, addon.fileName);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(FILES_DIR, `${addon.id}-${addon.fileName}`);
    }

    // If still not exist, write a mock text file dynamically so the download succeeds!
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, `// GL COM Minecraft Add-on File\n// Name: ${addon.name}\n// Direct download without ads!\n// ID: ${addon.id}`);
    }

    // Direct download without ads! Beautiful!
    res.download(filePath, addon.fileName, (err) => {
      if (err) {
        console.error("Error sending file:", err);
      }
    });
  } catch (error) {
    console.error("Download endpoint error:", error);
    res.status(500).send("Error downloading file");
  }
});

// API: Add comment to an addon
app.post("/api/addons/:id/comments", (req, res) => {
  try {
    const { id } = req.params;
    const { username, text } = req.body;

    if (!username || !text) {
      return res.status(400).json({ error: "Username dan isi komentar wajib diisi." });
    }

    const addons = getAddons();
    const addonIndex = addons.findIndex((a) => a.id === id);

    if (addonIndex === -1) {
      return res.status(404).json({ error: "Add-on tidak ditemukan." });
    }

    const newComment: Comment = {
      id: "comment-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      username,
      text,
      createdAt: new Date().toISOString()
    };

    addons[addonIndex].comments.push(newComment);
    saveAddons(addons);

    res.status(201).json(newComment);
  } catch (error: any) {
    res.status(500).json({ error: "Gagal menambahkan komentar: " + error.message });
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
