import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
export const runtime = "nodejs";
const schema = z.object({ name: z.string().trim().min(2).max(100), email: z.email().max(160), service: z.string().trim().max(100).optional().default(""), message: z.string().trim().min(10).max(3000), website: z.string().optional() });
export async function POST(request: Request) {
  try { const body: unknown = await request.json(); const parsed = schema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data formulir belum valid." }, { status: 400 }); if (parsed.data.website) return NextResponse.json({ ok: true, message: "Pesan diterima." });
    const db = createAdminClient(); const { data, error } = await db.from("Message").insert({ name: parsed.data.name, email: parsed.data.email, service: parsed.data.service, message: parsed.data.message }).select("id").single(); if (error) throw error; return NextResponse.json({ ok: true, id: data.id, message: "Pesan berhasil dikirim." }, { status: 201 });
  } catch (error) { console.error("Gagal menyimpan pesan:", error); return NextResponse.json({ error: "Pesan belum bisa disimpan. Coba lagi beberapa saat." }, { status: 500 }); }
}
