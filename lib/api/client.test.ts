import { afterEach, describe, expect, it, vi } from "vitest";

import { request, toAbsoluteImageUrl } from "@/lib/api/client";
import { ApiError, ApiUnreachableError } from "@/lib/api/errors";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function stubFetch(response: Response | Error) {
  // Typed with fetch's own signature so the recorded calls are inspectable;
  // a bare vi.fn(() => ...) records calls as an empty tuple.
  const fetchMock = vi.fn((_url: string | URL | Request, _init?: RequestInit) =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("request", () => {
  it("returns the payload unwrapped on success", async () => {
    stubFetch(jsonResponse({ count: 0, results: [] }));

    await expect(request("/api/v1/products/", { revalidate: 300 })).resolves.toEqual({
      count: 0,
      results: [],
    });
  });

  it("refuses a path without a trailing slash", async () => {
    // Django redirects one, which costs a round trip and can turn a POST into a GET.
    await expect(request("/api/v1/products", { revalidate: 300 })).rejects.toThrow(
      "trailing slash",
    );
  });

  it("omits absent and empty query values so the cache key stays canonical", async () => {
    const fetchMock = stubFetch(jsonResponse({}));

    await request("/api/v1/products/", {
      revalidate: 300,
      query: { category: "serums", size: undefined, search: "", in_stock: true, limit: 25 },
    });

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("category=serums");
    expect(url).toContain("in_stock=true");
    expect(url).toContain("limit=25");
    expect(url).not.toContain("size=");
    expect(url).not.toContain("search=");
  });

  it("repeats a parameter once per value of an array", async () => {
    const fetchMock = stubFetch(jsonResponse({}));

    await request("/api/v1/products/", {
      revalidate: 300,
      query: { brand: ["lumiere", "verde"] },
    });

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.searchParams.getAll("brand")).toEqual(["lumiere", "verde"]);
  });

  it("passes revalidate through to the data cache", async () => {
    const fetchMock = stubFetch(jsonResponse({}));

    await request("/api/v1/products/", { revalidate: 900 });

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ next: { revalidate: 900 } });
  });

  it("sends no-store for a customer-scoped call", async () => {
    const fetchMock = stubFetch(jsonResponse({}));

    await request("/api/v1/orders/lookup/", { cache: "no-store", method: "POST", body: { a: 1 } });

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ cache: "no-store", method: "POST" });
  });

  it("passes an abort signal through", async () => {
    const fetchMock = stubFetch(jsonResponse({}));
    const controller = new AbortController();

    await request("/api/v1/checkout/quote/", {
      cache: "no-store",
      method: "POST",
      body: {},
      signal: controller.signal,
    });

    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(controller.signal);
  });

  it("throws an ApiError carrying the code for a non-2xx", async () => {
    stubFetch(
      jsonResponse({ error: { code: "not_found", message: "Not found.", details: {} } }, 404),
    );

    await expect(request("/api/v1/products/nope/", { revalidate: 900 })).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it("distinguishes a transport failure from the store saying no", async () => {
    stubFetch(new TypeError("Failed to fetch"));

    await expect(request("/api/v1/products/", { revalidate: 300 })).rejects.toBeInstanceOf(
      ApiUnreachableError,
    );
  });
});

describe("toAbsoluteImageUrl", () => {
  it("leaves an absolute Cloudinary URL alone", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/products/tee.jpg";

    expect(toAbsoluteImageUrl(url)).toBe(url);
  });

  it("resolves the relative path the filesystem backend serves in development", () => {
    // Production is Cloudinary and absolute; local development overrides the
    // storage backend, and next/image would resolve a bare /media/... path
    // against the storefront's own origin and 404.
    expect(toAbsoluteImageUrl("/media/products/tee.jpg")).toBe(
      "http://127.0.0.1:8000/media/products/tee.jpg",
    );
  });

  it("tolerates a path with no leading slash", () => {
    expect(toAbsoluteImageUrl("media/products/tee.jpg")).toBe(
      "http://127.0.0.1:8000/media/products/tee.jpg",
    );
  });
});
