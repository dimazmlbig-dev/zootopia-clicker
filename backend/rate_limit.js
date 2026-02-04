const buckets = new Map();

function rateLimit(key, { limit, intervalMs }) {
  const now = Date.now();
  const bucket = buckets.get(key) || { tokens: limit, last: now };
  const elapsed = now - bucket.last;
  const refill = Math.floor((elapsed / intervalMs) * limit);

  bucket.tokens = Math.min(limit, bucket.tokens + refill);
  bucket.last = now;

  if (bucket.tokens <= 0) {
    buckets.set(key, bucket);
    return false;
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return true;
}

module.exports = { rateLimit };
