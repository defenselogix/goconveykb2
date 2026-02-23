const BASE = '/api';

async function handleResponse(res) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw data;
  }
  return res.json();
}

export async function apiGet(path) {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include' });
  return handleResponse(res);
}

export async function apiPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiPut(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiDelete(path) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(res);
}
