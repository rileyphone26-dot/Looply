# Looply — browser-based short-video app starter

This is a **web/PWA starter**, not an APK. It is branded independently and offers a vertical short-video style interface, local video selection, like buttons, a local comment demo, and installable-home-screen metadata.

## Run it
Host the files on any static HTTPS host. GitHub Pages works:
1. Upload all files in this folder to the root of a GitHub repository (or a `/docs` folder if configuring Pages for `/docs`).
2. In that repository, open **Settings → Pages**.
3. Select **Deploy from a branch**, choose `main` and `/ (root)` (or `/docs` if applicable), then Save.
4. Wait for the Pages URL to appear. Open it in Chrome on Android.
5. Chrome menu ⋮ → **Add to Home screen** or **Install app**, if offered.

## Important limitations
- This starter does not connect to the original Kotlin/Firebase/Cloudflare backend.
- Videos selected from your phone are played locally in the current session; they are **not uploaded to a server** and will not appear for other users.
- Real accounts, public uploads, synced likes/comments, moderation/reporting/blocking, and secure storage require a production backend and configuration.
- Do not put Firebase admin credentials, private API keys, or upload secrets in browser JavaScript.
- This is an independent TikTok-style app, not the official TikTok app and not affiliated with TikTok.
