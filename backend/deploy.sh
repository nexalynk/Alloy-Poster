#!/usr/bin/env bash
# Usage: PROJECT_REF=abc STRIPE_SECRET_KEY=sk_test_... SITE_URL=https://yoursite.com/ [RESEND_API_KEY=... EMAIL_FROM="Shop <orders@alloyposter.com>"] [STRIPE_WEBHOOK_SECRET=whsec_...] ./deploy.sh
set -eu
: "${PROJECT_REF:?}" "${STRIPE_SECRET_KEY:?}" "${SITE_URL:?}"
cd "$(dirname "$0")/.."
if command -v supabase >/dev/null 2>&1; then SB=supabase; else SB="npx --yes supabase@latest"; fi
[ -f supabase/config.toml ] || $SB init
$SB link --project-ref "$PROJECT_REF"
args=(STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" SITE_URL="$SITE_URL" SITE_ORIGIN="${SITE_URL%/}")
[ -n "${RESEND_API_KEY:-}" ] && args+=(RESEND_API_KEY="$RESEND_API_KEY" EMAIL_FROM="${EMAIL_FROM:?set EMAIL_FROM with RESEND_API_KEY}")
[ -n "${STRIPE_WEBHOOK_SECRET:-}" ] && args+=(STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET")
$SB secrets set "${args[@]}"
mkdir -p supabase && rm -rf supabase/functions && cp -r backend/functions supabase/functions
for f in create-checkout upload-url order-status-email; do $SB functions deploy "$f"; done
$SB functions deploy stripe-webhook --no-verify-jwt
echo "Done. Webhook URL: https://$PROJECT_REF.functions.supabase.co/stripe-webhook"
