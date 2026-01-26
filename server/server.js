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

const handleProxy = async (req, res, path) => {
  const response = await fetchWithAuth(path, { method: 'GET' });
  const json = await response.json();
  res.status(response.status).json(json);
};

app.get('/api/awqat/countries', async (req, res) => {
  try {
    await handleProxy(req, res, '/api/Place/Countries');
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch countries' });
  }
});

app.get('/api/awqat/states', async (req, res) => {
  const countryId = ensureParam(req, res, 'countryId');
  if (!countryId) return;
  try {
    await handleProxy(req, res, `/api/Place/States/${encodeURIComponent(countryId)}`);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch states' });
  }
});

app.get('/api/awqat/cities', async (req, res) => {
  const stateId = ensureParam(req, res, 'stateId');
  if (!stateId) return;
  try {
    await handleProxy(req, res, `/api/Place/Cities/${encodeURIComponent(stateId)}`);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch cities' });
  }
});

app.get('/api/awqat/daily', async (req, res) => {
  const cityId = ensureParam(req, res, 'cityId');
  if (!cityId) return;
  const key = `daily:${cityId}:${new Date().toISOString().slice(0, 10)}`;
  const ttlMs = Math.max(10, Math.min(30, DAILY_TTL_MIN)) * 60 * 1000;
  try {
    const data = await withCache(key, ttlMs, async () => {
      const response = await fetchWithAuth(
        `/api/PrayerTime/Daily/${encodeURIComponent(cityId)}`,
        { method: 'GET' },
      );
      return response.json();
    });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch daily prayer times' });
  }
});

app.get('/api/awqat/monthly', async (req, res) => {
  const cityId = ensureParam(req, res, 'cityId');
  if (!cityId) return;
  const key = `monthly:${cityId}:${new Date().toISOString().slice(0, 7)}`;
  const ttlMs = Math.max(6, Math.min(24, MONTHLY_TTL_HOURS)) * 60 * 60 * 1000;
  try {
    const data = await withCache(key, ttlMs, async () => {
      const response = await fetchWithAuth(
        `/api/PrayerTime/Monthly/${encodeURIComponent(cityId)}`,
        { method: 'GET' },
      );
      return response.json();
    });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch monthly prayer times' });
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
