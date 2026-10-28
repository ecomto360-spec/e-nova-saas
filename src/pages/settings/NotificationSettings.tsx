import { useState, useEffect } from "react";
import { 
  Bell, Mail, Send, MessageSquare, AlertTriangle, 
  MonitorSmartphone, PlayCircle, ExternalLink, CheckCircle, 
  RefreshCw, AlertCircle 
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { cleanAndLimitPhone, getPhoneMaxLength, validatePhoneNumber } from "../../lib/phoneUtils";

export default function NotificationSettings() {
  const { user } = useAuth();
  const [browserNotifications, setBrowserNotifications] = useState(true);
  
  // Real tenant notification settings
  const [notifEmail, setNotifEmail] = useState("");
  const [notifWhatsapp, setNotifWhatsapp] = useState("");
  const [notifyEmailEnabled, setNotifyEmailEnabled] = useState(true);
  const [notifyWhatsappEnabled, setNotifyWhatsappEnabled] = useState(true);
  const [callmebotApiKey, setCallmebotApiKey] = useState("");
  
  const [newOrderAlert, setNewOrderAlert] = useState(true);
  const [orderStatusAlert, setOrderStatusAlert] = useState(false);
  const [telegramNotifications, setTelegramNotifications] = useState(false);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    if (!user) return;
    setNotifEmail(user.email || "");

    const loadSettings = async () => {
      try {
        const tenantSnap = await getDoc(doc(db, "tenants", user.uid));
        if (tenantSnap.exists()) {
          const data = tenantSnap.data();
          if (data.notificationEmail) setNotifEmail(data.notificationEmail);
          if (data.notificationWhatsapp) setNotifWhatsapp(data.notificationWhatsapp);
          else if (data.phone) setNotifWhatsapp(data.phone);
          if (data.notifyEmailEnabled !== undefined) setNotifyEmailEnabled(data.notifyEmailEnabled);
          if (data.notifyWhatsappEnabled !== undefined) setNotifyWhatsappEnabled(data.notifyWhatsappEnabled);
          if (data.callmebotApiKey) setCallmebotApiKey(data.callmebotApiKey);
        }

        const settingsSnap = await getDoc(doc(db, "tenants", user.uid, "settings", "notifications"));
        if (settingsSnap.exists()) {
          const sData = settingsSnap.data();
          if (sData.notificationEmail) setNotifEmail(sData.notificationEmail);
          if (sData.notificationWhatsapp) setNotifWhatsapp(sData.notificationWhatsapp);
          if (sData.notifyEmailEnabled !== undefined) setNotifyEmailEnabled(sData.notifyEmailEnabled);
          if (sData.notifyWhatsappEnabled !== undefined) setNotifyWhatsappEnabled(sData.notifyWhatsappEnabled);
          if (sData.callmebotApiKey) setCallmebotApiKey(sData.callmebotApiKey);
        }
      } catch (err) {
        console.warn("Could not load notification settings:", err);
      }
    };

    loadSettings();
  }, [user]);

  const handleSaveSettings = async () => {
    if (!user) return;

    if (notifWhatsapp.trim()) {
      const val = validatePhoneNumber(notifWhatsapp);
      if (!val.isValid) {
        showToast(val.error || "Numéro WhatsApp invalide", "error");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        notificationEmail: notifEmail.trim() || user.email || "",
        notificationWhatsapp: notifWhatsapp.trim(),
        notifyEmailEnabled,
        notifyWhatsappEnabled,
        callmebotApiKey: callmebotApiKey.trim(),
        newOrderAlert,
        orderStatusAlert,
        browserNotifications,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "tenants", user.uid), payload, { merge: true });
      await setDoc(doc(db, "tenants", user.uid, "settings", "notifications"), payload, { merge: true });

      showToast("Paramètres des notifications enregistrés avec succès !");
    } catch (e: any) {
      console.error("Save notification error:", e);
      showToast("Erreur lors de l'enregistrement.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotifications = async () => {
    if (!user) return;
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/notify/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: user.uid,
          email: notifEmail.trim() || user.email,
          phone: notifWhatsapp.trim(),
          callmebotApiKey: callmebotApiKey.trim(),
        })
      });

      const data = await res.json();
      setTestResult(data);
      if (data.emailSent || data.whatsappSent) {
        showToast("Notification de test envoyée avec succès !");
      } else {
        showToast(data.error || "Échec de l'envoi du test.", "error");
      }
    } catch (err: any) {
      setTestResult({ error: err.message || "Erreur de connexion au serveur." });
      showToast("Impossible de contacter le serveur de notifications.", "error");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 text-yellow-500" />
            <h1 className="text-2xl font-bold text-white">Paramètres des notifications</h1>
          </div>
          <p className="text-neutral-400">
            Configurez les canaux d'alertes instantanées pour chaque nouvelle commande : E-mail, WhatsApp automatique et Navigateur.
          </p>
        </div>

        <button
          onClick={handleTestNotifications}
          disabled={testing}
          className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Envoyer une notification de test
        </button>
      </div>

      {toastMsg && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
          toastMsg.type === "success" 
            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" 
            : "bg-red-500/10 border border-red-500/30 text-red-400"
        }`}>
          {toastMsg.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toastMsg.text}
        </div>
      )}

      {testResult && (
        <div className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in ${testResult.emailSent || testResult.whatsappSent ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
          <div className="font-bold flex items-center gap-2 text-sm">
            {testResult.emailSent || testResult.whatsappSent ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
            Résultat du test de notification en temps réel :
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-neutral-300">
            <div className="flex items-center gap-2">
              <span>Email :</span>
              {testResult.emailSent ? (
                <span className="text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded">✓ Envoyé avec succès</span>
              ) : (
                <span className="text-red-400 font-semibold bg-red-500/20 px-2 py-0.5 rounded">✕ Non envoyé ({testResult.emailError || "erreur"})</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>WhatsApp :</span>
              {testResult.whatsappSent ? (
                <span className="text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded">✓ Envoyé ({testResult.whatsappMethod})</span>
              ) : (
                <span className="text-amber-400 font-semibold bg-amber-500/20 px-2 py-0.5 rounded">ℹ {testResult.whatsappError || "Désactivé / Non configuré"}</span>
              )}
            </div>
          </div>
          {testResult.previewUrl && (
            <div className="pt-2">
              <a href={testResult.previewUrl} target="_blank" rel="noreferrer" className="text-yellow-400 underline hover:text-yellow-300">
                Ouvrir l'aperçu de l'e-mail de test (Ethereal) ↗
              </a>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          
          {/* Email Notifications */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-yellow-500" />
              <div>
                <h2 className="text-base font-medium text-white">Notifications par E-mail</h2>
                <p className="text-xs text-neutral-400 mt-1">Réception d'un récapitulatif complet des commandes par e-mail en temps réel.</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Activer les alertes e-mail</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Envoi automatique à chaque commande passée</div>
                </div>
                <button 
                  onClick={() => setNotifyEmailEnabled(!notifyEmailEnabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${notifyEmailEnabled ? "bg-emerald-500" : "bg-neutral-600"}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${notifyEmailEnabled ? "left-6" : "left-1"}`} />
                </button>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-neutral-300">Adresse e-mail de réception :</label>
                <input
                  type="email"
                  value={notifEmail}
                  onChange={(e) => setNotifEmail(e.target.value)}
                  placeholder="votre-email@exemple.com"
                  className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="flex items-center justify-between border-t border-neutral-800/50 pt-4">
                <div>
                  <div className="text-sm font-medium text-white">Nouvelle commande</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Notification instantanée dès validation du panier</div>
                </div>
                <button 
                  onClick={() => setNewOrderAlert(!newOrderAlert)}
                  className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${newOrderAlert ? "bg-emerald-500" : "bg-neutral-600"}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${newOrderAlert ? "left-6" : "left-1"}`} />
                </button>
              </div>
            </div>
          </div>

          {/* WhatsApp Automatic Notifications */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
              <div>
                <h2 className="text-base font-medium text-white">Notifications WhatsApp Automatiques</h2>
                <p className="text-xs text-neutral-400 mt-1">Envoi automatique sans clic via Meta WhatsApp Cloud API ou CallMeBot.</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Activer les alertes WhatsApp</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Envoi d'un message direct sur votre téléphone à chaque commande</div>
                </div>
                <button 
                  onClick={() => setNotifyWhatsappEnabled(!notifyWhatsappEnabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${notifyWhatsappEnabled ? "bg-emerald-500" : "bg-neutral-600"}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${notifyWhatsappEnabled ? "left-6" : "left-1"}`} />
                </button>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-neutral-300">Numéro WhatsApp du destinataire :</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-500 font-mono font-medium">🇩🇿 +213</span>
                  <input
                    type="tel"
                    maxLength={getPhoneMaxLength(notifWhatsapp)}
                    value={notifWhatsapp}
                    onChange={(e) => setNotifWhatsapp(cleanAndLimitPhone(e.target.value))}
                    placeholder="0550252565"
                    className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg pl-20 pr-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              {/* CallMeBot Free API Integration */}
              <div className="bg-[#1e1e24] p-4 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-300">Option gratuite : Clé API CallMeBot WhatsApp</label>
                  <a
                    href="https://www.callmebot.com/blog/free-api-whatsapp-messages/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-yellow-500 hover:underline flex items-center gap-1"
                  >
                    Obtenir une clé gratuite <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="text"
                  value={callmebotApiKey}
                  onChange={(e) => setCallmebotApiKey(e.target.value)}
                  placeholder="Ex: 1234567"
                  className="w-full bg-[#16161a] border border-neutral-700 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-yellow-500"
                />
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  CallMeBot vous permet de recevoir des messages WhatsApp automatisés gratuits directement depuis le serveur en liant votre numéro.
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Enregistrer les paramètres
          </button>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Browser Notifications */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <MonitorSmartphone className="w-5 h-5 text-emerald-500" />
              <div>
                <h2 className="text-base font-medium text-white">Notifications navigateur & son de cloche</h2>
                <p className="text-xs text-neutral-400 mt-1">Alerte sonore et visuelle instantanée dans le tableau de bord.</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-800/50 pt-4">
              <div>
                <div className="text-sm font-medium text-white">Notifications du navigateur</div>
                <div className="text-xs text-neutral-500 mt-0.5">Alertes instantanées avec son de carillon à chaque commande.</div>
              </div>
              <button 
                onClick={() => setBrowserNotifications(!browserNotifications)}
                className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${browserNotifications ? "bg-emerald-500" : "bg-neutral-600"}`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${browserNotifications ? "left-6" : "left-1"}`} />
              </button>
            </div>
          </div>

          {/* Video Section */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center gap-3">
              <PlayCircle className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-medium text-white">Tutoriel : Configuration des alertes temps réel</h2>
            </div>
            <div className="aspect-video bg-neutral-900 relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 flex items-center justify-center">
                <div className="w-16 h-12 bg-red-600 rounded-xl flex items-center justify-center group-hover:bg-red-500 transition-colors">
                  <PlayCircle className="w-8 h-8 text-white fill-white" />
                </div>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80" 
                alt="Video thumbnail" 
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute bottom-4 right-4 bg-black/80 px-3 py-1 rounded text-xs text-white font-medium flex items-center gap-2">
                Regarder sur <span className="font-bold">YouTube</span>
              </div>
            </div>
          </div>

          {/* Telegram Notifications */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                <Send className="w-4 h-4 text-white -ml-0.5 mt-0.5" />
              </div>
              <div>
                <h2 className="text-base font-medium text-white">Notifications Telegram</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Recevez des alertes instantanées sur Telegram</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-800/50 pt-4">
              <div>
                <div className="text-sm font-medium text-white">Activer les notifications Telegram</div>
                <div className="text-xs text-neutral-500 mt-0.5">Bot @dzbuildbot</div>
              </div>
              <button 
                onClick={() => setTelegramNotifications(!telegramNotifications)}
                className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${telegramNotifications ? "bg-blue-500" : "bg-neutral-600"}`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${telegramNotifications ? "left-6" : "left-1"}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
