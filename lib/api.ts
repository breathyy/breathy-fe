import { getApiBaseUrl } from "./config";

export interface ApiFetchOptions extends RequestInit {
  token?: string;
  json?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
}

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
}

export interface ApiErrorEnvelope {
  success?: false;
  error?: string;
  message?: string;
  code?: string | number;
  [key: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorEnvelope | null;

  constructor(message: string, status: number, body: ApiErrorEnvelope | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const base = getApiBaseUrl();
  const url = new URL(path, base.endsWith("/") ? base : `${base}/`);

  const { token, json, query, headers: headersInit, ...rest } = options;

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      url.searchParams.append(key, String(value));
    });
  }

  const headers = new Headers(headersInit);
  headers.set("Accept", "application/json");

  let body: BodyInit | undefined;
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(json);
  } else if (rest.body) {
    body = rest.body as BodyInit;
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...rest,
    headers,
    body,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    if (!response.ok) {
      throw new ApiError(response.statusText, response.status, null);
    }
    return undefined as T;
  }

  let payload: ApiSuccessEnvelope<T> | ApiErrorEnvelope | Record<string, unknown>;
  try {
    payload = JSON.parse(text) as ApiSuccessEnvelope<T> | ApiErrorEnvelope | Record<string, unknown>;
  } catch (error) {
    throw new ApiError(`Unexpected response format (${(error as Error).message})`, response.status, null);
  }

  const errorMessage = (payload as ApiErrorEnvelope).error || (payload as ApiErrorEnvelope).message || response.statusText;

  if (!response.ok) {
    throw new ApiError(errorMessage, response.status, payload as ApiErrorEnvelope);
  }

  if ("success" in payload && payload.success === false) {
    throw new ApiError(errorMessage || "Unknown API error", response.status, payload as ApiErrorEnvelope);
  }

  if (!("data" in payload)) {
    throw new ApiError("API response missing data field", response.status, payload as ApiErrorEnvelope);
  }

  return payload.data as T;
}
