import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError("Une erreur est survenue. Vérifiez l'adresse email et réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] bg-[#1e1e24] rounded-[24px] p-10 shadow-2xl border border-neutral-800/50">
      <h1 className="text-3xl font-semibold text-white mb-8">Réinitialisation</h1>
      
      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
          {error}
        </div>
      )}

      {success ? (
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-neutral-300">
            Un email de réinitialisation a été envoyé à <br/>
            <span className="font-semibold text-white">{email}</span>
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-yellow-500 text-black font-semibold rounded-xl py-3.5 mt-4 hover:bg-yellow-400 transition-colors"
          >
            Retour à la connexion
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Adresse email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#16161a] border border-neutral-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors"
            />
          </div>

          {/* Mock reCAPTCHA */}
          <div className="flex items-center gap-3 p-3 bg-[#16161a] border border-neutral-700 rounded-xl">
            <input 
              type="checkbox" 
              id="robot_reset"
              required
              className="w-5 h-5 rounded bg-transparent border-neutral-600 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-[#16161a]"
            />
            <label htmlFor="robot_reset" className="text-sm font-medium text-white select-none">
              Pas un robot
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center bg-yellow-500 text-black font-semibold rounded-xl py-3.5 hover:bg-yellow-400 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Envoyer le lien"}
          </button>
        </form>
      )}

      {!success && (
        <div className="text-center mt-8">
          <Link to="/login" className="text-sm text-yellow-500 font-medium hover:text-yellow-400 underline-offset-2 hover:underline">
            Retour à la connexion
          </Link>
        </div>
      )}
    </div>
  );
}
