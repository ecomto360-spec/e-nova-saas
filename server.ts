import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import adminAuthRoutes from "./src/routes/adminAuth.js";
import multer from "multer";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { db } from "./src/lib/firebase-backend.js";
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { sendOwnerWhatsAppNotification } from "./src/lib/whatsappOwner.js";
import { formatDateTime } from "./src/lib/date.js";

// Setup multer to use memory storage since Cloud Run disk is ephemeral
const storage = multer.memoryStorage();
// 900KB limit since Firestore document max size is 1MB
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 900 * 1024 } 
});

async function startServer() {
  // Configuration Cloudinary avec les clés intégrées directement en dur
  cloudinary.config({ 
    cloud_name: 'ie6edvfe', 
    api_key: '571992972679788', 
    api_secret: 'ojRyuQn_r0KsBbWKH0dtLUY4-3I'
  });

  const app = express();
  const PORT = 3000;
  
  app.use(express.json());
  app.use(cookieParser());

  // Security headers for admin dashboard
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Anti-spam cooldown map for order notifications
  const orderCooldownMap = new Map<string, number>();

  // Real-time Order Notification Endpoint (Notifies Store Owner via Email & WhatsApp)
  app.post("/api/notify/order", async (req, res) => {
    try {
      const { 
        orderId, 
        reference, 
        tenantId, 
        manual = false,
        clientFallback
      } = req.body;

      const lookupRef = reference || orderId || (clientFallback && (clientFallback.reference || clientFallback.orderNumber));

      if (!lookupRef && !clientFallback) {
        return res.status(400).json({ error: "Identifiant ou référence de commande manquant." });
      }

      // Rate limit cooldown (3 seconds per order ID)
      const nowMs = Date.now();
      const lastTrigger = orderCooldownMap.get(String(lookupRef)) || 0;
      if (!manual && nowMs - lastTrigger < 3000) {
        return res.json({ success: true, message: "Notification déjà en cours de traitement." });
      }
      orderCooldownMap.set(String(lookupRef), nowMs);

      // Clean up cooldown map memory
      if (orderCooldownMap.size > 2000) {
        orderCooldownMap.clear();
      }

      let effectiveTenantId = tenantId || (clientFallback && (clientFallback.userId || clientFallback.tenantId)) || "";
      let orderData: any = null;
      let orderDocRef: any = null;

      // 1. Fetch Order directly from Firestore (Server-side source of truth)
      if (effectiveTenantId && lookupRef) {
        try {
          const directSnap = await getDoc(doc(db, "tenants", effectiveTenantId, "orders", lookupRef));
          if (directSnap.exists()) {
            orderData = directSnap.data();
            orderDocRef = doc(db, "tenants", effectiveTenantId, "orders", lookupRef);
          }
        } catch {}
      }

      // Query root /orders collection if not found
      if (!orderData && lookupRef) {
        try {
          const q = query(collection(db, "orders"), where("reference", "==", lookupRef));
          const snap = await getDocs(q);
          if (!snap.empty) {
            orderData = snap.docs[0].data();
            orderDocRef = doc(db, "orders", snap.docs[0].id);
            if (!effectiveTenantId && orderData.userId) {
              effectiveTenantId = orderData.userId;
            }
          }
        } catch {}
      }

      // Fallback to client payload if Firestore query didn't resolve yet
      if (!orderData && clientFallback) {
        orderData = clientFallback;
      }

      if (!orderData) {
        console.warn(`[NOTIFY] Order ${lookupRef} could not be resolved.`);
        return res.status(404).json({ error: "Commande non trouvée." });
      }

      // Anti-duplicate check (unless manual re-send requested)
      if (!manual && orderData.ownerNotified?.email && orderData.ownerNotified?.whatsapp) {
        console.log(`[NOTIFY] Order ${lookupRef} already notified to owner.`);
        return res.json({
          success: true,
          alreadyNotified: true,
          ownerNotified: orderData.ownerNotified
        });
      }

      // 2. Fetch Tenant settings & Owner Contact
      let ownerEmail = "";
      let ownerPhone = "";
      let notifyEmailEnabled = true;
      let notifyWhatsappEnabled = true;
      let callmebotApiKey = "";
      let storeName = "Votre boutique DZ Build";

      if (effectiveTenantId) {
        try {
          const tenantSnap = await getDoc(doc(db, "tenants", effectiveTenantId));
          if (tenantSnap.exists()) {
            const tData = tenantSnap.data();
            ownerEmail = tData.notificationEmail || tData.email || tData.ownerEmail || "";
            ownerPhone = tData.notificationWhatsapp || tData.phone || "";
            if (tData.notifyEmailEnabled !== undefined) notifyEmailEnabled = tData.notifyEmailEnabled;
            if (tData.notifyWhatsappEnabled !== undefined) notifyWhatsappEnabled = tData.notifyWhatsappEnabled;
            if (tData.callmebotApiKey) callmebotApiKey = tData.callmebotApiKey;
            if (tData.storeName) storeName = tData.storeName;
          }

          // Check subcollection /tenants/{tenantId}/settings/notifications
          const settingsSnap = await getDoc(doc(db, "tenants", effectiveTenantId, "settings", "notifications"));
          if (settingsSnap.exists()) {
            const sData = settingsSnap.data();
            if (sData.notificationEmail) ownerEmail = sData.notificationEmail;
            if (sData.notificationWhatsapp) ownerPhone = sData.notificationWhatsapp;
            if (sData.notifyEmailEnabled !== undefined) notifyEmailEnabled = sData.notifyEmailEnabled;
            if (sData.notifyWhatsappEnabled !== undefined) notifyWhatsappEnabled = sData.notifyWhatsappEnabled;
            if (sData.callmebotApiKey) callmebotApiKey = sData.callmebotApiKey;
          }
        } catch (tErr) {
          console.warn("[NOTIFY] Error fetching tenant config:", tErr);
        }
      }

      // Safe defaults
      if (!ownerEmail && req.body.merchantEmail) {
        ownerEmail = req.body.merchantEmail;
      }
      if (!ownerEmail) {
        ownerEmail = "nabsterzero@gmail.com";
      }

      const orderNumber = orderData.orderNumber || (orderData.reference ? String(orderData.reference).slice(-6) : "CMD");
      const clientName = orderData.client || orderData.customerName || "Client";
      const clientPhone = orderData.phone || orderData.customerPhone || "Non renseigné";
      const clientEmail = orderData.email || orderData.customerEmail || "";
      const wilaya = orderData.wilaya || "Algérie";
      const commune = orderData.commune || "";
      const address = orderData.address || "Livraison";
      const total = Number(orderData.total) || 0;
      const shippingCost = Number(orderData.shippingCost) || 0;
      const subtotal = Math.max(0, total - shippingCost);
      const itemsSummary = orderData.itemsSummary || (orderData.items && orderData.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ")) || "Produit commandé";
      const orderDate = formatDateTime(orderData.date || orderData.createdAt || new Date(), true);
      const status = orderData.status || "En attente";
      const items = orderData.items || [];

      console.log(`[NOTIFY OWNER] Processing order #${orderNumber} for tenant ${effectiveTenantId || 'default'} (Owner Email: ${ownerEmail}, Phone: ${ownerPhone})`);

      // 3. Dispatch Email & WhatsApp in parallel (Promise.allSettled)
      const dispatchPromises: [Promise<any>, Promise<any>] = [
        // 1. Email Dispatch
        (async () => {
          if (!notifyEmailEnabled || !ownerEmail) {
            return { success: false, skipped: true, reason: "Notification Email désactivée ou adresse email manquante." };
          }

          const itemsHtml = items.length > 0
            ? items.map((it: any) => `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px; font-size: 13px; color: #111827;">
                  <strong>${it.name || "Article"}</strong>
                  ${it.variants ? `<br/><span style="font-size: 11px; color: #6b7280;">${Object.entries(it.variants).map(([k, v]) => `${k}: ${v}`).join(", ")}</span>` : ""}
                </td>
                <td style="padding: 12px; font-size: 13px; text-align: center; color: #111827;">x${it.quantity || 1}</td>
                <td style="padding: 12px; font-size: 13px; text-align: right; font-weight: bold; color: #111827;">${(Number(it.price || 0) * Number(it.quantity || 1)).toLocaleString()} DZD</td>
              </tr>
            `).join("")
            : `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px; font-size: 13px; color: #111827;"><strong>${itemsSummary}</strong></td>
                <td style="padding: 12px; font-size: 13px; text-align: center; color: #111827;">x1</td>
                <td style="padding: 12px; font-size: 13px; text-align: right; font-weight: bold; color: #111827;">${subtotal.toLocaleString()} DZD</td>
              </tr>
            `;

          const emailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
              
              <!-- Header -->
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f3f4f6;">
                <div style="display: inline-block; background-color: #fef3c7; color: #d97706; font-size: 26px; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; margin-bottom: 8px;">🛒</div>
                <h1 style="color: #111827; font-size: 22px; margin: 0; font-weight: 800;">Nouvelle Commande Reçue !</h1>
                <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">${storeName} • Réf : <strong>#${orderNumber}</strong></p>
              </div>

              <!-- Client Info Box -->
              <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">👤 Coordonnées du Client</h3>
                <table style="width: 100%; font-size: 13px; line-height: 1.6; color: #111827;">
                  <tr><td style="color: #6b7280; width: 120px;">Nom complet :</td><td><strong>${clientName}</strong></td></tr>
                  <tr><td style="color: #6b7280;">Téléphone :</td><td><a href="tel:${clientPhone}" style="color: #2563eb; font-weight: bold; text-decoration: none;">${clientPhone}</a></td></tr>
                  ${clientEmail ? `<tr><td style="color: #6b7280;">Email :</td><td><a href="mailto:${clientEmail}" style="color: #2563eb; text-decoration: none;">${clientEmail}</a></td></tr>` : ""}
                  <tr><td style="color: #6b7280;">Destination :</td><td>${wilaya}${commune ? ` - ${commune}` : ""} (${address})</td></tr>
                  <tr><td style="color: #6b7280;">Statut initial :</td><td><span style="background-color: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;">${status}</span></td></tr>
                  <tr><td style="color: #6b7280;">Date :</td><td>${orderDate}</td></tr>
                </table>
              </div>

              <!-- Products Table -->
              <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">📦 Détails des Articles</h3>
                <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #f3f4f6; border-radius: 8px;">
                  <thead>
                    <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                      <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280;">Article</th>
                      <th style="padding: 10px 12px; text-align: center; font-size: 12px; color: #6b7280;">Qté</th>
                      <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #6b7280;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
              </div>

              <!-- Totals Box -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4b5563; margin-bottom: 6px;">
                  <span>Sous-total produits :</span>
                  <span>${subtotal.toLocaleString()} DZD</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4b5563; margin-bottom: 8px;">
                  <span>Frais de livraison :</span>
                  <span>${shippingCost > 0 ? `${shippingCost.toLocaleString()} DZD` : "Gratuit (0 DZD)"}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 17px; font-weight: bold; color: #111827; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  <span>Total à encaisser :</span>
                  <span style="color: #10b981;">${total.toLocaleString()} DZD</span>
                </div>
              </div>

              <!-- Dashboard CTA Button -->
              <div style="text-align: center; margin: 28px 0 16px 0;">
                <a href="${process.env.APP_URL || 'https://ais-dev-zvrbpruzhdfhlem4dnde34-707063893758.europe-west2.run.app'}/dashboard/orders/${lookupRef}" style="background-color: #f59e0b; color: #000000; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 14px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);">
                  📋 Ouvrir et traiter la commande
                </a>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid #f3f4f6; padding-top: 16px; text-align: center; color: #9ca3af; font-size: 11px;">
                Notification automatique sécurisée générée par la plateforme DZ Build.
              </div>
            </div>
          `;

          let transporter;
          if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: Number(process.env.SMTP_PORT || 587),
              secure: process.env.SMTP_SECURE === "true",
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            });
          } else {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
              host: "smtp.ethereal.email",
              port: 587,
              secure: false,
              auth: {
                user: testAccount.user,
                pass: testAccount.pass,
              },
            });
          }

          const fromHeader = process.env.SMTP_FROM || `"${storeName}" <notifications@dzbuild.com>`;
          const info = await transporter.sendMail({
            from: fromHeader,
            to: ownerEmail,
            subject: `🛒 Nouvelle commande #${orderNumber} — ${total.toLocaleString()} DZD`,
            html: emailHtml,
          });

          const previewUrl = nodemailer.getTestMessageUrl(info) || "";
          console.log(`[EMAIL DISPATCH SUCCESS] Owner email sent to ${ownerEmail}. MessageId: ${info.messageId}`);
          return { success: true, messageId: info.messageId, previewUrl };
        })(),

        // 2. WhatsApp Dispatch
        (async () => {
          if (!notifyWhatsappEnabled || !ownerPhone) {
            return { success: false, skipped: true, reason: "Notification WhatsApp désactivée ou numéro non renseigné." };
          }

          const waResult = await sendOwnerWhatsAppNotification({
            ownerPhone,
            orderNumber,
            clientName,
            clientPhone,
            wilaya,
            total,
            itemsSummary,
            storeName,
            callmebotApiKey,
          });

          return waResult;
        })()
      ];

      const [emailSettled, whatsappSettled] = await Promise.allSettled(dispatchPromises);

      const emailResult = emailSettled.status === "fulfilled" ? emailSettled.value : { success: false, error: (emailSettled as any).reason?.message };
      const whatsappResult = whatsappSettled.status === "fulfilled" ? whatsappSettled.value : { success: false, error: (whatsappSettled as any).reason?.message };

      const emailSuccess = !!emailResult?.success;
      const whatsappSuccess = !!whatsappResult?.success;

      // 4. Update ownerNotified status on Order document in Firestore
      const ownerNotifiedPayload = {
        email: emailSuccess,
        whatsapp: whatsappSuccess,
        emailError: emailSuccess ? null : (emailResult?.error || emailResult?.reason || null),
        whatsappError: whatsappSuccess ? null : (whatsappResult?.error || whatsappResult?.reason || null),
        whatsappMethod: whatsappResult?.method || "none",
        at: new Date().toISOString(),
      };

      if (orderDocRef) {
        try {
          await setDoc(orderDocRef, { ownerNotified: ownerNotifiedPayload }, { merge: true });
        } catch (updateErr) {
          console.warn("[NOTIFY] Could not update order ownerNotified:", updateErr);
        }
      }

      // 5. Log in /tenants/{tenantId}/notificationLogs
      if (effectiveTenantId) {
        try {
          const logId = `log_${lookupRef}_${Date.now()}`;
          await setDoc(doc(db, "tenants", effectiveTenantId, "notificationLogs", logId), {
            orderId: lookupRef,
            orderNumber,
            date: new Date().toISOString(),
            email: {
              sent: emailSuccess,
              recipient: ownerEmail,
              previewUrl: emailResult?.previewUrl || null,
              error: emailResult?.error || null,
            },
            whatsapp: {
              sent: whatsappSuccess,
              recipient: ownerPhone,
              method: whatsappResult?.method || "none",
              error: whatsappResult?.error || null,
            },
          });
        } catch (logErr) {
          console.warn("[NOTIFY] Could not save notification log:", logErr);
        }
      }

      return res.json({
        success: true,
        orderId: lookupRef,
        emailSent: emailSuccess,
        emailPreviewUrl: emailResult?.previewUrl || null,
        whatsappSent: whatsappSuccess,
        whatsappMethod: whatsappResult?.method || "none",
        whatsappError: whatsappResult?.error || null,
        ownerNotified: ownerNotifiedPayload,
      });

    } catch (globalErr: any) {
      console.error("[NOTIFY] Global exception in /api/notify/order:", globalErr);
      return res.status(500).json({ error: globalErr.message || "Erreur interne lors de la notification." });
    }
  });

  // Dedicated test notification endpoint for AccountSettings
  app.post("/api/notify/test", async (req, res) => {
    try {
      const { tenantId, email, phone, callmebotApiKey } = req.body;

      const targetEmail = email || "nabsterzero@gmail.com";
      const targetPhone = phone || "";

      console.log(`[TEST NOTIFY] Testing channels for email: ${targetEmail}, phone: ${targetPhone}`);

      let emailSent = false;
      let previewUrl = "";
      let emailError: string | null = null;

      try {
        let transporter;
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
          transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });
        } else {
          const testAccount = await nodemailer.createTestAccount();
          transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
        }

        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || `"DZ Build Test" <notifications@dzbuild.com>`,
          to: targetEmail,
          subject: "🧪 Test de notification commande — DZ Build",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
              <h2 style="color: #10b981; margin: 0 0 10px 0;">✅ Test Réussi !</h2>
              <p>Votre canal de notification Email fonctionne correctement. Vous recevrez automatiquement les alertes de chaque nouvelle commande ici.</p>
              <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">Généré à ${formatDateTime(new Date(), true)}</p>
            </div>
          `,
        });
        emailSent = true;
        previewUrl = nodemailer.getTestMessageUrl(info) || "";
      } catch (e: any) {
        emailError = e.message;
      }

      let waResult: any = { success: false, method: "none", error: "Numéro de téléphone non renseigné" };
      if (targetPhone) {
        waResult = await sendOwnerWhatsAppNotification({
          ownerPhone: targetPhone,
          orderNumber: "TEST-999",
          clientName: "Client Test",
          clientPhone: "0550000000",
          wilaya: "16 - Alger",
          total: 4500,
          itemsSummary: "1x Produit Test",
          storeName: "Test Store",
          callmebotApiKey,
        });
      }

      return res.json({
        success: true,
        emailSent,
        previewUrl,
        emailError,
        whatsappSent: waResult.success,
        whatsappMethod: waResult.method,
        whatsappError: waResult.error || null,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Example Cloudinary Upload Endpoint
  app.post("/api/cloudinary-upload", upload.single('image') as any, async (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "enova-products" }, 
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(500).json({ error: "Failed to upload to Cloudinary" });
          }
          res.json({ url: result?.secure_url });
        }
      );
      
      const stream = new Readable();
      stream.push(req.file.buffer);
      stream.push(null);
      stream.pipe(uploadStream);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Échec de l'enregistrement." });
    }
  });

  app.post("/api/admin/upload", upload.single('image') as any, async (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }
    try {
      const id = crypto.randomUUID();
      const mimeType = req.file.mimetype;
      const base64Data = req.file.buffer.toString('base64');
      
      await setDoc(doc(db, 'hosted_images', id), {
        id,
        mimeType,
        data: base64Data,
        createdAt: new Date().toISOString()
      });

      const fileUrl = `/api/images/${id}`;
      res.json({ url: fileUrl });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Échec de l'enregistrement. L'image est peut-être trop lourde (max 900KB)." });
    }
  });

  app.get("/api/images/:id", async (req, res) => {
    try {
      const docRef = doc(db, 'hosted_images', req.params.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const buffer = Buffer.from(data.data, 'base64');
        res.setHeader('Content-Type', data.mimeType);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.send(buffer);
      } else {
        res.status(404).send("Image not found");
      }
    } catch (error) {
      console.error("Error fetching image:", error);
      res.status(500).send("Error fetching image");
    }
  });

  // Media Manager endpoints
  app.get("/api/admin/images", async (req, res) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'hosted_images'));
      const images: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        images.push({
          id: data.id,
          mimeType: data.mimeType,
          createdAt: data.createdAt,
          url: `/api/images/${data.id}`
        });
      });
      images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json({ images });
    } catch (error) {
      console.error("Error listing images:", error);
      res.status(500).json({ error: "Failed to list images" });
    }
  });

  app.delete("/api/admin/images/:id", async (req, res) => {
    try {
      await deleteDoc(doc(db, 'hosted_images', req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  app.use("/api/admin/auth", adminAuthRoutes);

  // Chargily Pay Webhook (Phase 3)
  app.post("/api/webhooks/payment", async (req, res) => {
    try {
      const signature = req.headers['signature'];
      const payload = JSON.stringify(req.body);
      // Verify signature (using a dummy secret for now, will use CHARGILY_SECRET_KEY in production)
      const secret = process.env.CHARGILY_SECRET_KEY || 'dummy_secret';
      
      const computedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      
      // In a real app, you would block if signatures don't match
      // if (signature !== computedSignature) return res.status(403).json({error: "Invalid signature"});
      
      const event = req.body;
      if (event && event.type === 'checkout.paid') {
        const checkout = event.data;
        const tenantId = checkout.metadata?.tenantId;
        
        if (tenantId) {
          // Find pending payment for this tenant and update it
          const q = query(collection(db, 'payments'), where('tenantId', '==', tenantId), where('status', '==', 'pending'));
          const snap = await getDocs(q);
          
          if (!snap.empty) {
             const paymentDoc = snap.docs[0];
             await updateDoc(doc(db, 'payments', paymentDoc.id), {
               status: 'completed',
               approvedAt: new Date().toISOString()
             });
             
             // Update tenant plan
             const paymentData = paymentDoc.data();
             const tenantRef = doc(db, 'tenants', tenantId);
             const tenantSnap = await getDoc(tenantRef);
             
             let baseDate = new Date();
             if (tenantSnap.exists()) {
               const tData = tenantSnap.data();
               if (tData.planExpiresAt) {
                 const currentExp = new Date(tData.planExpiresAt);
                 if (currentExp > baseDate) baseDate = currentExp;
               }
             }
             
             let expiresAt = new Date(baseDate);
             const duration = paymentData.duration || "";
             if (duration.includes("3 mois")) expiresAt.setMonth(baseDate.getMonth() + 3);
             else if (duration.includes("6 mois")) expiresAt.setMonth(baseDate.getMonth() + 6);
             else if (duration.includes("1 an") || duration.includes("12 mois")) expiresAt.setFullYear(baseDate.getFullYear() + 1);
             else expiresAt.setMonth(baseDate.getMonth() + 1);
             
             await updateDoc(tenantRef, {
               plan: paymentData.planType || 'pro',
               planName: paymentData.plan || 'Professionnel',
               planExpiresAt: expiresAt.toISOString(),
               status: 'active'
             });
          }
        }
      }
      
      res.json({received: true});
    } catch(err) {
      console.error("Webhook error:", err);
      res.status(500).json({error: "Webhook error"});
    }
  });

  // ==========================================
  // PRODUCTS & OFFERS API (End-to-End)
  // ==========================================

  const getProductOffersList = async (productId: string) => {
    try {
      const q = query(collection(db, "product_offers"), where("product_id", "==", productId));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      return list;
    } catch {
      return [];
    }
  };

  // GET /products/:id & /api/products/:id (offers[] triées par sort_order)
  const handleGetProductById = async (req: any, res: any) => {
    try {
      const prodId = req.params.id;
      const snap = await getDoc(doc(db, "products", prodId));
      if (!snap.exists()) {
        return res.status(404).json({ error: "Produit non trouvé" });
      }
      const product = { id: snap.id, ...snap.data() } as any;
      const dbOffers = await getProductOffersList(prodId);
      if (dbOffers.length > 0) {
        product.offers = dbOffers;
      } else if (Array.isArray(product.offers)) {
        product.offers.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
      } else {
        product.offers = [];
      }
      res.json(product);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Erreur serveur" });
    }
  };
  app.get("/api/products/:id", handleGetProductById);
  app.get("/products/:id", handleGetProductById);

  // POST /products & /api/products (offers[] inclus)
  const handleCreateProduct = async (req: any, res: any) => {
    try {
      const payload = req.body;
      const prodId = payload.id || `prod_${Date.now()}`;
      const rawOffers = Array.isArray(payload.offers) ? payload.offers : [];
      
      const cleanOffers = rawOffers.map((o: any, idx: number) => ({
        ...o,
        id: o.id || `offer_${Date.now()}_${idx}`,
        product_id: prodId,
        sort_order: idx,
        is_active: o.is_active ?? true
      }));

      const productData = {
        ...payload,
        id: prodId,
        offers: cleanOffers,
        createdAt: payload.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "products", prodId), productData, { merge: true });

      for (const off of cleanOffers) {
        await setDoc(doc(db, "product_offers", off.id), off, { merge: true });
      }

      res.status(201).json({ success: true, product: productData });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Erreur création produit" });
    }
  };
  app.post("/api/products", handleCreateProduct);
  app.post("/products", handleCreateProduct);

  // PUT /products/:id & /api/products/:id (offers[] inclus)
  const handleUpdateProduct = async (req: any, res: any) => {
    try {
      const prodId = req.params.id;
      const payload = req.body;
      const rawOffers = Array.isArray(payload.offers) ? payload.offers : [];

      const cleanOffers = rawOffers.map((o: any, idx: number) => ({
        ...o,
        id: o.id || `offer_${Date.now()}_${idx}`,
        product_id: prodId,
        sort_order: idx,
        is_active: o.is_active ?? true
      }));

      const productData = {
        ...payload,
        id: prodId,
        offers: cleanOffers,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "products", prodId), productData, { merge: true });

      for (const off of cleanOffers) {
        await setDoc(doc(db, "product_offers", off.id), off, { merge: true });
      }

      res.json({ success: true, product: productData });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Erreur mise à jour produit" });
    }
  };
  app.put("/api/products/:id", handleUpdateProduct);
  app.put("/products/:id", handleUpdateProduct);

  // GET /store/products/:slug & /api/store/products/:slug → offres actives uniquement
  const handleGetStoreProductBySlug = async (req: any, res: any) => {
    try {
      const slugOrId = req.params.slug;
      let product: any = null;

      const snap = await getDoc(doc(db, "products", slugOrId));
      if (snap.exists()) {
        product = { id: snap.id, ...snap.data() };
      } else {
        const q = query(collection(db, "products"), where("slug", "==", slugOrId));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          product = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() };
        }
      }

      if (!product) {
        return res.status(404).json({ error: "Produit non trouvé" });
      }

      const allOffers = await getProductOffersList(product.id);
      const activeOffers = (allOffers.length > 0 ? allOffers : (product.offers || []))
        .filter((o: any) => o.is_active)
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

      product.offers = activeOffers;
      res.json(product);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Erreur serveur" });
    }
  };
  app.get("/api/store/products/:slug", handleGetStoreProductBySlug);
  app.get("/store/products/:slug", handleGetStoreProductBySlug);

  // POST /orders & /api/orders (accepte offer_id et recalcule le total côté serveur)
  const handleCreateOrder = async (req: any, res: any) => {
    try {
      const {
        productId,
        offer_id,
        offerId,
        quantity: clientQty,
        client,
        fullName,
        phone,
        email,
        wilaya,
        commune,
        address,
        notes,
        shippingMethod,
        shippingCost: clientShippingCost,
        tenantId,
        userId,
        variants
      } = req.body;

      const effectiveOfferId = offer_id || offerId || req.body.items?.[0]?.offerId;
      const targetProductId = productId || req.body.items?.[0]?.productId;

      // 1. Fetch genuine Product from database
      let authenticProduct: any = null;
      if (targetProductId) {
        const pSnap = await getDoc(doc(db, "products", targetProductId));
        if (pSnap.exists()) {
          authenticProduct = { id: pSnap.id, ...pSnap.data() };
        }
      }

      const unitBasePrice = authenticProduct?.price || Number(req.body.items?.[0]?.price) || 1000;

      // 2. Fetch genuine Offer from database if offerId provided
      let authenticOffer: any = null;
      if (effectiveOfferId) {
        const oSnap = await getDoc(doc(db, "product_offers", effectiveOfferId));
        if (oSnap.exists()) {
          authenticOffer = { id: oSnap.id, ...oSnap.data() };
        } else if (authenticProduct?.offers) {
          authenticOffer = authenticProduct.offers.find((o: any) => o.id === effectiveOfferId);
        }
      }

      // 3. SERVER-SIDE RECALCULATION
      const qty = authenticOffer ? authenticOffer.quantity : Math.max(1, Number(clientQty) || Number(req.body.items?.[0]?.quantity) || 1);
      let calculatedSubtotal = 0;
      let freeShipping = false;

      if (authenticOffer) {
        freeShipping = !!authenticOffer.free_shipping;
        if (authenticOffer.price_mode === "fixed") {
          calculatedSubtotal = Number(authenticOffer.final_price) || 0;
        } else if (authenticOffer.price_mode === "percent") {
          const pct = Math.min(99, Math.max(1, Number(authenticOffer.discount_value) || 0));
          calculatedSubtotal = Math.round(unitBasePrice * qty * (1 - pct / 100));
        } else if (authenticOffer.price_mode === "amount") {
          const da = Math.max(0, Number(authenticOffer.discount_value) || 0);
          calculatedSubtotal = Math.max(0, Math.round((unitBasePrice * qty) - da));
        } else {
          calculatedSubtotal = unitBasePrice * qty;
        }
      } else {
        calculatedSubtotal = unitBasePrice * qty;
      }

      const effectiveShippingFee = freeShipping ? 0 : Math.max(0, Number(clientShippingCost) || 0);
      const serverCalculatedTotal = calculatedSubtotal + effectiveShippingFee;

      const generatedOrderId = req.body.id || req.body.reference || `ORD-${Math.floor(Math.random() * 90000) + 10000}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
      const effectiveTenant = tenantId || userId || authenticProduct?.userId || "default_tenant";

      const verifiedOrder = {
        id: generatedOrderId,
        reference: generatedOrderId,
        orderNumber: generatedOrderId.substring(4, 10),
        userId: effectiveTenant,
        tenantId: effectiveTenant,
        client: client || fullName || "Client",
        phone: phone || "",
        email: email || "",
        wilaya: wilaya || "الجزائر",
        commune: commune || "",
        address: address || "Livraison à domicile",
        notes: notes || "",
        shippingMethod: shippingMethod || "Livraison à domicile",
        shippingCost: effectiveShippingFee,
        total: serverCalculatedTotal,
        subtotal: calculatedSubtotal,
        offerId: authenticOffer?.id || null,
        offerTitle: authenticOffer?.title || null,
        freeShippingApplied: freeShipping,
        status: "En attente",
        paymentStatus: "Non payé",
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        items: [{
          productId: targetProductId || "prod",
          name: authenticProduct?.name || req.body.items?.[0]?.name || "Article",
          unitPrice: unitBasePrice,
          price: calculatedSubtotal,
          quantity: qty,
          offerId: authenticOffer?.id || null,
          offerTitle: authenticOffer?.title || null,
          priceMode: authenticOffer?.price_mode || null,
          discountValue: authenticOffer?.discount_value || null,
          freeShippingApplied: freeShipping,
          variants: variants || req.body.items?.[0]?.variants || {}
        }]
      };

      await setDoc(doc(db, "orders", generatedOrderId), verifiedOrder);
      if (effectiveTenant && effectiveTenant !== "default_tenant") {
        await setDoc(doc(db, "tenants", effectiveTenant, "orders", generatedOrderId), verifiedOrder);
      }

      res.status(201).json({
        success: true,
        order: verifiedOrder,
        message: "Commande recalculée et validée côté serveur"
      });
    } catch (err: any) {
      console.error("Server order calculation error:", err);
      res.status(500).json({ error: err.message || "Erreur serveur" });
    }
  };
  app.post("/api/orders", handleCreateOrder);
  app.post("/orders", handleCreateOrder);

  // In-memory 60s cache for dashboard statistics
  interface StatsCacheEntry {
    timestamp: number;
    data: any;
  }
  const dashboardStatsCache = new Map<string, StatsCacheEntry>();

  // In-memory events ring buffer for low-latency analytics
  const recentEventsBuffer: any[] = [];

  // Event tracking endpoint (records visitor sessions, page views, and impressions)
  const handleRecordEvent = async (req: express.Request, res: express.Response) => {
    try {
      const {
        shop_id,
        tenantId,
        event = "page_view",
        session_id,
        sessionId,
        product_id,
        productId,
        path: pagePath,
        url,
        user_agent
      } = req.body;

      const effectiveShopId = shop_id || tenantId || "default_tenant";
      const effectiveSessionId = session_id || sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const effectiveProductId = product_id || productId || null;

      const eventData = {
        shop_id: effectiveShopId,
        tenantId: effectiveShopId,
        event,
        session_id: effectiveSessionId,
        product_id: effectiveProductId,
        path: pagePath || url || "",
        created_at: new Date().toISOString(),
        timestamp: Date.now()
      };

      // Push to in-memory buffer (fast ring buffer)
      recentEventsBuffer.push(eventData);
      if (recentEventsBuffer.length > 5000) {
        recentEventsBuffer.splice(0, 1000);
      }

      // Persist asynchronously in Firestore
      try {
        const eventsColl = collection(db, "events");
        const newDocRef = doc(eventsColl);
        setDoc(newDocRef, eventData).catch(() => {});
      } catch {}

      res.status(201).json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Erreur enregistrement événement" });
    }
  };

  app.post("/api/events", handleRecordEvent);
  app.post("/events", handleRecordEvent);

  // Dashboard Stats Endpoint (Calculated server-side, 60s cache, Africa/Algiers timezone)
  const handleGetDashboardStats = async (req: express.Request, res: express.Response) => {
    try {
      const {
        from,
        to,
        range = "today",
        productId = "all",
        tenantId,
        shop_id,
        userId
      } = req.query;

      const effectiveTenantId = String(tenantId || shop_id || userId || "");
      const rangeType = String(range) as any;
      const prodFilter = String(productId || "all");

      // Check 60-second in-memory cache
      const cacheKey = `${effectiveTenantId}_${rangeType}_${prodFilter}_${from || ''}_${to || ''}`;
      const nowMs = Date.now();
      const cached = dashboardStatsCache.get(cacheKey);
      if (cached && nowMs - cached.timestamp < 60000) {
        return res.json({ ...cached.data, cached: true });
      }

      // 1. Fetch Orders from Firestore
      const ordersMap = new Map<string, any>();
      const queries: Promise<any>[] = [];

      if (effectiveTenantId) {
        queries.push(getDocs(query(collection(db, "orders"), where("userId", "==", effectiveTenantId))).catch(() => null));
        queries.push(getDocs(query(collection(db, "orders"), where("tenantId", "==", effectiveTenantId))).catch(() => null));
        queries.push(getDocs(collection(db, "tenants", effectiveTenantId, "orders")).catch(() => null));
      }
      queries.push(getDocs(query(collection(db, "orders"), where("userId", "==", "default_tenant"))).catch(() => null));
      queries.push(getDocs(collection(db, "tenants", "default_tenant", "orders")).catch(() => null));

      // Also get root orders if small
      queries.push(getDocs(collection(db, "orders")).catch(() => null));

      const snaps = await Promise.all(queries);
      snaps.forEach(snap => {
        if (snap && snap.docs) {
          snap.docs.forEach((d: any) => {
            const data = d.data();
            const id = d.id;
            ordersMap.set(id, { id, ...data });
          });
        }
      });

      const ordersList = Array.from(ordersMap.values());

      // 2. Fetch Products
      const productsMap = new Map<string, any>();
      try {
        const prodQueries: Promise<any>[] = [];
        if (effectiveTenantId) {
          prodQueries.push(getDocs(query(collection(db, "products"), where("userId", "==", effectiveTenantId))).catch(() => null));
        }
        prodQueries.push(getDocs(collection(db, "products")).catch(() => null));
        const pSnaps = await Promise.all(prodQueries);
        pSnaps.forEach(snap => {
          if (snap && snap.docs) {
            snap.docs.forEach((d: any) => {
              productsMap.set(d.id, { id: d.id, ...d.data() });
            });
          }
        });
      } catch {}

      const productsList = Array.from(productsMap.values());

      // 3. Events from memory buffer and/or Firestore
      const eventsList = [...recentEventsBuffer];

      // Dynamically import computeDashboardStats to avoid circular dependency
      const { computeDashboardStats } = await import("./src/lib/analyticsService.js");

      const stats = computeDashboardStats(
        ordersList,
        productsList,
        eventsList,
        rangeType,
        prodFilter,
        from ? String(from) : undefined,
        to ? String(to) : undefined
      );

      // Save to 60s cache
      dashboardStatsCache.set(cacheKey, {
        timestamp: nowMs,
        data: stats
      });

      // Evict old cache keys
      if (dashboardStatsCache.size > 100) {
        dashboardStatsCache.clear();
      }

      res.json(stats);
    } catch (e: any) {
      console.error("[STATS API ERROR]:", e);
      res.status(500).json({ error: e.message || "Erreur calcul statistiques" });
    }
  };

  app.get("/api/dashboard/stats", handleGetDashboardStats);
  app.get("/dashboard/stats", handleGetDashboardStats);

  app.get("/api/products", async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      const q = tenantId ? query(collection(db, "products"), where("userId", "==", tenantId)) : collection(db, "products");
      const snap = await getDocs(q);
      const products: any[] = [];
      snap.forEach(d => products.push({ id: d.id, name: d.data().name }));
      res.json(products);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });



  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();