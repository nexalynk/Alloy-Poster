#!/usr/bin/env bash
# Photo uploads only (no Stripe needed yet):   PROJECT_REF=abc ./deploy.sh
# Everything:  PROJECT_REF=abc STRIPE_SECRET_KEY=sk_test_... SITE_URL=https://alloyposter.com/ [RESEND_API_KEY=... EMAIL_FROM="Alloy Poster <orders@alloyposter.com>"] [STRIPE_WEBHOOK_SECRET=whsec_...] ./deploy.sh
set -eu
: "${PROJECT_REF:?Set PROJECT_REF (the code in your Supabase URL)}"
cd "$(dirname "$0")/.."
if command -v supabase >/dev/null 2>&1; then SB=supabase; else SB="npx --yes supabase@latest"; fi
[ -f supabase/config.toml ] || $SB init
$SB link --project-ref "$PROJECT_REF"
mkdir -p supabase && rm -rf supabase/functions && cp -r backend/functions supabase/functions
if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "No STRIPE_SECRET_KEY given: deploying photo uploads only."
  $SB functions deploy upload-url
  echo "Done. Photo uploads are on. Run again with STRIPE_SECRET_KEY and SITE_URL to turn on checkout."; exit 0
fi
: "${SITE_URL:?Set SITE_URL, e.g. https://alloyposter.com/}"
args=(STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" SITE_URL="$SITE_URL" SITE_ORIGIN="${SITE_URL%/}")
[ -n "${RESEND_API_KEY:-}" ] && args+=(RESEND_API_KEY="$RESEND_API_KEY" EMAIL_FROM="${EMAIL_FROM:?set EMAIL_FROM with RESEND_API_KEY}")
[ -n "${STRIPE_WEBHOOK_SECRET:-}" ] && args+=(STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET")
$SB secrets set "${args[@]}"
for f in create-checkout upload-url order-status-email; do $SB functions deploy "$f"; done
$SB functions deploy stripe-webhook --no-verify-jwt
echo "Done. Webhook URL: https://$PROJECT_REF.functions.supabase.co/stripe-webhook"
