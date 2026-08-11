const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Missing required web environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.trim();
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim();

function parseHttpsUrl(value, name) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }
  if (parsed.protocol !== "https:") {
    throw new Error(`${name} must use HTTPS for a production build.`);
  }
  return parsed;
}

const supabase = parseHttpsUrl(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL");
const site = parseHttpsUrl(siteUrl, "NEXT_PUBLIC_SITE_URL");

if (!supabase.hostname.endsWith(".supabase.co")) {
  console.warn("Warning: NEXT_PUBLIC_SUPABASE_URL is not a *.supabase.co URL. Verify this is intentional.");
}

if (site.hostname === "localhost" || site.hostname === "127.0.0.1") {
  throw new Error("NEXT_PUBLIC_SITE_URL cannot point to localhost in a production build.");
}

const loweredKey = anonKey.toLowerCase();
if (loweredKey.includes("service_role") || loweredKey.includes("secret")) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY appears to contain a privileged/secret key. Never expose a service-role key to the browser.");
}

console.log(`Web environment validated for ${site.origin}${site.pathname}`);
console.log(`Supabase project host: ${supabase.host}`);
