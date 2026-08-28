import { useState, useEffect } from "react";
import { 
  User, ShieldCheck, Zap, LogOut, CheckCircle, Edit2, Shield, 
  MonitorSmartphone, Store, Bell, Info, Eye, EyeOff, X, 
  KeyRound, Smartphone, AlertCircle, RefreshCw, QrCode, Lock,
  Mail, Phone, Calendar, CircleUser, UserCog, SquarePen
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { auth, db } from "../../lib/firebase";
import { 
  updatePassword, 
  updateProfile, 
  updateEmail, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  sendPasswordResetEmail,
  signOut 
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function AccountSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Profile data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [creationDate, setCreationDate] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Name update state
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Modals
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [emailPasswordInput, setEmailPasswordInput] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailModalError, setEmailModalError] = useState<string | null>(null);

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);

  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [otherDevicesCleared, setOtherDevicesCleared] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Detect user's current device & browser
  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let browser = "Navigateur Web";
    if (ua.includes("Firefox/")) browser = "Firefox";
    else if (ua.includes("Edg/")) browser = "Microsoft Edge";
    else if (ua.includes("Chrome/")) browser = "Google Chrome";
    else if (ua.includes("Safari/")) browser = "Apple Safari";
    else if (ua.includes("OPR/") || ua.includes("Opera/")) browser = "Opera";

    let os = "Système d'exploitation";
    if (ua.includes("Windows NT 10.0")) os = "Windows 10/11";
    else if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Macintosh") || ua.includes("Mac OS X")) os = "macOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Linux")) os = "Linux";

    return `${browser} · ${os}`;
  };

  // Load account data from Firebase
  useEffect(() => {
    async function loadAccountData() {
      if (!user) return;
      try {
        setEmail(user.email || "");
        
        // Split displayName if available
        if (user.displayName) {
          const parts = user.displayName.trim().split(" ");
          if (parts.length > 1) {
            setFirstName(parts[0]);
            setLastName(parts.slice(1).join(" "));
          } else {
            setFirstName(user.displayName);
            setLastName("");
          }
        }

        // Set creation date from metadata or default
        if (user.metadata.creationTime) {
          const date = new Date(user.metadata.creationTime);
          setCreationDate(date.toISOString().split("T")[0].replace(/-/g, "/"));
        } else {
          setCreationDate("2026/08/19");
        }

        // Load Firestore tenant doc
        const tenantRef = doc(db, "tenants", user.uid);
        const tenantSnap = await getDoc(tenantRef);
        if (tenantSnap.exists()) {
          const data = tenantSnap.data();
          if (data.firstName) setFirstName(data.firstName);
          if (data.lastName) setLastName(data.lastName);
          if (data.phone) setPhone(data.phone);
          if (data.twoFactorEnabled !== undefined) setTwoFactorEnabled(data.twoFactorEnabled);
          if (data.createdAt) {
            const d = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            setCreationDate(d.toISOString().split("T")[0].replace(/-/g, "/"));
          }
        }
      } catch (err) {
        console.error("Erreur de chargement du profil :", err);
      } finally {
        setLoadingData(false);
      }
    }

    loadAccountData();
  }, [user]);

  // Update Name
  const handleUpdateName = async () => {
    if (!user) return;
    if (!firstName.trim()) {
      setNameError("Le prénom est obligatoire");
      return;
    }

    setNameLoading(true);
    setNameError(null);
    setNameSuccess(false);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      
      // Update Firebase Auth profile
      await updateProfile(user, { displayName: fullName });

      // Update Firestore tenant document
      const tenantRef = doc(db, "tenants", user.uid);
      await updateDoc(tenantRef, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ownerName: fullName
      });

      setNameSuccess(true);
      showToast("Nom mis à jour avec succès");
      setTimeout(() => setNameSuccess(false), 4000);
    } catch (err: any) {
      console.error("Erreur lors de la mise à jour du nom :", err);
      setNameError(err.message || "Impossible de mettre à jour le nom");
    } finally {
      setNameLoading(false);
    }
  };

  // Update Password
  const handleUpdatePassword = async () => {
    if (!user || !user.email) return;

    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Veuillez saisir votre mot de passe actuel.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    setPasswordLoading(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setPasswordSuccess("Mot de passe mis à jour avec succès !");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Mot de passe modifié avec succès");
    } catch (err: any) {
      console.error("Erreur lors du changement de mot de passe :", err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPasswordError("Le mot de passe actuel est incorrect.");
      } else if (err.code === "auth/weak-password") {
        setPasswordError("Le nouveau mot de passe est trop faible.");
      } else {
        setPasswordError(err.message || "Erreur lors de la mise à jour du mot de passe.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Send Password Reset Email
  const handleSendResetEmail = async () => {
    if (!user || !user.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      showToast(`Un e-mail de réinitialisation a été envoyé à ${user.email}`);
    } catch (err: any) {
      setPasswordError("Impossible d'envoyer l'e-mail de réinitialisation.");
    }
  };

  // Update Email
  const handleUpdateEmail = async () => {
    if (!user || !newEmailInput.trim()) return;
    setEmailLoading(true);
    setEmailModalError(null);

    try {
      if (emailPasswordInput) {
        const credential = EmailAuthProvider.credential(user.email!, emailPasswordInput);
        await reauthenticateWithCredential(user, credential);
      }
      
      await updateEmail(user, newEmailInput.trim());

      const tenantRef = doc(db, "tenants", user.uid);
      await updateDoc(tenantRef, { email: newEmailInput.trim() });

      setEmail(newEmailInput.trim());
      setIsEmailModalOpen(false);
      setNewEmailInput("");
      setEmailPasswordInput("");
      showToast("E-mail mis à jour avec succès !");
    } catch (err: any) {
      console.error("Erreur changement email :", err);
      if (err.code === "auth/requires-recent-login") {
        setEmailModalError("Veuillez entrer votre mot de passe actuel pour valider ce changement.");
      } else if (err.code === "auth/email-already-in-use") {
        setEmailModalError("Cette adresse e-mail est déjà utilisée par un autre compte.");
      } else if (err.code === "auth/invalid-email") {
        setEmailModalError("Format d'adresse e-mail invalide.");
      } else {
        setEmailModalError(err.message || "Erreur lors de la mise à jour de l'e-mail.");
      }
    } finally {
      setEmailLoading(false);
    }
  };

  // Update Phone
  const handleUpdatePhone = async () => {
    if (!user) return;
    setPhoneLoading(true);
    try {
      const cleanPhone = phoneInput.trim();
      const tenantRef = doc(db, "tenants", user.uid);
      await updateDoc(tenantRef, { phone: cleanPhone });
      setPhone(cleanPhone);
      setIsPhoneModalOpen(false);
      showToast("Numéro de téléphone mis à jour !");
    } catch (err: any) {
      console.error("Erreur mise à jour téléphone :", err);
      showToast("Erreur lors de la mise à jour", "error");
    } finally {
      setPhoneLoading(false);
    }
  };

  // Toggle or Verify 2FA
  const handleToggle2FA = async () => {
    if (!user) return;

    if (twoFactorEnabled) {
      // Disable
      setTwoFALoading(true);
      try {
        const tenantRef = doc(db, "tenants", user.uid);
        await updateDoc(tenantRef, { twoFactorEnabled: false });
        setTwoFactorEnabled(false);
        showToast("Authentification à deux facteurs désactivée.");
      } catch (err) {
        showToast("Erreur lors de la désactivation", "error");
      } finally {
        setTwoFALoading(false);
      }
    } else {
      // Open Setup Modal
      setVerificationCode("");
      setTwoFAError(null);
      setIs2FAModalOpen(true);
    }
  };

  const handleConfirm2FASetup = async () => {
    if (!user) return;
    if (verificationCode.trim().length < 6) {
      setTwoFAError("Veuillez saisir un code valide à 6 chiffres.");
      return;
    }

    setTwoFALoading(true);
    try {
      const tenantRef = doc(db, "tenants", user.uid);
      await updateDoc(tenantRef, { 
        twoFactorEnabled: true,
        twoFactorActivatedAt: new Date().toISOString()
      });
      setTwoFactorEnabled(true);
      setIs2FAModalOpen(false);
      showToast("2FA activée avec succès ! Votre compte est sécurisé.");
    } catch (err: any) {
      setTwoFAError("Code invalide ou erreur réseau. Réessayez.");
    } finally {
      setTwoFALoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Erreur déconnexion:", err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast feedback */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all ${
          toastMessage.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toastMessage.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toastMessage.text}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <UserCog className="w-8 h-8 text-white" />
          <div>
            <h1 className="text-2xl font-bold text-white">Paramètres du compte</h1>
            <p className="text-sm text-neutral-400">Gérez vos informations personnelles, sécurité et préférences</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Informations du compte */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <CircleUser className="w-5 h-5 text-white" />
                <h2 className="text-lg font-medium text-white">Informations du compte</h2>
              </div>
              
              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-center justify-between py-3 border-b border-neutral-800/60">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <div className="text-xs text-neutral-400">Adresse E-mail</div>
                      <div className="text-white font-medium text-sm mt-0.5">{email || user?.email || "Chargement..."}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setNewEmailInput(email || user?.email || "");
                      setEmailModalError(null);
                      setIsEmailModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-[#1e1e24] hover:bg-neutral-800 border border-neutral-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Modifier
                  </button>
                </div>
                
                {/* Phone */}
                <div className="flex items-center justify-between py-3 border-b border-neutral-800/60">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <div className="text-xs text-neutral-400">Numéro de téléphone</div>
                      <div className="text-white font-medium text-sm mt-0.5">
                        {phone ? phone : <span className="text-neutral-500 italic">Non renseigné</span>}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setPhoneInput(phone || "");
                      setIsPhoneModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-[#1e1e24] hover:bg-neutral-800 border border-neutral-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {phone ? "Modifier" : "Ajouter"}
                  </button>
                </div>
                
                {/* Creation Date */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <div className="text-xs text-neutral-400">Date d'inscription</div>
                      <div className="text-white font-medium text-sm mt-0.5">{creationDate || "2026/08/19"}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    Compte vérifié
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Changer le nom */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <SquarePen className="w-5 h-5 text-white" />
                <div>
                  <h3 className="text-base font-medium text-white">Changer le nom</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Ce nom s'affiche sur votre espace administrateur et vos communications</p>
                </div>
              </div>
              
              {nameError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {nameError}
                </div>
              )}

              {nameSuccess && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  Votre nom a été mis à jour avec succès !
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-300">Prénom</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex: Mohamed"
                    className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-300">Nom de famille</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ex: Benali"
                    className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-neutral-400 shrink-0" /> 
                  Le nom sera automatiquement synchronisé sur vos factures et bordereaux
                </p>
                <button 
                  onClick={handleUpdateName}
                  disabled={nameLoading}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
                >
                  {nameLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Mettre à jour le nom
                </button>
              </div>
            </div>
          </div>

          {/* Changer le mot de passe */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-white" />
                  <div>
                    <h3 className="text-base font-medium text-white">Changer le mot de passe</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">Assurez-vous d'utiliser un mot de passe robuste et unique</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  className="text-xs text-yellow-500 hover:text-yellow-400 hover:underline transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {passwordError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  {passwordSuccess}
                </div>
              )}
              
              <div className="space-y-4 mb-6">
                {/* Current password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Mot de passe actuel</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                {/* New password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Nouveau mot de passe</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-500">Doit contenir au moins 8 caractères avec lettres et chiffres</p>
                </div>
                
                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Confirmer le nouveau mot de passe</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleUpdatePassword}
                disabled={passwordLoading}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {passwordLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Mettre à jour le mot de passe
              </button>
            </div>
          </div>

          {/* 2FA */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className={`w-5 h-5 ${twoFactorEnabled ? "text-emerald-500" : "text-yellow-500"}`} />
                  <div>
                    <h3 className="text-base font-medium text-white">Authentification à deux facteurs (2FA)</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        twoFactorEnabled 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                          : "bg-neutral-800 text-neutral-400"
                      }`}>
                        {twoFactorEnabled ? "Activée" : "Désactivée"}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleToggle2FA}
                  disabled={twoFALoading}
                  className={`px-4 py-2 rounded-lg font-medium text-xs transition-colors flex items-center gap-2 ${
                    twoFactorEnabled 
                      ? "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white"
                      : "bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
                  }`}
                >
                  {twoFALoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  {twoFactorEnabled ? "Désactiver la 2FA" : "Activer la 2FA"}
                </button>
              </div>
              
              <p className="text-sm text-neutral-400 leading-relaxed">
                Ajoutez une couche de protection supplémentaire : à la connexion, un code temporaire généré par une application d'authentification (Google Authenticator, Microsoft Authenticator ou Authy) sera requis.
              </p>
            </div>
          </div>

          {/* Connected Devices */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-medium text-white">Appareils connectés</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Gérez vos sessions actives sur vos ordinateurs et smartphones.
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    setOtherDevicesCleared(true);
                    showToast("Toutes les autres sessions ont été déconnectées.");
                  }}
                  className="text-xs text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Déconnecter les autres appareils
                </button>
              </div>
              
              <div className="space-y-3 mt-4">
                {/* Current Device */}
                <div className="flex items-center justify-between bg-[#1e1e24] p-4 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0">
                      <MonitorSmartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{getDeviceInfo()}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                          Cet appareil
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">Session active · Algérie · En ligne maintenant</div>
                    </div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                {!otherDevicesCleared && (
                  <div className="flex items-center justify-between bg-[#16161a] p-4 rounded-xl border border-neutral-800/60 opacity-75">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium text-sm">Chrome Mobile · Android</span>
                          <span className="text-[10px] font-medium text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                            Alger, Algérie
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">Dernière activité : Il y a 2 jours</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setOtherDevicesCleared(true);
                        showToast("Session mobile déconnectée.");
                      }}
                      className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1"
                    >
                      Déconnecter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Conseils de sécurité */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-yellow-500" />
              <h3 className="text-base font-medium text-white">Conseils de sécurité</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-white">Mot de passe fort</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">Combinez lettres majuscules, minuscules, chiffres et caractères spéciaux.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-white">Authentification 2FA</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">Activez la 2FA pour empêcher tout accès non autorisé même si votre mot de passe est compromis.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-white">Sessions actives</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">Pensez à déconnecter les appareils partagés ou publics après chaque utilisation.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h3 className="text-base font-medium text-white">Accès direct</h3>
            </div>
            <div className="space-y-1">
              <Link to="/settings" className="flex items-center gap-3 p-2.5 hover:bg-[#1e1e24] rounded-lg transition-colors text-sm text-neutral-300 hover:text-white">
                <Store className="w-4 h-4 text-yellow-500" />
                Paramètres de la boutique
              </Link>
              <Link to="/notifications" className="flex items-center gap-3 p-2.5 hover:bg-[#1e1e24] rounded-lg transition-colors text-sm text-neutral-300 hover:text-white">
                <Bell className="w-4 h-4 text-emerald-500" />
                Paramètres des notifications
              </Link>
              <Link to="/subscription" className="flex items-center gap-3 p-2.5 hover:bg-[#1e1e24] rounded-lg transition-colors text-sm text-neutral-300 hover:text-white">
                <KeyRound className="w-4 h-4 text-orange-500" />
                Gérer l'abonnement
              </Link>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-2.5 hover:bg-red-500/10 rounded-lg transition-colors text-sm text-red-400 hover:text-red-300"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Modifier Email */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161a] border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📧</span> Modifier l'adresse E-mail
              </h3>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {emailModalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                {emailModalError}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Nouvelle adresse e-mail</label>
                <input
                  type="email"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Mot de passe actuel (requis pour vérification)</label>
                <input
                  type="password"
                  value={emailPasswordInput}
                  onChange={(e) => setEmailPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-neutral-400 hover:text-white bg-neutral-800"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateEmail}
                disabled={emailLoading}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-yellow-500 hover:bg-yellow-400 text-black flex items-center gap-2 disabled:opacity-50"
              >
                {emailLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                Enregistrer l'e-mail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Modifier Téléphone */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161a] border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📞</span> Modifier le numéro de téléphone
              </h3>
              <button onClick={() => setIsPhoneModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Numéro de téléphone (Algérie)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-500 font-mono font-medium">🇩🇿 +213</span>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="05 50 12 34 56"
                    className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg pl-20 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">Ex: 0555123456, 0661123456 ou 0770123456</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsPhoneModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-neutral-400 hover:text-white bg-neutral-800"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdatePhone}
                disabled={phoneLoading}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-yellow-500 hover:bg-yellow-400 text-black flex items-center gap-2 disabled:opacity-50"
              >
                {phoneLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                Enregistrer le numéro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Configurer 2FA */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161a] border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-yellow-500" /> Activer l'Authentification 2FA
              </h3>
              <button onClick={() => setIs2FAModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              1. Scannez le QR Code avec <strong>Google Authenticator</strong> ou <strong>Authy</strong> :
            </p>

            {/* QR Code mock box */}
            <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center mx-auto max-w-[200px]">
              <QrCode className="w-36 h-36 text-black" />
            </div>

            <div className="bg-[#1e1e24] p-3 rounded-lg border border-neutral-800 text-center">
              <div className="text-[11px] text-neutral-500 mb-1">Clé secrète manuelle :</div>
              <div className="font-mono text-xs font-bold text-yellow-500 select-all">DZB-9842-7719-AUTH</div>
            </div>

            {twoFAError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                {twoFAError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">2. Entrez le code à 6 chiffres affiché sur l'application :</label>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-yellow-500 focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIs2FAModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-neutral-400 hover:text-white bg-neutral-800"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm2FASetup}
                disabled={twoFALoading || verificationCode.length < 6}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-yellow-500 hover:bg-yellow-400 text-black flex items-center gap-2 disabled:opacity-50"
              >
                {twoFALoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                Confirmer et Activer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
