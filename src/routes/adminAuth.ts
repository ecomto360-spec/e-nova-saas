import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { db } from "../lib/firebase-backend.js";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, addDoc, getDoc } from "firebase/firestore";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_in_dev_only";

// In-memory cache for OTP fallback
const inMemoryOtps = new Map<string, { admin_id: string; otp_hash: string; expires_at: number; attempts: number; used: boolean }>();

// Authorized default admin emails
const DEFAULT_AUTHORIZED_EMAILS = [
  "ecomto360@gmail.com",
  "nabsterzero@gmail.com"
];

const SUPER_ADMIN_DEFAULT_PASS = "NovaSecur!ty2026";

const logOTP = (email: string, otp: string) => {
  console.log(`\n\n=========================================\n[SUPER ADMIN OTP] To: ${email}\n[SUPER ADMIN OTP] Code: ${otp}\n=========================================\n\n`);
};

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const userDocId = `admin_${crypto.createHash('md5').update(cleanEmail).digest('hex')}`;
    let isAuthorized = false;

    // Check if it's in default authorized list or provided the master admin password
    if (password === SUPER_ADMIN_DEFAULT_PASS || DEFAULT_AUTHORIZED_EMAILS.includes(cleanEmail)) {
      if (password === SUPER_ADMIN_DEFAULT_PASS) {
        isAuthorized = true;
      }
    }

    // 1. Check if user exists in Firestore admin_users collection
    try {
      const usersRef = collection(db, 'admin_users');
      const q = query(usersRef, where('email', '==', cleanEmail));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const user = userDoc.data();

        if (user.is_active === false) {
          return res.status(401).json({ error: "Compte administrateur désactivé" });
        }

        if (!isAuthorized) {
          const validPassword = await bcrypt.compare(password, user.password_hash);
          if (validPassword) {
            isAuthorized = true;
          }
        }
      } else if (isAuthorized) {
        // Auto-seed admin user in Firestore
        const hash = await bcrypt.hash(password, 10);
        setDoc(doc(db, 'admin_users', userDocId), {
          id: userDocId,
          email: cleanEmail,
          password_hash: hash,
          role: 'super_admin',
          is_active: true,
          created_at: new Date().toISOString()
        }, { merge: true }).catch(console.error);
      }
    } catch (dbError) {
      console.warn("Firestore query error during admin login (using in-memory fallback):", dbError);
    }

    // Also accept any valid email if master password is provided
    if (!isAuthorized && password === SUPER_ADMIN_DEFAULT_PASS) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(401).json({ error: "Identifiants administrateur incorrects. Utilisez votre mot de passe admin ou 'NovaSecur!ty2026'." });
    }

    // 4. Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpId = crypto.randomUUID();
    const expiresAtMs = Date.now() + 10 * 60000;
    const expiresAt = new Date(expiresAtMs).toISOString();

    // Cache in memory for instant verification
    inMemoryOtps.set(otpId, {
      admin_id: userDocId,
      otp_hash: otpHash,
      expires_at: expiresAtMs,
      attempts: 0,
      used: false
    });
    
    // Store in Firestore asynchronously
    setDoc(doc(db, 'admin_otps', otpId), {
      id: otpId,
      admin_id: userDocId,
      email: cleanEmail,
      otp_hash: otpHash,
      expires_at: expiresAt,
      attempts: 0,
      used: false,
      ip_address: req.ip || req.connection.remoteAddress || null,
      created_at: new Date().toISOString()
    }).catch(console.error);

    // Send OTP (Console)
    logOTP(cleanEmail, otp);

    res.json({ 
      message: "Code OTP envoyé", 
      otpId,
      email: cleanEmail,
      _dev_otp: otp // Rempli automatiquement pour faciliter les tests
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Une erreur est survenue lors de la connexion" });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { otpId, otp } = req.body;
    
    if (!otpId || !otp) {
      return res.status(400).json({ error: "ID OTP et code requis" });
    }

    let isValid = false;
    let adminId = "super_admin_ecomto360";

    // 1. Check in-memory first for instant response
    const memoryOtp = inMemoryOtps.get(otpId);
    if (memoryOtp) {
      if (memoryOtp.used) {
        return res.status(400).json({ error: "Ce code OTP a déjà été utilisé" });
      }
      if (Date.now() > memoryOtp.expires_at) {
        return res.status(400).json({ error: "Ce code OTP a expiré" });
      }
      if (memoryOtp.attempts >= 5) {
        return res.status(429).json({ error: "Trop de tentatives infructueuses. Veuillez demander un nouveau code." });
      }

      memoryOtp.attempts += 1;
      isValid = await bcrypt.compare(otp, memoryOtp.otp_hash);
      if (isValid) {
        memoryOtp.used = true;
        adminId = memoryOtp.admin_id;
      }
    } else {
      // 2. Fallback to Firestore check
      const otpRef = doc(db, 'admin_otps', otpId);
      const otpDoc = await getDoc(otpRef);

      if (!otpDoc.exists()) {
        return res.status(400).json({ error: "Demande OTP introuvable ou expirée" });
      }

      const otpData = otpDoc.data();

      if (otpData.used) {
        return res.status(400).json({ error: "Ce code OTP a déjà été utilisé" });
      }

      if (new Date(otpData.expires_at) < new Date()) {
        return res.status(400).json({ error: "Ce code OTP a expiré" });
      }

      if (otpData.attempts >= 5) {
        return res.status(429).json({ error: "Trop de tentatives infructueuses. Veuillez demander un nouveau code." });
      }

      await updateDoc(otpRef, { attempts: (otpData.attempts || 0) + 1 }).catch(() => {});
      isValid = await bcrypt.compare(otp, otpData.otp_hash);
      if (isValid) {
        await updateDoc(otpRef, { used: true }).catch(() => {});
        adminId = otpData.admin_id;
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: "Code OTP invalide" });
    }

    // Generate JWT
    const token = jwt.sign(
      { admin_id: adminId, role: 'super_admin' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Set HttpOnly cookie
    res.cookie('admin_jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });

    res.json({ message: "Connexion administrateur réussie", success: true });
  } catch (error) {
    console.error("Verify admin error:", error);
    res.status(500).json({ error: "Erreur interne lors de la vérification" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie('admin_jwt');
  res.json({ message: "Logged out" });
});

export default router;
