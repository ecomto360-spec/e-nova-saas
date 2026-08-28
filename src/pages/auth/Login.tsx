import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { auth, googleProvider } from "../../lib/firebase";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { checkTenantAndRedirect } from "../../lib/checkTenant";

export const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      const result = await signInWithPopup(auth, googleProvider);
      await checkTenantAndRedirect(result.user, navigate);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        setError("Connexion annulée.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("La connexion Google n'est pas activée. Veuillez l'activer dans la console Firebase.");
      } else {
        setError("Erreur lors de la connexion avec Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await checkTenantAndRedirect(result.user, navigate);
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Identifiants incorrects. Ce compte n'existe pas ou le mot de passe est faux.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("L'authentification par email n'est pas activée dans Firebase.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Trop de tentatives infructueuses. Veuillez réessayer plus tard.");
      } else {
        setError(err.message || "Une erreur est survenue lors de la connexion.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] bg-[#1a1a1f] rounded-[24px] p-10 shadow-2xl border border-neutral-800/50">
      <h1 className="text-[32px] font-semibold text-white mb-8 tracking-tight">Bon retour !</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col gap-3">
          <span className="text-red-500 text-sm leading-relaxed">{error}</span>
        </div>
      )}

      {/* Bouton Google */}
      <div className="mb-6">
        <button 
          onClick={handleGoogleLogin}
          type="button"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-full border border-neutral-700 bg-[#16161a] text-sm font-medium text-white hover:bg-neutral-800 hover:border-neutral-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
        >
          <GoogleIcon />
          <span>Continuer avec Google</span>
        </button>
      </div>

      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-800"></div>
        </div>
        <div className="relative bg-[#1a1a1f] px-4 text-xs font-medium text-neutral-400">ou avec email</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <input
            type="email"
            placeholder="Adresse e-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#16161a] border border-neutral-700 rounded-full px-5 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors"
          />
        </div>
        <div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
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
          <div className="flex justify-end mt-3">
            <Link to="/forgot-password" className="text-xs text-[#FBA707] hover:text-[#e59806] hover:underline underline-offset-2 transition-colors">
              Mot de passe oublié ?
            </Link>
          </div>
        </div>

        {/* Mock reCAPTCHA */}
        <div className="flex items-center gap-3 p-3.5 bg-[#16161a] border border-neutral-700 rounded-xl">
          <input 
            type="checkbox" 
            id="robot"
            required
            className="w-4 h-4 rounded bg-transparent border-neutral-600 text-[#FBA707] focus:ring-[#FBA707] focus:ring-offset-[#16161a]"
          />
          <label htmlFor="robot" className="text-sm font-medium text-white select-none">
            Pas un robot
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center bg-[#FBA707] text-black font-semibold rounded-full py-3.5 mt-2 hover:bg-[#e59806] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Se connecter"}
        </button>
      </form>

      <p className="text-center text-sm text-white mt-8">
        Vous n'avez pas de compte ?{" "}
        <Link to="/register" className="text-[#FBA707] font-medium hover:text-[#e59806] hover:underline underline-offset-2 transition-colors">
          Inscrivez-vous gratuitement
        </Link>
      </p>
    </div>
  );
}
