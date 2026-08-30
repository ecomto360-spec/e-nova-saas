sed -i '484,485c\
  if (isModalOpen) {\
    return (\
      <div className="pb-24 max-w-7xl mx-auto">\
        {toast && (\
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all ${\
            toast.type === "success" \
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-800 backdrop-blur-md" \
              : "bg-red-950/90 text-red-300 border-red-800 backdrop-blur-md"\
          }`}>\
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}\
            {toast.message}\
          </div>\
        )}\
        \
        <div className="flex items-center justify-between mb-8">\
          <div className="flex items-center gap-3">\
            <div className="w-10 h-10 rounded-full bg-transparent border border-neutral-700 text-white flex items-center justify-center">\
              <PlusCircle className="w-5 h-5" />\
            </div>\
            <h1 className="text-2xl font-bold text-white">\
              {editingProduct ? "Modifier le produit" : "Ajouter un nouveau produit"}\
            </h1>\
          </div>\
          <div className="flex items-center gap-3">\
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-700 text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors">\
              <span className="text-red-500 font-bold">▶</span> Voir le tutoriel\
            </button>\
            <button onClick={handleCloseModal} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-700 text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors">\
              <ArrowLeft className="w-4 h-4" /> Retour aux produits\
            </button>\
          </div>\
        </div>\
\
        <form id="product-form" onSubmit={handleSaveProduct} className="grid grid-cols-1 lg:grid-cols-3 gap-6">\
          {/* LEFT COLUMN */}\
          <div className="lg:col-span-2 space-y-6">\
            {/* Informations de base */}\
            <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-6">\
              <div className="flex items-center gap-2 mb-6">\
                <Info className="w-5 h-5 text-neutral-400" />\
                <h2 className="text-base font-semibold text-white">Informations de base</h2>\
              </div>\
              \
              <div className="space-y-5">\
                <div>\
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Nom du produit <span className="text-red-500">*</span></label>\
                  <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Exemple : iPhone 15 Pro" className="w-full rounded-lg border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors" />\
                </div>\
                \
                <div>\
                  <div className="flex items-center justify-between mb-2">\
                    <label className="text-sm font-medium text-neutral-300">Description</label>\
                    <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500 text-xs font-bold text-black hover:bg-yellow-400 transition-colors">\
                      <Wand2 className="w-3.5 h-3.5" /> Générer la description par IA\
                    </button>\
                  </div>\
                  <div className="border border-neutral-700 rounded-lg overflow-hidden bg-[#16161a]">\
                    <div className="flex items-center flex-wrap gap-1 p-2 border-b border-neutral-700 bg-[#1e1e24] text-neutral-400">\
                       <span className="text-xs px-2 py-1 cursor-pointer hover:bg-neutral-700 rounded">Texte normal <ChevronDown className="w-3 h-3 inline" /></span>\
                       <div className="w-px h-4 bg-neutral-700 mx-1"></div>\
                       <span className="font-bold px-2 py-1 cursor-pointer hover:bg-neutral-700 rounded">B</span>\
                       <span className="italic px-2 py-1 cursor-pointer hover:bg-neutral-700 rounded">I</span>\
                       <span className="underline px-2 py-1 cursor-pointer hover:bg-neutral-700 rounded">U</span>\
                       <span className="line-through px-2 py-1 cursor-pointer hover:bg-neutral-700 rounded">S</span>\
                       <div className="w-px h-4 bg-neutral-700 mx-1"></div>\
                       <span className="px-2 py-1 cursor-pointer hover:bg-neutral-700 rounded text-xs">"</span>\
                    </div>\
                    <textarea rows={6} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Rédigez une description détaillée du produit..." className="w-full bg-transparent p-4 text-sm text-white placeholder-neutral-500 focus:outline-none resize-y" />\
                  </div>\
                </div>\
              </div>\
            </div>\
\
            {/* Prix et stock */}\
            <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-6">\
              <div className="flex items-center gap-2 mb-6">\
                <DollarSign className="w-5 h-5 text-neutral-400" />\
                <h2 className="text-base font-semibold text-white">Prix et stock</h2>\
              </div>\
              \
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">\
                <div>\
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Prix <span className="text-red-500">*</span></label>\
                  <div className="flex">\
                    <input type="number" required min={0} value={formPrice} onChange={(e) => setFormPrice(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0.00" className="flex-1 rounded-l-lg border border-neutral-700 border-r-0 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors" />\
                    <span className="flex items-center px-4 rounded-r-lg border border-neutral-700 bg-[#25252d] text-neutral-400 text-sm">DA</span>\
                  </div>\
                </div>\
                <div>\
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Prix avant remise</label>\
                  <div className="flex mb-1">\
                    <input type="number" min={0} value={formOriginalPrice} onChange={(e) => setFormOriginalPrice(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0.00" className="flex-1 rounded-l-lg border border-neutral-700 border-r-0 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors" />\
                    <span className="flex items-center px-4 rounded-r-lg border border-neutral-700 bg-[#25252d] text-neutral-400 text-sm">DA</span>\
                  </div>\
                  <p className="text-xs text-neutral-500">Laisser vide s'\''il n'\''y a pas de remise</p>\
                </div>\
                <div>\
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Coût du produit</label>\
                  <div className="flex mb-1">\
                    <input type="number" min={0} value={formCostPrice} onChange={(e) => setFormCostPrice(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0.00" className="flex-1 rounded-l-lg border border-neutral-700 border-r-0 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors" />\
                    <span className="flex items-center px-4 rounded-r-lg border border-neutral-700 bg-[#25252d] text-neutral-400 text-sm">DA</span>\
                  </div>\
                  <p className="text-xs text-neutral-500">Prix d'\''achat ou coût (usage interne uniquement)</p>\
                </div>\
                <div>\
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Code produit (SKU) <span className="text-neutral-500 font-normal text-xs">(optionnel)</span></label>\
                  <input type="text" value={formSku} onChange={(e) => setFormSku(e.target.value)} placeholder="Code produit (SKU)" className="w-full rounded-lg border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors" />\
                </div>\
                <div>\
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Poids <span className="text-neutral-500 font-normal text-xs">(optionnel)</span></label>\
                  <div className="flex mb-1">\
                    <span className="flex items-center px-3 border border-neutral-700 border-r-0 bg-[#16161a] rounded-l-lg"><AlertCircle className="w-4 h-4 text-yellow-500" /></span>\
                    <input type="number" min={0} value={formWeight} onChange={(e) => setFormWeight(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0.00" className="flex-1 border border-neutral-700 bg-[#16161a] px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none transition-colors" />\
                    <span className="flex items-center px-4 rounded-r-lg border border-neutral-700 bg-[#25252d] text-neutral-400 text-sm">kg</span>\
                  </div>\
                  <p className="text-xs text-neutral-500 leading-relaxed">Poids du produit en kilogrammes. Au-delà de 5 kg, des frais de livraison supplémentaires s'\''appliquent</p>\
                </div>\
              </div>\
\
              <div className="mt-8 space-y-6">\
                <div>\
                  <label className="flex items-center gap-3 cursor-pointer">\
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formTrackStock ? "bg-white" : "bg-neutral-600"}`} onClick={() => setFormTrackStock(!formTrackStock)}>\
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${formTrackStock ? "translate-x-4" : "translate-x-1"}`} />\
                    </div>\
                    <span className="text-sm font-medium text-white">Suivi du stock</span>\
                  </label>\
                  <p className="text-xs text-neutral-500 mt-2 flex items-start gap-1"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Lorsque le suivi du stock est désactivé, le produit apparaîtra toujours comme disponible</p>\
                </div>\
                <div>\
                  <label className="flex items-center gap-3 cursor-pointer">\
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formFragile ? "bg-white" : "bg-neutral-600"}`} onClick={() => setFormFragile(!formFragile)}>\
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${formFragile ? "translate-x-4" : "translate-x-1"}`} />\
                    </div>\
                    <span className="text-sm font-medium text-white">Produit fragile</span>\
                  </label>\
                  <p className="text-xs text-neutral-500 mt-2 flex items-start gap-1"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Le colis sera marqué comme fragile lors de l'\''envoi à la société de livraison (si elle prend en charge cette option)</p>\
                </div>\
                <div>\
                  <label className="flex items-center gap-3 cursor-pointer">\
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formTrackVariantStock ? "bg-white" : "bg-neutral-600"}`} onClick={() => setFormTrackVariantStock(!formTrackVariantStock)}>\
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${formTrackVariantStock ? "translate-x-4" : "translate-x-1"}`} />\
                    </div>\
                    <span className="text-sm font-medium text-white flex items-center gap-2"><Boxes className="w-4 h-4" /> Suivi du stock des variantes</span>\
                  </label>\
                  <p className="text-xs text-neutral-500 mt-2 flex items-start gap-1"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Le stock sera suivi pour chaque option (couleur/taille) séparément. Lorsque toutes les options sont épuisées, le produit apparaît comme indisponible.</p>\
                  <p className="text-xs text-neutral-500 mt-1 flex items-start gap-1"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Suivre le stock de chaque combinaison d'\''options séparément (ex: Taille 32 + Bleu = 2 en stock)</p>\
                </div>\
              </div>\
            </div>\
\
            {/* Variantes */}\
            <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-6">\
              <div className="flex items-center justify-between mb-4">\
                <div className="flex items-center gap-2">\
                  <Boxes className="w-5 h-5 text-neutral-400" />\
                  <h2 className="text-base font-semibold text-white">Variantes (Couleurs / Options)</h2>\
                </div>\
                <button type="button" onClick={handleAddVariant} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-600 text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors">\
                  <PlusCircle className="w-3.5 h-3.5" /> Ajouter un groupe\
                </button>\
              </div>\
              <p className="text-xs text-neutral-500 flex items-start gap-1 mb-6"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Ajoutez des groupes de variantes comme : couleurs, tailles, capacité... Le client doit choisir une option de chaque groupe</p>\
              \
              <div className="space-y-4">\
                {formVariants.map((variant, idx) => (\
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-[#16161a] border border-neutral-800">\
                    <div className="flex-1">\
                      <div className="flex items-center justify-between mb-2">\
                        <span className="text-sm font-medium text-white">{variant.name}</span>\
                        <button type="button" onClick={() => handleRemoveVariant(idx)} className="text-neutral-500 hover:text-red-400"><X className="w-4 h-4" /></button>\
                      </div>\
                      <div className="flex flex-wrap gap-2">\
                        {variant.options.map((opt, i) => (\
                          <span key={i} className="px-2.5 py-1 rounded-md bg-neutral-800 text-xs text-neutral-300">{opt}</span>\
                        ))}\
                      </div>\
                    </div>\
                  </div>\
                ))}\
\
                <div className="flex items-center gap-3 p-4 rounded-xl border border-neutral-800 bg-[#16161a]">\
                  <input type="text" placeholder="Type (ex: Taille)" value={variantInputName} onChange={(e) => setVariantInputName(e.target.value)} className="w-1/3 rounded-lg border border-neutral-700 bg-[#1e1e24] px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500" />\
                  <input type="text" placeholder="Options séparées par des virgules" value={variantInputOptions} onChange={(e) => setVariantInputOptions(e.target.value)} className="flex-1 rounded-lg border border-neutral-700 bg-[#1e1e24] px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500" />\
                  <button type="button" onClick={handleAddVariant} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-semibold transition-colors">+ Ajouter</button>\
                </div>\
              </div>\
            </div>\
          </div>\
\
          {/* RIGHT COLUMN */}\
          <div className="space-y-6">\
            {/* Images du produit */}\
            <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-6">\
              <div className="flex items-center gap-2 mb-6">\
                <UploadCloud className="w-5 h-5 text-neutral-400" />\
                <h2 className="text-base font-semibold text-white">Images du produit <span className="text-red-500">*</span></h2>\
              </div>\
              <div className="border border-dashed border-neutral-600 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-neutral-800/50 transition-colors">\
                <UploadCloud className="w-8 h-8 text-neutral-400 mb-3" />\
                <span className="text-sm font-medium text-white mb-1">Cliquez pour télécharger</span>\
                <span className="text-xs text-neutral-500">Au moins une image requise</span>\
              </div>\
              {/* Optional: URL Input fallback for images since backend uses URLs for preset */}\
              <div className="mt-4">\
                <label className="block text-xs font-medium text-neutral-400 mb-2">Ou URL de l'\''image</label>\
                <input type="text" value={formImage} onChange={(e) => setFormImage(e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-neutral-700 bg-[#16161a] px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-yellow-500 focus:outline-none" />\
              </div>\
            </div>\
\
            {/* Catégorie et statut */}\
            <div className="bg-[#1e1e24] border border-neutral-800 rounded-2xl p-6">\
              <div className="flex items-center gap-2 mb-6">\
                <FolderTree className="w-5 h-5 text-neutral-400" />\
                <h2 className="text-base font-semibold text-white">Catégorie et statut</h2>\
              </div>\
              \
              <div className="space-y-5">\
                <div>\
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Catégorie</label>\
                  <div className="relative">\
                    <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full rounded-lg border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none transition-colors appearance-none">\
                      <option value="Sans catégorie">Sans catégorie</option>\
                      {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}\
                      <option value="Général">Général</option>\
                      <option value="Vêtements">Vêtements</option>\
                    </select>\
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />\
                  </div>\
                </div>\
\
                <div>\
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Statut</label>\
                  <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)} className="w-full rounded-lg border border-neutral-700 bg-[#16161a] px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none transition-colors">\
                    <option value="active">Actif - Disponible à la vente</option>\
                    <option value="inactive">Inactif - Masqué</option>\
                  </select>\
                </div>\
\
                <div className="pt-2">\
                  <label className="flex items-center gap-3 cursor-pointer mb-2">\
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formFeatured ? "bg-white" : "bg-neutral-600"}`} onClick={() => setFormFeatured(!formFeatured)}>\
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${formFeatured ? "translate-x-4" : "translate-x-1"}`} />\
                    </div>\
                    <span className="text-sm font-medium text-white flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Produit en vedette</span>\
                  </label>\
                  <p className="text-xs text-neutral-500 leading-relaxed">Les produits en vedette apparaissent dans la section "Produits en vedette" de la page d'\''accueil</p>\
                </div>\
              </div>\
            </div>\
\
            {/* Submit Button */}\
            <button type="submit" disabled={isSaving} className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-yellow-500 text-sm font-bold text-black hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/10">\
              {isSaving ? (\
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>\
              ) : (\
                <><Check className="w-4 h-4 stroke-[2.5]" /> {editingProduct ? "Mettre à jour le produit" : "Ajouter le produit"}</>\
              )}\
            </button>\
          </div>\
        </form>\
      </div>\
    );\
  }\
\
  return (\
' src/pages/Products.tsx
