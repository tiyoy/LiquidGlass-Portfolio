import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const schema = z.object({ email: z.email().max(200), password: z.string().min(1).max(300) });

export async function POST(request: Request) {
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Masukkan email dan password yang valid." }, { status: 400 });
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || parsed.data.email.toLowerCase() !== adminEmail) return NextResponse.json({ error: "Akun ini tidak diizinkan sebagai admin." }, { status: 401 });
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) return NextResponse.json({ error: "Email atau password salah. Pastikan akun admin sudah dibuat di Supabase Auth." }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== adminEmail) { await supabase.auth.signOut(); return NextResponse.json({ error: "Akun tidak memiliki akses admin." }, { status: 403 }); }
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
