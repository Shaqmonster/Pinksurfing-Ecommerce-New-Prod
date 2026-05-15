const VAULT_VERSION = 1;
const PBKDF2_ITERATIONS = 600_000;

function assertWebCrypto() {
  if (!globalThis.crypto?.subtle) {
    throw new Error("WebCrypto unavailable (crypto.subtle missing).");
  }
}

function utf8Encode(str) {
  return new TextEncoder().encode(str);
}

function utf8Decode(bytes) {
  return new TextDecoder().decode(bytes);
}

function bytesToB64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function concatBytes(...parts) {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function randomBytes(n) {
  assertWebCrypto();
  const out = new Uint8Array(n);
  crypto.getRandomValues(out);
  return out;
}

async function deriveAesKey(password, salt) {
  assertWebCrypto();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    utf8Encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt JSON data with PBKDF2-SHA256 + AES-256-GCM.
 *
 * Blob format (binary):
 *   [1 byte version][32 bytes salt][12 bytes nonce][ciphertext...]
 *
 * AES-GCM auth tag is appended to ciphertext by WebCrypto.
 */
export async function encryptJsonToB64({ json, password = "" }) {
  const salt = randomBytes(32);
  const nonce = randomBytes(12);
  const key = await deriveAesKey(password, salt);

  const plaintext = utf8Encode(JSON.stringify(json));
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, plaintext);
  const cipherBytes = new Uint8Array(cipherBuf);

  const blob = concatBytes(new Uint8Array([VAULT_VERSION]), salt, nonce, cipherBytes);

  return {
    encrypted_b64: bytesToB64(blob),
    crypto_params: {
      v: VAULT_VERSION,
      kdf: "pbkdf2",
      hash: "sha256",
      iterations: PBKDF2_ITERATIONS,
      salt_b64: bytesToB64(salt),
      nonce_b64: bytesToB64(nonce),
      enc: "aes-256-gcm",
    },
  };
}

export async function decryptJsonFromB64({ encrypted_b64, password = "" }) {
  const blob = b64ToBytes(encrypted_b64);
  if (blob.length < 1 + 32 + 12 + 16) throw new Error("Vault blob too small.");
  const version = blob[0];
  if (version !== VAULT_VERSION) throw new Error(`Unsupported vault version: ${version}`);

  const salt = blob.subarray(1, 33);
  const nonce = blob.subarray(33, 45);
  const cipherBytes = blob.subarray(45);
  const key = await deriveAesKey(password, salt);

  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, key, cipherBytes);
  const plainText = utf8Decode(new Uint8Array(plainBuf));
  return JSON.parse(plainText);
}

