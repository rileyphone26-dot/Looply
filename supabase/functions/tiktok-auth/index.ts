import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TIKTOK_CLIENT_KEY = Deno.env.get("TIKTOK_CLIENT_KEY") ?? "";
const TIKTOK_CLIENT_SECRET = Deno.env.get("TIKTOK_CLIENT_SECRET") ?? "";
const TIKTOK_REDIRECT_URI = Deno.env.get("TIKTOK_REDIRECT_URI") ?? "";
const LOOPLY_SITE_URL = Deno.env.get("LOOPLY_SITE_URL") ?? "https://rileyphone26-dot.github.io/Nova/";

const corsHeaders = {
  "Access-Control-Allow-Origin": LOOPLY_SITE_URL.replace(/\/$/, ""),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Vary": "Origin",
};

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "no-store" } });
}

function siteResult(result: string) {
  const url = new URL(LOOPLY_SITE_URL);
  url.searchParams.set("tiktok", result);
  return redirect(url.toString());
}

async function requireUser(req: Request) {
  const header = req.headers.get("Authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

function requireTikTokConfig() {
  return Boolean(TIKTOK_CLIENT_KEY && TIKTOK_CLIENT_SECRET && TIKTOK_REDIRECT_URI);
}

async function tokenRequest(params: Record<string, string>) {
  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
    body: new URLSearchParams(params),
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error_description || data.message || "TikTok token request failed");
  return data;
}

async function getConnection(userId: string) {
  const { data, error } = await admin.from("tiktok_connections").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

async function freshConnection(userId: string) {
  let connection = await getConnection(userId);
  if (!connection) return null;
  if (Date.parse(connection.access_token_expires_at) > Date.now() + 90_000) return connection;
  if (!connection.refresh_token || !requireTikTokConfig()) throw new Error("TikTok connection expired. Reconnect your account.");
  const tokens = await tokenRequest({
    client_key: TIKTOK_CLIENT_KEY,
    client_secret: TIKTOK_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: connection.refresh_token,
  });
  connection = {
    ...connection,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || connection.refresh_token,
    access_token_expires_at: new Date(Date.now() + Number(tokens.expires_in || 86400) * 1000).toISOString(),
    refresh_token_expires_at: new Date(Date.now() + Number(tokens.refresh_expires_in || 31536000) * 1000).toISOString(),
    scope: tokens.scope || connection.scope,
    updated_at: new Date().toISOString(),
  };
  const { error } = await admin.from("tiktok_connections").upsert(connection, { onConflict: "user_id" });
  if (error) throw error;
  return connection;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "status";

  if (action === "callback") {
    if (url.searchParams.get("error")) return siteResult("error");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state || !requireTikTokConfig()) return siteResult("error");

    const { data: stateRow, error: stateError } = await admin
      .from("tiktok_oauth_states").select("user_id, expires_at").eq("state", state).maybeSingle();
    if (stateError || !stateRow || Date.parse(stateRow.expires_at) < Date.now()) {
      if (stateRow) await admin.from("tiktok_oauth_states").delete().eq("state", state);
      return siteResult("error");
    }
    await admin.from("tiktok_oauth_states").delete().eq("state", state);

    try {
      const tokens = await tokenRequest({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: TIKTOK_REDIRECT_URI,
      });
      const fields = "open_id,avatar_url,display_name";
      const profileResponse = await fetch(`https://open.tiktokapis.com/v2/user/info/?fields=${fields}`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profileJson = await profileResponse.json();
      if (!profileResponse.ok || profileJson.error?.code && profileJson.error.code !== "ok") {
        throw new Error("Could not read TikTok profile");
      }
      const profile = profileJson.data?.user ?? {};
      const row = {
        user_id: stateRow.user_id,
        open_id: tokens.open_id,
        display_name: profile.display_name ?? null,
        avatar_url: profile.avatar_url ?? null,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        access_token_expires_at: new Date(Date.now() + Number(tokens.expires_in || 86400) * 1000).toISOString(),
        refresh_token_expires_at: new Date(Date.now() + Number(tokens.refresh_expires_in || 31536000) * 1000).toISOString(),
        scope: tokens.scope ?? "",
        updated_at: new Date().toISOString(),
      };
      const { error } = await admin.from("tiktok_connections").upsert(row, { onConflict: "user_id" });
      if (error) throw error;
      return siteResult("connected");
    } catch (error) {
      console.error("TikTok callback failed", error);
      return siteResult("error");
    }
  }

  if (action === "start") {
    const user = await requireUser(req);
    if (!user) return json({ error: "Sign in to Looply before connecting TikTok." }, 401);
    if (!requireTikTokConfig()) return json({ error: "TikTok setup is not configured yet. Add the developer app secrets in Supabase first." }, 503);
    const state = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
    const { error } = await admin.from("tiktok_oauth_states").insert({
      state,
      user_id: user.id,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    if (error) return json({ error: "Could not start secure TikTok sign-in." }, 500);
    const authorize = new URL("https://www.tiktok.com/v2/auth/authorize/");
    authorize.search = new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      response_type: "code",
      scope: "user.info.basic,video.list",
      redirect_uri: TIKTOK_REDIRECT_URI,
      state,
    }).toString();
    return json({ authorize_url: authorize.toString() });
  }

  const user = await requireUser(req);
  if (!user) return json({ error: "Sign in to Looply first." }, 401);

  if (action === "disconnect") {
    const connection = await getConnection(user.id);
    if (connection?.access_token) {
      try {
        await fetch("https://open.tiktokapis.com/v2/oauth/revoke/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ client_key: TIKTOK_CLIENT_KEY, client_secret: TIKTOK_CLIENT_SECRET, token: connection.access_token }),
        });
      } catch (_) { /* Remove local tokens even if revoke cannot be reached. */ }
    }
    const { error } = await admin.from("tiktok_connections").delete().eq("user_id", user.id);
    if (error) return json({ error: "Could not disconnect TikTok." }, 500);
    return json({ connected: false });
  }

  if (action === "status") {
    const connection = await getConnection(user.id);
    return json({ connected: Boolean(connection), profile: connection ? {
      display_name: connection.display_name, avatar_url: connection.avatar_url, scope: connection.scope,
    } : null });
  }

  if (action === "videos") {
    try {
      const connection = await freshConnection(user.id);
      if (!connection) return json({ error: "Connect your TikTok account first." }, 404);
      const response = await fetch("https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,duration,cover_image_url,embed_link,share_url", {
        method: "POST",
        headers: { Authorization: `Bearer ${connection.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ max_count: 20 }),
      });
      const result = await response.json();
      if (!response.ok || result.error?.code && result.error.code !== "ok") {
        return json({ error: result.error?.message || "TikTok could not return your videos." }, 502);
      }
      return json({ videos: result.data?.videos ?? [] });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Could not load TikTok videos." }, 502);
    }
  }

  return json({ error: "Unknown action." }, 400);
});
