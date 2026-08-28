import { useState } from "react";
import { Bell, Mail, Send, MessageSquare, AlertTriangle, MonitorSmartphone, PlayCircle, ExternalLink } from "lucide-react";

export default function NotificationSettings() {
  const [browserNotifications, setBrowserNotifications] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newOrderEmail, setNewOrderEmail] = useState(true);
  const [orderStatusEmail, setOrderStatusEmail] = useState(false);
  const [telegramNotifications, setTelegramNotifications] = useState(false);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-8 h-8 text-yellow-500" />
          <h1 className="text-2xl font-bold text-white">Paramètres des notifications</h1>
        </div>
        <p className="text-neutral-400">Contrôlez les canaux de notifications de commandes : e-mail, Telegram et Discord</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          
          {/* Browser Notifications */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <MonitorSmartphone className="w-5 h-5 text-emerald-500" />
              <div>
                <h2 className="text-base font-medium text-white">Notifications navigateur & application</h2>
                <p className="text-xs text-neutral-400 mt-1">Alerte instantanée sur votre appareil dès qu'une commande arrive — même tableau de bord fermé.</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-800/50 pt-4">
              <div>
                <div className="text-sm font-medium text-white">Notifications du navigateur</div>
                <div className="text-xs text-neutral-500 mt-0.5">Alertes instantanées sur ce navigateur à chaque nouvelle commande.</div>
              </div>
              <button 
                onClick={() => setBrowserNotifications(!browserNotifications)}
                className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${browserNotifications ? "bg-emerald-500" : "bg-neutral-600"}`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${browserNotifications ? "left-6" : "left-1"}`} />
              </button>
            </div>

            <div className="bg-[#2a1d13] border border-orange-900/50 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-500/80 leading-relaxed">
                Les notifications sont bloquées pour ce site dans le navigateur. Cliquez sur l'icône de cadenas à côté de l'adresse, autorisez les notifications puis rechargez la page.
              </p>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-yellow-500" />
              <div>
                <h2 className="text-base font-medium text-white">Notifications e-mail et application</h2>
                <p className="text-xs text-neutral-400 mt-1">Activer ou désactiver toutes les notifications par e-mail, application et navigateur</p>
              </div>
            </div>

            <div className="bg-[#1e1e24] border border-neutral-700/50 rounded-lg p-4 flex gap-3">
              <Mail className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-neutral-400 mb-1">Les notifications seront envoyées à :</div>
                <div className="text-sm font-medium text-white mb-2">grfilaha@gmail.com</div>
                <a href="#" className="text-[10px] text-neutral-500 hover:text-neutral-400 underline">Pour changer cet e-mail, modifiez l'e-mail de votre compte dans les paramètres du compte</a>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Activer les notifications e-mail et application</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Activer ou désactiver toutes les notifications par e-mail, application et navigateur</div>
                </div>
                <button 
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${emailNotifications ? "bg-emerald-500" : "bg-neutral-600"}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${emailNotifications ? "left-6" : "left-1"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-neutral-800/50 pt-4">
                <div>
                  <div className="text-sm font-medium text-white">Nouvelle commande</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Notification lors de la réception d'une nouvelle commande</div>
                </div>
                <button 
                  onClick={() => setNewOrderEmail(!newOrderEmail)}
                  className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${newOrderEmail ? "bg-emerald-500" : "bg-neutral-600"}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${newOrderEmail ? "left-6" : "left-1"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-neutral-800/50 pt-4">
                <div>
                  <div className="text-sm font-medium text-white">Mise à jour du statut de commande</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Notification lors du changement de statut d'une commande</div>
                </div>
                <button 
                  onClick={() => setOrderStatusEmail(!orderStatusEmail)}
                  className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${orderStatusEmail ? "bg-emerald-500" : "bg-neutral-600"}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${orderStatusEmail ? "left-6" : "left-1"}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Video Section */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center gap-3">
              <PlayCircle className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-medium text-white">Regardez : Meilleure façon d'activer les notifications</h2>
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

          <button className="bg-yellow-500 text-black px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-yellow-400 transition-colors">
            Enregistrer les paramètres
          </button>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Telegram Notifications */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                <Send className="w-4 h-4 text-white -ml-0.5 mt-0.5" />
              </div>
              <div>
                <h2 className="text-base font-medium text-white">Notifications Telegram</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Recevez des notifications instantanées sur Telegram</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-800/50 pt-4">
              <div>
                <div className="text-sm font-medium text-white">Activer les notifications Telegram</div>
                <div className="text-xs text-neutral-500 mt-0.5">Recevez des notifications instantanées sur Telegram</div>
              </div>
              <button 
                onClick={() => setTelegramNotifications(!telegramNotifications)}
                className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${telegramNotifications ? "bg-blue-500" : "bg-neutral-600"}`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${telegramNotifications ? "left-6" : "left-1"}`} />
              </button>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white">Comptes liés</h3>
                <span className="bg-[#1e1e24] text-neutral-400 text-xs px-2 py-1 rounded border border-neutral-700/50 flex items-center gap-1">
                  <span className="w-3 h-3 text-neutral-500">👥</span> Comptes utilisés <span className="text-white ml-1 font-medium">0 / 2</span>
                </span>
              </div>
              <p className="text-sm text-neutral-500 mb-6">Aucun compte lié pour le moment</p>

              <div className="bg-[#1e1e24] border border-blue-900/30 rounded-xl p-5">
                <h4 className="text-sm font-medium text-blue-400 flex items-center gap-2 mb-4">
                  <Send className="w-4 h-4" /> Connecter un compte Telegram
                </h4>
                
                <ol className="space-y-4 mb-6 relative">
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-neutral-800 z-0" />
                  <li className="flex items-start gap-3 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
                    <p className="text-sm text-neutral-300 mt-0.5">Cliquez sur le bouton "Connecter Telegram" ci-dessous</p>
                  </li>
                  <li className="flex items-start gap-3 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
                    <p className="text-sm text-neutral-300 mt-0.5">Vous serez redirigé vers le bot <span className="font-medium text-blue-400">@dzbuildbot</span></p>
                  </li>
                  <li className="flex items-start gap-3 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">3</div>
                    <p className="text-sm text-neutral-300 mt-0.5">Appuyez sur "Start" pour activer la connexion</p>
                  </li>
                </ol>

                <button className="w-full bg-[#0088cc] hover:bg-[#007ab8] text-white py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
                  <Send className="w-4 h-4 -ml-0.5 mt-0.5" /> Connecter Telegram
                </button>
              </div>
            </div>
          </div>

          {/* Discord Notifications */}
          <div className="bg-[#16161a] border border-neutral-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-[#5865F2] rounded-full flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-medium text-white">Notifications Discord</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Recevez les notifications de commandes dans le serveur Discord de votre boutique ou en messages privés.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-[#1e1e24] border border-neutral-800 rounded-lg p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center shrink-0 font-medium">#</div>
                <div>
                  <div className="text-sm font-medium text-white">Canal du serveur</div>
                  <div className="text-xs text-neutral-500">Non lié</div>
                </div>
              </div>
              <div className="bg-[#1e1e24] border border-neutral-800 rounded-lg p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center shrink-0 font-medium">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Messages privés</div>
                  <div className="text-xs text-neutral-500">Non lié</div>
                </div>
              </div>
            </div>

            <button className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" /> Lier Discord
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
