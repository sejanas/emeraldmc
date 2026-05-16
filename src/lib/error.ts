import telemetry from './telemetry';

export function userMessageFromError(err: any) {
  if (!err) return 'An unknown error occurred.';
  if (typeof err === 'string') {
    return err.replace(/^Error:\s*/i, '');
  }
  if (typeof err.safeMessage === 'string' && err.safeMessage.trim()) {
    return err.safeMessage;
  }
  if (err.message) return String(err.message).replace(/^Error:\s*/i, '');
  if (err.error) return String(err.error);
  return 'An unexpected error occurred.';
}

/** User-facing message when saving/publishing announcements fails. */
export function announcementSaveMessage(err: unknown): string {
  const maybe = err as Error & { status?: number; safeMessage?: string; data?: { error?: string } };
  const apiError =
    typeof maybe?.data === 'object' && maybe.data && typeof maybe.data.error === 'string'
      ? maybe.data.error
      : null;
  const raw = (apiError ?? userMessageFromError(err)).replace(/^Error:\s*/i, '');

  const lower = raw.toLowerCase();
  if (lower.includes("reading 'bind'") || lower.includes('jsdom')) {
    return 'The server could not process announcement content. Redeploy the API edge function, then try again.';
  }
  if (lower.startsWith('cannot publish:')) {
    return raw.replace(/^cannot publish:\s*/i, 'Cannot publish: ');
  }
  if (lower.includes('required') || lower.includes('invalid') || lower.includes('must be')) {
    return raw;
  }
  if (maybe.status === 401 || maybe.status === 403) {
    return 'You do not have permission to save announcements.';
  }
  if (maybe.status === 404 || lower.includes('not found')) {
    return 'Announcement API not found. Deploy the latest edge function (api) and try again.';
  }
  if (maybe.status != null && maybe.status >= 500) {
    return maybe.safeMessage?.trim()
      ? `${maybe.safeMessage} (${raw})`
      : 'Server error while saving. Try again in a moment.';
  }
  if (maybe.status === 0 || lower.includes('failed to fetch') || lower.includes('network')) {
    return 'Could not reach the API. Check your connection and that the edge function is running.';
  }
  return raw;
}

export function handleError(err: any, context?: { feature?: string }) {
  const message = userMessageFromError(err);
  // Send to telemetry for later inspection (no-op unless configured)
  try {
    telemetry.reportError(err, { feature: context?.feature });
  } catch (e) {
    // swallow telemetry errors
  }
  return message;
}

export default { userMessageFromError, handleError };
