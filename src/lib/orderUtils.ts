/**
 * Utility functions for definitive deduplication of orders and products
 * across Firestore, LocalStorage, real-time events, and Storefront views.
 */

export function getOrderDeduplicationKey(data: any, fallbackId?: string): string {
  if (!data) return fallbackId || `ord_${Date.now()}`;
  
  // 1. Reference is the most unique primary identifier (e.g. ORD-83031-20260908-7DEAA975)
  if (data.reference && typeof data.reference === 'string' && data.reference.trim()) {
    return `ref_${data.reference.trim().toUpperCase()}`;
  }

  // 2. Order number (e.g. #83031 or 83031)
  if (data.orderNumber && typeof data.orderNumber === 'string' && data.orderNumber.trim()) {
    const cleanNum = data.orderNumber.replace(/^[#\s]+/, '').trim().toUpperCase();
    if (cleanNum && cleanNum !== 'CMD') {
      return `num_${cleanNum}`;
    }
  }

  // 3. Fallback: match by client + phone + total + date within same window
  const client = (data.client || data.customerName || data.name || '').trim().toLowerCase();
  const phone = (data.phone || data.customerPhone || '').replace(/\D/g, '');
  const total = data.total ? Number(data.total) : null;
  const dateStr = (data.date || '').slice(0, 16); // up to minute
  if (phone && (client || total)) {
    return `fingerprint_${phone}_${client}_${total || ''}_${dateStr}`;
  }

  // 4. Fallback ID
  const id = data.id || fallbackId || '';
  return id ? `id_${String(id).trim()}` : `fallback_${Date.now()}_${Math.random()}`;
}

export function deduplicateOrders<T = any>(ordersList: T[]): T[] {
  if (!Array.isArray(ordersList)) return [];
  const seenKeys = new Set<string>();
  const seenRefs = new Set<string>();
  const seenOrderNums = new Set<string>();
  const seenFingerprints = new Set<string>();
  const result: T[] = [];

  for (const raw of ordersList) {
    if (!raw) continue;
    const o = raw as any;

    const ref = o.reference ? String(o.reference).trim().toUpperCase() : '';
    const orderNum = o.orderNumber ? String(o.orderNumber).replace(/^[#\s]+/, '').trim().toUpperCase() : '';
    const client = (o.client || o.customerName || o.name || '').trim().toLowerCase();
    const phone = (o.phone || o.customerPhone || '').replace(/\D/g, '');
    const total = o.total ? Number(o.total) : '';
    const dateStr = (o.date || '').slice(0, 16);
    const fingerprint = (phone && (client || total)) ? `${phone}_${total}_${dateStr}` : '';
    const primaryKey = getOrderDeduplicationKey(o, o.id);

    // If already seen by reference, skip
    if (ref && seenRefs.has(ref)) continue;
    // If already seen by order number, skip
    if (orderNum && orderNum !== 'CMD' && seenOrderNums.has(orderNum)) continue;
    // If already seen by customer fingerprint (same phone, total, and date), skip
    if (fingerprint && seenFingerprints.has(fingerprint)) continue;
    // If already seen by primary key, skip
    if (seenKeys.has(primaryKey)) continue;

    // Mark as seen
    seenKeys.add(primaryKey);
    if (ref) seenRefs.add(ref);
    if (orderNum && orderNum !== 'CMD') seenOrderNums.add(orderNum);
    if (fingerprint) seenFingerprints.add(fingerprint);
    if (o.id) seenKeys.add(`id_${String(o.id).trim()}`);

    result.push(raw);
  }

  return result;
}

export function deduplicateProducts<T = any>(productsList: T[]): T[] {
  if (!Array.isArray(productsList)) return [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const result: T[] = [];

  for (const raw of productsList) {
    if (!raw) continue;
    const p = raw as any;
    const idStr = String(p.id ?? '').trim();
    const nameNorm = (p.name || p.nameAr || '').trim().toLowerCase();

    // Check if ID already seen
    if (idStr && seenIds.has(idStr)) continue;
    // Check if product with identical normalized name already seen
    if (nameNorm && seenNames.has(nameNorm)) continue;

    if (idStr) seenIds.add(idStr);
    if (nameNorm) seenNames.add(nameNorm);
    result.push(raw);
  }

  return result;
}
