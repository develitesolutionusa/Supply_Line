import * as Sentry from "@sentry/nextjs";

export function logInfo(scope: string, extra?: Record<string, unknown>) {
  console.info(`[${scope}]`, extra ?? {});
}

export function logError(scope: string, error: unknown, extra?: Record<string, unknown>) {
  console.error(`[${scope}]`, extra ?? {}, error);
  Sentry.captureException(error, { extra: { scope, ...extra } });
}