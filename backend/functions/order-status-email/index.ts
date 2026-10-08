import { createClient } from "npm:@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": Deno.env.get("SITE_ORIGIN") ?? "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const KINDS: Record<string, (o: any, site: string) => { subject: string; body: string }> = {
  "Production": (o) => ({ subject: `Your art is in production (${o.order_number})`, body: `<p>Good news: your metal print is now being made. We'll email you again when it ships.</p>` }),
  "Shipped": (o, site) => ({ subject: `Your order has shipped (${o.order_number})`, body: `<p>Your order is on its way.</p>${o.tracking_number ? `<p>Tracking number: <b>${esc(o.tracking_number)}</b></p>` : ""}<p><a href="${site}track-order.html">Track your order</a></p>` }),
  "Delivered": (o) => ({ subject: `Your order was delivered (${o.order_number})`, body: `<p>Your order should now be on your wall. We'd love to hear how it looks. Just reply to this email with your feedback or a photo.</p>` }),
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const asUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: ok } = await asUser.rpc("is_admin");
    if (ok !== true) return J({ error: "forbidden" }, 403);
    const { order_id } = await req.json();
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: o } = await sb.from("orders").select("*").eq("id", order_id).maybeSingle();
    if (!o || !KINDS[o.status]) return J({ error: "no email for this status" }, 400);
    const { error: dup } = await sb.from("email_log").insert({ order_id: o.id, kind: o.status });
    if (dup) return J({ skipped: true });
    const site = Deno.env.get("SITE_URL") ?? "";
    const m = KINDS[o.status](o, site);
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: Deno.env.get("EMAIL_FROM"), to: o.customer_email, subject: m.subject, html: `<p>Hi ${esc(o.customer_name)},</p>${m.body}<p>Order ${esc(o.order_number)}</p>` }) });
    if (!r.ok) { await sb.from("email_log").delete().eq("order_id", o.id).eq("kind", o.status); throw new Error(await r.text()); }
    return J({ sent: true });
  } catch (e) { console.error(e); return J({ error: "send_failed" }, 500); }
});
