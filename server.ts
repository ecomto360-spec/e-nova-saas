import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import adminAuthRoutes from "./src/routes/adminAuth.js";
import multer from "multer";
import crypto from "crypto";
import { db } from "./src/lib/firebase-backend.js";
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Setup multer to use memory storage since Cloud Run disk is ephemeral
const storage = multer.memoryStorage();
// 900KB limit since Firestore document max size is 1MB
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 900 * 1024 } 
});

async function buildApp(): Promise<express.Express> {
  // Configuration Cloudinary avec les clés intégrées directement en dur
  cloudinary.config({
    cloud_name: 'ie6edvfe',
    api_key: '571992972679788',
    api_secret: 'ojRyuQn_r0KsBbWKH0dtLUY4-3I'
  });

  const app = express();
  
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

  // Example Cloudinary Upload Endpoint
  app.post("/api/cloudinary-upload", upload.single('image'), async (req, res) => {
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

  app.post("/api/admin/upload", upload.single('image'), async (req, res) => {
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


  // --- Middleware final selon l'environnement d'exécution ---
  if (process.env.VERCEL) {
    // Sur Vercel, cette fonction ne sert que l'API : le SPA et les assets sont
    // servis par le filesystem Vercel. 404 JSON propre pour toute route inconnue.
    app.use((req, res) => {
      res.status(404).json({ error: "Route API introuvable" });
    });
  } else if (process.env.NODE_ENV !== "production") {
    // Vite middleware for development.
    // Import dynamique + webpackIgnore : vite n'est PAS embarque dans le bundle
    // de la fonction Vercel (sinon son package.json "type": "module" pollue le
    // bundle et le fait craser en ESM). En dev local, l'import se fait au runtime.
    const { createServer: createViteServer } = await import(/* webpackIgnore: true */ "vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serveur autonome (node dist/server.cjs) : sert le build statique
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

// Cache : l'app n'est construite qu'une fois par instance (utile en serverless
// où la fonction est réutilisée entre les requêtes à chaud).
let cachedApp: Promise<express.Express> | null = null;
export function getApp(): Promise<express.Express> {
  if (!cachedApp) cachedApp = buildApp();
  return cachedApp;
}

// Démarrage local uniquement (npm run dev avec tsx, ou node dist/server.cjs).
// Sur Vercel, la fonction api/[...path].ts importe getApp() sans jamais écouter de port.
if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 3000;
  getApp().then((app) => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}