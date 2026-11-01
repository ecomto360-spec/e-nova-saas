import { db, auth } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";

export interface AbandonedCartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  variants?: Record<string, string>;
  image?: string;
}

/** Note / remarque marchand attachée à un panier abandonné (Lot 19). */
export interface CartNote {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export const CART_NOTE_MAX_LENGTH = 1000;

export interface AbandonedCart {
  id: string;
  userId?: string;
  tenantId?: string;
  client: string;
  phone: string;
  email?: string;
  wilaya?: string;
  commune?: string;
  address?: string;
  itemsSummary: string;
  items?: AbandonedCartItem[];
  total: number;
  status: "abandoned" | "relanced" | "contacted" | "recovered" | "refused";
  recovered: boolean;
  relanceCount: number;
  source: string;
  phoneDigits?: string;
  /** Extension WhatsApp : statut du dernier message + jeton du lien public. */
  waStatus?: "sent" | "delivered" | "read" | "replied" | "failed";
  waSimulated?: boolean;
  waSentAt?: any;
  waToken?: string;
  waError?: string;
  waMerchantTodo?: boolean;
  createdAt: any;
  updatedAt: any;
  date?: string;
  orderId?: string;
  recoveredAt?: any;
  lastRelancedAt?: any;
  contactedAt?: any;
  shipping?: number;
  subtotal?: number;
  wilayaCode?: string;
  deliveryType?: string;
  pageUrl?: string;
  sessionId?: string;
  lang?: string;
  /** Notes / remarques du marchand (plus récentes en premier). */
  notes?: CartNote[];
}

export function cleanPhoneForWhatsApp(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "213" + cleaned.slice(1);
  } else if (!cleaned.startsWith("213") && cleaned.length === 9) {
    cleaned = "213" + cleaned;
  }
  return cleaned;
}

export function generateWhatsAppRelanceUrl(
  cart: AbandonedCart, 
  customMessageTemplate?: string
): string {
  const cleanedPhone = cleanPhoneForWhatsApp(cart.phone);
  if (!cleanedPhone) return "";

  let message = "";
  if (customMessageTemplate && customMessageTemplate.trim()) {
    message = customMessageTemplate
      .replace(/{client}/g, cart.client || "Cher client")
      .replace(/{phone}/g, cart.phone || "")
      .replace(/{product}/g, cart.itemsSummary || "votre produit")
      .replace(/{total}/g, (cart.total || 0).toLocaleString())
      .replace(/{wilaya}/g, cart.wilaya || "");
  } else {
    message = `👋 Bonjour ${cart.client || ""},\n\nNous avons remarqué que vous avez initié une commande pour :\n📦 *${cart.itemsSummary || "Votre article"}*\n💰 Montant: *${(cart.total || 0).toLocaleString()} DZD* (Paiement à la livraison)\n\nSouhaitez-vous que nous confirmions et expédions votre colis ?\nRépondez simplement à ce message pour valider votre livraison.\n\nMerci pour votre visite !`;
  }

  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Enregistre ou met à jour un panier abandonné (détection dès la saisie du formulaire sans clic sur commander)
 */
export async function saveAbandonedCart(data: Partial<AbandonedCart>): Promise<string> {
  const clientName = (data.client || "").trim();
  const phone = (data.phone || "").trim();
  const cleanPhone = phone.replace(/\D/g, "");
  const email = (data.email || "").trim().toLowerCase();
  const wilaya = (data.wilaya || "").trim();
  const address = (data.address || "").trim();

  // On enregistre dès qu'au moins UN champ est saisi par le client
  const hasAnyInput = clientName.length > 0 || cleanPhone.length > 0 || email.length > 0 || wilaya.length > 0 || address.length > 0;
  if (!hasAnyInput) {
    return "";
  }

  const effectiveTenantId = data.tenantId || data.userId || auth.currentUser?.uid || "default_tenant";
  
  // Utiliser un ID déterministe pour ne pas créer de doublon à chaque frappe
  let cartId = data.id;
  if (!cartId) {
    if (cleanPhone.length >= 4) {
      cartId = `cart_${effectiveTenantId}_${cleanPhone}`;
    } else if (email) {
      cartId = `cart_${effectiveTenantId}_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    } else if (clientName) {
      cartId = `cart_${effectiveTenantId}_${clientName.replace(/\s+/g, '_')}`;
    } else {
      cartId = `cart_${effectiveTenantId}_${Date.now()}`;
    }
  }

  const nowIso = new Date().toISOString();

  const cartPayload: AbandonedCart = {
    id: cartId,
    userId: effectiveTenantId,
    tenantId: effectiveTenantId,
    client: clientName || (phone ? phone : "Client potentiel"),
    phone: phone,
    phoneDigits: cleanPhone,
    email: email,
    wilaya: wilaya,
    commune: data.commune || "",
    address: address,
    itemsSummary: data.itemsSummary || "Panier en cours",
    items: data.items || [],
    total: Number(data.total) || 0,
    status: data.status || "abandoned",
    recovered: !!data.recovered,
    relanceCount: data.relanceCount || 0,
    source: data.source || "storefront_form",
    createdAt: data.createdAt || nowIso,
    updatedAt: nowIso,
    date: nowIso
  };

  // 1. Sauvegarde locale immédiate
  try {
    const cached = localStorage.getItem("dzbuild_abandoned_carts");
    const list: AbandonedCart[] = cached ? JSON.parse(cached) : [];
    const existingIndex = list.findIndex(c => 
      c.id === cartId || 
      (cleanPhone.length >= 6 && c.phone && c.phone.replace(/\D/g, "") === cleanPhone) ||
      (email && c.email && c.email.toLowerCase() === email)
    );
    
    if (existingIndex > -1) {
      // Préserver le statut si déjà relancé ou récupéré
      const prev = list[existingIndex];
      list[existingIndex] = {
        ...prev,
        ...cartPayload,
        status: prev.status === "recovered" ? "recovered" : (prev.status === "relanced" || prev.status === "contacted" ? prev.status : cartPayload.status),
        recovered: prev.recovered || cartPayload.recovered,
        relanceCount: prev.relanceCount || 0
      };
    } else {
      list.unshift(cartPayload);
    }

    localStorage.setItem("dzbuild_abandoned_carts", JSON.stringify(list));
    window.dispatchEvent(new Event("dzbuild_abandoned_cart_updated"));
    window.dispatchEvent(new Event("storage"));

    // Propager aux iframes / fenêtres parentes si applicable
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "dzbuild_abandoned_cart_updated", data: cartPayload }, "*");
    }
  } catch (err) {
    console.warn("Local storage abandoned cart save error:", err);
  }

  // 2. Sauvegarde Firestore
  try {
    // Préserver le statut posé par le vendeur (contacted/recovered ne retombent
    // jamais en "abandoned" lors d'un upsert).
    let firestoreStatus = cartPayload.status;
    try {
      const existingSnap = await getDoc(doc(db, "abandoned_carts", cartId));
      if (existingSnap.exists()) {
        const prevStatus = existingSnap.data()?.status;
        if (prevStatus === "recovered") firestoreStatus = "recovered";
        else if (prevStatus === "contacted" || prevStatus === "relanced") firestoreStatus = "contacted";
      }
    } catch {}

    await setDoc(doc(db, "abandoned_carts", cartId), {
      ...cartPayload,
      status: firestoreStatus,
      updatedAt: serverTimestamp(),
      ...(data.createdAt ? {} : { createdAt: serverTimestamp() })
    }, { merge: true });

    if (effectiveTenantId) {
      await setDoc(doc(db, "tenants", effectiveTenantId, "abandoned_carts", cartId), {
        ...cartPayload,
        status: firestoreStatus,
        updatedAt: serverTimestamp(),
        ...(data.createdAt ? {} : { createdAt: serverTimestamp() })
      }, { merge: true });
    }

    if (auth.currentUser?.uid && auth.currentUser.uid !== effectiveTenantId) {
      await setDoc(doc(db, "tenants", auth.currentUser.uid, "abandoned_carts", cartId), {
        ...cartPayload,
        updatedAt: serverTimestamp(),
        ...(data.createdAt ? {} : { createdAt: serverTimestamp() })
      }, { merge: true });
    }
  } catch (dbErr) {
    console.warn("Firestore abandoned cart sync warning:", dbErr);
  }

  return cartId;
}

/**
 * Marque un panier abandonné comme "Récupéré" lorsqu'une commande est validée avec succès
 */
export async function markAbandonedCartAsRecovered(phone: string, orderId: string, tenantId?: string): Promise<void> {
  if (!phone) return;
  const cleanPhone = phone.replace(/\D/g, "");
  const effectiveTenantId = tenantId || auth.currentUser?.uid || "default_tenant";
  const cartId = `cart_${effectiveTenantId}_${cleanPhone}`;

  // 1. Local storage
  try {
    const cached = localStorage.getItem("dzbuild_abandoned_carts");
    if (cached) {
      const list: AbandonedCart[] = JSON.parse(cached);
      const updated = list.map(c => {
        if (c.id === cartId || (c.phone && c.phone.replace(/\D/g, "") === cleanPhone)) {
          return {
            ...c,
            status: "recovered" as const,
            recovered: true,
            orderId,
            recoveredAt: new Date().toISOString()
          };
        }
        return c;
      });
      localStorage.setItem("dzbuild_abandoned_carts", JSON.stringify(updated));
      window.dispatchEvent(new Event("dzbuild_abandoned_cart_updated"));
      window.dispatchEvent(new Event("storage"));
    }
  } catch (e) {
    console.warn("Local storage recovery update error:", e);
  }

  // 2. Firestore — toutes les fiches ACTIVES de ce téléphone chez ce vendeur
  // (nouvelles fiches avec phoneDigits + ancien ID déterministe) passent en
  // "recovered" : une commande validée ne peut jamais rester "abandonnée".
  try {
    const updates = {
      status: "recovered" as const,
      recovered: true,
      orderId,
      recoveredAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const idsToUpdate: string[] = [cartId];
    try {
      const snap = await getDocs(query(collection(db, "abandoned_carts"), where("phoneDigits", "==", cleanPhone)));
      snap.forEach((d) => {
        const data = d.data() || {};
        if (data.tenantId === effectiveTenantId && data.status !== "recovered" && !idsToUpdate.includes(d.id)) {
          idsToUpdate.push(d.id);
        }
      });
    } catch {}

    for (const id of idsToUpdate) {
      try {
        await setDoc(doc(db, "abandoned_carts", id), updates, { merge: true });
        await setDoc(doc(db, "tenants", effectiveTenantId, "abandoned_carts", id), updates, { merge: true });
      } catch {}
    }
  } catch (e) {
    console.warn("Firestore recovery update warning:", e);
  }
}

/**
 * Marque un panier comme "Contacté" (bouton téléphone / relance WhatsApp).
 * Le statut "contacted" remplace l'ancien "relanced" (legacy mappé à l'affichage).
 */
export async function markAbandonedCartAsContacted(cartId: string, tenantId?: string): Promise<void> {
  const effectiveTenantId = tenantId || auth.currentUser?.uid || "default_tenant";
  const nowIso = new Date().toISOString();

  // 1. Local
  try {
    const cached = localStorage.getItem("dzbuild_abandoned_carts");
    if (cached) {
      const list: AbandonedCart[] = JSON.parse(cached);
      const updated = list.map(c => {
        if (c.id === cartId) {
          return {
            ...c,
            status: "contacted" as const,
            relanceCount: (c.relanceCount || 0) + 1,
            lastRelancedAt: nowIso,
            contactedAt: nowIso
          };
        }
        return c;
      });
      localStorage.setItem("dzbuild_abandoned_carts", JSON.stringify(updated));
      window.dispatchEvent(new Event("dzbuild_abandoned_cart_updated"));
      window.dispatchEvent(new Event("storage"));
    }
  } catch (e) {}

  // 2. Firestore (les deux collections)
  try {
    const updates = {
      status: "contacted" as const,
      lastRelancedAt: serverTimestamp(),
      contactedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, "abandoned_carts", cartId), updates, { merge: true });
    await setDoc(doc(db, "tenants", effectiveTenantId, "abandoned_carts", cartId), updates, { merge: true });
  } catch (e) {
    console.warn("Firestore contacted update warning:", e);
  }
}

/**
 * Nettoyage automatique : supprime les fiches de plus de `days` jours (60 par
 * défaut) chez ce vendeur, dans les deux collections + le cache local.
 */
export async function cleanupOldAbandonedCarts(tenantId?: string, days = 60): Promise<number> {
  const effectiveTenantId = tenantId || auth.currentUser?.uid;
  if (!effectiveTenantId) return 0;

  const maxAgeMs = days * 24 * 60 * 60 * 1000;
  const toMillis = (v: any): number => {
    try {
      if (!v) return 0;
      if (typeof v === "object" && typeof v.toMillis === "function") return v.toMillis();
      const t = new Date(v).getTime();
      return Number.isFinite(t) ? t : 0;
    } catch {
      return 0;
    }
  };

  let removed = 0;
  const expiredIds: string[] = [];
  try {
    const snap = await getDocs(collection(db, "tenants", effectiveTenantId, "abandoned_carts"));
    snap.forEach((d) => {
      const data = d.data() || {};
      const updatedMs = toMillis(data.updatedAt) || toMillis(data.createdAt) || toMillis(data.date);
      if (updatedMs > 0 && Date.now() - updatedMs > maxAgeMs) {
        expiredIds.push(d.id);
      }
    });
  } catch (e) {
    console.warn("cleanupOldAbandonedCarts: read failed:", e);
    return 0;
  }

  for (const id of expiredIds) {
    try {
      await deleteDoc(doc(db, "tenants", effectiveTenantId, "abandoned_carts", id));
      await deleteDoc(doc(db, "abandoned_carts", id));
      removed++;
    } catch {}
  }

  // Cache local du navigateur du vendeur
  try {
    const cached = localStorage.getItem("dzbuild_abandoned_carts");
    if (cached) {
      const list: AbandonedCart[] = JSON.parse(cached);
      const kept = list.filter(c => {
        const updatedMs = toMillis(c.updatedAt) || toMillis(c.createdAt) || toMillis(c.date);
        return !(updatedMs > 0 && Date.now() - updatedMs > maxAgeMs);
      });
      if (kept.length !== list.length) {
        localStorage.setItem("dzbuild_abandoned_carts", JSON.stringify(kept));
        window.dispatchEvent(new Event("dzbuild_abandoned_cart_updated"));
      }
    }
  } catch {}

  return removed;
}

/**
 * Marque un panier abandonné comme "Relancé"
 */
export async function markAbandonedCartAsRelanced(cartId: string, tenantId?: string): Promise<void> {
  const effectiveTenantId = tenantId || auth.currentUser?.uid || "default_tenant";

  // 1. Local
  try {
    const cached = localStorage.getItem("dzbuild_abandoned_carts");
    if (cached) {
      const list: AbandonedCart[] = JSON.parse(cached);
      const updated = list.map(c => {
        if (c.id === cartId) {
          return {
            ...c,
            status: "relanced" as const,
            relanceCount: (c.relanceCount || 0) + 1,
            lastRelancedAt: new Date().toISOString()
          };
        }
        return c;
      });
      localStorage.setItem("dzbuild_abandoned_carts", JSON.stringify(updated));
      window.dispatchEvent(new Event("dzbuild_abandoned_cart_updated"));
      window.dispatchEvent(new Event("storage"));
    }
  } catch (e) {}

  // 2. Firestore
  try {
    await setDoc(doc(db, "abandoned_carts", cartId), {
      status: "relanced",
      lastRelancedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    if (effectiveTenantId) {
      await setDoc(doc(db, "tenants", effectiveTenantId, "abandoned_carts", cartId), {
        status: "relanced",
        lastRelancedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (e) {}
}

/**
 * Supprime un panier abandonné
 */
export async function deleteAbandonedCart(cartId: string, tenantId?: string): Promise<void> {
  const effectiveTenantId = tenantId || auth.currentUser?.uid || "default_tenant";

  try {
    const cached = localStorage.getItem("dzbuild_abandoned_carts");
    if (cached) {
      const list: AbandonedCart[] = JSON.parse(cached);
      const filtered = list.filter(c => c.id !== cartId);
      localStorage.setItem("dzbuild_abandoned_carts", JSON.stringify(filtered));
      window.dispatchEvent(new Event("dzbuild_abandoned_cart_updated"));
      window.dispatchEvent(new Event("storage"));
    }
  } catch (e) {}

  try {
    await deleteDoc(doc(db, "abandoned_carts", cartId));
    if (effectiveTenantId) {
      await deleteDoc(doc(db, "tenants", effectiveTenantId, "abandoned_carts", cartId));
    }
  } catch (e) {}
}

/**
 * Récupère la liste de tous les paniers abandonnés (Local storage + Firestore avec déduplication)
 */
export async function getAbandonedCarts(tenantId?: string): Promise<AbandonedCart[]> {
  const effectiveTenantId = tenantId || auth.currentUser?.uid || "default_tenant";
  const mergedMap = new Map<string, AbandonedCart>();

  // 1. Lire d'abord depuis localStorage pour un affichage instantané
  // (uniquement les fiches de CE vendeur — jamais celles des autres tenants)
  try {
    const cached = localStorage.getItem("dzbuild_abandoned_carts");
    if (cached) {
      const localList: AbandonedCart[] = JSON.parse(cached);
      localList.forEach(c => {
        if (c.id && (!c.tenantId || c.tenantId === effectiveTenantId)) {
          mergedMap.set(c.id, c);
        }
      });
    }
  } catch (err) {
    console.warn("Error reading local abandoned carts:", err);
  }

  // 2. Récupérer depuis Firestore si disponible
  // Sécurité : la collection globale est filtrée par tenantId (lecture
  // propriétaire uniquement) + la sous-collection du vendeur.
  try {
    const promises: Promise<any>[] = [
      getDocs(query(collection(db, "abandoned_carts"), where("tenantId", "==", effectiveTenantId))),
      getDocs(collection(db, "tenants", effectiveTenantId, "abandoned_carts"))
    ];

    if (auth.currentUser?.uid && auth.currentUser.uid !== effectiveTenantId) {
      promises.push(getDocs(collection(db, "tenants", auth.currentUser.uid, "abandoned_carts")));
    }

    const snaps = await Promise.allSettled(promises);
    snaps.forEach(snap => {
      if (snap.status === "fulfilled" && snap.value) {
        snap.value.forEach((docSnap: any) => {
          const data = docSnap.data() as AbandonedCart;
          const id = docSnap.id;
          const existing = mergedMap.get(id);
          mergedMap.set(id, {
            ...existing,
            ...data,
            id
          });
        });
      }
    });

    // Mettre à jour le cache local avec les données fraîches (ce vendeur uniquement)
    const mergedList = Array.from(mergedMap.values());
    try {
      localStorage.setItem("dzbuild_abandoned_carts", JSON.stringify(mergedList));
    } catch {}
  } catch (dbErr) {
    console.warn("Firestore abandoned carts fetch warning:", dbErr);
  }

  // Trier par date la plus récente (updatedAt peut être un Timestamp Firestore
  // ou une chaîne ISO selon la source)
  const toMs = (v: any): number => {
    try {
      if (!v) return 0;
      if (typeof v === "object" && typeof v.toMillis === "function") return v.toMillis();
      const t = new Date(v).getTime();
      return Number.isFinite(t) ? t : 0;
    } catch {
      return 0;
    }
  };
  const result = Array.from(mergedMap.values());
  result.sort((a, b) => {
    const timeA = toMs(a.updatedAt) || toMs(a.createdAt) || toMs(a.date);
    const timeB = toMs(b.updatedAt) || toMs(b.createdAt) || toMs(b.date);
    return timeB - timeA;
  });

  return result;
}

/**
 * Convertit un panier abandonné en une véritable commande active
 */
export async function convertAbandonedCartToOrder(cart: AbandonedCart, tenantId?: string): Promise<string> {
  const effectiveTenantId = tenantId || cart.tenantId || cart.userId || auth.currentUser?.uid || "default_tenant";
  const generatedOrderId = `ORD-${Math.floor(Math.random() * 90000) + 10000}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(16).substring(2, 6).toUpperCase()}`;

  const nowIso = new Date().toISOString();

  const orderPayload = {
    id: generatedOrderId,
    reference: generatedOrderId,
    orderNumber: generatedOrderId.substring(4, 10),
    userId: effectiveTenantId,
    client: cart.client || "Client récupéré",
    phone: cart.phone,
    email: cart.email || "",
    customerEmail: cart.email || "",
    wilaya: cart.wilaya || "الجزائر",
    commune: cart.commune || "",
    address: cart.address || "Livraison à domicile",
    itemsSummary: cart.itemsSummary || "Commande issue d'un panier abandonné",
    total: cart.total || 0,
    status: "En attente",
    paymentStatus: "Non payé",
    paymentMethod: "COD (الدفع عند الاستلام)",
    deliveryType: "À domicile",
    source: "abandoned_cart_recovery",
    date: nowIso,
    createdAt: nowIso,
    items: cart.items && cart.items.length > 0 ? cart.items : [{
      productId: "abandoned-recovered",
      name: cart.itemsSummary || "Produit récupéré",
      price: cart.total || 0,
      quantity: 1,
      image: ""
    }]
  };

  // 1. Sauvegarde dans les commandes locales
  try {
    const raw = localStorage.getItem("dzbuild_local_orders");
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(orderPayload);
    localStorage.setItem("dzbuild_local_orders", JSON.stringify(list));
    window.dispatchEvent(new Event("dzbuild_order_placed"));
    window.dispatchEvent(new CustomEvent("order_created", { detail: orderPayload }));
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.warn("Local storage order save error:", err);
  }

  // 2. Sauvegarde Firestore
  try {
    await setDoc(doc(db, "orders", generatedOrderId), {
      ...orderPayload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    if (effectiveTenantId) {
      await setDoc(doc(db, "tenants", effectiveTenantId, "orders", generatedOrderId), {
        ...orderPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (dbErr) {
    console.warn("Firestore order save error:", dbErr);
  }

  // 3. Marquer le panier comme récupéré
  await markAbandonedCartAsRecovered(cart.phone, generatedOrderId, effectiveTenantId);

  return generatedOrderId;
}

// ---------------------------------------------------------------------------
// Notes / remarques marchand (Lot 19) — stockées en tableau `notes` sur le
// document du panier (protégé par les règles owner-only d'abandoned_carts).
// Lecture-modification-écriture : seul le propriétaire écrit depuis le
// dashboard, les écritures sont propagées aux deux collections (globale +
// miroir tenant).
// ---------------------------------------------------------------------------

/** Lit le tableau de notes actuel d'un panier (globale puis miroir tenant). */
async function readCartNotes(cartId: string, tenantId?: string): Promise<CartNote[]> {
  const effectiveTenantId = tenantId || auth.currentUser?.uid;
  let data: Record<string, unknown> | undefined;
  try {
    const snap = await getDoc(doc(db, "abandoned_carts", cartId));
    if (snap.exists()) data = snap.data();
  } catch (e) {
    console.warn("readCartNotes: global read failed:", e);
  }
  if (!data && effectiveTenantId) {
    try {
      const snap = await getDoc(doc(db, "tenants", effectiveTenantId, "abandoned_carts", cartId));
      if (snap.exists()) data = snap.data();
    } catch (e) {
      console.warn("readCartNotes: tenant read failed:", e);
    }
  }
  return Array.isArray(data?.notes) ? ((data!.notes as CartNote[]).filter(n => n && typeof n.text === "string")) : [];
}

/** Écrit le tableau de notes sur les deux collections (merge, sans écraser le reste). */
async function writeCartNotes(cartId: string, notes: CartNote[], tenantId?: string): Promise<void> {
  const effectiveTenantId = tenantId || auth.currentUser?.uid;
  const patch = { notes, updatedAt: serverTimestamp() };
  await setDoc(doc(db, "abandoned_carts", cartId), patch, { merge: true });
  if (effectiveTenantId) {
    await setDoc(doc(db, "tenants", effectiveTenantId, "abandoned_carts", cartId), patch, { merge: true }).catch((e) => {
      console.warn("writeCartNotes: tenant mirror failed:", e);
    });
  }
}

/** Ajoute une note (nouvelle en tête de liste). Texte trimé, 1000 car. max. */
export async function addCartNote(
  cartId: string,
  text: string,
  author: { id: string; name: string },
  tenantId?: string
): Promise<void> {
  const clean = (text || "").trim().slice(0, CART_NOTE_MAX_LENGTH);
  if (!clean) throw new Error("EMPTY_NOTE");
  const current = await readCartNotes(cartId, tenantId);
  const now = new Date().toISOString();
  const note: CartNote = {
    id: `note_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    text: clean,
    authorId: author.id,
    authorName: author.name,
    createdAt: now,
    updatedAt: now
  };
  await writeCartNotes(cartId, [note, ...current], tenantId);
}

/** Modifie une note existante (updatedAt mis à jour → mention « modifié »). */
export async function updateCartNote(
  cartId: string,
  noteId: string,
  text: string,
  tenantId?: string
): Promise<void> {
  const clean = (text || "").trim().slice(0, CART_NOTE_MAX_LENGTH);
  if (!clean) throw new Error("EMPTY_NOTE");
  const current = await readCartNotes(cartId, tenantId);
  const next = current.map((n) =>
    n.id === noteId ? { ...n, text: clean, updatedAt: new Date().toISOString() } : n
  );
  await writeCartNotes(cartId, next, tenantId);
}

/** Supprime une note. */
export async function deleteCartNote(cartId: string, noteId: string, tenantId?: string): Promise<void> {
  const current = await readCartNotes(cartId, tenantId);
  await writeCartNotes(cartId, current.filter((n) => n.id !== noteId), tenantId);
}
