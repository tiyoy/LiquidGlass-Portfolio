import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/supabase/is-admin";

export const runtime = "nodejs";

const MAX = 10 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "Login admin diperlukan." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  if (!TYPES.has(file.type)) return NextResponse.json({ error: "Gunakan gambar JPG, PNG, atau WebP." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Ukuran gambar maksimal 10 MB." }, { status: 413 });

  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const rawFolder = form.get("folder");
  const folder = typeof rawFolder === "string" && ["profile", "projects", "testimonials", "covers"].includes(rawFolder)
    ? rawFolder
    : "profile";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const db = createAdminClient();
  const { error } = await db.storage.from("portfolio-media").upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Upload ke Supabase Storage gagal. Jalankan schema.sql terlebih dahulu." }, { status: 500 });
  }

  const { data } = db.storage.from("portfolio-media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}

