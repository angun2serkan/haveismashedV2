import * as ed25519 from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

// Required for @noble/ed25519 v2 sync methods
ed25519.etc.sha512Sync = (...m: Uint8Array[]) => sha512(ed25519.etc.concatBytes(...m));

const ENCRYPTION_INFO = "havesmashed-encryption-v1";

export function generateSeedPhrase(): string {
  return generateMnemonic(wordlist, 128);
}

export function validateSeedPhraseWords(phrase: string): boolean {
  return validateMnemonic(phrase.trim().toLowerCase(), wordlist);
}

export function deriveMasterSeed(mnemonic: string): Uint8Array {
  return mnemonicToSeedSync(mnemonic.trim().toLowerCase());
}

export function deriveSigningKeyPair(masterSeed: Uint8Array): {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
} {
  const privateKey = masterSeed.slice(0, 32);
  const publicKey = ed25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

export function signChallenge(
  challenge: string,
  timestamp: string,
  privateKey: Uint8Array,
): Uint8Array {
  const message = new TextEncoder().encode(challenge + timestamp);
  return ed25519.sign(message, privateKey);
}

export async function deriveEncryptionKey(
  masterSeed: Uint8Array,
): Promise<CryptoKey> {
  const ikm = masterSeed.slice(32, 64);
  const keyMaterial = hkdf(sha256, ikm, undefined, ENCRYPTION_INFO, 32);

  return crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptData(
  data: object,
  key: CryptoKey,
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(data));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext,
  );

  return {
    ciphertext: uint8ToBase64(new Uint8Array(encrypted)),
    iv: uint8ToBase64(iv),
  };
}

export async function decryptData(
  ciphertext: string,
  iv: string,
  key: CryptoKey,
): Promise<object> {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToUint8(iv) },
    key,
    base64ToUint8(ciphertext),
  );

  return JSON.parse(new TextDecoder().decode(decrypted));
}

export function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function uint8ToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
