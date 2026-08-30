import { useState, useMemo, FormEvent } from "react";
import { 
  ShoppingBag, 
  Search, 
  Menu, 
  X, 
  Phone, 
  Truck, 
  ShieldCheck, 
  Clock, 
  Star, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  ArrowLeft,
  Filter,
  Eye,
  Heart,
  RotateCcw,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { StoreTheme, StoreDemoProduct } from "../../data/themesData";
import { ALGERIAN_WILAYAS as WILAYAS_LIST } from "../../data/landingData";

const RenderStars = ({ count, reviewsCount }: { count?: number; reviewsCount?: number }) => {
  if (!count) return null;
  return (
    <div className="flex items-center gap-1.5 mb-2 flex-row-reverse justify-end">
      <div className="flex gap-0.5 flex-row-reverse">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-3.5 w-3.5 ${i < Math.floor(count) ? "fill-amber-500 text-amber-500" : "fill-gray-200 text-gray-200"}`} 
          />
        ))}
      </div>
      {reviewsCount && (
        <span className="text-[10px] text-gray-400 font-medium">({reviewsCount})</span>
      )}
    </div>
  );
};

interface ThemeStorePreviewProps {
  theme: StoreTheme;
  customStoreName?: string;
  isStandaloneView?: boolean;
  actualProducts?: any[];
}

export function ThemeStorePreview({ theme, customStoreName, isStandaloneView = false, actualProducts }: ThemeStorePreviewProps) {
  const storeName = customStoreName || theme.nameAr || theme.name || "أزياء الموضة";
  
  // Selected category filter
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(1);
  
  // Active product for COD Fast Checkout Modal
  const [selectedProduct, setSelectedProduct] = useState<StoreDemoProduct | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  
  // COD Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number>(16); // Default Alger (16)
  const [deliveryType, setDeliveryType] = useState<"home" | "desk">("home");
  const [commune, setCommune] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categories list with "All"
  const categories = useMemo(() => {
    return [
      { id: "all", nameAr: "الكل", name: "Tous" },
      ...theme.categories
    ];
  }, [theme.categories]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return (actualProducts ? actualProducts : theme.products).filter(product => {
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesSearch = searchQuery === "" || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.nameAr && product.nameAr.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [(actualProducts ? actualProducts : theme.products), selectedCategory, searchQuery]);

  // Featured products
  const featuredProducts = useMemo(() => {
    return (actualProducts ? actualProducts : theme.products).filter(p => p.isFeatured).slice(0, 4);
  }, [(actualProducts ? actualProducts : theme.products)]);

  // Calculate pricing for checkout
  const currentWilaya = useMemo(() => {
    return WILAYAS_LIST.find(w => w.code === selectedWilayaCode) || WILAYAS_LIST[15]; // Default Alger
  }, [selectedWilayaCode]);

  const deliveryPrice = useMemo(() => {
    if (!currentWilaya) return 500;
    return deliveryType === "home" ? currentWilaya.homeDeliveryPrice : currentWilaya.deskDeliveryPrice;
  }, [currentWilaya, deliveryType]);

  const totalPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    return (selectedProduct.price * quantity) + deliveryPrice;
  }, [selectedProduct, quantity, deliveryPrice]);

  const handleOpenProduct = (product: StoreDemoProduct) => {
    setSelectedProduct(product);
    const initialVariants: Record<string, string> = {};
    if (product.variants) {
      product.variants.forEach(v => {
        initialVariants[v.name] = v.options[0];
      });
    }
    setSelectedVariants(initialVariants);
    setQuantity(1);
    setOrderSuccess(false);
  };

  const handleOrderSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setOrderSuccess(true);
      setCartCount(prev => prev + 1);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-800 flex flex-col font-sans" dir="rtl">
      {/* Top Announcement Bar */}
      <div 
        className="text-white text-xs sm:text-sm py-2 px-4 text-center flex items-center justify-center gap-3 font-medium transition-colors shadow-sm"
        style={{ backgroundColor: theme.primaryColor || "#f59e0b" }}
      >
        <span className="flex items-center gap-1.5 font-bold">
          <Truck className="w-4 h-4" />
          التوصيل متوفر لـ 58 ولاية والدفع عند الاستلام 🇩🇿
        </span>
        <span className="hidden sm:inline opacity-80">•</span>
        <span className="hidden sm:inline font-normal">ضمان استبدال وإرجاع مجاني لمدة 7 أيام</span>
      </div>

      {/* Main Store Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Logo / Store Name */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="flex items-center gap-2">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md"
                style={{ backgroundColor: theme.primaryColor || "#f59e0b" }}
              >
                {storeName.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{storeName}</h1>
                <span className="text-[10px] text-gray-400 font-medium hidden sm:block">المتجر الرسمي المعتمد</span>
              </div>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-6 relative">
            <input 
              type="text"
              placeholder="ابحث عن منتج، قسم، أو فئة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pr-11 pl-4 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if ((actualProducts ? actualProducts : theme.products).length > 0) handleOpenProduct((actualProducts ? actualProducts : theme.products)[0]);
              }}
              className="relative p-2.5 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
              title="السلة"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm"
                  style={{ backgroundColor: theme.primaryColor || "#f59e0b" }}
                >
                  {cartCount}
                </span>
              )}
            </button>
            <a 
              href="#order-now"
              onClick={(e) => {
                e.preventDefault();
                if ((actualProducts ? actualProducts : theme.products).length > 0) handleOpenProduct((actualProducts ? actualProducts : theme.products)[0]);
              }}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-white shadow-sm hover:opacity-95 transition-all transform active:scale-95"
              style={{ backgroundColor: theme.primaryColor || "#f59e0b" }}
            >
              <span>اطلب الآن</span>
              <ChevronLeft className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Navigation Bar (Desktop) */}
        <div className="hidden lg:block border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-8 py-2.5 text-sm font-semibold text-gray-600">
              <button 
                onClick={() => setSelectedCategory("all")}
                className={`pb-1 transition-colors ${selectedCategory === "all" ? "text-amber-600 font-bold border-b-2 border-amber-500" : "hover:text-gray-900"}`}
              >
                الرئيسية
              </button>
              {theme.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`pb-1 transition-colors ${selectedCategory === cat.id ? "text-amber-600 font-bold border-b-2 border-amber-500" : "hover:text-gray-900"}`}
                >
                  {cat.nameAr}
                </button>
              ))}
              <a href="#featured" className="hover:text-gray-900 mr-auto text-xs text-amber-600 flex items-center gap-1 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                عروض وتخفيضات الأسبوع
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3 shadow-lg">
            <div className="relative mb-3">
              <input 
                type="text"
                placeholder="ابحث عن منتج..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pr-10 pl-3 text-sm text-gray-800"
              />
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => { setSelectedCategory("all"); setMobileMenuOpen(false); }}
                className="text-right py-2 px-3 rounded-md hover:bg-gray-50 font-medium text-sm text-gray-800"
              >
                الرئيسية
              </button>
              {theme.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setMobileMenuOpen(false); }}
                  className="text-right py-2 px-3 rounded-md hover:bg-gray-50 font-medium text-sm text-gray-800 flex justify-between"
                >
                  <span>{cat.nameAr}</span>
                  <span className="text-xs text-gray-400">({cat.productCount})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Hero Banner Section (Matching Screenshot 2 & 3) */}
      <section className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-12 sm:py-20">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={theme.bannerImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80"} 
            alt="Hero Banner" 
            className="w-full h-full object-cover object-center opacity-30 scale-105 transform hover:scale-100 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/70 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl text-right">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>تشكيلة الموسم الجديدة 2026</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4 text-white">
              {theme.bannerHeadlineAr || "أزياء عصرية لكل المناسبات"}
            </h2>
            <p className="text-sm sm:text-base text-gray-300 mb-8 font-normal leading-relaxed">
              {theme.bannerSubheadlineAr || "اكتشف تشكيلتنا الجديدة من الملابس والأكسسوارات بأسعار مناسبة وجودة عالية مع توصيل سريع لجميع الولايات."}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a 
                href="#all-products"
                className="px-8 py-3.5 rounded-xl font-bold text-sm text-gray-900 shadow-xl hover:opacity-95 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                style={{ backgroundColor: theme.primaryColor || "#f59e0b" }}
              >
                {theme.bannerCtaAr || "تسوق الآن"}
              </a>
              <a 
                href="#categories"
                className="px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all"
              >
                تصفح الأقسام
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex items-center gap-3 justify-center text-right">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">توصيل لـ 58 ولاية</h4>
                <p className="text-[11px] text-gray-500">سريع خلال 24 - 48 ساعة</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center text-right">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">الدفع عند الاستلام</h4>
                <p className="text-[11px] text-gray-500">افحص طلبك قبل الدفع</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center text-right">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">ضمان استبدال سهل</h4>
                <p className="text-[11px] text-gray-500">خلال 7 أيام من الاستلام</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center text-right">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">خدمة عملاء 7/7</h4>
                <p className="text-[11px] text-gray-500">رد فوري على الواتساب</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Circle Grid (Matching Screenshot 2 & 3) */}
      <section id="categories" className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="text-right">
            <h3 className="text-xl sm:text-2xl font-black text-gray-900">تصفح الأقسام</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">اختر القسم المناسب وتصفح أفضل المنتجات</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {theme.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`group flex flex-col items-center text-center p-4 rounded-2xl bg-white border transition-all duration-300 ${
                selectedCategory === cat.id 
                  ? "border-amber-500 shadow-md ring-2 ring-amber-500/20 bg-amber-50/20" 
                  : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
              }`}
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-3 border-2 border-gray-100 group-hover:scale-105 transition-transform duration-300 shadow-inner">
                <img 
                  src={cat.image} 
                  alt={cat.nameAr} 
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <span className="font-bold text-sm text-gray-900 group-hover:text-amber-600 transition-colors">
                {cat.nameAr}
              </span>
              <span className="text-xs text-gray-400 mt-0.5">
                {cat.productCount} منتج
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Products Section (المنتجات المميزة - Matching Screenshot 2 & 4) */}
      {featuredProducts.length > 0 && (
        <section id="featured" className="py-8 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md mb-1">
                  <Sparkles className="w-3 h-3" />
                  الأكثر مبيعاً
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900">المنتجات المميزة</h3>
              </div>
              <a href="#all-products" className="text-xs sm:text-sm font-bold text-amber-600 hover:underline">
                عرض الكل ({(actualProducts ? actualProducts : theme.products).length})
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((product) => (
                <div 
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  {/* Product Image Box */}
                  <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden cursor-pointer" onClick={() => handleOpenProduct(product)}>
                    <img 
                      src={product.image} 
                      alt={product.nameAr || product.name} 
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Badges */}
                    {product.discountBadge && (
                      <span className="absolute top-2.5 right-2.5 bg-amber-500 text-black text-[11px] font-black px-2.5 py-1 rounded-md shadow-sm">
                        {product.discountBadge}
                      </span>
                    )}
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                        -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between text-right">
                    <div>
                      <span className="text-[11px] text-gray-400 font-medium block mb-1">
                        {product.categoryAr || product.category}
                      </span>
                      <h4 
                        onClick={() => handleOpenProduct(product)}
                        className="font-bold text-sm text-gray-900 line-clamp-2 hover:text-amber-600 transition-colors cursor-pointer mb-2"
                      >
                        {product.nameAr || product.name}
                      </h4>
                      <RenderStars count={product.rating} reviewsCount={product.reviewsCount} />
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-50 flex flex-col gap-3">
                      <div className="flex items-baseline gap-2 justify-start">
                        <span className="text-base sm:text-lg font-black text-gray-900">
                          {product.price.toLocaleString()} د.ج
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            {product.originalPrice.toLocaleString()} د.ج
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleOpenProduct(product)}
                        className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white transition-all transform active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
                        style={{ backgroundColor: theme.primaryColor || "#f59e0b" }}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>اختر الخيارات / اطلب</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Products Catalog with Filter Tabs (Matching Screenshot 4) */}
      <section id="all-products" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="text-right">
            <h3 className="text-2xl font-black text-gray-900">جميع المنتجات</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">تصفح التشكيلة الكاملة بأفضل الأسعار</p>
          </div>

          {/* Category Filter Pills (Matching Screenshot 4) */}
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-amber-500 text-black shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900"
                }`}
              >
                {cat.nameAr}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Product Image */}
                <div 
                  className="relative aspect-[3/4] bg-gray-50 overflow-hidden cursor-pointer" 
                  onClick={() => handleOpenProduct(product)}
                >
                  <img 
                    src={product.image} 
                    alt={product.nameAr || product.name} 
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.discountBadge && (
                    <span className="absolute top-2.5 right-2.5 bg-amber-500 text-black text-[11px] font-black px-2.5 py-1 rounded-md shadow-sm">
                      {product.discountBadge}
                    </span>
                  )}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                      -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col justify-between text-right">
                  <div>
                    <span className="text-[11px] text-gray-400 font-medium block mb-1">
                      {product.categoryAr || product.category}
                    </span>
                    <h4 
                      onClick={() => handleOpenProduct(product)}
                      className="font-bold text-sm text-gray-900 line-clamp-2 hover:text-amber-600 transition-colors cursor-pointer mb-2"
                    >
                      {product.nameAr || product.name}
                    </h4>
                    <RenderStars count={product.rating} reviewsCount={product.reviewsCount} />
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-50 flex flex-col gap-3">
                    <div className="flex items-baseline gap-2 justify-start">
                      <span className="text-base sm:text-lg font-black text-gray-900">
                        {product.price.toLocaleString()} د.ج
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          {product.originalPrice.toLocaleString()} د.ج
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenProduct(product)}
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white transition-all transform active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: theme.primaryColor || "#f59e0b" }}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>اختر الخيارات</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center my-8">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-gray-800">لا توجد منتجات في هذا القسم</h4>
            <p className="text-xs text-gray-500 mt-1">جرب اختيار قسم آخر أو مسح البحث</p>
            <button
              onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}
              className="mt-4 px-4 py-2 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              عرض جميع المنتجات
            </button>
          </div>
        )}
      </section>

      {/* Store Footer (Matching Screenshot 5) */}
      <footer className="bg-gray-900 text-gray-400 pt-16 pb-8 border-t border-gray-800 text-right">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-gray-800">
            
            {/* Col 1: Store Bio */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: theme.primaryColor || "#f59e0b" }}
                >
                  {storeName.charAt(0)}
                </div>
                <h4 className="text-lg font-black text-white">{storeName}</h4>
              </div>
              <p className="text-xs leading-relaxed text-gray-400">
                متجرك الإلكتروني المفضل للتسوق بأمان في الجزائر. منتجات أصلية، توصيل سريع لـ 58 ولاية، والدفع عند الاستلام مع ضمان كامل.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>متجر موثوق 100%</span>
                </div>
              </div>
            </div>

            {/* Col 2: Categories */}
            <div>
              <h5 className="text-sm font-bold text-white mb-4">الأقسام الرئيسية</h5>
              <ul className="space-y-2 text-xs">
                {theme.categories.map((cat) => (
                  <li key={cat.id}>
                    <button 
                      onClick={() => setSelectedCategory(cat.id)}
                      className="hover:text-amber-400 transition-colors"
                    >
                      {cat.nameAr}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Quick Links */}
            <div>
              <h5 className="text-sm font-bold text-white mb-4">روابط تهمك</h5>
              <ul className="space-y-2 text-xs">
                <li><a href="#about" className="hover:text-amber-400 transition-colors">من نحن</a></li>
                <li><a href="#shipping" className="hover:text-amber-400 transition-colors">سياسة الشحن والتوصيل 58 ولاية</a></li>
                <li><a href="#returns" className="hover:text-amber-400 transition-colors">سياسة الاستبدال والاسترجاع (7 أيام)</a></li>
                <li><a href="#track" className="hover:text-amber-400 transition-colors">تتبع حالة الطلبية</a></li>
                <li><a href="#terms" className="hover:text-amber-400 transition-colors">الشروط والأحكام</a></li>
              </ul>
            </div>

            {/* Col 4: Contact Info */}
            <div>
              <h5 className="text-sm font-bold text-white mb-4">خدمة العملاء والاتصال</h5>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span dir="ltr">+213 555 00 00 00</span>
                </div>
                <p className="text-gray-500 text-[11px]">
                  متاحون يومياً من 09:00 صباحاً حتى 21:00 مساءً للرد على استفساراتكم وتأكيد طلبياتكم.
                </p>
                <div className="pt-2">
                  <button 
                    onClick={() => {
                      if ((actualProducts ? actualProducts : theme.products).length > 0) handleOpenProduct((actualProducts ? actualProducts : theme.products)[0]);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 transition-all shadow-md text-center"
                  >
                    تواصل معنا عبر واتساب
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>© 2026 {storeName}. جميع الحقوق محفوظة.</p>
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <span>تم التطوير والتصميم بواسطة</span>
              <span className="text-amber-400 font-bold">DZBuild E-Commerce</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive COD Fast Order Modal (شراء سريع / الدفع عند الاستلام) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="text-right">
                <span className="text-xs font-bold text-amber-600">طلب مباشر والدفع عند الاستلام 🇩🇿</span>
                <h3 className="text-base sm:text-lg font-black text-gray-900 line-clamp-1">{selectedProduct.nameAr || selectedProduct.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="p-2 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            {orderSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-black text-gray-900">تم تسجيل طلبكم بنجاح !</h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  شكراً لثقتكم بنا، سيتصل بكم أحد ممثلي خدمة العملاء على الرقم <strong className="text-gray-900" dir="ltr">{customerPhone}</strong> لتأكيد العنوان وشحن طلبيتكم في أسرع وقت.
                </p>
                <div className="bg-gray-50 rounded-xl p-4 text-xs space-y-1.5 max-w-sm mx-auto text-right border border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-gray-500">المنتج :</span>
                    <span className="font-bold text-gray-900">{selectedProduct.nameAr || selectedProduct.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">الكمية :</span>
                    <span className="font-bold text-gray-900">{quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">الولاية :</span>
                    <span className="font-bold text-gray-900">{currentWilaya.name}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-sm">
                    <span>المبلغ الإجمالي :</span>
                    <span className="text-amber-600">{totalPrice.toLocaleString()} د.ج</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-8 py-3 rounded-xl font-bold text-xs text-white shadow-md hover:opacity-90 transition-all"
                  style={{ backgroundColor: theme.primaryColor || "#f59e0b" }}
                >
                  العودة للمتجر
                </button>
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit} className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                
                {/* Product Summary Row */}
                <div className="flex gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100 items-start sm:items-center flex-col sm:flex-row">
                  <div className="flex gap-4 items-center w-full sm:w-auto">
                    <img 
                      src={selectedProduct.image} 
                      alt={selectedProduct.name} 
                      className="w-16 h-16 sm:w-24 sm:h-24 rounded-lg object-cover border border-gray-200"
                    />
                    <div className="flex-1 text-right">
                      <h4 className="font-bold text-sm text-gray-900 line-clamp-2">{selectedProduct.nameAr || selectedProduct.name}</h4>
                      <RenderStars count={selectedProduct.rating} reviewsCount={selectedProduct.reviewsCount} />
                      <div className="flex items-baseline justify-end gap-2 mt-1">
                        <span className="text-base font-black text-amber-600">{selectedProduct.price.toLocaleString()} د.ج</span>
                        {selectedProduct.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">{selectedProduct.originalPrice.toLocaleString()} د.ج</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Description */}
                {selectedProduct.description && (
                  <div className="bg-white border border-gray-100 p-4 rounded-xl text-right">
                    <h5 className="text-xs font-bold text-gray-900 mb-2 border-r-2 border-amber-500 pr-2">وصف المنتج</h5>
                    <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedProduct.description}</p>
                  </div>
                )}

                {/* Product Reviews */}
                {selectedProduct.reviews && selectedProduct.reviews.length > 0 && (
                  <div className="bg-white border border-gray-100 p-4 rounded-xl text-right">
                    <h5 className="text-xs font-bold text-gray-900 mb-3 border-r-2 border-amber-500 pr-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-row-reverse">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>تقييمات العملاء ({selectedProduct.reviewsCount || selectedProduct.reviews.length})</span>
                      </div>
                    </h5>
                    <div className="space-y-4">
                      {selectedProduct.reviews.map(review => (
                        <div key={review.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start mb-1 flex-row-reverse">
                            <div className="flex items-center gap-2 flex-row-reverse">
                              <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px]">
                                {review.author.charAt(0)}
                              </div>
                              <span className="text-xs font-bold text-gray-800">{review.author}</span>
                            </div>
                            <span className="text-[10px] text-gray-400">{review.date}</span>
                          </div>
                          <div className="flex gap-0.5 mb-1.5 flex-row-reverse">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-2.5 w-2.5 ${i < review.rating ? "fill-amber-500 text-amber-500" : "fill-gray-200 text-gray-200"}`} 
                              />
                            ))}
                          </div>
                          <p className="text-[11px] text-gray-600 leading-relaxed text-right">{review.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variants Selection */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="space-y-3">
                    {selectedProduct.variants.map((v) => (
                      <div key={v.name} className="text-right">
                        <label className="text-xs font-bold text-gray-700 block mb-1.5">{v.name}</label>
                        <div className="flex flex-wrap gap-2">
                          {v.options.map((opt) => (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => setSelectedVariants(prev => ({ ...prev, [v.name]: opt }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                selectedVariants[v.name] === opt
                                  ? "bg-amber-500 text-black ring-2 ring-amber-500 shadow-sm"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quantity */}
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-700">الكمية المطلوبة :</span>
                  <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-3 py-1">
                    <button 
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="text-gray-500 hover:text-gray-800 font-bold px-1"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm text-gray-900 w-6 text-center">{quantity}</span>
                    <button 
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="text-gray-500 hover:text-gray-800 font-bold px-1"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-3 text-right">
                  <h5 className="text-xs font-bold text-gray-900 border-r-2 border-amber-500 pr-2">معلومات التوصيل</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-gray-600 block mb-1">الاسم الكامل *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="مثال: محمد بلعيدي"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-gray-600 block mb-1">رقم الهاتف *</label>
                      <input 
                        type="tel" 
                        required
                        dir="ltr"
                        placeholder="05 / 06 / 07 XX XX XX"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500 text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-gray-600 block mb-1">الولاية (58 ولاية) *</label>
                      <select 
                        value={selectedWilayaCode}
                        onChange={(e) => setSelectedWilayaCode(Number(e.target.value))}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {WILAYAS_LIST.map((w) => (
                          <option key={w.code} value={w.code}>
                            {w.code < 10 ? `0${w.code}` : w.code} - {w.arName} ({w.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-gray-600 block mb-1">البلدية / العنوان *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="البلدية والشارع"
                        value={commune}
                        onChange={(e) => setCommune(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Delivery Mode Choice */}
                  <div className="pt-2">
                    <label className="text-[11px] font-medium text-gray-600 block mb-2">طريقة التوصيل :</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDeliveryType("home")}
                        className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                          deliveryType === "home"
                            ? "border-amber-500 bg-amber-50/40 text-amber-900 ring-1 ring-amber-500"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className="font-bold text-xs">توصيل للعنوان (المنزل)</span>
                        <span className="text-[11px] font-bold text-amber-600 mt-1">
                          +{currentWilaya.homeDeliveryPrice} د.ج
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryType("desk")}
                        className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                          deliveryType === "desk"
                            ? "border-amber-500 bg-amber-50/40 text-amber-900 ring-1 ring-amber-500"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className="font-bold text-xs">استلام من المكتب (Stop Desk)</span>
                        <span className="text-[11px] font-bold text-amber-600 mt-1">
                          +{currentWilaya.deskDeliveryPrice} د.ج
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Total and Submit Button */}
                <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">المجموع الكلي مع التوصيل :</span>
                    <span className="text-xl font-black text-amber-600">{totalPrice.toLocaleString()} د.ج</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-xl font-black text-sm text-gray-900 shadow-xl hover:opacity-95 transition-all transform active:scale-98 flex items-center justify-center gap-2"
                    style={{ backgroundColor: theme.primaryColor || "#f59e0b" }}
                  >
                    {isSubmitting ? (
                      <span>جاري تسجيل الطلب...</span>
                    ) : (
                      <>
                        <ShoppingBag size={18} />
                        <span>تأكيد الطلب الآن (الدفع عند الاستلام)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
