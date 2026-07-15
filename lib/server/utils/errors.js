// ============================================================
//  Typed errors + the rejection reason codes from the spec.
// ============================================================

export const REASONS = {
  INVALID_TX_HASH: "INVALID_TX_HASH",
  TX_NOT_FOUND: "TX_NOT_FOUND",
  TX_ALREADY_USED: "TX_ALREADY_USED",
  WRONG_NETWORK: "WRONG_NETWORK",
  WRONG_RECIPIENT: "WRONG_RECIPIENT",
  WRONG_TOKEN_CONTRACT: "WRONG_TOKEN_CONTRACT",
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
  INSUFFICIENT_CONFIRMATIONS: "INSUFFICIENT_CONFIRMATIONS",
  INVALID_TRANSFER: "INVALID_TRANSFER",
  BLOCKCHAIN_API_UNAVAILABLE: "BLOCKCHAIN_API_UNAVAILABLE",
};

export const TX_STATUS = {
  AWAITING_VERIFICATION: "awaiting_verification",
  VERIFYING: "verifying",
  PENDING_CONFIRMATIONS: "pending_confirmations",
  VERIFIED: "verified",
  REJECTED: "rejected",
  FAILED: "failed",
  ALREADY_USED: "already_used",
};

export class AppError extends Error {
  constructor(message, { status = 400, code = "BAD_REQUEST", details } = {}) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message, details) {
    super(message, { status: 400, code: "VALIDATION_ERROR", details });
    this.name = "ValidationError";
  }
}

export class AuthError extends AppError {
  constructor(message = "Not authenticated") {
    super(message, { status: 401, code: "UNAUTHENTICATED" });
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Not allowed") {
    super(message, { status: 403, code: "FORBIDDEN" });
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, { status: 404, code: "NOT_FOUND" });
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message, code = "CONFLICT") {
    super(message, { status: 409, code });
    this.name = "ConflictError";
  }
}

export class LockTimeoutError extends AppError {
  constructor(message = "Resource is busy, try again") {
    super(message, { status: 503, code: "LOCK_TIMEOUT" });
    this.name = "LockTimeoutError";
  }
}

export class RateLimitError extends AppError {
  constructor(message, retryAfterSeconds) {
    super(message, { status: 429, code: "RATE_LIMITED" });
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
