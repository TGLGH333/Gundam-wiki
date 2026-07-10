type AuthUser = { id: string; email?: string };
type AuthSession = { access_token: string; user: AuthUser };
type AuthCallback = (event: string, session: AuthSession | null) => void;

const TOKEN_KEY = "gundam_supabase_token";
const listeners = new Set<AuthCallback>();

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

function configuration() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "",
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  };
}

function storedToken() {
  return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
}

async function requestJson(url: string, init: RequestInit = {}) {
  const { key } = configuration();
  const token = storedToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token ?? key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) return { data: null, error: { message: data?.msg ?? data?.message ?? data?.error_description ?? "Supabase request failed" } };
  return { data, error: null };
}

function tableClient(table: string) {
  const { url } = configuration();
  return {
    select(_columns = "*") {
      const filters: string[] = [];
      const execute = (order?: string) => requestJson(`${url}/rest/v1/${encodeURIComponent(table)}?select=*${filters.length ? `&${filters.join("&")}` : ""}${order ? `&order=${order}` : ""}`);
      const builder = {
        eq(column: string, value: string) {
          filters.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`);
          return builder;
        },
        async order(column: string, options?: { ascending?: boolean }) {
          return execute(`${encodeURIComponent(column)}.${options?.ascending === false ? "desc" : "asc"}`);
        },
        async single() {
          const result = await execute();
          return result.error ? result : { data: Array.isArray(result.data) ? (result.data[0] ?? null) : result.data, error: null };
        },
      };
      return builder;
    },
    async upsert(rows: unknown[]) {
      return requestJson(`${url}/rest/v1/${encodeURIComponent(table)}`, {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(rows),
      });
    },
  };
}

export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  const { url, key } = configuration();

  return {
    from: tableClient,
    auth: {
      async getUser() {
        const token = storedToken();
        if (!token) return { data: { user: null as AuthUser | null }, error: null };
        const result = await requestJson(`${url}/auth/v1/user`);
        return { data: { user: result.data as AuthUser | null }, error: result.error };
      },
      async signInWithPassword(credentials: { email: string; password: string }) {
        const result = await requestJson(`${url}/auth/v1/token?grant_type=password`, { method: "POST", body: JSON.stringify(credentials) });
        if (result.data?.access_token && typeof window !== "undefined") {
          localStorage.setItem(TOKEN_KEY, result.data.access_token);
          const session = result.data as AuthSession;
          listeners.forEach((listener) => listener("SIGNED_IN", session));
        }
        return result;
      },
      async signUp(credentials: { email: string; password: string }) {
        return requestJson(`${url}/auth/v1/signup`, { method: "POST", body: JSON.stringify(credentials) });
      },
      async signOut() {
        await requestJson(`${url}/auth/v1/logout`, { method: "POST" });
        if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
        listeners.forEach((listener) => listener("SIGNED_OUT", null));
        return { error: null };
      },
      onAuthStateChange(callback: AuthCallback) {
        listeners.add(callback);
        return { data: { subscription: { unsubscribe: () => { listeners.delete(callback); } } } };
      },
    },
    storage: {
      from(bucket: string) {
        return {
          async upload(path: string, file: File, options?: { upsert?: boolean }) {
            const token = storedToken();
            const response = await fetch(`${url}/storage/v1/object/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`, {
              method: "POST",
              headers: {
                apikey: key,
                Authorization: `Bearer ${token ?? key}`,
                "Content-Type": file.type,
                "x-upsert": options?.upsert ? "true" : "false",
              },
              body: file,
            });
            const data = await response.json().catch(() => null);
            return response.ok ? { data, error: null } : { data: null, error: { message: data?.message ?? data?.error ?? "Image upload failed" } };
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}` } };
          },
        };
      },
    },
  };
}
