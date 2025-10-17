type RuntimeEnv = { __env?: Record<string, string | undefined> };

const readRuntimeEnv = (key: string): string | undefined => {
  const fromProcess = process.env[key];
  if (fromProcess !== undefined) {
    return fromProcess;
  }
  if (typeof window !== "undefined") {
    const runtime = window as unknown as RuntimeEnv;
    return runtime.__env?.[key];
  }
  return undefined;
};

const normalizeBaseUrl = (value: string): string => value.replace(/\/$/, "");

export function getApiBaseUrl(): string {
  const base = readRuntimeEnv("NEXT_PUBLIC_API_BASE_URL");

  if (!base || base.trim().length === 0) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  }

  return normalizeBaseUrl(base);
}

export function getBlobPublicBaseUrl(): string | null {
  const base = readRuntimeEnv("NEXT_PUBLIC_BLOB_PUBLIC_BASE_URL");
  if (!base || base.trim().length === 0) {
    return null;
  }
  return normalizeBaseUrl(base);
}
