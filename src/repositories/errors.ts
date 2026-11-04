// ─── Errors the repositories throw
// Pages show `message` as is, so it is always in Egyptian Arabic.

export type RepoErrorCode = 'unavailable' | 'rejected';

export const UNAVAILABLE_MESSAGE = 'الخدمة متوقفة مؤقتًا، جرّب تاني بعد شوية';

export class RepoError extends Error {
  readonly code: RepoErrorCode;
  /** The original error, for logs. */
  readonly reason?: unknown;
  constructor(code: RepoErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'RepoError';
    this.code = code;
    this.reason = options?.cause;
  }
}

/** The backend is down, paused or unreachable. Nothing was saved. */
export class ServiceUnavailableError extends RepoError {
  constructor(message: string = UNAVAILABLE_MESSAGE, options?: { cause?: unknown }) {
    super('unavailable', message, options);
    this.name = 'ServiceUnavailableError';
  }
}
