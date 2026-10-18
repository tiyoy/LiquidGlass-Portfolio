import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const db = createAdminClient();
    const [profile, services, projects, testimonials] = await Promise.all([
      db.from("Profile").select("*").eq("id", "main").maybeSingle(),
      db.from("Service").select("*").order("sortOrder"),
      db.from("Project").select("*").order("sortOrder"),
      db.from("Testimonial").select("*").order("sortOrder"),
    ]);
    const err = profile.error || services.error || projects.error || testimonials.error; if (err) throw err;
    return NextResponse.json({ profile: profile.data, services: services.data, projects: projects.data, testimonials: testimonials.data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { console.error("Gagal mengambil data portofolio:", error); return NextResponse.json({ error: "Data Supabase belum tersedia. Jalankan supabase/schema.sql dan seed data." }, { status: 500 }); }
}
