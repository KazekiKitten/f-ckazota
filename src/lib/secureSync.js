/**
 * Client-side end-to-end encryption for synced secrets.
 *
 * API keys are encrypted in the browser with AES-256-GCM before they ever
 * reach Firestore. The encryption key is derived from a user passphrase with
 * PBKDF2-SHA256 (210k iterations) and is non-extractable. The passphrase is
 * never stored anywhere and never leaves the device, so Firestore only ever
 * holds ciphertext that is useless without it.
 */

const KDF_ITERATIONS = 210000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Session cache so the passphrase isn't re-derived on every sync operation
let session = null; // { passphrase, key, salt }

export const clearSyncSession = () => {
  session = null;
};

const toBase64 = (bytes) => {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
};

const fromBase64 = (base64) =>
  Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));

const deriveKey = async (passphrase, salt, iterations) => {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
};

// Reuses the in-memory key when the same passphrase is entered again
const getSessionKey = async (passphrase) => {
  if (session && session.passphrase === passphrase) return session;
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const key = await deriveKey(passphrase, salt, KDF_ITERATIONS);
  session = { passphrase, key, salt };
  return session;
};

export const encryptSecrets = async (data, passphrase) => {
  if (!passphrase) throw new Error("PASSPHRASE_REQUIRED");
  const { key, salt } = await getSessionKey(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(data)),
  );
  return {
    v: 1,
    kdf: "PBKDF2-SHA256",
    iterations: KDF_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  };
};

export const decryptSecrets = async (payload, passphrase) => {
  if (!passphrase) throw new Error("PASSPHRASE_REQUIRED");
  if (!payload?.ciphertext || !payload.salt || !payload.iv) {
    throw new Error("INVALID_PAYLOAD");
  }
  const key = await deriveKey(
    passphrase,
    fromBase64(payload.salt),
    payload.iterations || KDF_ITERATIONS,
  );
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(payload.iv) },
      key,
      fromBase64(payload.ciphertext),
    );
    return JSON.parse(decoder.decode(plaintext));
  } catch {
    // GCM authentication failed: wrong passphrase or tampered ciphertext
    throw new Error("INCORRECT_PASSPHRASE");
  }
};

const getFirestore = async () => {
  const [firestore, { getDb }] = await Promise.all([
    import("firebase/firestore"),
    import("../firebase"),
  ]);
  return { ...firestore, db: await getDb() };
};

// ── Firestore sync ──────────────────────────────────────────────────────────

const SECRETS_COLLECTION = "userSecrets";
const PREFS_COLLECTION = "userPrefs";

export const uploadSecrets = async (uid, data, passphrase) => {
  const { doc, setDoc, serverTimestamp, db } = await getFirestore();
  const payload = await encryptSecrets(data, passphrase);
  await setDoc(doc(db, SECRETS_COLLECTION, uid), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
};

export const downloadSecrets = async (uid, passphrase) => {
  const { doc, getDoc, db } = await getFirestore();
  const snapshot = await getDoc(doc(db, SECRETS_COLLECTION, uid));
  if (!snapshot.exists()) return null;
  const { updatedAt, ...payload } = snapshot.data();
  const data = await decryptSecrets(payload, passphrase);
  return { data, updatedAt: updatedAt?.toMillis?.() || null };
};

// Preferences are non-sensitive, so they sync in plaintext
export const uploadPrefs = async (uid, prefs) => {
  const { doc, setDoc, serverTimestamp, db } = await getFirestore();
  await setDoc(doc(db, PREFS_COLLECTION, uid), {
    ...prefs,
    updatedAt: serverTimestamp(),
  });
};

export const downloadPrefs = async (uid) => {
  const { doc, getDoc, db } = await getFirestore();
  const snapshot = await getDoc(doc(db, PREFS_COLLECTION, uid));
  if (!snapshot.exists()) return null;
  const { updatedAt, ...prefs } = snapshot.data();
  return { prefs, updatedAt: updatedAt?.toMillis?.() || null };
};
