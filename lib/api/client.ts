import { env } from "@/lib/env";
import { ApiUnreachableError, toApiError } from "@/lib/api/errors";

type QueryValue = string | number | boolean | string[] | undefined;

type BaseOptions = {
  query?: Record<string, QueryValue>;
  method?: "GET" | "POST";
  body?: unknown;
};

// A caching directive is required by the type, so no call can skip deciding its
// cost against the catalogue request budget (ADR 0001).
type CachedOptions = BaseOptions & { revalidate: number; cache?: never };
type UncachedOptions = BaseOptions & { cache: "no-store"; revalidate?: never };

export type RequestOptions = CachedOptions | UncachedOptions;

function baseUrl(): string {
  // Evaluated per call: this module is bundled for both the server and the browser.
  return typeof window === "undefined" ? env.apiBaseUrl : env.publicApiBaseUrl;
}

function buildQuery(query: Record<string, QueryValue> | undefined): string {
  if (!query) return "";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    // An empty value would mint a distinct cache key for identical results.
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else {
      params.set(key, String(value));
    }
  }

  const serialised = params.toString();
  return serialised === "" ? "" : `?${serialised}`;
}

export async function request<T>(path: string, options: RequestOptions): Promise<T> {
  // Django redirects a path without a trailing slash, which can turn a POST into a GET.
  if (!path.endsWith("/")) {
    throw new Error(`API paths must end in a trailing slash: ${path}`);
  }

  const url = `${baseUrl()}${path}${buildQuery(options.query)}`;

  const init: RequestInit & { next?: { revalidate: number } } = {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    ...(options.cache === "no-store"
      ? { cache: "no-store" as const }
      : { next: { revalidate: options.revalidate } }),
  };

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (cause) {
    throw new ApiUnreachableError(cause);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  return (await response.json()) as T;
}

/** In local development the API serves media from its own filesystem as relative paths. */
export function toAbsoluteImageUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${baseUrl()}${url.startsWith("/") ? url : `/${url}`}`;
}
