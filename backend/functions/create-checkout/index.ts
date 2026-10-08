import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": Deno.env.get("SITE_ORIGIN") ?? "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    const { data: allowed } = await sb.rpc("check_rate", { p_key: "checkout:" + ip, p_max: 10, p_window: 600 });
    if (allowed !== true) return J({ error: "rate_limited" }, 429);
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
    const b = await req.json(); const items = b.items, cu = b.customer;
    if (!Array.isArray(items) || !items.length || items.length > 20 || !/^[^@\s]+@[^@\s]+$/.test(cu?.email ?? "")) return J({ error: "invalid" }, 400);
    const [rules, opts, disc] = await Promise.all([sb.from("pricing_rules").select("*"), sb.from("product_options").select("*").eq("active", true), sb.from("discount_rules").select("*").eq("active", true)]);
    const R = Object.fromEntries(rules.data!.map((r) => [r.key, +r.value]));
    const opt = (t: string, n: string) => opts.data!.find((o) => o.type === t && o.name === n);
    const lines: any[] = [], clean: any[] = []; let sub = 0;
    for (const i of items) {
      const w = +i.d?.[0], h = +i.d?.[1], q = Math.floor(+i.qty);
      const f = opt("finish", i.finish), m = opt("mount", i.mount), e = opt("enhance", i.enh), sh = opt("shape", i.shape ?? "Rectangle");
      if (!(w > 0 && w <= 96 && h > 0 && h <= 96 && q >= 1 && q <= 50 && f && m && e && sh)) return J({ error: "invalid item" }, 400);
      if (i.file && !/^uploads\/[\w-]+\.[a-z0-9]+$/.test(i.file)) return J({ error: "invalid file" }, 400);
      const files = Array.isArray(i.files) ? i.files : [];
      if (files.length > 12 || files.some((x: unknown) => typeof x !== "string" || !/^uploads\/[\w-]+\.[a-z0-9]+$/.test(x))) return J({ error: "invalid files" }, 400);
      const rate = Math.max(0, ...disc.data!.filter((d) => q >= d.min_qty).map((d) => +d.rate));
      const u = Math.max(R.min_price, w * h * R.price_per_sq_in) * +f.multiplier + +m.addon + +e.addon + +sh.addon;
      const cents = Math.round(u * (1 - rate) * 100); sub += cents * q;
      const name = String(i.name ?? "Custom Metal Print").slice(0, 80);
      lines.push({ quantity: q, price_data: { currency: "usd", unit_amount: cents, product_data: { name, description: `${w} × ${h} in · ${i.finish} · ${i.mount}${i.shape && i.shape !== "Rectangle" ? " · " + i.shape : ""}${i.enh !== "None" ? " · Enhanced" : ""}` } } });
      clean.push({ name, d: [w, h], finish: i.finish, shape: i.shape ?? "Rectangle", mount: i.mount, enh: i.enh, qty: q, file: i.file ?? null, files, unit: cents / 100 });
    }
    const express = b.shipping === "express";
    const ship = (sub >= R.free_shipping_over * 100 ? 0 : Math.round(R.shipping_flat * 100)) + (express ? Math.round(R.shipping_express * 100) : 0);
    const tax = Math.round((sub + ship) * R.tax_rate);
    if (ship) lines.push({ quantity: 1, price_data: { currency: "usd", unit_amount: ship, product_data: { name: express ? "Express shipping" : "Shipping" } } });
    if (tax) lines.push({ quantity: 1, price_data: { currency: "usd", unit_amount: tax, product_data: { name: "Estimated tax" } } });
    const { data: order, error } = await sb.from("orders").insert({ customer_email: cu.email.toLowerCase(), customer_name: String(cu.name ?? "").slice(0, 120), shipping_address: cu.address, items: clean, subtotal: sub / 100, shipping: ship / 100, tax: tax / 100, total: (sub + ship + tax) / 100, shipping_method: express ? "express" : "standard" }).select("id").single();
    if (error) throw error;
    const site = Deno.env.get("SITE_URL")!; // e.g. https://yourstore.com/
    const session = await stripe.checkout.sessions.create({ mode: "payment", customer_email: cu.email, line_items: lines, success_url: `${site}order-confirmation?s={CHECKOUT_SESSION_ID}`, cancel_url: `${site}cart`, metadata: { order_id: order.id } });
    await sb.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
    return J({ url: session.url });
  } catch (e) { console.error(e); return J({ error: "checkout_failed" }, 500); }
});
