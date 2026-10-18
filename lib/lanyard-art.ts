import type { Profile } from "@/lib/portfolio-data";

/**
 * Membuat gambar untuk lanyard 3D (komponen React Bits) langsung dari data profil:
 * - front: sisi depan kartu (foto/inisial, nama, role, lokasi)
 * - back : sisi belakang kartu (ajakan kontak, email, lokasi)
 * - strap: motif tali dengan tulisan berulang
 *
 * Supaya tulisan tajam di layar:
 * - ukuran huruf dibuat besar (kartu hanya tampil ±300px lebar di layar, jadi huruf kecil tidak terbaca),
 * - digambar 1,5x lebih besar (SCALE) lalu diperkecil halus oleh komponen Lanyard,
 * - disimpan sebagai PNG (tanpa kompresi yang merusak tepi huruf).
 *
 * Hasilnya berupa blob URL. Panggil revokeLanyardArt() saat gambar tidak dipakai lagi.
 */

export type LanyardArt = { front: string; back: string; strap: string };

type Ctx = CanvasRenderingContext2D;

// Koordinat gambar memakai ruang 1024 x 1440 (rasio kartu portrait 1,6 : 2,25).
const W = 1024;
const H = 1440;
const SCALE = 1.5;

const DISPLAY = "'Manrope', 'Segoe UI', system-ui, sans-serif";
const SANS = "'DM Sans', 'Segoe UI', system-ui, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'Courier New', monospace";

function makeCanvas(width: number, height: number, scale = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D tidak tersedia");
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { canvas, ctx };
}

function setSpacing(ctx: Ctx, px: number) {
  (ctx as Ctx & { letterSpacing?: string }).letterSpacing = `${px}px`;
}

function roundRectPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Mengecilkan ukuran huruf sampai teks muat dalam lebar maksimum. */
function fitFont(ctx: Ctx, text: string, weight: number, family: string, startSize: number, maxWidth: number, minSize = 36) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function wrapLines(ctx: Ctx, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[.,;:\s]+$/, "")}…`;
    return kept;
  }
  return lines;
}

function initialsOf(name: string) {
  const letters = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("");
  return (letters || "•").toUpperCase();
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function toBlobUrl(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(URL.createObjectURL(blob)) : reject(new Error("Gagal membuat gambar lanyard"))),
      type,
      quality,
    );
  });
}

function paintBackground(ctx: Ctx, flip = false) {
  const base = ctx.createLinearGradient(flip ? W : 0, 0, flip ? 0 : W, H);
  base.addColorStop(0, "#15173a");
  base.addColorStop(0.55, "#0c0e24");
  base.addColorStop(1, "#1a1244");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  const violet = ctx.createRadialGradient(W * (flip ? 0.15 : 0.85), H * 0.12, 0, W * (flip ? 0.15 : 0.85), H * 0.12, 560);
  violet.addColorStop(0, "rgba(160, 140, 255, 0.34)");
  violet.addColorStop(1, "rgba(160, 140, 255, 0)");
  ctx.fillStyle = violet;
  ctx.fillRect(0, 0, W, H);

  const cyan = ctx.createRadialGradient(W * (flip ? 0.9 : 0.1), H * 0.93, 0, W * (flip ? 0.9 : 0.1), H * 0.93, 600);
  cyan.addColorStop(0, "rgba(90, 190, 255, 0.22)");
  cyan.addColorStop(1, "rgba(90, 190, 255, 0)");
  ctx.fillStyle = cyan;
  ctx.fillRect(0, 0, W, H);

  roundRectPath(ctx, 26, 26, W - 52, H - 52, 62);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function paintFooter(ctx: Ctx) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  ctx.fillRect(72, 1290, W - 144, 3);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#a3aacb";
  ctx.font = `500 30px ${MONO}`;
  setSpacing(ctx, 3);
  ctx.textAlign = "left";
  ctx.fillText("PERSONAL PORTFOLIO", 72, 1360);
  ctx.textAlign = "right";
  ctx.fillText(`© ${new Date().getFullYear()}`, W - 72, 1360);
  ctx.textAlign = "left";
  setSpacing(ctx, 0);
}

/** Bentuk "blob" bersudut seperti pada kartu lama. */
function blobPath(ctx: Ctx, cx: number, cy: number, w: number, h: number) {
  const points: Array<[number, number]> = [
    [0.28, 0], [0.72, 0], [0.95, 0.2], [0.94, 0.77], [0.74, 1], [0.24, 1], [0.05, 0.76], [0.06, 0.22],
  ];
  ctx.beginPath();
  points.forEach(([px, py], index) => {
    const x = cx - w / 2 + px * w;
    const y = cy - h / 2 + py * h;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}


function paintFront(profile: Profile, avatar: HTMLImageElement | null) {
  const { canvas, ctx } = makeCanvas(W, H, SCALE);
  paintBackground(ctx);

  // Label atas + status (dibiarkan di bawah lubang tali kartu)
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#c3c7e3";
  ctx.font = `500 34px ${MONO}`;
  setSpacing(ctx, 4);
  ctx.textAlign = "left";
  ctx.fillText("CREATIVE DEVELOPER", 72, 232);
  setSpacing(ctx, 0);

  const pill = { w: 292, h: 68 };
  const pillX = W - 72 - pill.w;
  roundRectPath(ctx, pillX, 232 - pill.h / 2, pill.w, pill.h, pill.h / 2);
  ctx.fillStyle = "rgba(102, 226, 173, 0.14)";
  ctx.fill();
  ctx.strokeStyle = "rgba(122, 240, 187, 0.55)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#7af0bb";
  ctx.beginPath();
  ctx.arc(pillX + 38, 232, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c4f7e0";
  ctx.font = `500 30px ${MONO}`;
  setSpacing(ctx, 2);
  ctx.fillText("AVAILABLE", pillX + 64, 234);
  setSpacing(ctx, 0);

  // Panggung potret
  const stage = { x: 60, y: 300, w: W - 120, h: 620 };
  roundRectPath(ctx, stage.x, stage.y, stage.w, stage.h, 56);
  const stageFill = ctx.createLinearGradient(stage.x, stage.y, stage.x + stage.w, stage.y + stage.h);
  stageFill.addColorStop(0, "rgba(119, 114, 200, 0.28)");
  stageFill.addColorStop(1, "rgba(28, 44, 80, 0.36)");
  ctx.fillStyle = stageFill;
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 3;
  ctx.stroke();

  const cx = W / 2;
  const cy = stage.y + stage.h / 2;
  ctx.save();
  roundRectPath(ctx, stage.x, stage.y, stage.w, stage.h, 56);
  ctx.clip();
  const glow = ctx.createRadialGradient(cx, stage.y + stage.h * 0.92, 0, cx, stage.y + stage.h * 0.92, 420);
  glow.addColorStop(0, "rgba(152, 143, 255, 0.34)");
  glow.addColorStop(1, "rgba(152, 143, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(stage.x, stage.y, stage.w, stage.h);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(207, 197, 255, 0.2)";
  ctx.beginPath();
  ctx.arc(cx, cy, 250, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([12, 14]);
  ctx.strokeStyle = "rgba(164, 207, 255, 0.26)";
  ctx.beginPath();
  ctx.arc(cx, cy, 325, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Foto profil atau inisial (diperbesar sesuai tinggi kotak panggung stage)
  const bh = stage.h;
  const bw = Math.round(stage.h * (370 / 450));
  ctx.save();
  ctx.shadowColor = "rgba(139, 144, 255, 0.45)";
  ctx.shadowBlur = 70;
  blobPath(ctx, cx, cy, bw, bh);
  const blobFill = ctx.createLinearGradient(cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2);
  blobFill.addColorStop(0, "rgba(210, 204, 255, 0.96)");
  blobFill.addColorStop(0.45, "rgba(126, 160, 255, 0.9)");
  blobFill.addColorStop(1, "rgba(119, 215, 224, 0.88)");
  ctx.fillStyle = blobFill;
  ctx.fill();
  ctx.restore();

  if (avatar) {
    ctx.save();
    blobPath(ctx, cx, cy, bw, bh);
    ctx.clip();
    const scale = Math.max(bw / avatar.width, bh / avatar.height);
    const dw = avatar.width * scale;
    const dh = avatar.height * scale;
    ctx.drawImage(avatar, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();
  } else {
    const initials = initialsOf(profile.name);
    ctx.fillStyle = "rgba(18, 22, 48, 0.78)";
    ctx.font = `800 ${initials.length > 1 ? 260 : 310}px ${DISPLAY}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    setSpacing(ctx, -8);
    ctx.fillText(initials, cx, cy + 8);
    setSpacing(ctx, 0);
  }
  blobPath(ctx, cx, cy, bw, bh);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Nama, role, lokasi
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  setSpacing(ctx, -2);
  fitFont(ctx, profile.name, 800, DISPLAY, 120, W - 144, 56);
  ctx.fillText(profile.name, 72, 1044);
  setSpacing(ctx, 0);

  ctx.fillStyle = "#dadcf2";
  fitFont(ctx, profile.role, 600, SANS, 50, W - 144, 30);
  ctx.fillText(profile.role, 72, 1114);

  if (profile.location) {
    ctx.strokeStyle = "#b4b9d6";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(88, 1166, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#c3c7e3";
    ctx.font = `500 38px ${MONO}`;
    setSpacing(ctx, 1);
    ctx.fillText(profile.location, 118, 1180);
    setSpacing(ctx, 0);
  }

  paintFooter(ctx);
  return canvas;
}

function paintBack(profile: Profile) {
  const { canvas, ctx } = makeCanvas(W, H, SCALE);
  paintBackground(ctx, true);

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = "#c3c7e3";
  ctx.font = `500 34px ${MONO}`;
  setSpacing(ctx, 4);
  ctx.fillText("LET'S CONNECT", 72, 232);
  setSpacing(ctx, 0);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 120px ${DISPLAY}`;
  setSpacing(ctx, -4);
  ctx.fillText("Ide bagus", 72, 440);
  ctx.fillText("layak jadi", 72, 562);
  const accent = ctx.createLinearGradient(72, 0, 760, 0);
  accent.addColorStop(0, "#d9d0ff");
  accent.addColorStop(1, "#8fd8ff");
  ctx.fillStyle = accent;
  ctx.fillText("kenyataan.", 72, 684);
  setSpacing(ctx, 0);

  ctx.fillStyle = "#d3d6ee";
  ctx.font = `500 42px ${SANS}`;
  wrapLines(ctx, profile.headline, W - 144, 3).forEach((line, index) => {
    ctx.fillText(line, 72, 790 + index * 60);
  });

  const rows: Array<[string, string]> = [];
  if (profile.email) rows.push(["EMAIL", profile.email]);
  if (profile.whatsapp) rows.push(["WHATSAPP", profile.whatsapp]);
  if (profile.location) rows.push(["LOKASI", profile.location]);
  rows.slice(0, 2).forEach(([label, value], index) => {
    const y = 1072 + index * 112;
    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    ctx.fillRect(72, y - 62, W - 144, 3);
    ctx.fillStyle = "#a3aacb";
    ctx.font = `500 26px ${MONO}`;
    setSpacing(ctx, 4);
    ctx.fillText(label, 72, y - 18);
    setSpacing(ctx, 0);
    ctx.fillStyle = "#ffffff";
    fitFont(ctx, value, 700, SANS, 46, W - 144, 28);
    ctx.fillText(value, 72, y + 32);
  });

  paintFooter(ctx);
  return canvas;
}

/** Motif tali: gradasi ungu-biru, jahitan putus-putus, dan teks yang berulang. */
function paintStrap(text: string) {
  const width = 960;
  const height = 160;
  const repeats = 3;
  const { canvas, ctx } = makeCanvas(width, height, 2);

  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, "#5546d8");
  base.addColorStop(0.5, "#7ea8ff");
  base.addColorStop(1, "#5546d8");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 12]);
  [16, height - 16].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  const label = `${text}  ✦`;
  const unit = width / repeats;
  ctx.font = `700 40px ${MONO}`;
  setSpacing(ctx, 5);
  const measured = ctx.measureText(label).width;
  const size = Math.min(64, Math.floor((40 * unit * 0.84) / measured));
  ctx.font = `700 ${size}px ${MONO}`;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(10, 12, 40, 0.45)";
  ctx.shadowBlur = 5;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < repeats; i++) ctx.fillText(label, unit * (i + 0.5), height / 2 + 2);
  return canvas;
}

export async function buildLanyardArt(profile: Profile, strapText = "PORTFOLIO"): Promise<LanyardArt> {
  // Tunggu font situs siap supaya teks di kartu memakai font yang sama dengan halaman.
  try {
    await Promise.all([
      document.fonts.load(`800 64px ${DISPLAY}`),
      document.fonts.load(`700 32px ${SANS}`),
      document.fonts.load(`600 32px ${SANS}`),
      document.fonts.load(`500 24px ${MONO}`),
      document.fonts.load(`700 24px ${MONO}`),
    ]);
    await document.fonts.ready;
  } catch {
    /* lanjut dengan font cadangan */
  }
  const avatar = await loadImage(profile.avatarUrl);
  const [front, back, strap] = await Promise.all([
    toBlobUrl(paintFront(profile, avatar), "image/png"),
    toBlobUrl(paintBack(profile), "image/png"),
    toBlobUrl(paintStrap(strapText), "image/png"),
  ]);
  return { front, back, strap };
}

/** Membebaskan memori blob URL yang sudah tidak dipakai. */
export function revokeLanyardArt(art: LanyardArt | null) {
  if (!art) return;
  URL.revokeObjectURL(art.front);
  URL.revokeObjectURL(art.back);
  URL.revokeObjectURL(art.strap);
}
