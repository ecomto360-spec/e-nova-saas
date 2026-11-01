/**
 * Chiffrement des secrets super admin (AES-256-GCM).
 * Clé : variable d'environnement ENCRYPTION_KEY (64 hex, base64 ou passphrase).
 * Format stocké : "v1:<iv base64url>:<tag base64url>:<chiffré base64url>".
 */
import crypto from "crypto";

function deriveKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY || "";
  if (!raw) throw new Error("ENCRYPTION_KEY non définie : impossible de chiffrer/déchiffrer les secrets.");
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
  try {
    const b64 = Buffer.from(raw, "base64");
    if (b64.length === 32) return b64;
  } catch { /* pas une base64 valide */ }
  return crypto.scryptSync(raw, "e-nova-encryption-v1", 32);
}

export function hasEncryptionKey(): boolean {
  return Boolean(process.env.ENCRYPTION_KEY);
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), enc.toString("base64url")].join(":");
}

export function decryptSecret(stored: string): string {
  if (!stored.startsWith("v1:")) return stored; // valeur héritée non chiffrée (compat)
  const parts = stored.split(":");
  if (parts.length !== 4) throw new Error("Secret chiffré invalide.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", deriveKey(), Buffer.from(parts[1], "base64url"));
  decipher.setAuthTag(Buffer.from(parts[2], "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(parts[3], "base64url")), decipher.final()]).toString("utf8");
}
