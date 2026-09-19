import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Globe, Moon, Sun, Eye, Bell, Check, CheckCheck, ChevronDown, ChevronUp, 
  UserCog, HelpCircle, LogOut, User, Menu, ShoppingBag, AlertTriangle, ArrowRight, Inbox,
  Clock, Volume2, VolumeX, X, Sparkles, MapPin
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTenant } from "../../contexts/TenantContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { signOut } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface NotificationItem {
  id: string;
  orderId?: string;
  type: "order" | "warning" | "system";
  title: string;
  orderNumber: string;
  client: string;
  phone: string;
  total: string;
  location: string;
  orderTime: string;
  orderDate: string;
  timeAgo: string;
  timestamp: number;
  link: string;
  status: string;
  message?: string;
}

function parseOrderDateTime(data: any): { dateStr: string; timeStr: string; timestamp: number } {
  let d: Date | null = null;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (data.createdAt?.toDate) {
    d = data.createdAt.toDate();
  } else if (data.createdAt && typeof data.createdAt === "string") {
    const parsed = new Date(data.createdAt);
    if (!isNaN(parsed.getTime())) d = parsed;
  } else if (typeof data.createdAt === "number") {
    d = new Date(data.createdAt);
  } else if (data.date) {
    const raw = String(data.date).trim();
    if (raw.includes(" ")) {
      const [datePart, timePart] = raw.split(" ");
      if (datePart && (datePart.includes("/") || datePart.includes("-"))) {
        const segs = datePart.split(/[/ -]/).map(Number);
        let [hh, mm] = [12, 0];
        if (timePart && timePart.includes(":")) {
          const tParts = timePart.split(":").map(Number);
          hh = tParts[0] || 0;
          mm = tParts[1] || 0;
        }
        if (segs[0] > 1000) {
          // YYYY/MM/DD
          d = new Date(segs[0], (segs[1] || 1) - 1, segs[2] || 1, hh, mm);
        } else {
          // DD/MM/YYYY
          d = new Date(segs[2] || 2026, (segs[1] || 1) - 1, segs[0] || 1, hh, mm);
        }
      }
    } else {
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) d = parsed;
    }
  }

  if (!d || isNaN(d.getTime())) {
    const now = new Date();
    return {
      dateStr: `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())}`,
      timeStr: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
      timestamp: Date.now()
    };
  }

  return {
    dateStr: `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`,
    timeStr: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    timestamp: d.getTime()
  };
}

function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return "Récemment";
  const diff = Math.max(0, Date.now() - timestamp);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} j`;
}

// Pleasant chime for new order alerts
function playOrderChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  } catch (e) {
    // Audio might be constrained until user interaction
  }
}

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuth();
  const { tenantData, isTrialExpired } = useTenant();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const displayName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Utilisateur";
  const email = user?.email || "";
  
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem("order_alert_sound") !== "false";
  });
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);

  const langRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Load read notification IDs from local storage
  useEffect(() => {
    if (!user?.uid) return;
    const storageKey = `notifications_read_${user.uid}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setReadIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error loading read notifications:", e);
    }
  }, [user?.uid]);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("order_alert_sound", next ? "true" : "false");
    if (next) playOrderChime();
  };

  // Real-time listener for merchant orders from Firestore and real-time events
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      return;
    }

    const ordersMap = new Map<string, NotificationItem>();

    const updateCombinedNotifications = () => {
      const list = Array.from(ordersMap.values());
      if (isTrialExpired) {
        list.push({
          id: "sys_trial_expired",
          type: "warning",
          title: "Période d'essai expirée",
          orderNumber: "URGENT",
          client: "Système",
          phone: "",
          total: "",
          location: "",
          orderTime: "--:--",
          orderDate: "Aujourd'hui",
          timeAgo: "Urgent",
          timestamp: Date.now() + 1000000,
          link: "/dashboard/subscription",
          status: "Expiré",
          message: "Votre boutique est actuellement suspendue. Renouvelez votre forfait pour continuer."
        });
      }

      // If no orders found yet in Firestore, provide recent demo orders with exact times
      if (list.length === 0) {
        const demoOrders: NotificationItem[] = [
          {
            id: "demo_1005",
            orderId: "1005",
            type: "order",
            title: "Nouvelle commande #1005",
            orderNumber: "1005",
            client: "Amine Benali",
            phone: "0555 12 34 56",
            total: "4 500 DA",
            location: "Bab El Oued, Alger",
            orderTime: "10:30",
            orderDate: "Aujourd'hui",
            timeAgo: "Il y a 2h",
            timestamp: Date.now() - 7200000,
            link: "/dashboard/orders",
            status: "En attente",
            message: "Amine Benali • 4 500 DA • Bab El Oued, Alger"
          },
          {
            id: "demo_1004",
            orderId: "1004",
            type: "order",
            title: "Nouvelle commande #1004",
            orderNumber: "1004",
            client: "Sarah Mansouri",
            phone: "0770 98 76 54",
            total: "12 000 DA",
            location: "Bir El Djir, Oran",
            orderTime: "14:15",
            orderDate: "Hier",
            timeAgo: "Hier",
            timestamp: Date.now() - 86400000,
            link: "/dashboard/orders",
            status: "Confirmée",
            message: "Sarah Mansouri • 12 000 DA • Bir El Djir, Oran"
          },
          {
            id: "demo_1003",
            orderId: "1003",
            type: "order",
            title: "Nouvelle commande #1003",
            orderNumber: "1003",
            client: "Karim Slimani",
            phone: "0661 23 45 67",
            total: "8 900 DA",
            location: "El Khroub, Constantine",
            orderTime: "09:45",
            orderDate: "Hier",
            timeAgo: "Hier",
            timestamp: Date.now() - 95000000,
            link: "/dashboard/orders",
            status: "Livrée",
            message: "Karim Slimani • 8 900 DA • El Khroub, Constantine"
          }
        ];
        demoOrders.forEach(d => ordersMap.set(d.id, d));
        setNotifications(demoOrders);
        return;
      }

      // Sort newest first
      list.sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(list);
    };

    const handleIncomingOrderData = (data: any, isLiveAlert: boolean = false) => {
      if (!data) return;
      const { dateStr, timeStr, timestamp } = parseOrderDateTime(data);
      const orderNumber = data.orderNumber || (data.reference ? String(data.reference).slice(-6) : (data.id ? String(data.id).slice(0, 5).toUpperCase() : "CMD"));
      const client = data.client || data.customerName || data.name || "Client";
      const phone = data.phone || data.customerPhone || "";
      const total = data.total ? `${Number(data.total).toLocaleString()} DA` : "";
      const location = [data.commune, data.wilaya].filter(Boolean).join(", ");
      const key = data.reference || data.orderNumber || (data.id ? `doc_${data.id}` : `evt_${Date.now()}`);
      const notifId = `order_${key}`;

      // Remove demo items if real orders are arriving
      if (ordersMap.has("demo_1005")) {
        ordersMap.delete("demo_1005");
        ordersMap.delete("demo_1004");
        ordersMap.delete("demo_1003");
      }

      const notifItem: NotificationItem = {
        id: notifId,
        orderId: data.id || key,
        type: "order",
        title: `Nouvelle commande #${orderNumber}`,
        orderNumber,
        client,
        phone,
        total,
        location,
        orderTime: timeStr,
        orderDate: dateStr,
        timeAgo: isLiveAlert ? "À l'instant" : formatTimeAgo(timestamp),
        timestamp,
        link: `/dashboard/orders`,
        status: data.status || "En attente",
        message: `${client}${total ? ` • ${total}` : ""}${location ? ` • ${location}` : ""}`
      };

      const isNewArrival = isLiveAlert || (!isInitialLoadRef.current && !knownOrderIdsRef.current.has(key));
      knownOrderIdsRef.current.add(key);
      ordersMap.set(key, notifItem);
      updateCombinedNotifications();

      if (isNewArrival) {
        if (soundEnabled) {
          playOrderChime();
        }
        setActiveToast(notifItem);
        setTimeout(() => {
          setActiveToast(null);
        }, 8000);
      }
    };

    const processSnapshot = (snapshot: any) => {
      snapshot.forEach((docSnap: any) => {
        handleIncomingOrderData({ id: docSnap.id, ...docSnap.data() }, false);
      });
      updateCombinedNotifications();
    };

    // Subscriptions to multiple paths for robustness
    const unsubs: (() => void)[] = [];

    // 1. Orders by userId
    try {
      const q1 = query(collection(db, "orders"), where("userId", "==", user.uid));
      unsubs.push(onSnapshot(q1, (snap) => {
        processSnapshot(snap);
        isInitialLoadRef.current = false;
      }, (err) => {
        console.warn("Global orders notification subscription:", err);
      }));
    } catch (e) {
      console.warn("Error setting up q1:", e);
    }

    // 2. Orders by tenantId
    try {
      const qTenant = query(collection(db, "orders"), where("tenantId", "==", user.uid));
      unsubs.push(onSnapshot(qTenant, (snap) => {
        processSnapshot(snap);
        isInitialLoadRef.current = false;
      }, (err) => {
        console.warn("TenantId orders subscription:", err);
      }));
    } catch (e) {
      console.warn("Error setting up qTenant:", e);
    }

    // 3. Subcollection tenants/{uid}/orders
    try {
      const q2 = query(collection(db, "tenants", user.uid, "orders"));
      unsubs.push(onSnapshot(q2, (snap) => {
        processSnapshot(snap);
        isInitialLoadRef.current = false;
      }, (err) => {
        console.warn("Tenant orders notification subscription:", err);
      }));
    } catch (e) {
      console.warn("Error setting up q2:", e);
    }

    // 4. If tenantData?.id is distinct
    if (tenantData?.id && tenantData.id !== user.uid) {
      try {
        const q3 = query(collection(db, "tenants", tenantData.id, "orders"));
        unsubs.push(onSnapshot(q3, (snap) => {
          processSnapshot(snap);
        }, () => {}));
      } catch (e) {}
    }

    // 5. In-app custom event listener (immediate live alert across store/landing preview)
    const handleOrderEvent = (e: any) => {
      if (e.detail) {
        handleIncomingOrderData(e.detail, true);
      }
    };
    window.addEventListener("order_created", handleOrderEvent);

    // 6. PostMessage listener (when order submitted inside an iframe)
    const handleMessageEvent = (e: MessageEvent) => {
      if (e.data?.type === "order_created" && e.data?.data) {
        handleIncomingOrderData(e.data.data, true);
      }
    };
    window.addEventListener("message", handleMessageEvent);

    // 7. Storage event listener (across browser tabs)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "last_order_alert" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handleIncomingOrderData(parsed, true);
        } catch (err) {}
      }
    };
    window.addEventListener("storage", handleStorageEvent);

    // Initial fallback check
    updateCombinedNotifications();

    return () => {
      unsubs.forEach(fn => fn());
      window.removeEventListener("order_created", handleOrderEvent);
      window.removeEventListener("message", handleMessageEvent);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [user?.uid, tenantData?.id, isTrialExpired, soundEnabled]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const markAllAsRead = () => {
    if (!user?.uid) return;
    const allIds = Array.from(new Set([...readIds, ...notifications.map((n) => n.id)]));
    const storageKey = `notifications_read_${user.uid}`;
    localStorage.setItem(storageKey, JSON.stringify(allIds));
    setReadIds(allIds);
  };

  const markSingleAsRead = (id: string) => {
    if (!user?.uid) return;
    const allIds = Array.from(new Set([...readIds, id]));
    const storageKey = `notifications_read_${user.uid}`;
    localStorage.setItem(storageKey, JSON.stringify(allIds));
    setReadIds(allIds);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(prev => !prev);
  };

  const handleItemClick = (item: NotificationItem) => {
    markSingleAsRead(item.id);
    setIsNotificationsOpen(false);
    navigate(item.link);
  };

  const handleTestAlert = () => {
    playOrderChime();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const num = Math.floor(1000 + Math.random() * 9000);
    const testTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const testDate = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())}`;

    const testItem: NotificationItem = {
      id: `test_${Date.now()}`,
      orderId: `ORD-${num}`,
      type: "order",
      title: `Nouvelle commande #${num}`,
      orderNumber: `${num}`,
      client: "Amina Benali",
      phone: "0550 12 34 56",
      total: "4 800 DA",
      location: "Bab Ezzouar, Alger",
      orderTime: testTime,
      orderDate: testDate,
      timeAgo: "À l'instant",
      timestamp: Date.now(),
      link: "/dashboard/orders",
      status: "En attente",
      message: "Amina Benali • 4 800 DA • Alger"
    };

    // Add to notifications, ensure it is unread so the red badge lights up
    setNotifications(prev => [testItem, ...prev.filter(x => x.id !== testItem.id)]);
    setReadIds(prev => prev.filter(id => id !== testItem.id));
    setActiveToast(testItem);
    setTimeout(() => setActiveToast(null), 8000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Floating Alert Toast for real-time incoming orders */}
      {activeToast && (
        <div 
          onClick={() => {
            navigate(activeToast.link);
            setActiveToast(null);
          }}
          className="fixed top-20 right-4 z-50 max-w-sm w-full bg-[#1e1e24] border-2 border-yellow-500 shadow-2xl rounded-2xl p-4 cursor-pointer hover:bg-[#25252d] transition-all transform animate-bounce duration-500"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/20 text-yellow-500 flex items-center justify-center shrink-0">
              <Bell className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">Nouvelle commande #{activeToast.orderNumber}</span>
                <span className="text-xs text-yellow-500 font-mono font-bold flex items-center gap-1 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                  <Clock className="w-3 h-3" />
                  {activeToast.orderTime}
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-1">
                Client: <strong className="text-white">{activeToast.client}</strong> ({activeToast.phone})
              </p>
              <div className="flex items-center justify-between mt-1 text-xs">
                <span className="font-bold text-emerald-400">{activeToast.total}</span>
                <span className="text-[11px] text-neutral-400">{activeToast.location}</span>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveToast(null);
              }}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6 dark:border-neutral-800 dark:bg-[#16161a]">
        <div className="flex flex-1 items-center gap-4">
          {onMenuClick && (
            <button 
              onClick={onMenuClick}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={langRef}>
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
            >
              <Globe className="h-5 w-5" />
            </button>
            
            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md bg-white border border-gray-200 shadow-lg z-50 py-1 dark:bg-[#1e1e24] dark:border-neutral-800">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('header.chooseLanguage')}
                </div>
                <button
                  onClick={() => { setLanguage('ar'); setIsLangOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span>🇩🇿</span>
                    <span className="font-medium text-gray-900 dark:text-white">{t('header.arabic')}</span>
                    <span className="text-xs text-gray-500 dark:text-neutral-500">Arabic</span>
                  </div>
                  {language === 'ar' && <Check className="w-4 h-4 text-yellow-500" />}
                </button>
                <button
                  onClick={() => { setLanguage('fr'); setIsLangOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span>🇫🇷</span>
                    <span className="font-medium text-gray-900 dark:text-white">{t('header.french')}</span>
                    <span className="text-xs text-gray-500 dark:text-neutral-500">French</span>
                  </div>
                  {language === 'fr' && <Check className="w-4 h-4 text-yellow-500" />}
                </button>
              </div>
            )}
          </div>
          
          <button 
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
          >
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
          
          <a 
            href={tenantData?.storeUrl ? `/store/${tenantData.storeUrl}` : "/store"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-black hover:bg-yellow-400 transition-colors"
          >
            <Eye className="h-4 w-4" />
            {t('header.viewStore')}
          </a>

          <div className="h-8 w-px bg-gray-200 dark:bg-neutral-800 mx-2" />

          {/* Real-time Order Alert Bell */}
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={toggleNotifications}
              title="Notifications et alertes de commandes"
              className={`relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors mr-2 ${
                unreadCount > 0 ? "text-yellow-500 dark:text-yellow-500" : ""
              }`}
            >
              <Bell className={`h-5 w-5 ${unreadCount > 0 ? "animate-pulse" : ""}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#16161a]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-[#1a1a20] z-50 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Alertes & Commandes</span>
                    {unreadCount > 0 ? (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500 dark:bg-red-500/20">
                        {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500 dark:bg-emerald-500/20">
                        À jour
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={toggleSound}
                      title={soundEnabled ? "Désactiver le son d'alerte" : "Activer le son d'alerte"}
                      className={`p-1.5 rounded-lg transition-colors ${
                        soundEnabled ? "text-yellow-500 hover:bg-yellow-500/10" : "text-neutral-500 hover:bg-neutral-800"
                      }`}
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    {notifications.length > 0 && unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        title="Tout marquer comme lu"
                        className="flex items-center gap-1 text-xs text-neutral-400 hover:text-yellow-500 transition-colors py-1 px-1.5 rounded"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Tout lu</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100 dark:divide-neutral-800/60">
                  {notifications.length === 0 ? (
                    <div className="py-10 px-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                        <Inbox className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Aucune commande récente</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                        Les nouvelles commandes reçues apparaîtront ici en temps réel avec l'heure exacte et l'alerte sonore.
                      </p>
                      <button
                        onClick={handleTestAlert}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 px-3 py-1.5 rounded-lg border border-yellow-500/20 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Tester l'alerte sonore</span>
                      </button>
                    </div>
                  ) : (
                    notifications.slice(0, 20).map((item) => {
                      const isUnread = !readIds.includes(item.id);
                      return (
                        <div 
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className={`flex items-start gap-3 p-3.5 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/60 ${
                            isUnread ? "bg-yellow-500/[0.06] dark:bg-yellow-500/[0.05]" : ""
                          }`}
                        >
                          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            item.type === "order" 
                              ? "bg-emerald-500/15 text-emerald-500 dark:bg-emerald-500/20" 
                              : "bg-amber-500/15 text-amber-500 dark:bg-amber-500/20"
                          }`}>
                            {item.type === "order" ? (
                              <ShoppingBag className="h-4 w-4" />
                            ) : (
                              <AlertTriangle className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {item.title}
                              </p>
                              {/* HEURE DE LA COMMANDE BIEN VISIBLE */}
                              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-600 dark:text-yellow-400 bg-amber-500/10 dark:bg-yellow-500/15 px-2 py-0.5 rounded-md border border-amber-500/30 dark:border-yellow-500/30 shrink-0 shadow-xs">
                                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-yellow-400 shrink-0" />
                                <span className="text-[10px] text-gray-500 dark:text-neutral-400 font-sans font-medium">Heure:</span>
                                <span>{item.orderTime}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
                              <span className="font-semibold text-gray-900 dark:text-white truncate">
                                {item.client}
                              </span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                                {item.total}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mt-1.5 pt-1 border-t border-gray-100 dark:border-neutral-800/60">
                              <span className="truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                                {item.location || item.phone || "Algérie"}
                              </span>
                              <span className="shrink-0 ml-2 font-medium">
                                {item.orderDate} • {item.timeAgo}
                              </span>
                            </div>
                          </div>
                          {isUnread && (
                            <span className="mt-1 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-yellow-500 text-black shrink-0 animate-pulse">
                              Nouveau
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-2.5 bg-gray-50 dark:bg-neutral-900/60 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between px-4">
                  <button
                    onClick={handleTestAlert}
                    className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-yellow-400 hover:text-amber-700 dark:hover:text-yellow-300 font-medium transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Simuler une commande</span>
                  </button>
                  <Link 
                    to="/dashboard/orders" 
                    onClick={() => setIsNotificationsOpen(false)}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-yellow-600 hover:text-yellow-500 dark:text-yellow-500 transition-colors py-1"
                  >
                    <span>Voir toutes les commandes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-1.5 pr-3 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:bg-[#1a1a20] dark:hover:bg-neutral-800"
            >
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-blue-100 dark:bg-neutral-700">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-blue-600 dark:text-neutral-300" />
                )}
              </div>
              <div className="flex flex-col items-start text-left max-w-[120px]">
                <span className="text-sm font-bold text-gray-900 truncate w-full dark:text-white leading-tight">
                  {displayName}
                </span>
                <span className="text-xs text-gray-500 truncate w-full dark:text-neutral-400 leading-tight">
                  {email}
                </span>
              </div>
              {isUserMenuOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-400 dark:text-neutral-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400 dark:text-neutral-500" />
              )}
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-[#1a1a20] z-50 overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-blue-100 dark:bg-neutral-700 flex-shrink-0">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-blue-600 dark:text-neutral-300" />
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-base font-bold text-gray-900 truncate dark:text-white">
                      {displayName}
                    </span>
                    <span className="text-sm text-gray-500 truncate dark:text-neutral-400">
                      {email}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-gray-200 dark:bg-neutral-800/50" />

                <div className="p-2">
                  <Link 
                    to="/dashboard/account" 
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <UserCog className="h-4 w-4 text-gray-500 dark:text-neutral-400" />
                    Paramètres du compte
                  </Link>
                  <Link 
                    to="/dashboard/support" 
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <HelpCircle className="h-4 w-4 text-gray-500 dark:text-neutral-400" />
                    Centre d'aide
                  </Link>
                </div>

                <div className="h-px bg-gray-200 dark:bg-neutral-800/50" />

                <div className="p-2">
                  <button 
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
