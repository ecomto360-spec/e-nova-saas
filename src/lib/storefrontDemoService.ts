/**
 * T1 — Données de démo de la vitrine : chargement / suppression en un clic.
 * Écrit dans les collections réelles (products / categories) avec le drapeau
 * isDemo: true, et injecte avis + sections par défaut dans les réglages
 * storefront. La suppression retire uniquement les documents isDemo.
 */

import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  demoCategories,
  demoProducts,
  demoReviews,
  demoHeroImage,
} from "../data/storefrontDemoData";
import { defaultStarterSections } from "../data/storefrontDefaults";
import type { HomeSection } from "../types/storefrontSections";

/** Charge les données de démo (idempotent : remplace l'existante). */
export async function loadDemoStoreData(uid: string): Promise<{ categories: number; products: number }> {
  // 1. Supprimer l'éventuelle démo précédente
  await removeDemoStoreData(uid);

  // 2. Catégories (IDs fixes pour le filtrage)
  for (let i = 0; i < demoCategories.length; i += 1) {
    const cat = demoCategories[i];
    await setDoc(doc(db, "categories", `demo_cat_${i + 1}`), {
      userId: uid,
      name: cat.name.fr,
      nameAr: cat.name.ar,
      image: cat.image,
      status: "active",
      isDemo: true,
      order: i,
      createdAt: serverTimestamp(),
    });
  }

  // 3. Produits (category = id de la catégorie de démo pour le filtrage)
  for (let i = 0; i < demoProducts.length; i += 1) {
    const p = demoProducts[i];
    await setDoc(doc(db, "products", `demo_prod_${i + 1}`), {
      userId: uid,
      name: p.name.fr,
      nameAr: p.name.ar,
      description: p.description.fr,
      descriptionAr: p.description.ar,
      price: p.price,
      originalPrice: p.oldPrice,
      image: p.images[0],
      images: p.images,
      // Modèle réel : product.category = NOM de la catégorie (cf. Products.tsx)
      category: demoCategories[p.categoryIndex].name.fr,
      isFeatured: p.featured,
      stock: p.stock,
      status: "active",
      isDemo: true,
      variants: p.variants.map((v) => ({
        name: v.name.fr,
        nameAr: v.name.ar,
        options: v.options.map((o) => ({ value: o.fr, valueAr: o.ar })),
      })),
      createdAt: serverTimestamp(),
    });
  }

  // 4. Réglages storefront : sections par défaut + avis de démo + hero de démo
  const sections: HomeSection[] = defaultStarterSections().map((sec) => {
    if (sec.type === "reviews") return { ...sec, manualReviews: demoReviews, includeProductReviews: true };
    if (sec.type === "hero") return { ...sec, desktopImage: demoHeroImage() };
    return sec;
  });
  await setDoc(
    doc(db, "tenants", uid, "settings", "storefront"),
    { sections, demoDataLoadedAt: new Date().toISOString() },
    { merge: true }
  );

  return { categories: demoCategories.length, products: demoProducts.length };
}

/** Supprime UNIQUEMENT les données de démo (isDemo: true). */
export async function removeDemoStoreData(uid: string): Promise<{ categories: number; products: number }> {
  const catsSnap = await getDocs(query(collection(db, "categories"), where("userId", "==", uid), where("isDemo", "==", true)));
  for (const d of catsSnap.docs) await deleteDoc(d.ref);
  const prodsSnap = await getDocs(query(collection(db, "products"), where("userId", "==", uid), where("isDemo", "==", true)));
  for (const d of prodsSnap.docs) await deleteDoc(d.ref);
  return { categories: catsSnap.size, products: prodsSnap.size };
}
