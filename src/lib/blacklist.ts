import { db } from "./firebase";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore";

export interface BlacklistEntry {
  id: string;
  userId: string;
  phone: string; // normalized digits
  rawPhone?: string;
  name?: string;
  reason?: string;
  bannedAt: string;
  ip?: string;
}

/**
 * Normalizes an Algerian / international phone number for consistent blacklist matching.
 * Converts:
 *  - "0550 25 25 65" -> "0550252565"
 *  - "+213550252565" -> "0550252565"
 *  - "213550252565"  -> "0550252565"
 *  - "00213550252565" -> "0550252565"
 */
export function normalizePhoneForBlacklist(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  
  if (digits.startsWith("00213") && digits.length >= 14) {
    return "0" + digits.slice(5);
  }
  if (digits.startsWith("213") && digits.length >= 12) {
    return "0" + digits.slice(3);
  }
  if (digits.length === 9 && ["5", "6", "7"].includes(digits.charAt(0))) {
    return "0" + digits;
  }
  return digits;
}

/**
 * Checks if a specific phone number is blacklisted for a merchant.
 */
export async function isPhoneBlacklisted(userId: string, phone: string): Promise<boolean> {
  if (!userId || !phone) return false;
  const normalized = normalizePhoneForBlacklist(phone);
  if (!normalized) return false;

  try {
    const docId = `${userId}_${normalized}`;
    const docRef = doc(db, "blacklist", docId);
    const snap = await getDoc(docRef);
    return snap.exists();
  } catch (err) {
    console.error("Error checking blacklist status:", err);
    return false;
  }
}

/**
 * Adds a phone number to the merchant's blacklist.
 */
export async function banPhoneNumber(
  userId: string,
  phone: string,
  name?: string,
  reason: string = "Banni manuellement",
  ip?: string
): Promise<void> {
  if (!userId || !phone) return;
  const normalized = normalizePhoneForBlacklist(phone);
  if (!normalized) return;

  const docId = `${userId}_${normalized}`;
  await setDoc(doc(db, "blacklist", docId), {
    userId,
    phone: normalized,
    rawPhone: phone,
    name: name || "Client",
    reason,
    bannedAt: new Date().toISOString(),
    ip: ip || ""
  });
}

/**
 * Removes a phone number from the merchant's blacklist.
 */
export async function unbanPhoneNumber(userId: string, phone: string): Promise<void> {
  if (!userId || !phone) return;
  const normalized = normalizePhoneForBlacklist(phone);
  if (!normalized) return;

  const docId = `${userId}_${normalized}`;
  await deleteDoc(doc(db, "blacklist", docId));
}

/**
 * Retrieves the set of all blacklisted phone numbers for a merchant.
 */
export async function getBlacklistedPhones(userId: string): Promise<Set<string>> {
  if (!userId) return new Set();
  try {
    const q = query(collection(db, "blacklist"), where("userId", "==", userId));
    const snap = await getDocs(q);
    const set = new Set<string>();
    snap.forEach((d) => {
      const data = d.data();
      if (data.phone) {
        set.add(data.phone);
      }
    });
    return set;
  } catch (err) {
    console.error("Error loading blacklisted phones:", err);
    return new Set();
  }
}
