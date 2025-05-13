const rateLimitMap = new Map();

export function rateLimit(ip) {
  const limit = parseInt('100');
  const windowMs = parseInt('60') * 1000;

  const now = Date.now();
  const userData = rateLimitMap.get(ip) || { count: 0, lastRequest: now };

  if (now - userData.lastRequest > windowMs) {
    rateLimitMap.set(ip, { count: 1, lastRequest: now });
    return true;
  }

  if (userData.count < limit) {
    userData.count += 1;
    rateLimitMap.set(ip, userData);
    return true;
  }

  return false;
}
