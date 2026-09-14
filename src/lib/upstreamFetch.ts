type FetchOptions = {
  timeoutMs?: number;
  attempts?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

class UpstreamHttpError extends Error {
  constructor(readonly status: number) {
    super(`Upstream returned HTTP ${status}`);
  }
}

/** Bounded GET retries, including body reads. Do not retry permanent HTTP failures. */
export async function readUpstream<T>(
  url: string,
  read: (response: Response) => Promise<T>,
  init: RequestInit = {},
  options: FetchOptions = {},
): Promise<T> {
  const { timeoutMs = 8_000, attempts = 2, fetchImpl = fetch,
    sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)) } = options;
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const abort = () => controller.abort(init.signal?.reason);
    init.signal?.addEventListener('abort', abort, { once: true });
    if (init.signal?.aborted) abort();
    const timer = setTimeout(() => controller.abort(new Error('Upstream request timed out')), timeoutMs);
    let retryDelay = 300 * (2 ** attempt);
    try {
      const response = await fetchImpl(url, { ...init, cache: 'no-store', signal: controller.signal });
      if (!response.ok) {
        const retryAfter = response.headers.get('retry-after');
        if (retryAfter) {
          const seconds = Number(retryAfter);
          const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - Date.now();
          if (Number.isFinite(delay)) retryDelay = Math.max(retryDelay, Math.min(delay, 2_000));
        }
        await response.body?.cancel();
        throw new UpstreamHttpError(response.status);
      }
      return await read(response);
    } catch (error) {
      if (init.signal?.aborted || attempt + 1 >= attempts) throw error;
      if (error instanceof UpstreamHttpError
        && error.status !== 408 && error.status !== 429 && error.status < 500) throw error;
    } finally {
      clearTimeout(timer);
      init.signal?.removeEventListener('abort', abort);
    }
    await sleep(retryDelay);
  }
}

export const fetchUpstreamText = (url: string): Promise<string> => readUpstream(url, response => response.text());

/** Share concurrent work, then forget it so a failed request never poisons the next one. */
export function singleFlight<T>() {
  const pending = new Map<string, Promise<T>>();
  return (key: string, work: () => Promise<T>): Promise<T> => {
    const existing = pending.get(key);
    if (existing) return existing;
    const promise = Promise.resolve().then(work).finally(() => pending.delete(key));
    pending.set(key, promise);
    return promise;
  };
}
