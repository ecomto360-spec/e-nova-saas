import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { db } from "../lib/firebase-backend.js";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, addDoc, getDoc } from "firebase/firestore";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_in_dev_only";

// In production, we'd use SendGrid or Nodemailer. For this environment, 
// we will simulate the email and return the OTP in the response (dev mode only)
// or just log it to the console.
const logOTP = (email: string, otp: string) => {
  console.log(`\n\n[MOCK EMAIL] To: ${email}\n[MOCK EMAIL] Subject: Your Admin Dashboard OTP\n[MOCK EMAIL] Code: ${otp}\n\n`);
};

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // 1. Check if user exists
    const usersRef = collection(db, 'admin_users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    if (!user.is_active) {
      return res.status(401).json({ error: "Account disabled" });
    }

    // 2. Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 3. Rate limiting (max 1 request per 60s)
    const otpsRef = collection(db, 'admin_otps');
    const recentOtpsQuery = query(
      otpsRef, 
      where('admin_id', '==', userDoc.id),
      where('created_at', '>=', new Date(Date.now() - 60000).toISOString())
    );
    const recentOtps = await getDocs(recentOtpsQuery);
      
    if (!recentOtps.empty) {
      return res.status(429).json({ error: "Please wait 60 seconds before requesting another code" });
    }

    // 4. Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    
    // 5. Store OTP (TTL 10 mins)
    const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();
    const otpId = crypto.randomUUID();
    
    await setDoc(doc(db, 'admin_otps', otpId), {
      id: otpId,
      admin_id: userDoc.id,
      otp_hash: otpHash,
      expires_at: expiresAt,
      attempts: 0,
      used: false,
      ip_address: req.ip || req.connection.remoteAddress || null,
      created_at: new Date().toISOString()
    });

    // 6. Send OTP (Simulated)
    logOTP(email, otp);

    res.json({ 
      message: "OTP sent", 
      otpId,
      _dev_otp: otp // TEMPORARY FOR DEMO 
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { otpId, otp } = req.body;
    
    if (!otpId || !otp) {
      return res.status(400).json({ error: "OTP ID and code required" });
    }

    const otpRef = doc(db, 'admin_otps', otpId);
    const otpDoc = await getDoc(otpRef);

    if (!otpDoc.exists()) {
      return res.status(400).json({ error: "Invalid OTP request" });
    }

    const otpData = otpDoc.data();

    if (otpData.used) {
      return res.status(400).json({ error: "OTP already used" });
    }

    if (new Date(otpData.expires_at) < new Date()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    if (otpData.attempts >= 3) {
      return res.status(429).json({ error: "Too many failed attempts. Request a new code." });
    }

    // Increment attempt
    await updateDoc(otpRef, { attempts: otpData.attempts + 1 });

    const isValid = await bcrypt.compare(otp, otpData.otp_hash);

    // Audit log
    await addDoc(collection(db, 'admin_audit_logs'), {
      id: crypto.randomUUID(),
      admin_id: otpData.admin_id,
      action: isValid ? 'login_success' : 'login_failed',
      target_type: 'auth',
      ip_address: req.ip || req.connection.remoteAddress || null,
      created_at: new Date().toISOString()
    });

    if (!isValid) {
      return res.status(401).json({ error: "Invalid OTP" });
    }

    // Mark used
    await updateDoc(otpRef, { used: true });

    // Update last login
    await updateDoc(doc(db, 'admin_users', otpData.admin_id), {
      last_login: new Date().toISOString()
    });

    // Generate JWT
    const token = jwt.sign(
      { admin_id: otpData.admin_id, role: 'super_admin' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Set HttpOnly cookie
    res.cookie('admin_jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });

    res.json({ message: "Login successful" });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie('admin_jwt');
  res.json({ message: "Logged out" });
});

export default router;
