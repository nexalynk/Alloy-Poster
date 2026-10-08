# Alloy Poster: deploy guide (about 45 minutes)

You need free accounts at **Supabase**, **Stripe**, **Resend** (email) and a static host (**Vercel**). Use Stripe *test mode* until step 8.

## 1. Database (Supabase)
1. supabase.com > New project. Save the database password.
2. SQL Editor > paste all of `backend/schema.sql` > Run. It is safe to run again (for example after an update), so "already exists" errors should not happen.
3. Authentication > Users > Add user (your email + a strong password).
4. In the SQL Editor run (use your email): `update profiles set role='admin' where id=(select id from auth.users where email='you@example.com');`
5. Project Settings > API: copy the **Project URL** and the **anon public** key.

## 2. Connect the website
Open `site/assets/config.js` and paste the URL and anon key between the quotes. (The anon key is public by design. Never paste the service_role key anywhere in `site/`.)

## 3. Put the site online (Vercel) and connect alloyposter.com
Easiest: push the `site` folder to a GitHub repository, then in Vercel choose Add New > Project, import it, leave Framework as "Other", and Deploy. (Or from this folder run `npx vercel deploy site --prod`.)
Then add your domain: Vercel project > Settings > Domains > add `alloyposter.com` (and `www.alloyposter.com`). At the company where you bought the domain, add the DNS records Vercel shows you, exactly as shown. It can take from a few minutes to a few hours to start working.
Your site address is now `https://alloyposter.com/`.

## 4. Email (Resend)
Resend > API Keys > create one. Add and verify your sending domain, then pick a sender like `Alloy Poster <orders@alloyposter.com>`.

## 5. Deploy the server functions
You need Node.js installed (nodejs.org). Run `npx supabase@latest login` once and follow the browser prompt. On Windows, run the script below in Git Bash or WSL. From this folder (`alloy-poster`):
```
PROJECT_REF=<your project ref> STRIPE_SECRET_KEY=sk_test_... SITE_URL=https://alloyposter.com/ \
RESEND_API_KEY=re_... EMAIL_FROM="Alloy Poster <orders@alloyposter.com>" bash backend/deploy.sh
```
The project ref is the code in your Supabase URL (`https://<ref>.supabase.co`).

## 6. Stripe webhook
Stripe > Developers > Webhooks > Add endpoint: the URL printed by the script, event `checkout.session.completed`. Copy the signing secret (`whsec_...`) and run the same command from step 5 again with `STRIPE_WEBHOOK_SECRET=whsec_...` added.

## 7. Test
Open your site, then check each:
- [ ] Upload a photo, add to cart, check out with test card `4242 4242 4242 4242` (any future date, any CVC).
- [ ] You land on the confirmation page and get the confirmation email.
- [ ] `/admin.html`: sign in, the order shows under Needs review.
- [ ] Set it to Shipped with a tracking number: the customer email arrives and Artwork buttons open the photo.
- [ ] Change the price per square inch in Pricing & shipping: the new price shows on the site after a refresh.

## 8. Go live
Stripe: switch to live mode, replace `STRIPE_SECRET_KEY` with the live key and create the webhook again in live mode. Re-run step 5 and 6 with the live values. Make sure `SITE_URL` is `https://alloyposter.com/`.

## Troubleshooting
| Problem | Check |
|---|---|
| Site shows demo behavior | `config.js` is empty or has a typo |
| "We couldn't start checkout" | Step 5 not run, or `SITE_URL` missing the final `/` |
| Order stays Pending Payment | Webhook missing or wrong signing secret (step 6) |
| No emails | Domain not verified in Resend, or `EMAIL_FROM` not on that domain |
| Admin says no access | Step 1.4 not run for that email |
| "Too many attempts" | Rate limit: 10 checkouts per 10 min and 40 uploads per hour per visitor |

Leave `config.js` empty to try the site in demo mode (browser-only cart and orders, no payment).
"# Alloy-Poster" 
