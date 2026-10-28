import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff, Phone, MessageSquare } from "lucide-react";
import { GoogleIcon } from "./Login";
import { auth, googleProvider, db } from "../../lib/firebase";
import { signInWithPopup, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { checkTenantAndRedirect } from "../../lib/checkTenant";
import { cleanAndLimitPhone, getPhoneMaxLength, validatePhoneNumber } from "../../lib/phoneUtils";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      const result = await signInWithPopup(auth, googleProvider);
      if (result && result.user) {
        await checkTenantAndRedirect(result.user, navigate);
      }
    } catch (err: any) {
      console.warn("Google registration error:", err);
      if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
        return;
      }
      
      if (err?.code === "auth/popup-blocked") {
        setError("La fenêtre d'inscription a été bloquée par le navigateur. Veuillez autoriser les fenêtres pop-up ou ouvrir l'application dans un nouvel onglet.");
      } else if (err?.code === "auth/configuration-not-found" || err?.code === "auth/operation-not-allowed") {
        setError("L'authentification Google n'est pas encore activée dans votre projet Firebase 'e-nova-119f6'. Activez 'Google' dans la console Firebase (Authentication > Mode de connexion), ou inscrivez-vous avec votre email ci-dessous.");
      } else if (err?.code === "auth/unauthorized-domain") {
        setError(`Le domaine actuel (${window.location.hostname}) n'est pas autorisé dans Firebase Auth. Veuillez ajouter ce domaine aux 'Domaines autorisés' dans Firebase Console (Authentication > Settings), ou vous inscrire avec votre email ci-dessous.`);
      } else {
        const errorDetail = err?.message ? ` (${err.message})` : "";
        setError(`Erreur lors de l'inscription avec Google${errorDetail}. Veuillez réessayer ou utiliser le formulaire d'inscription.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Veuillez renseigner votre adresse e-mail.");
      return;
    }

    const phoneValidation = validatePhoneNumber(phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || "Numéro de téléphone ou WhatsApp invalide.");
      return;
    }
    setPhoneError("");

    if (password.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        if (fullName.trim()) {
          await updateProfile(userCredential.user, { displayName: fullName.trim() });
        }

        // Save phone/WhatsApp & email in user & tenant profiles
        try {
          const uid = userCredential.user.uid;
          localStorage.setItem("dzbuild_user_phone", phone);
          localStorage.setItem("dzbuild_user_whatsapp", phone);
          
          await setDoc(doc(db, "users", uid), {
            uid,
            email: email.trim().toLowerCase(),
            displayName: fullName.trim() || email.split("@")[0],
            phone: phone.trim(),
            whatsapp: phone.trim(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });

          await setDoc(doc(db, "tenants", uid), {
            ownerEmail: email.trim().toLowerCase(),
            ownerPhone: phone.trim(),
            ownerWhatsApp: phone.trim(),
            ownerName: fullName.trim() || email.split("@")[0],
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (dbErr) {
          console.warn("User profile background save:", dbErr);
        }
      }
      await checkTenantAndRedirect(userCredential.user, navigate);
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Cette adresse e-mail est déjà utilisée. Veuillez vous connecter.");
      } else if (err.code === "auth/invalid-email") {
        setError("Adresse e-mail invalide.");
      } else if (err.code === "auth/weak-password") {
        setError("Le mot de passe est trop faible.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("L'inscription par e-mail n'est pas activée dans Firebase.");
      } else {
        setError(err.message || "Une erreur est survenue lors de la création du compte.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] bg-[#1a1a1f] rounded-[24px] p-10 shadow-2xl border border-neutral-800/50 my-8">
      <div className="flex justify-center mb-6">
        <img src="/logo.png" alt="E nova" className="h-14 w-auto max-w-[200px] object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
      </div>
      <h1 className="text-[30px] font-semibold text-white mb-2 text-center tracking-tight">Créez votre site web</h1>
      <p className="text-neutral-400 text-sm text-center mb-8">Inscrivez-vous en quelques secondes</p>
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm leading-relaxed">
          {error}
        </div>
      )}

      {/* Bouton Google */}
      <div className="mb-6">
        <button 
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-full border border-neutral-700 bg-[#16161a] text-sm font-medium text-white hover:bg-neutral-800 hover:border-neutral-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
          <span>S'inscrire avec Google</span>
        </button>
      </div>

      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-800"></div>
        </div>
        <div className="relative bg-[#1a1a1f] px-4 text-xs font-medium text-neutral-400">ou avec email</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Nom complet (facultatif)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-[#16161a] border border-neutral-700 rounded-full px-5 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors"
          />
        </div>

        <div>
          <input
            type="email"
            placeholder="Adresse e-mail *"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#16161a] border border-neutral-700 rounded-full px-5 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors"
          />
        </div>

        <div>
          <div className="relative">
            <input
              type="tel"
              placeholder="Numéro de téléphone ou WhatsApp *"
              required
              maxLength={getPhoneMaxLength(phone)}
              value={phone}
              onChange={(e) => {
                const cleaned = cleanAndLimitPhone(e.target.value);
                setPhone(cleaned);
                if (phoneError) setPhoneError("");
              }}
              className={`w-full bg-[#16161a] border rounded-full px-5 py-3.5 pl-12 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 transition-colors ${
                phoneError ? "border-red-500 focus:ring-red-500" : "border-neutral-700 focus:border-neutral-500 focus:ring-neutral-500"
              }`}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-400">
              <Phone className="w-4 h-4 text-neutral-400" />
            </div>
          </div>
          {phoneError ? (
            <p className="text-xs text-red-400 mt-1.5 px-3">{phoneError}</p>
          ) : (
            <p className="text-[11px] text-neutral-500 mt-1 px-3">Ex: 0550252565 (10 chiffres) pour recevoir vos notifications</p>
          )}
        </div>

        <div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe (min 6 car.) *"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#16161a] border border-neutral-700 rounded-full px-5 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors p-1"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Mock reCAPTCHA */}
        <div className="flex items-center gap-3 p-3.5 bg-[#16161a] border border-neutral-700 rounded-xl mt-2">
          <input 
            type="checkbox" 
            id="robot_reg"
            required
            className="w-4 h-4 rounded bg-transparent border-neutral-600 text-[#FBA707] focus:ring-[#FBA707] focus:ring-offset-[#16161a]"
          />
          <label htmlFor="robot_reg" className="text-sm font-medium text-white select-none">
            Pas un robot
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center bg-[#FBA707] text-black font-semibold rounded-full py-3.5 mt-4 hover:bg-[#e59806] transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Créer mon compte"}
        </button>
      </form>

      <div className="text-center mt-6">
        <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
          En continuant vous acceptez les <a href="#" className="underline hover:text-white transition-colors">conditions</a> et la <a href="#" className="underline hover:text-white transition-colors">politique de confidentialité</a>.
        </p>
        <p className="text-sm text-neutral-400 mt-6">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-[#FBA707] font-medium hover:text-[#e59806] underline-offset-2 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
