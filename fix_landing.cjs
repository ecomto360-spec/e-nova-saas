const fs = require('fs');

const fileContent = fs.readFileSync('src/pages/LandingPagePublicView.tsx', 'utf8');

// The file needs to be rewritten starting from `return (`
const returnIndex = fileContent.indexOf('return (');
const topPart = fileContent.substring(0, returnIndex);

const newRender = `return (
    <div className="min-h-screen bg-neutral-50 font-sans pb-24 sm:pb-10 selection:bg-emerald-200">
      {/* 1. Bandeau d'urgence (sticky top) */}
      <div className="sticky top-0 z-50 bg-neutral-900 text-white text-[11px] font-bold tracking-wider py-2.5 px-4 text-center flex items-center justify-center gap-2 shadow-md">
        <Clock className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
        <span className="uppercase">⚡ Offre limitée • Paiement à réception (58 Wilayas)</span>
      </div>

      <div className="w-full max-w-lg mx-auto bg-white sm:my-8 sm:shadow-2xl sm:rounded-2xl overflow-hidden border-x sm:border border-neutral-200 relative">
        
        {/* 2. Hero : image produit + titre H1 ultra-bold + prix barré/réduit + CTA principal */}
        <div className="relative bg-neutral-100 aspect-square sm:aspect-[4/3] w-full overflow-hidden group">
          <img 
            src={page.product?.image || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"} 
            alt={page.product?.name || page.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
            -30% Promo
          </div>
        </div>

        <div className="p-5 md:p-6 border-b border-neutral-100">
          <div className="flex items-center gap-1 mb-3 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
            <span className="text-xs text-neutral-500 font-bold ml-1.5">(4.9/5 • 148 avis)</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-neutral-900 leading-tight mb-4 tracking-tight">
            {page.title}
          </h1>

          <div className="flex flex-col gap-2 mb-6 bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-emerald-600 tracking-tighter">
                {currentPrice.toLocaleString("fr-DZ")} <span className="text-xl">DZD</span>
              </span>
              <span className="text-base line-through text-neutral-400 font-bold">
                {originalPrice.toLocaleString("fr-DZ")} DZD
              </span>
            </div>
            <div className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg inline-flex w-max">
              🔥 Économisez {(originalPrice - currentPrice).toLocaleString("fr-DZ")} DZD aujourd'hui
            </div>
          </div>

          <a 
            href="#checkout-form"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-6 rounded-xl text-center text-base shadow-[0_8px_30px_rgb(16,185,129,0.3)] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            <ShoppingCart className="w-5 h-5" />
            COMMANDER MAINTENANT
          </a>
        </div>

        {/* 3. Compte à rebours d'urgence */}
        <div className="bg-red-50 p-5 border-b border-red-100 text-center">
          <div className="text-xs font-black text-red-600 mb-3 uppercase tracking-widest">
            La promotion se termine dans :
          </div>
          <div className="flex items-center justify-center gap-3 font-mono">
            <div className="flex flex-col items-center">
              <span className="bg-white text-red-600 border-2 border-red-200 text-2xl font-black px-4 py-2 rounded-xl shadow-sm w-16 text-center">02</span>
              <span className="text-[10px] text-red-500 font-bold mt-1.5 uppercase">Heures</span>
            </div>
            <span className="text-red-300 font-black text-2xl mb-5">:</span>
            <div className="flex flex-col items-center">
              <span className="bg-white text-red-600 border-2 border-red-200 text-2xl font-black px-4 py-2 rounded-xl shadow-sm w-16 text-center">47</span>
              <span className="text-[10px] text-red-500 font-bold mt-1.5 uppercase">Minutes</span>
            </div>
            <span className="text-red-300 font-black text-2xl mb-5">:</span>
            <div className="flex flex-col items-center">
              <span className="bg-white text-red-600 border-2 border-red-200 text-2xl font-black px-4 py-2 rounded-xl shadow-sm w-16 text-center">35</span>
              <span className="text-[10px] text-red-500 font-bold mt-1.5 uppercase">Secs</span>
            </div>
          </div>
        </div>

        {/* 4. Avantages clés */}
        <div className="p-5 border-b border-neutral-100 bg-white">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
              <Banknote className="w-7 h-7 text-emerald-600 mb-2" />
              <span className="font-bold text-xs text-neutral-900 uppercase">Paiement à la réception</span>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
              <Truck className="w-7 h-7 text-emerald-600 mb-2" />
              <span className="font-bold text-xs text-neutral-900 uppercase">Livraison 58 Wilayas</span>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
              <RotateCcw className="w-7 h-7 text-emerald-600 mb-2" />
              <span className="font-bold text-xs text-neutral-900 uppercase">Échange facile (7 jours)</span>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
              <ShieldCheck className="w-7 h-7 text-emerald-600 mb-2" />
              <span className="font-bold text-xs text-neutral-900 uppercase">Garantie Qualité</span>
            </div>
          </div>
        </div>

        {/* 5. Galerie produit + description détaillée (using sections if available, else fallback) */}
        <div className="p-5 md:p-6 border-b border-neutral-100 bg-white space-y-6">
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">À propos du produit</h2>
          
          <div className="prose prose-sm text-neutral-600 leading-relaxed font-medium">
            {page.description ? (
              <p>{page.description}</p>
            ) : (
              <p>Découvrez notre produit phare, conçu pour répondre à tous vos besoins. Fabriqué avec des matériaux de haute qualité pour une durabilité maximale.</p>
            )}
          </div>

          {page.sections && page.sections.length > 0 ? (
            <div className="space-y-4 mt-6">
              {page.sections.filter(s => s.type === 'features').map((section, idx) => (
                <div key={idx} className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100">
                  <h3 className="font-bold text-neutral-900 mb-3">{section.title}</h3>
                  {section.content && (
                    <ul className="space-y-2">
                      {section.content.split('\n').map((line, i) => line.trim() && (
                        <li key={i} className="flex items-start gap-2 text-sm text-neutral-700 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{line.replace(/^[•\\-]/, '').trim()}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
             <div className="space-y-3 mt-6">
               {[
                 "Qualité supérieure garantie",
                 "Facile à utiliser au quotidien",
                 "Design moderne et élégant",
                 "Recommandé par 98% de nos clients"
               ].map((feature, i) => (
                 <div key={i} className="flex items-start gap-3">
                   <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                   <span className="text-sm font-bold text-neutral-800">{feature}</span>
                 </div>
               ))}
             </div>
          )}

          <div className="pt-4">
            <a 
              href="#checkout-form"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-6 rounded-xl text-center text-base shadow-[0_8px_30px_rgb(16,185,129,0.3)] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            >
              <ShoppingCart className="w-5 h-5" />
              JE VEUX MON PACK
            </a>
          </div>
        </div>

        {/* 7. Avis clients vérifiés */}
        <div className="p-5 md:p-6 border-b border-neutral-100 bg-neutral-50">
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight mb-6 text-center">Ils nous font confiance</h2>
          
          <div className="space-y-4">
            {[
              { name: "Amine K.", wilaya: "Alger", rating: 5, text: "Livraison super rapide en 24h, le produit est conforme à la description. Je recommande !" },
              { name: "Samira B.", wilaya: "Oran", rating: 5, text: "Très satisfaite de mon achat. Le service client est au top et le paiement à la livraison rassure." },
              { name: "Yacine M.", wilaya: "Setif", rating: 5, text: "Qualité excellente. C'est exactement ce que je cherchais. Merci l'équipe !" }
            ].map((review, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-neutral-900 flex items-center gap-1">
                      {review.name}
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div className="text-[11px] text-neutral-400 font-medium">{review.wilaya} • Achat vérifié</div>
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(review.rating)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-current" />)}
                  </div>
                </div>
                <p className="text-sm text-neutral-700 font-medium leading-relaxed">
                  "{review.text}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 8. FAQ */}
        <div className="p-5 md:p-6 border-b border-neutral-100 bg-white">
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight mb-6 text-center">Questions fréquentes</h2>
          <div className="space-y-3">
            {[
              { q: "Comment se passe la livraison ?", a: "Nous livrons dans les 58 wilayas. Le délai est généralement de 24h à 72h selon votre région." },
              { q: "Puis-je payer à la réception ?", a: "Absolument ! Vous ne payez que lorsque le livreur vous remet le colis en main propre." },
              { q: "Et si le produit ne me plaît pas ?", a: "Vous bénéficiez d'une garantie satisfait ou remboursé de 7 jours pour effectuer un échange ou un retour." }
            ].map((faq, i) => (
              <details key={i} className="group bg-neutral-50 border border-neutral-100 rounded-2xl [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-1.5 p-4 text-neutral-900 font-bold">
                  {faq.q}
                  <span className="shrink-0 rounded-full bg-white p-1.5 text-neutral-900 sm:p-3 group-open:-rotate-180 transition-transform">
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </summary>
                <div className="px-4 pb-4 text-sm text-neutral-600 font-medium leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Checkout Form */}
        <div id="checkout-form" className="p-5 md:p-8 bg-neutral-100 scroll-mt-10">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-black text-neutral-900 tracking-tight">
              Finaliser la commande
            </h3>
            <p className="text-sm text-neutral-600 mt-2 font-bold">
              Remplissez ce formulaire et payez à la réception
            </p>
          </div>

          {!orderSuccess ? (
            <form onSubmit={handleCreatePublicOrder} className="space-y-6">
              
              {/* 6. Sélecteur de pack */}
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
                <label className="block text-xs font-black text-neutral-900 uppercase tracking-widest mb-1">
                  1. Choisissez votre pack
                </label>
                
                <div 
                  onClick={() => setSelectedBundleId("b1")}
                  className={\`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all \${
                    selectedBundleId === "b1" ? "border-emerald-600 bg-emerald-50" : "border-neutral-100 bg-neutral-50 hover:border-neutral-200"
                  }\`}
                >
                  <div className="flex items-center gap-3">
                    <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center \${
                      selectedBundleId === "b1" ? "border-emerald-600" : "border-neutral-300 bg-white"
                    }\`}>
                      {selectedBundleId === "b1" && <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-neutral-900">Pack 1 Pièce</div>
                    </div>
                  </div>
                  <div className="font-black text-base text-neutral-900">{currentPrice.toLocaleString("fr-DZ")} DZD</div>
                </div>

                <div 
                  onClick={() => setSelectedBundleId("b2")}
                  className={\`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between relative transition-all overflow-hidden \${
                    selectedBundleId === "b2" ? "border-emerald-600 bg-emerald-50" : "border-neutral-100 bg-neutral-50 hover:border-neutral-200"
                  }\`}
                >
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded-bl-xl shadow-sm">
                    Le plus vendu
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center \${
                      selectedBundleId === "b2" ? "border-emerald-600" : "border-neutral-300 bg-white"
                    }\`}>
                      {selectedBundleId === "b2" && <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-neutral-900">Pack 2 Pièces</div>
                      <div className="text-[11px] text-red-600 font-bold">-15% de réduction</div>
                    </div>
                  </div>
                  <div className="font-black text-base text-emerald-700">
                    {Math.round(currentPrice * 1.8).toLocaleString("fr-DZ")} DZD
                  </div>
                </div>

                <div 
                  onClick={() => setSelectedBundleId("b3")}
                  className={\`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between relative transition-all overflow-hidden \${
                    selectedBundleId === "b3" ? "border-emerald-600 bg-emerald-50" : "border-neutral-100 bg-neutral-50 hover:border-neutral-200"
                  }\`}
                >
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded-bl-xl shadow-sm">
                    Livraison Offerte
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center \${
                      selectedBundleId === "b3" ? "border-emerald-600" : "border-neutral-300 bg-white"
                    }\`}>
                      {selectedBundleId === "b3" && <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-neutral-900">Pack Famille (3)</div>
                      <div className="text-[11px] text-emerald-600 font-bold">Livraison 0 DZD</div>
                    </div>
                  </div>
                  <div className="font-black text-base text-emerald-700">
                    {Math.round(currentPrice * 2.5).toLocaleString("fr-DZ")} DZD
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="space-y-4 bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
                <label className="block text-xs font-black text-neutral-900 uppercase tracking-widest mb-1">
                  2. Coordonnées de livraison
                </label>
                
                <div className="space-y-3.5">
                  <div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nom et Prénom *"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-sm text-neutral-900 font-medium placeholder:text-neutral-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  
                  <div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Numéro de téléphone *"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-sm text-neutral-900 font-medium placeholder:text-neutral-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <div>
                    <select
                      value={selectedWilayaCode}
                      onChange={(e) => setSelectedWilayaCode(Number(e.target.value))}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-sm text-neutral-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none"
                    >
                      {ALGERIAN_WILAYAS.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.code.toString().padStart(2, '0')} - {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("home")}
                      className={\`py-3 px-2 rounded-xl border-2 text-xs font-black text-center transition-all \${
                        deliveryType === "home" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                      }\`}
                    >
                      🏠 À Domicile
                      <div className="text-[10px] font-bold mt-0.5 opacity-80">
                        {selectedBundleId === "b3" ? "0 DZD" : \`\${curWilaya.homeDeliveryPrice} DZD\`}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType("desk")}
                      className={\`py-3 px-2 rounded-xl border-2 text-xs font-black text-center transition-all \${
                        deliveryType === "desk" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                      }\`}
                    >
                      🏢 Bureau (Stop Desk)
                      <div className="text-[10px] font-bold mt-0.5 opacity-80">
                        {selectedBundleId === "b3" ? "0 DZD" : \`\${curWilaya.deskDeliveryPrice} DZD\`}
                      </div>
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Commune / Adresse exacte"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-sm text-neutral-900 font-medium placeholder:text-neutral-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Order Summary Calculation */}
              <div className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800 space-y-3 text-white shadow-xl">
                <div className="flex justify-between text-sm font-medium text-neutral-300">
                  <span>Produits ({quantity} pièce{quantity > 1 ? "s" : ""})</span>
                  <span>{itemsTotal.toLocaleString("fr-DZ")} DZD</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-neutral-300">
                  <span>Livraison ({curWilaya.name})</span>
                  <span className={deliveryFee === 0 ? "text-emerald-400 font-bold" : ""}>
                    {deliveryFee === 0 ? "GRATUITE" : \`\${deliveryFee} DZD\`}
                  </span>
                </div>
                <div className="border-t border-neutral-700 pt-3 flex justify-between font-black text-xl text-white">
                  <span>TOTAL À PAYER</span>
                  <span className="tracking-tight text-emerald-400">{grandTotal.toLocaleString("fr-DZ")} <span className="text-sm">DZD</span></span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-xl text-center text-lg shadow-[0_8px_30px_rgb(16,185,129,0.4)] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              >
                <Check className="w-6 h-6" />
                CONFIRMER MA COMMANDE
              </button>
              
              <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 font-bold uppercase tracking-widest mt-4">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Paiement 100% sécurisé à la livraison
              </div>
            </form>
          ) : (
            <div className="text-center py-10 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white p-6 rounded-2xl shadow-xl border border-emerald-100">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-3xl font-black text-neutral-900 tracking-tight">
                Félicitations !
              </h4>
              <p className="text-sm font-bold text-neutral-600">
                Votre commande a été enregistrée avec succès.
              </p>
              
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 text-left space-y-2 text-sm text-neutral-800 font-medium mt-6">
                <div className="flex justify-between border-b border-neutral-200 pb-2 mb-2">
                  <span className="text-neutral-500 font-bold">Référence</span>
                  <strong className="text-neutral-900 font-mono text-base">{orderReference}</strong>
                </div>
                <div className="flex justify-between border-b border-neutral-200 pb-2 mb-2">
                  <span className="text-neutral-500 font-bold">Total à payer</span>
                  <strong className="text-emerald-600 font-black text-base">{grandTotal.toLocaleString("fr-DZ")} DZD</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-bold">Destinataire</span>
                  <strong className="text-neutral-900">{fullName}</strong>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mt-6">
                <p className="text-xs text-amber-800 font-bold leading-relaxed">
                  ⚠️ Un conseiller va vous contacter au <span className="font-black text-amber-900 text-sm">{phone}</span> dans les plus brefs délais pour confirmer l'expédition. Restez joignable !
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => setOrderSuccess(false)}
                className="text-sm text-neutral-900 font-black underline decoration-neutral-300 underline-offset-4 pt-6 inline-block hover:text-emerald-600 transition-colors"
              >
                Effectuer un autre achat
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Sticky Mobile Bottom Bar (Hidden on desktop or when success) */}
      {!orderSuccess && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-3 shadow-[0_-10px_40px_rgb(0,0,0,0.1)] sm:hidden z-50 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-full duration-500">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total</span>
            <span className="font-black text-emerald-600 text-xl leading-none">{grandTotal.toLocaleString("fr-DZ")} <span className="text-[10px] text-neutral-400">DZD</span></span>
          </div>
          <a 
            href="#checkout-form"
            className="bg-emerald-600 text-white font-black py-3.5 px-6 rounded-xl text-sm flex items-center gap-2 active:scale-95 transition-transform shadow-[0_4px_15px_rgb(16,185,129,0.4)]"
          >
            COMMANDER
          </a>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/pages/LandingPagePublicView.tsx', topPart + newRender);
