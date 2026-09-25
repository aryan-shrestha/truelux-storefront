import { env } from "@/lib/env";
import { ApiUnreachableError, toApiError } from "@/lib/api/errors";

/**
 * The only place in this repository that calls the backend.
 *
 * The caching directive is part of the options type rather than a default, so a
 * call that states neither `revalidate` nor `cache` does not compile. That is
 * what keeps ADR 0001's request budget honest: the intervals are terms in a sum,
 * and a call nobody decided the cost of breaks the arithmetic silently.
 */

type QueryValue = string | number | boolean | undefined;

type BaseOptions = {
  query?: Record<string, QueryValue>;
  method?: "GET" | "POST";
  body?: unknown;
};

type CachedOptions = BaseOptions & { revalidate: number; cache?: never };
type UncachedOptions = BaseOptions & { cache: "no-store"; revalidate?: never };

export type RequestOptions = CachedOptions | UncachedOptions;

function baseUrl(): string {
  // Evaluated per call, not at import: the same module is bundled for both
  // runtimes. Locally the two values are identical, which is why calling a
  // browser-only endpoint from the server works in development and fails in
  // production with a CORS error and no server-side trace.
  return typeof window === "undefined" ? env.apiBaseUrl : env.publicApiBaseUrl;
}

function buildQuery(query: Record<string, QueryValue> | undefined): string {
  if (!query) return "";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    // An empty value mints a distinct cache key for identical results, so it is
    // dropped rather than sent.
    if (value === undefined || value === "") continue;
    params.set(key, String(value));
  }

  const serialised = params.toString();
  return serialised === "" ? "" : `?${serialised}`;
}

export async function request<T>(path: string, options: RequestOptions): Promise<T> {
  // Django redirects a path without a trailing slash, which costs a round trip
  // and can turn a POST into a GET.
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
    // Never reached the API, so there is no envelope and no code. "We could not
    // reach the store" is a different fact from "the store said no".
    throw new ApiUnreachableError(cause);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  return (await response.json()) as T;
}

/**
 * Resolves an image URL against the API.
 *
 * Production serves Cloudinary URLs, which are absolute. Local development
 * overrides the storage backend to the filesystem, so `image.url` is
 * `/media/products/foo.jpg` — relative, and `next/image` would resolve it
 * against the storefront's own origin and 404.
 */
export function toAbsoluteImageUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${baseUrl()}${url.startsWith("/") ? url : `/${url}`}`;
}
