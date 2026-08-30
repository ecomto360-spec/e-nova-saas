import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { GoogleIcon } from "./Login";
import { auth, googleProvider } from "../../lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { checkTenantAndRedirect } from "../../lib/checkTenant";

export default function Register() {
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
        setError("Inscription annulée.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("La connexion Google n'est pas activée. Veuillez l'activer dans la console Firebase.");
      } else {
        setError("Erreur lors de l'inscription avec Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] bg-[#1e1e24] rounded-[24px] p-10 shadow-2xl border border-neutral-800/50 my-8">
      <div className="flex justify-center mb-6">
        <img src="/logo.png" alt="E nova" className="h-14 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />
      </div>
      <h1 className="text-3xl font-semibold text-white mb-8 text-center">Créez votre site web</h1>
      
      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 mb-6">
        <button 
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-neutral-700 bg-transparent text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
          S'inscrire avec Google
        </button>
      </div>

      <div className="text-center mt-6">
        <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
          En continuant vous acceptez les <a href="#" className="underline hover:text-white transition-colors">conditions</a> et la <a href="#" className="underline hover:text-white transition-colors">politique de confidentialité</a>.
        </p>
        <p className="text-sm text-neutral-400 mt-6">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-yellow-500 font-medium hover:text-yellow-400 underline-offset-2 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
