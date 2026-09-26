/**
 * The backend pins its error codes as a public contract and rewords its messages
 * freely, so `code` is the only thing anything branches on (ADR 0005). No
 * component above this module reads a status code.
 */

export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    readonly details: Record<string, unknown>,
    readonly requestId: string | null,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** A request that never reached the API. It has no envelope and no code. */
export class ApiUnreachableError extends Error {
  constructor(override readonly cause: unknown) {
    super("The store could not be reached.");
    this.name = "ApiUnreachableError";
  }
}

const FALLBACK_CODE = "server_error";
const FALLBACK_MESSAGE = "The request could not be completed.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * A body that is not JSON, or JSON without an `error` object, is a server fault
 * whatever its status says: the envelope is a contract, and a response that does
 * not honour it cannot be reported as the condition it claims.
 */
export async function toApiError(response: Response): Promise<ApiError> {
  const requestId = response.headers.get("X-Request-ID");

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return new ApiError(FALLBACK_CODE, response.status, {}, requestId, FALLBACK_MESSAGE);
  }

  if (!isRecord(body) || !isRecord(body.error)) {
    return new ApiError(FALLBACK_CODE, response.status, {}, requestId, FALLBACK_MESSAGE);
  }

  const { code, message, details } = body.error;

  return new ApiError(
    typeof code === "string" ? code : FALLBACK_CODE,
    response.status,
    isRecord(details) ? details : {},
    requestId,
    typeof message === "string" ? message : FALLBACK_MESSAGE,
  );
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** True when the failure is the given code — the only shape a caller should test. */
export function hasCode(error: unknown, code: string): boolean {
  return isApiError(error) && error.code === code;
}
