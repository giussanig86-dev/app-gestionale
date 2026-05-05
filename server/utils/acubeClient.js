let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const { ACUBE_BASE_URL, ACUBE_EMAIL, ACUBE_PASSWORD } = process.env;
  if (!ACUBE_BASE_URL || !ACUBE_EMAIL || !ACUBE_PASSWORD) {
    throw new Error('Variabili ACUBE_BASE_URL, ACUBE_EMAIL, ACUBE_PASSWORD non configurate');
  }

  const res = await fetch(`${ACUBE_BASE_URL}/users/sign_in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: { email: ACUBE_EMAIL, password: ACUBE_PASSWORD } }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`A-Cube auth fallita (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = data.token;
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
  return cachedToken;
}

async function request(method, path, body) {
  const token = await getToken();
  const res = await fetch(`${process.env.ACUBE_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || `A-Cube ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

module.exports = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
};
