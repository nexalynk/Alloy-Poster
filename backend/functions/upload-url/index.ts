import { createClient } from "npm:@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": Deno.env.get("SITE_ORIGIN") ?? "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    const { data: ok } = await sb.rpc("check_rate", { p_key: "upload:" + ip, p_max: 40, p_window: 3600 });
    if (ok !== true) return J({ error: "rate_limited" }, 429);
    const { ext, type, size } = await req.json();
    if (TYPES[ext] !== type || !(size > 0 && size <= 41943040)) return J({ error: "invalid_file" }, 400);
    const path = `uploads/${crypto.randomUUID()}.${ext}`;
    const { data, error } = await sb.storage.from("designs").createSignedUploadUrl(path);
    if (error) throw error;
    return J({ path, token: data.token });
  } catch (e) { console.error(e); return J({ error: "failed" }, 500); }
});
