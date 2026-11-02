/**
 * T1 — Panier de la vitrine publique.
 * ---------------------------------------------------------------------------
 * localStorage, clé par slug de boutique : le panier ne dépend JAMAIS de la
 * session Firebase ni du cache du dashboard (contrat de /store/:slug).
 * API : useStorefrontCart() → items, addItem, removeItem, setQty, clear,
 * totalDA, count. Un événement custom prévient le header (compteur) et le
 * mini-panier sans recharger la page.
 */

import { useCallback, useEffect, useState } from "react";

export interface StoreCartItem {
  /** productId Firestore ou id de démo. */
  productId: string;
  name: string;
  image: string;
  price: number;
  oldPrice: number | null;
  qty: number;
  /** Libellés des variantes choisies, ex. « Couleur : Rouge · Taille : L ». */
  variantLabel: string;
  /** Nom de catégorie pour les produits associés. */
  category: string;
}

const CART_EVENT = "storefront-cart-changed";

function storageKey(slug: string): string {
  return "sf_cart_" + slug;
}

function readCart(slug: string): StoreCartItem[] {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return [];
    const arr = JSON.parse(raw) as StoreCartItem[];
    return Array.isArray(arr) ? arr.filter((it) => it && it.productId && it.qty > 0) : [];
  } catch {
    return [];
  }
}

function writeCart(slug: string, items: StoreCartItem[]): void {
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(items));
  } catch { /* quota : best-effort */ }
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { slug } }));
}

export function useStorefrontCart(slug: string) {
  const [items, setItems] = useState<StoreCartItem[]>(() => readCart(slug));

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ slug: string }>).detail;
      if (!detail || detail.slug === slug) setItems(readCart(slug));
    };
    window.addEventListener(CART_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CART_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [slug]);

  const addItem = useCallback(
    (item: StoreCartItem) => {
      const next = readCart(slug);
      const existing = next.find((it) => it.productId === item.productId && it.variantLabel === item.variantLabel);
      if (existing) existing.qty += item.qty;
      else next.push({ ...item });
      writeCart(slug, next.slice(0, 60));
    },
    [slug]
  );

  const removeItem = useCallback(
    (productId: string, variantLabel: string) => {
      writeCart(slug, readCart(slug).filter((it) => !(it.productId === productId && it.variantLabel === variantLabel)));
    },
    [slug]
  );

  const setQty = useCallback(
    (productId: string, variantLabel: string, qty: number) => {
      const next = readCart(slug)
        .map((it) => (it.productId === productId && it.variantLabel === variantLabel ? { ...it, qty: Math.max(1, Math.min(99, qty)) } : it));
      writeCart(slug, next);
    },
    [slug]
  );

  const clear = useCallback(() => writeCart(slug, []), [slug]);

  const totalDA = items.reduce((acc, it) => acc + it.price * it.qty, 0);
  const count = items.reduce((acc, it) => acc + it.qty, 0);

  return { items, addItem, removeItem, setQty, clear, totalDA, count };
}

/** Format du prix selon le réglage « Affichage du prix » (appliqué partout). */
export function formatPrice(amount: number, format: "plain" | "comma" | "space", lang: "fr" | "ar"): string {
  const n = Math.max(0, Math.round(amount));
  const body =
    format === "comma"
      ? n.toLocaleString("en-US")
      : format === "space"
        ? n.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ")
        : String(n);
  return lang === "ar" ? `${body} دج` : `${body} DA`;
}
