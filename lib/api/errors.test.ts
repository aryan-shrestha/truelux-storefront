import { describe, expect, it } from "vitest";

import { ApiError, hasCode, isApiError, toApiError } from "@/lib/api/errors";

function response(body: unknown, status = 422, requestId: string | null = "req-1"): Response {
  const headers = new Headers();
  if (requestId !== null) headers.set("X-Request-ID", requestId);
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers,
  });
}

describe("toApiError", () => {
  it("reads the envelope the backend publishes", async () => {
    const error = await toApiError(
      response({
        error: {
          code: "insufficient_stock",
          message: "Not enough stock to fulfil this order.",
          details: { variant_id: "1b7d", requested: 3 },
        },
      }),
    );

    expect(error.code).toBe("insufficient_stock");
    expect(error.status).toBe(422);
    expect(error.details).toEqual({ variant_id: "1b7d", requested: 3 });
    expect(error.requestId).toBe("req-1");
  });

  it("treats a body that is not JSON as a server fault, whatever the status says", async () => {
    const error = await toApiError(response("<html>502 Bad Gateway</html>", 502));

    expect(error.code).toBe("server_error");
    expect(error.status).toBe(502);
  });

  it("treats JSON without an error object as a server fault", async () => {
    const error = await toApiError(response({ detail: "Not found." }, 404));

    expect(error.code).toBe("server_error");
  });

  it("always exposes details as an object, never undefined", async () => {
    const error = await toApiError(
      response({ error: { code: "not_found", message: "Nope." } }, 404),
    );

    expect(error.details).toEqual({});
  });

  it("tolerates a missing request id", async () => {
    const error = await toApiError(
      response({ error: { code: "throttled", message: "Slow down." } }, 429, null),
    );

    expect(error.requestId).toBeNull();
  });
});

describe("branching on failures", () => {
  it("identifies an ApiError", () => {
    expect(isApiError(new ApiError("not_found", 404, {}, null, "Not found."))).toBe(true);
    expect(isApiError(new Error("boom"))).toBe(false);
  });

  it("matches on code, which is the contract, and not on message", () => {
    const error = new ApiError("variant_unavailable", 422, {}, null, "Gone.");

    expect(hasCode(error, "variant_unavailable")).toBe(true);
    expect(hasCode(error, "insufficient_stock")).toBe(false);
    expect(hasCode(new Error("variant_unavailable"), "variant_unavailable")).toBe(false);
  });
});
