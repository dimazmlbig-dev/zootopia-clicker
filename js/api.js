(function () {
  const DEFAULT_TIMEOUT = 10000;
  const RETRY_STATUSES = [502, 503, 504];

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function apiFetch(path, options = {}) {
    const url = `${window.AppConfig.API_BASE}${path}`;
    const token = window.Auth?.getToken?.();
    const headers = {
      "content-type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const retries = options.retries ?? 2;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT);

      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          if (RETRY_STATUSES.includes(response.status) && attempt < retries) {
            await sleep(300 * (attempt + 1));
            continue;
          }
          const error = new Error(errorPayload.error || "Request failed");
          error.code = errorPayload.code || "request_failed";
          error.details = errorPayload.details || null;
          error.status = response.status;
          throw error;
        }

        return response.json();
      } catch (err) {
        clearTimeout(timer);
        if (attempt < retries && (err.name === "AbortError" || err.status >= 500)) {
          await sleep(400 * (attempt + 1));
          continue;
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }
    }

    throw new Error("Request failed after retries");
  }

  window.App = window.App || {};
  window.App.apiFetch = apiFetch;
})();
