import Constants from "expo-constants";
import { NativeModules, Platform } from "react-native";

const DEV_API_PORT = 8787;

function extractHost(hostUri: string): string | null {
  const trimmed = String(hostUri || "").trim();
  if (!trimmed) return null;

  // hostUri/debuggerHost commonly look like: "192.168.1.5:8081"
  // sometimes they include protocol: "http://192.168.1.5:8081"
  const noProto = trimmed.replace(/^https?:\/\//, "");
  const host = noProto.split("/")[0]?.split(":")[0];
  return host || null;
}

function inferDevHostFromExpo(): string | null {
  const anyConstants = Constants as any;

  const hostUri =
    Constants.expoConfig?.hostUri ||
    anyConstants?.manifest?.debuggerHost ||
    anyConstants?.manifest2?.extra?.expoClient?.hostUri;

  return hostUri ? extractHost(hostUri) : null;
}

function inferDevHostFromSourceCode(): string | null {
  // In RN dev builds, this usually points at Metro, e.g.
  //   http://192.168.1.5:8081/index.bundle?platform=ios&dev=true
  // or sometimes exp.direct / tunnel URLs.
  const scriptUrl: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
  if (!scriptUrl) return null;
  try {
    const url = new URL(scriptUrl);
    return url.hostname || null;
  } catch {
    return extractHost(scriptUrl);
  }
}

export type ApiBaseResolution = {
  baseUrl: string | null;
  source: "env" | "expoHost" | "localhost" | "missing";
};

export function resolveApiBaseUrl(): ApiBaseResolution {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (envUrl) return { baseUrl: envUrl, source: "env" };

  // Web can reach a local dev server via localhost.
  if (Platform.OS === "web") {
    return { baseUrl: `http://localhost:${DEV_API_PORT}`, source: "localhost" };
  }

  // Native: use the Metro host IP so the phone can reach your Mac.
  const host = inferDevHostFromExpo() || inferDevHostFromSourceCode();
  if (host) {
    return { baseUrl: `http://${host}:${DEV_API_PORT}`, source: "expoHost" };
  }

  return { baseUrl: null, source: "missing" };
}

export function requireApiBaseUrl(): string {
  const { baseUrl } = resolveApiBaseUrl();
  if (!baseUrl) {
    throw new Error(
      "API base URL is not set. Set EXPO_PUBLIC_RORK_API_BASE_URL or run in Expo dev with a detectable host."
    );
  }
  return baseUrl;
}
