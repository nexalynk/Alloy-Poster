import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature") ?? ""; const body = await req.text(); let ev;
  try { ev = await stripe.webhooks.constructEventAsync(body, sig, Deno.env.get("STRIPE_WEBHOOK_SECRET")!, undefined, Stripe.createSubtleCryptoProvider()); }
  catch { return new Response("bad signature", { status: 400 }); }
  if (ev.type === "checkout.session.completed") {
    const s = ev.data.object as any;
    const { data: o } = await sb.from("orders").update({ status: "Payment Confirmed", paid_at: new Date().toISOString(), stripe_payment_intent: s.payment_intent }).eq("id", s.metadata.order_id).eq("status", "Pending Payment").select().maybeSingle();
    if (o && Deno.env.get("RESEND_API_KEY")) await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: Deno.env.get("EMAIL_FROM"), to: o.customer_email, subject: `Order ${o.order_number} confirmed`, html: `<p>Thank you! Your metal art is being prepared.</p><p>Order number: <b>${o.order_number}</b></p>` }) });
  }
  return new Response("ok");
});
