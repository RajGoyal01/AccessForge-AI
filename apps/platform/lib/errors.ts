export type ErrorCode = "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT" | "FORBIDDEN" | "TARGET_UNAVAILABLE" | "SCAN_FAILED" | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(public readonly code: ErrorCode, message: string, public readonly status = 400, public readonly details?: unknown) { super(message); }
}

export function errorResponse(error: unknown) {
  const appError = error instanceof AppError ? error : new AppError("INTERNAL_ERROR", "Something went wrong. Please try again.", 500);
  return Response.json({ error: { code: appError.code, message: appError.message, ...(appError.details ? { details: appError.details } : {}) } }, { status: appError.status });
}
