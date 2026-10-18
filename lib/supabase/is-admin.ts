import { createClient } from "@/lib/supabase/server";

export async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const allowedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!allowedEmail || user.email?.toLowerCase() !== allowedEmail) return null;
  return user;
}
