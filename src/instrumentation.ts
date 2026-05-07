export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const upstream = process.env.UPSTREAM_API_URL;

    if (!apiBase) {
      console.warn("[GodenStream] NEXT_PUBLIC_API_BASE is not set");
    }
    if (!appUrl) {
      console.warn("[GodenStream] NEXT_PUBLIC_APP_URL is not set");
    }
    if (!upstream) {
      console.warn(
        "[GodenStream] UPSTREAM_API_URL is not set — server-side API calls will use the proxy path",
      );
    }

    console.log("[GodenStream] Environment validated");
  }
}
