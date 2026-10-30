// github.js: lets the dashboard publish straight to the GitHub repo that hosts the site.
// The token stays in this browser's localStorage and is only ever sent to api.github.com.

const KEY = 'dksKardsGitHub';

// On github.io the owner and repo can be read from the address; otherwise fall back to the known repo.
function guess() {
  const host = location.hostname.match(/^([^.]+)\.github\.io$/);
  const repo = location.pathname.split('/').filter(Boolean)[0];
  return host && repo && !repo.includes('.') ? { owner: host[1], repo } : { owner: 'Lauriej25', repo: 'dkskards' };
}

export function getConn() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch {}
  return { ...guess(), branch: 'main', token: '', ...saved };
}

export function setConn(c) {
  localStorage.setItem(KEY, JSON.stringify(c));
}

export function forgetToken() {
  const c = getConn();
  delete c.token;
  setConn(c);
}

async function api(path, opts = {}) {
  const { token } = getConn();
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.body ? { 'Content-Type': 'application/json' } : {})
    }
  });
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).message || msg; } catch {}
    const err = new Error(
      res.status === 401 ? 'GitHub rejected the token. It may have expired or been pasted incompletely.' :
      res.status === 403 || res.status === 404 && opts.method === 'PUT' ? `The token can’t write to this repo (${msg}). Give it “Contents: Read and write” on this repository.` :
      res.status === 404 ? 'Repo not found. Check the owner and repo name, and that the token has access to it.' :
      `GitHub error ${res.status}: ${msg}`);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

const repoPath = () => { const c = getConn(); return `/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}`; };

// Checks the token can see the repo. Returns the repo's full name.
export async function testConn() {
  const r = await api(repoPath());
  return r.full_name;
}

async function shaOf(path) {
  try {
    const f = await api(`${repoPath()}/contents/${path}?ref=${encodeURIComponent(getConn().branch)}`);
    return f.sha;
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

// Creates or replaces one file in the repo as a single commit.
export async function putFile(path, base64, message) {
  const sha = await shaOf(path);
  return api(`${repoPath()}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({ message, content: base64, branch: getConn().branch, ...(sha ? { sha } : {}) })
  });
}

export function b64text(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

const b64blob = blob => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(',')[1]);
  r.onerror = reject;
  r.readAsDataURL(blob);
});

// Scales a photo to at most 1600px tall and encodes WebP (JPEG where the browser can't make WebP, e.g. Safari).
export async function preparePhoto(file, maxH = 1600) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxH / bmp.height);
  const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(bmp.width * scale), height: Math.round(bmp.height * scale) });
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  let blob = await new Promise(r => canvas.toBlob(r, 'image/webp', .8));
  if (!blob || blob.type !== 'image/webp') blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', .85));
  return { base64: await b64blob(blob), ext: blob.type === 'image/webp' ? 'webp' : 'jpg', kb: Math.round(blob.size / 1024) };
}

// Latest GitHub Pages build status: 'queued' | 'building' | 'built' | 'errored', or null if the token can't read it.
export async function pagesStatus() {
  try { return (await api(`${repoPath()}/pages/builds/latest`)).status; } catch { return null; }
}
