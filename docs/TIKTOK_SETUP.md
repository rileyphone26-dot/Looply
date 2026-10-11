# TikTok setup for Looply (Nova)

The code is prepared, but TikTok login stays inactive until you create/approve a TikTok developer app and configure Supabase secrets. **Never commit a client secret, access token, or refresh token to GitHub or paste secrets into chat.**

## What this integration supports

- OAuth 2.0 Login Kit with CSRF state validation.
- Display API scopes: `user.info.basic` and `video.list`.
- Server-side token exchange and refresh.
- Token storage in Supabase tables with RLS enabled and no client read policies.
- Listing the signed-in user's public TikTok videos.
- Disconnect flow with a best-effort token revoke.
- Public video embeds remain available independently.

It does not provide likes/comments on arbitrary TikTok videos. TikTok must approve the requested products/scopes before the API calls can succeed.

## 1. TikTok developer app

In [TikTok for Developers](https://developers.tiktok.com/), create/select an app and request **Login Kit** and **TikTok API / Display API** access. Request `user.info.basic` and `video.list`.

Use this exact redirect URI in the Login Kit product settings:

```
https://vnggkzdythazonznfizx.supabase.co/functions/v1/tiktok-auth?action=callback
```

Copy the **Client key** and **Client secret** from the developer portal. Keep the secret private.

## 2. Supabase SQL

Open your Supabase project's SQL Editor and run the complete file:

`supabase/migrations/202610110001_tiktok_oauth.sql`

This creates the OAuth state and token tables. The tables intentionally have no client-access policies.

## 3. Deploy the Edge Function

Install/use the Supabase CLI in a trusted terminal, log in, link the project, and deploy:

```sh
supabase login
supabase link --project-ref vnggkzdythazonznfizx
supabase functions deploy tiktok-auth --no-verify-jwt
```

The function has its own user-JWT validation for signed-in actions; callback is public by design and protected with a one-time, short-lived OAuth state value.

## 4. Add secrets in Supabase

In Supabase Dashboard → Edge Functions → Secrets, add:

- `TIKTOK_CLIENT_KEY` = your TikTok client key
- `TIKTOK_CLIENT_SECRET` = your TikTok client secret
- `TIKTOK_REDIRECT_URI` = the exact redirect URI above
- `LOOPLY_SITE_URL` = `https://rileyphone26-dot.github.io/Nova/`

Supabase normally provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. If your project dashboard does not provide them automatically, configure the required values as function secrets. Never put the service-role key in frontend code.

## 5. Redirect URLs and testing

In Supabase Authentication → URL Configuration, ensure the site URL is `https://rileyphone26-dot.github.io/Nova/` and add it to allowed redirect URLs if needed.

After deployment and approval, sign in to Looply, open Discover → TikTok, and press **Connect TikTok**. TikTok asks for consent. After approving, Looply returns to the site and can load your own videos.

## Security notes

- The callback URI must match exactly in TikTok's developer portal and Supabase secrets.
- Keep the client secret and tokens on the server only.
- The OAuth state expires after 10 minutes and is deleted when consumed.
- If TikTok has not approved the app/products/scopes, the connection may fail even with correct keys.
- This repository is a static GitHub Pages site; OAuth token exchange must happen in Supabase Edge Functions, never in browser JavaScript.
