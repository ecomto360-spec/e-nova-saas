import { db, auth } from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
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
  status: "abandoned" | "relanced" | "recovered";
  recovered: boolean;
  relanceCount: number;
  source: string;
  createdAt: any;
  updatedAt: any;
  date?: string;
  orderId?: string;
  recoveredAt?: any;
  lastRelancedAt?: any;
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
        status: prev.status === "recovered" ? "recovered" : (prev.status === "relanced" ? "relanced" : cartPayload.status),
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
    await setDoc(doc(db, "abandoned_carts", cartId), {
      ...cartPayload,
      updatedAt: serverTimestamp(),
      ...(data.createdAt ? {} : { createdAt: serverTimestamp() })
    }, { merge: true });

    if (effectiveTenantId) {
      await setDoc(doc(db, "tenants", effectiveTenantId, "abandoned_carts", cartId), {
        ...cartPayload,
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

  // 2. Firestore
  try {
    await setDoc(doc(db, "abandoned_carts", cartId), {
      status: "recovered",
      recovered: true,
      orderId,
      recoveredAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    if (effectiveTenantId) {
      await setDoc(doc(db, "tenants", effectiveTenantId, "abandoned_carts", cartId), {
        status: "recovered",
        recovered: true,
        orderId,
        recoveredAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (e) {
    console.warn("Firestore recovery update warning:", e);
  }
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
  try {
    const cached = localStorage.getItem("dzbuild_abandoned_carts");
    if (cached) {
      const localList: AbandonedCart[] = JSON.parse(cached);
      localList.forEach(c => {
        if (c.id) mergedMap.set(c.id, c);
      });
    }
  } catch (err) {
    console.warn("Error reading local abandoned carts:", err);
  }

  // 2. Récupérer depuis Firestore si disponible
  try {
    const promises: Promise<any>[] = [
      getDocs(collection(db, "abandoned_carts")),
      getDocs(collection(db, "tenants", "default_tenant", "abandoned_carts"))
    ];

    if (effectiveTenantId && effectiveTenantId !== "default_tenant") {
      promises.push(getDocs(collection(db, "tenants", effectiveTenantId, "abandoned_carts")));
    }
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

    // Mettre à jour le cache local avec les données fraîches
    const mergedList = Array.from(mergedMap.values());
    try {
      localStorage.setItem("dzbuild_abandoned_carts", JSON.stringify(mergedList));
    } catch {}
  } catch (dbErr) {
    console.warn("Firestore abandoned carts fetch warning:", dbErr);
  }

  // Trier par date la plus récente
  const result = Array.from(mergedMap.values());
  result.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
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
