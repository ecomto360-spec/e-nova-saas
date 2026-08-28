import { useState } from "react";
import { LinkIcon, Copy, Info, Users, Clock, ArrowRight, Share2, MessageCircle, Send, Facebook, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

type PaymentMethod = "ccp" | "baridimob" | "wise" | "paysera" | "redotpay" | null;

export default function ReferralProgram() {
  const [copied, setCopied] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [accountDetails, setAccountDetails] = useState("");
  const { t } = useLanguage();
  const referralLink = "https://dzbuild.com/register?ref=grfi_87ea95ce";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPlaceholderForMethod = (method: PaymentMethod) => {
    switch (method) {
      case "ccp": return t("referral.placeholders.ccp");
      case "baridimob": return t("referral.placeholders.baridimob");
      case "wise": return t("referral.placeholders.wise");
      case "paysera": return t("referral.placeholders.paysera");
      case "redotpay": return t("referral.placeholders.redotpay");
      default: return "";
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="text-[10px] font-bold tracking-wider text-gray-500 dark:text-neutral-500 uppercase mb-2">{t("referral.program")}</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t("referral.title")}</h1>
        <p className="text-gray-600 dark:text-neutral-400">{t("referral.subtitle")}</p>
      </div>

      {/* Solde Disponible */}
      <div className="bg-[#fff9ef] border border-orange-100 dark:bg-[#16161a] dark:border-neutral-800 rounded-xl p-8">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 text-xs font-bold tracking-wider uppercase mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500" />
          {t("referral.availableBalance")}
        </div>
        <div className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          0 <span className="text-2xl text-gray-500 dark:text-neutral-500 font-normal">DZD</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-neutral-400 mb-2">
          <span>{t("referral.minimumWithdrawal")}</span>
          <span>0%</span>
        </div>
        <div className="h-1.5 w-full bg-gray-200 dark:bg-[#1e1e24] rounded-full overflow-hidden mb-8">
          <div className="h-full bg-emerald-500 w-0" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-orange-100 dark:border-neutral-800 pt-8">
          <div>
            <div className="text-xs text-gray-500 dark:text-neutral-500 uppercase tracking-wider mb-2">{t("referral.totalReferrals")}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-neutral-500 uppercase tracking-wider mb-2">{t("referral.totalEarnings")}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">0<span className="text-sm text-gray-500 dark:text-neutral-500 font-normal mx-1">DZD</span></div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-neutral-500 uppercase tracking-wider mb-2">{t("referral.totalPaid")}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">0<span className="text-sm text-gray-500 dark:text-neutral-500 font-normal mx-1">DZD</span></div>
          </div>
        </div>
      </div>

      {/* Votre lien de parrainage */}
      <div className="bg-white border border-gray-200 dark:bg-[#16161a] dark:border-neutral-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-orange-500 dark:text-yellow-500" /> {t("referral.yourLink")}
          </h2>
          <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded dark:text-yellow-500 dark:bg-yellow-500/10">5%+</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 bg-white border border-gray-300 text-gray-900 dark:bg-[#1e1e24] dark:border-neutral-700 rounded-lg px-4 py-3 text-sm dark:text-yellow-500 font-mono flex items-center overflow-x-auto text-left" dir="ltr">
            {referralLink}
          </div>
          <button 
            onClick={handleCopy}
            className="bg-orange-500 hover:bg-orange-600 dark:bg-yellow-500 dark:hover:bg-yellow-400 text-white dark:text-black px-6 py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? t("referral.copied") : t("referral.copyLink")}
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 dark:bg-[#1e1e24] dark:hover:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#25D366]" /> WhatsApp
          </button>
          <button className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 dark:bg-[#1e1e24] dark:hover:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
            <Send className="w-4 h-4 text-[#0088cc]" /> Telegram
          </button>
          <button className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 dark:bg-[#1e1e24] dark:hover:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
            <Facebook className="w-4 h-4 text-[#1877F2]" /> Facebook
          </button>
        </div>
      </div>

      {/* Structure de commission */}
      <div className="bg-white border border-gray-200 dark:bg-[#16161a] dark:border-neutral-800 rounded-xl p-6">
        <h2 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-6">
          <svg className="w-5 h-5 text-orange-500 dark:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {t("referral.commissionStructure")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-orange-50 border border-orange-200 dark:bg-[#1e1e24] dark:border-yellow-500/50 rounded-xl p-6 text-center">
            <div className="text-[10px] font-bold text-orange-600 dark:text-yellow-500 uppercase tracking-wider mb-2">{t("referral.payment1")}</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">30<span className="text-lg text-gray-500 dark:text-neutral-400">%</span></div>
            <div className="text-xs text-gray-600 dark:text-neutral-500">{t("referral.sub1")}</div>
          </div>
          <div className="bg-white border border-gray-200 dark:bg-[#1e1e24] dark:border-neutral-800 rounded-xl p-6 text-center">
            <div className="text-[10px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider mb-2">{t("referral.payment2")}</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">20<span className="text-lg text-gray-500 dark:text-neutral-400">%</span></div>
            <div className="text-xs text-gray-600 dark:text-neutral-500">{t("referral.sub2")}</div>
          </div>
          <div className="bg-white border border-gray-200 dark:bg-[#1e1e24] dark:border-neutral-800 rounded-xl p-6 text-center">
            <div className="text-[10px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider mb-2">{t("referral.payment3")}</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">10<span className="text-lg text-gray-500 dark:text-neutral-400">%</span></div>
            <div className="text-xs text-gray-600 dark:text-neutral-500">{t("referral.sub3")}</div>
          </div>
          <div className="bg-white border border-gray-200 dark:bg-[#1e1e24] dark:border-neutral-800 rounded-xl p-6 text-center">
            <div className="text-[10px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider mb-2">{t("referral.forever")}</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">5<span className="text-lg text-gray-500 dark:text-neutral-400">%</span></div>
            <div className="text-xs text-gray-600 dark:text-neutral-500">{t("referral.forever")}</div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 text-orange-900 dark:bg-[#2a2118] dark:border-orange-900/50 rounded-lg p-4 flex gap-3 text-sm dark:text-neutral-300">
          <Info className="w-4 h-4 text-orange-500 dark:text-yellow-500 shrink-0 mt-0.5" />
          <p>{t("referral.commissionInfo")}</p>
        </div>
      </div>

      {/* Paramètres de paiement */}
      <div className="bg-white border border-gray-200 dark:bg-[#16161a] dark:border-neutral-800 rounded-xl p-6">
        <h2 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-gray-400 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          {t("referral.paymentSettings")}
        </h2>
        <p className="text-sm text-gray-600 dark:text-neutral-400 mb-6">{t("referral.choosePaymentMethod")}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
          <button 
            onClick={() => setSelectedMethod("ccp")}
            className={`p-4 rounded-xl flex flex-col items-center justify-center gap-3 transition-colors h-24 relative ${selectedMethod === 'ccp' ? 'bg-orange-50 border-2 border-orange-500 dark:bg-[#1e1e24] dark:border-yellow-500' : 'bg-white border border-gray-200 hover:border-gray-300 dark:bg-[#1e1e24] dark:border-neutral-800 dark:hover:border-neutral-700'}`}
          >
            {selectedMethod === 'ccp' && <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 dark:bg-yellow-500 rounded-full flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white dark:text-black" /></div>}
            <div className="text-blue-500 dark:text-blue-400 font-bold text-xl italic tracking-tighter">CCP</div>
            <span className="text-xs font-medium text-gray-900 dark:text-white">{t("referral.ccp")}</span>
          </button>
          
          <button 
            onClick={() => setSelectedMethod("baridimob")}
            className={`p-4 rounded-xl flex flex-col items-center justify-center gap-3 transition-colors h-24 relative ${selectedMethod === 'baridimob' ? 'bg-orange-50 border-2 border-orange-500 dark:bg-[#1e1e24] dark:border-yellow-500' : 'bg-white border border-gray-200 hover:border-gray-300 dark:bg-[#1e1e24] dark:border-neutral-800 dark:hover:border-neutral-700'}`}
          >
            {selectedMethod === 'baridimob' && <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 dark:bg-yellow-500 rounded-full flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white dark:text-black" /></div>}
            <div className="text-orange-500 dark:text-yellow-500 font-bold text-xl tracking-tight">BaridiMob</div>
            <span className="text-xs font-medium text-gray-900 dark:text-white">BaridiMob</span>
          </button>
          
          <button 
            onClick={() => setSelectedMethod("wise")}
            className={`p-4 rounded-xl flex flex-col items-center justify-center gap-3 transition-colors h-24 relative overflow-hidden ${selectedMethod === 'wise' ? 'border-2 border-orange-500 bg-orange-50 dark:border-yellow-500 dark:bg-[#1e1e24]' : 'bg-white border border-gray-200 hover:border-gray-300 dark:bg-[#1e1e24] dark:border-neutral-800 dark:hover:border-neutral-700'}`}
          >
            {selectedMethod === 'wise' && <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 dark:bg-yellow-500 rounded-full flex items-center justify-center z-20"><CheckCircle2 className="w-3 h-3 text-white dark:text-black" /></div>}
            <div className="absolute inset-0 bg-green-500/10"></div>
            <div className="bg-[#9fe870] text-[#163300] px-3 py-1 rounded text-sm font-bold relative z-10">wise</div>
            <span className="text-xs font-medium text-gray-900 dark:text-white relative z-10 mt-1">Wise</span>
          </button>
          
          <button 
            onClick={() => setSelectedMethod("paysera")}
            className={`p-4 rounded-xl flex flex-col items-center justify-center gap-3 transition-colors h-24 relative ${selectedMethod === 'paysera' ? 'bg-orange-50 border-2 border-orange-500 dark:bg-[#1e1e24] dark:border-yellow-500' : 'bg-white border border-gray-200 hover:border-gray-300 dark:bg-[#1e1e24] dark:border-neutral-800 dark:hover:border-neutral-700'}`}
          >
            {selectedMethod === 'paysera' && <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 dark:bg-yellow-500 rounded-full flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white dark:text-black" /></div>}
            <div className="w-8 h-8 bg-blue-50 border border-blue-100 dark:bg-white dark:border-transparent rounded-lg flex items-center justify-center text-blue-600 font-bold text-xl">P</div>
            <span className="text-xs font-medium text-gray-900 dark:text-white">Paysera</span>
          </button>
          
          <button 
            onClick={() => setSelectedMethod("redotpay")}
            className={`p-4 rounded-xl flex flex-col items-center justify-center gap-3 transition-colors h-24 relative ${selectedMethod === 'redotpay' ? 'bg-orange-50 border-2 border-orange-500 dark:bg-[#1e1e24] dark:border-yellow-500' : 'bg-white border border-gray-200 hover:border-gray-300 dark:bg-[#1e1e24] dark:border-neutral-800 dark:hover:border-neutral-700'}`}
          >
            {selectedMethod === 'redotpay' && <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 dark:bg-yellow-500 rounded-full flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white dark:text-black" /></div>}
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">P</div>
            <span className="text-xs font-medium text-gray-900 dark:text-white">RedotPay</span>
          </button>
        </div>

        {selectedMethod && (
          <div className="mb-4 space-y-4">
            <div>
              <label className="block text-xs text-gray-600 dark:text-neutral-400 mb-2">{t("referral.accountDetails")}</label>
              <input 
                type="text" 
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                placeholder={getPlaceholderForMethod(selectedMethod)}
                className="w-full bg-white border border-gray-300 text-gray-900 dark:bg-[#1e1e24] dark:border-neutral-700 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:border-orange-500 dark:focus:border-yellow-500 transition-colors"
                dir="auto"
              />
            </div>
            <button className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-yellow-500 dark:hover:bg-yellow-400 text-white dark:text-black font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t("referral.savePaymentInfo")}
            </button>
          </div>
        )}

        <div className="bg-orange-50 border border-orange-100 text-orange-900 dark:bg-[#2a2118] dark:border-orange-900/50 rounded-lg p-4 flex gap-3 text-sm dark:text-neutral-300">
          <Info className="w-4 h-4 text-orange-500 dark:text-yellow-500 shrink-0 mt-0.5" />
          <p>{t("referral.paymentLaterInfo")}</p>
        </div>
      </div>

      {/* Utilisateurs parrainés */}
      <div className="bg-white border border-gray-200 dark:bg-[#16161a] dark:border-neutral-800 rounded-xl p-6">
        <h2 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-8">
          <Users className="w-5 h-5 text-orange-500 dark:text-yellow-500" />
          {t("referral.referredUsers")}
        </h2>
        
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-[#1e1e24] rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-gray-400 dark:text-neutral-600" />
          </div>
          <p className="text-sm text-gray-500 dark:text-neutral-500">{t("referral.noReferrals")}</p>
        </div>
      </div>

      {/* Historique des commissions */}
      <div className="bg-white border border-gray-200 dark:bg-[#16161a] dark:border-neutral-800 rounded-xl p-6">
        <h2 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-8">
          <svg className="w-5 h-5 text-orange-500 dark:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t("referral.commissionHistory")}
        </h2>
        
        <div className="flex flex-col items-center justify-center py-12 text-center mb-6">
          <div className="w-16 h-16 bg-gray-50 dark:bg-[#1e1e24] rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-gray-400 dark:text-neutral-600" />
          </div>
          <p className="text-sm text-gray-500 dark:text-neutral-500">{t("referral.noCommissions")}</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 dark:bg-[#1e1e24] dark:border-neutral-800 rounded-lg p-4 flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
          <Info className="w-4 h-4 text-orange-500 dark:text-yellow-500" />
          {t("referral.minimumWithdrawal").split(":")[0]}: <span className="font-bold text-gray-900 dark:text-white mx-1">5,000 DZD</span>
        </div>
      </div>

      {/* Comment ça marche */}
      <div className="bg-white border border-gray-200 dark:bg-[#16161a] dark:border-neutral-800 rounded-xl p-6">
        <h2 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-6">
          <svg className="w-5 h-5 text-orange-500 dark:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          {t("referral.howItWorks")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 dark:bg-[#1e1e24] dark:border-neutral-800 rounded-xl p-6">
            <div className="w-6 h-6 rounded-full bg-orange-50 text-orange-600 dark:bg-yellow-500/20 dark:text-yellow-500 flex items-center justify-center text-xs font-bold mb-4">1</div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t("referral.step1Title")}</h4>
            <p className="text-xs text-gray-500 dark:text-neutral-500">{t("referral.step1Desc")}</p>
          </div>
          <div className="bg-white border border-gray-200 dark:bg-[#1e1e24] dark:border-neutral-800 rounded-xl p-6">
            <div className="w-6 h-6 rounded-full bg-orange-50 text-orange-600 dark:bg-yellow-500/20 dark:text-yellow-500 flex items-center justify-center text-xs font-bold mb-4">2</div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t("referral.step2Title")}</h4>
            <p className="text-xs text-gray-500 dark:text-neutral-500">{t("referral.step2Desc")}</p>
          </div>
          <div className="bg-white border border-gray-200 dark:bg-[#1e1e24] dark:border-neutral-800 rounded-xl p-6">
            <div className="w-6 h-6 rounded-full bg-orange-50 text-orange-600 dark:bg-yellow-500/20 dark:text-yellow-500 flex items-center justify-center text-xs font-bold mb-4">3</div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t("referral.step3Title")}</h4>
            <p className="text-xs text-gray-500 dark:text-neutral-500">{t("referral.step3Desc")}</p>
          </div>
          <div className="bg-white border border-gray-200 dark:bg-[#1e1e24] dark:border-neutral-800 rounded-xl p-6">
            <div className="w-6 h-6 rounded-full bg-orange-50 text-orange-600 dark:bg-yellow-500/20 dark:text-yellow-500 flex items-center justify-center text-xs font-bold mb-4">4</div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t("referral.step4Title")}</h4>
            <p className="text-xs text-gray-500 dark:text-neutral-500">{t("referral.step4Desc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
