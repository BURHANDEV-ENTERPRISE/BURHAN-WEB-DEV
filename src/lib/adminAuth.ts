// Client-side login gate for the staff content-editor page. This is NOT a
// real server-enforced login — this site has no server, so the page's HTML/JS
// is always downloadable regardless of any check written into it. What this
// *does* do: keep the password out of the shipped source as plaintext (only
// a PBKDF2 hash is stored, same algorithm family as a real backend would use)
// and stop the editor UI from being visible to a casual visitor who stumbles
// onto the URL. The real access boundary for actually *saving* anything
// remains the GitHub token entered separately in the editor itself.

const USERNAME = "AdminBurhan";
const SALT_HEX = "beaf43d4c8b945b2b9a7d72a6612572e";
const HASH_HEX = "d2ac27d19621c7ec17de07d961e8829cc798e6785dff9aab3c3d1d01d6c87478";
const ITERATIONS = 210000;
const KEY_LENGTH_BITS = 256;

const SESSION_KEY = "burhandev_admin_unlocked";

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function derivePbkdf2Hash(password: string, salt: Uint8Array): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_LENGTH_BITS
  );
  return bytesToHex(bits);
}

export async function checkCredentials(username: string, password: string): Promise<boolean> {
  if (username !== USERNAME) return false;
  const derived = await derivePbkdf2Hash(password, hexToBytes(SALT_HEX));
  return derived === HASH_HEX;
}

export function isUnlockedThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markUnlockedThisSession(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // ignore — worst case the user re-enters credentials next reload
  }
}

export function lockSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
