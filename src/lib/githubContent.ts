// Minimal client-side wrapper around the GitHub Contents API, used only by
// /admin. This site has no backend — the GitHub Personal Access Token the
// user pastes in is the *only* real access control, since a fully static
// page can't enforce anything server-side. The token never leaves the
// browser except in direct requests to api.github.com.

const OWNER = "BURHANDEV-ENTERPRISE";
const REPO = "BURHAN-WEB-DEV";
const BRANCH = "main";

export interface RemoteFile<T> {
  data: T;
  sha: string;
}

// atob/btoa are byte-oriented and mangle multi-byte UTF-8 (e.g. the en-dash
// in "5–7 day delivery"), so encode/decode through TextEncoder/TextDecoder.
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64.replace(/\n/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encodeUtf8Base64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text));
}

function decodeUtf8Base64(base64: string): string {
  return new TextDecoder().decode(base64ToBytes(base64));
}

async function githubRequest(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status} on ${path}: ${body || res.statusText}`);
  }
  return res.json();
}

export async function fetchContentFile<T>(path: string, token: string): Promise<RemoteFile<T>> {
  const json = await githubRequest(`${path}?ref=${BRANCH}`, token);
  const data = JSON.parse(decodeUtf8Base64(json.content)) as T;
  return { data, sha: json.sha };
}

export async function saveContentFile<T>(
  path: string,
  value: T,
  sha: string,
  token: string,
  message: string
): Promise<string> {
  const body = {
    message,
    content: encodeUtf8Base64(JSON.stringify(value, null, 2) + "\n"),
    sha,
    branch: BRANCH,
  };
  const json = await githubRequest(path, token, { method: "PUT", body: JSON.stringify(body) });
  return json.content.sha as string;
}
