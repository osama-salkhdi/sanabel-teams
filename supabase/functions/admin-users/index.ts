// دالة إدارة الأعضاء — يستدعيها المدير فقط
// Supabase → Edge Functions → Deploy a new function → Via Editor → الاسم: admin-users
import { createClient } from "jsr:@supabase/supabase-js@2";

const DOMAIN = "sanabel.team";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "غير مسجل الدخول" }, 401);
    const { data: prof } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (prof?.role !== "admin") return json({ error: "هذه العملية للمدير فقط" }, 403);

    const b = await req.json();
    if (b.action === "create") {
      const username = String(b.username || "").trim().toLowerCase();
      if (!/^[a-z0-9._-]{3,30}$/.test(username)) return json({ error: "اسم المستخدم: أحرف إنجليزية وأرقام فقط (3 أحرف على الأقل)" }, 400);
      if (!b.password || String(b.password).length < 6) return json({ error: "كلمة السر 6 أحرف على الأقل" }, 400);
      const { data, error } = await admin.auth.admin.createUser({
        email: `${username}@${DOMAIN}`, password: b.password, email_confirm: true,
        user_metadata: { full_name: b.full_name || username },
      });
      if (error) return json({ error: error.message }, 400);
      await admin.from("profiles").update({ full_name: b.full_name || username, specialty: b.specialty || null }).eq("id", data.user.id);
      return json({ id: data.user.id });
    }
    if (b.action === "set_password") {
      if (!b.password || String(b.password).length < 6) return json({ error: "كلمة السر 6 أحرف على الأقل" }, 400);
      const { error } = await admin.auth.admin.updateUserById(b.user_id, { password: b.password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }
    if (b.action === "delete") {
      if (b.user_id === user.id) return json({ error: "لا يمكنك حذف حسابك" }, 400);
      const { error } = await admin.auth.admin.deleteUser(b.user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }
    return json({ error: "عملية غير معروفة" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
