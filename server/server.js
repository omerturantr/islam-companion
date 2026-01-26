const express = require('express');
const cors = require('cors');

const BASE_URL = process.env.AWQAT_BASE_URL || 'https://awqatsalah.diyanet.gov.tr';
const EMAIL = process.env.AWQAT_EMAIL;
const PASSWORD = process.env.AWQAT_PASSWORD;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
const DAILY_TTL_MIN = Number(process.env.DAILY_TTL_MIN || 20);
const MONTHLY_TTL_HOURS = Number(process.env.MONTHLY_TTL_HOURS || 12);

if (!EMAIL || !PASSWORD) {
  throw new Error('Missing AWQAT_EMAIL or AWQAT_PASSWORD');
}
if (!ALLOWED_ORIGIN) {
  throw new Error('Missing ALLOWED_ORIGIN');
}

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`,
    );
  });
  next();
});
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (origin === ALLOWED_ORIGIN) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
  }),
);

const cache = new Map();

const safeExcerpt = (value, limit = 500) => {
  if (value === null || value === undefined) {
    return null;
  }
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit)}...`;
};

const getCache = (key) => {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const setCache = (key, value, ttlMs) => {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

const decodeJwtExp = (token) => {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return 0;
    }
    const json = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    if (typeof json.exp === 'number') {
      return json.exp * 1000;
    }
  } catch (err) {
    return 0;
  }
  return 0;
};

const tokenState = {
  accessToken: null,
  refreshToken: null,
  accessTokenExp: 0,
};

let refreshPromise = null;

const setTokens = (accessToken, refreshToken) => {
  tokenState.accessToken = accessToken;
  tokenState.refreshToken = refreshToken;
  tokenState.accessTokenExp = decodeJwtExp(accessToken);
};

const login = async () => {
  const response = await fetch(`${BASE_URL}/api/Auth/Login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!response.ok) {
    throw new Error(`Login failed (${response.status})`);
  }

  const json = await response.json();
  const accessToken = json?.data?.accessToken;
  const refreshToken = json?.data?.refreshToken;
  if (!accessToken || !refreshToken) {
    throw new Error('Login response missing tokens');
  }
  setTokens(accessToken, refreshToken);
  return accessToken;
};

const refresh = async () => {
  if (!tokenState.refreshToken) {
    throw new Error('No refresh token available');
  }
  const response = await fetch(
    `${BASE_URL}/api/Auth/RefreshToken/${encodeURIComponent(
      tokenState.refreshToken,
    )}`,
    {
      method: 'GET',
    },
  );

  if (!response.ok) {
    throw new Error(`Refresh failed (${response.status})`);
  }

  const json = await response.json();
  const accessToken = json?.data?.accessToken;
  const refreshToken = json?.data?.refreshToken;
  if (!accessToken || !refreshToken) {
    throw new Error('Refresh response missing tokens');
  }
  setTokens(accessToken, refreshToken);
  return accessToken;
};

const tokenExpiringSoon = () => {
  if (!tokenState.accessToken) {
    return true;
  }
  if (!tokenState.accessTokenExp) {
    return false;
  }
  return tokenState.accessTokenExp - Date.now() < 2 * 60 * 1000;
};

const getAccessToken = async () => {
  if (!tokenExpiringSoon()) {
    return tokenState.accessToken;
  }
  if (refreshPromise) {
    return refreshPromise;
  }
  refreshPromise = (async () => {
    try {
      if (tokenState.refreshToken) {
        return await refresh();
      }
      return await login();
    } catch (err) {
      return await login();
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
};

const fetchWithAuth = async (path, options = {}) => {
  const accessToken = await getAccessToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status !== 401) {
    return response;
  }

  await login();
  const retryToken = tokenState.accessToken;
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${retryToken}`,
    },
  });
};

const readUpstreamBody = async (response) => {
  const text = await response.text();
  if (!text) {
    return { text: '', json: null };
  }
  try {
    return { text, json: JSON.parse(text) };
  } catch (err) {
    return { text, json: null };
  }
};

const logUpstreamFailure = (label, status, bodyText, bodyJson) => {
  console.error(
    `[upstream:${label}] status=${status} body=${safeExcerpt(
      bodyJson ?? bodyText,
    )}`,
  );
};

const fetchUpstreamJson = async (label, path) => {
  const response = await fetchWithAuth(path, { method: 'GET' });
  const { text, json } = await readUpstreamBody(response);
  if (!response.ok) {
    logUpstreamFailure(label, response.status, text, json);
    const error = new Error(`${label} failed (${response.status})`);
    error.upstreamStatus = response.status;
    error.upstreamError = json ?? text;
    throw error;
  }
  return json ?? {};
};

const withCache = async (key, ttlMs, fetcher) => {
  const cached = getCache(key);
  if (cached) {
    return cached;
  }
  const value = await fetcher();
  setCache(key, value, ttlMs);
  return value;
};

const ensureParam = (req, res, name) => {
  const value = req.query[name];
  if (!value) {
    res.status(400).json({ error: `Missing query param: ${name}` });
    return null;
  }
  return value;
};

const handleProxy = async (res, label, path) => {
  try {
    const data = await fetchUpstreamJson(label, path);
    res.json(data);
  } catch (err) {
    console.error(`[proxy:${label}] ${err.message}`);
    const payload = { error: `Failed to fetch ${label}` };
    if (err.upstreamStatus) {
      payload.upstreamStatus = err.upstreamStatus;
    }
    if (err.upstreamError) {
      payload.upstreamError = safeExcerpt(err.upstreamError);
    }
    res.status(502).json(payload);
  }
};

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'awqat-proxy', ts: new Date().toISOString() });
});

app.get('/api/debug/env', (req, res) => {
  res.json({
    hasEmail: Boolean(EMAIL),
    hasPassword: Boolean(PASSWORD),
    allowedOriginSet: Boolean(ALLOWED_ORIGIN),
  });
});

app.get('/api/awqat/countries', async (req, res) => {
  await handleProxy(res, 'countries', '/api/Place/Countries');
});

app.get('/api/awqat/states', async (req, res) => {
  const countryId = ensureParam(req, res, 'countryId');
  if (!countryId) return;
  await handleProxy(
    res,
    'states',
    `/api/Place/States/${encodeURIComponent(countryId)}`,
  );
});

app.get('/api/awqat/cities', async (req, res) => {
  const stateId = ensureParam(req, res, 'stateId');
  if (!stateId) return;
  await handleProxy(
    res,
    'cities',
    `/api/Place/Cities/${encodeURIComponent(stateId)}`,
  );
});

app.get('/api/awqat/daily', async (req, res) => {
  const cityId = ensureParam(req, res, 'cityId');
  if (!cityId) return;
  const key = `daily:${cityId}:${new Date().toISOString().slice(0, 10)}`;
  const ttlMs = Math.max(10, Math.min(30, DAILY_TTL_MIN)) * 60 * 1000;
  try {
    const data = await withCache(key, ttlMs, async () =>
      fetchUpstreamJson(
        'daily',
        `/api/PrayerTime/Daily/${encodeURIComponent(cityId)}`,
      ),
    );
    res.json(data);
  } catch (err) {
    console.error(`[proxy:daily] ${err.message}`);
    const payload = { error: 'Failed to fetch daily prayer times' };
    if (err.upstreamStatus) {
      payload.upstreamStatus = err.upstreamStatus;
    }
    if (err.upstreamError) {
      payload.upstreamError = safeExcerpt(err.upstreamError);
    }
    res.status(502).json(payload);
  }
});

app.get('/api/awqat/monthly', async (req, res) => {
  const cityId = ensureParam(req, res, 'cityId');
  if (!cityId) return;
  const key = `monthly:${cityId}:${new Date().toISOString().slice(0, 7)}`;
  const ttlMs = Math.max(6, Math.min(24, MONTHLY_TTL_HOURS)) * 60 * 60 * 1000;
  try {
    const data = await withCache(key, ttlMs, async () =>
      fetchUpstreamJson(
        'monthly',
        `/api/PrayerTime/Monthly/${encodeURIComponent(cityId)}`,
      ),
    );
    res.json(data);
  } catch (err) {
    console.error(`[proxy:monthly] ${err.message}`);
    const payload = { error: 'Failed to fetch monthly prayer times' };
    if (err.upstreamStatus) {
      payload.upstreamStatus = err.upstreamStatus;
    }
    if (err.upstreamError) {
      payload.upstreamError = safeExcerpt(err.upstreamError);
    }
    res.status(502).json(payload);
  }
});

app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    res.status(403).json({ error: 'Not allowed by CORS' });
    return;
  }
  next(err);
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`Awqat proxy listening on port ${PORT}`);
});
