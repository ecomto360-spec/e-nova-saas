const fs = require('fs');

let content = fs.readFileSync('src/pages/Customize.tsx', 'utf8');

// I will replace the entire hero block. Let's find it.
// The hero block starts with `{activeMenu === "hero" && (` and ends with `)}` just before `{activeMenu === "announcement" && (`

const heroBlockRegex = /\{activeMenu === "hero" && \([\s\S]*?\}\)\}\s*\{activeMenu === "announcement"/;

const newHeroBlock = `{activeMenu === "hero" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <ImageIcon size={20} className="text-amber-500" />
                      Section Hero
                    </h3>

                    <div className="bg-[#1e1e24] border border-[#2a2a35] p-3 rounded-lg flex items-start gap-3">
                      <div className="mt-0.5 text-[#a3a3b2]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                      </div>
                      <p className="text-xs text-[#d1d1e0] leading-relaxed">
                        Le hero s'affiche en pleine largeur avec un dégradé. Ajoutez une image de fond et un titre accrocheur.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5 flex items-center gap-2">
                        <Monitor size={14} /> Image d'arrière-plan pour ordinateur (optionnel)
                      </label>
                      <p className="text-[10px] text-neutral-500 mb-2 flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                        Dimensions recommandées : 1920×600 pixels (minimum : 800×200)
                      </p>
                      <div className="border border-dashed border-neutral-700 rounded-xl p-4 flex flex-col items-center justify-center bg-[#1e1e24]/50 hover:bg-[#1e1e24] hover:border-amber-500 transition-colors relative overflow-hidden group min-h-[140px]">
                        {!config.heroDesktopBg && (
                          <label className="absolute inset-0 w-full h-full cursor-pointer flex flex-col items-center justify-center z-10">
                            <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={(e) => handleImageUpload(e, 'heroDesktopBg')} />
                          </label>
                        )}
                        {uploadingField === 'heroDesktopBg' ? (
                          <div className="flex flex-col items-center justify-center text-amber-500 z-0">
                            <RotateCw className="w-6 h-6 animate-spin mb-2" />
                            <span className="text-xs font-medium">Téléchargement...</span>
                          </div>
                        ) : config.heroDesktopBg ? (
                          <div className="relative w-full h-full flex flex-col items-center justify-center z-0">
                            <img src={config.heroDesktopBg} alt="Hero Desktop" className="w-full h-24 object-cover rounded mb-2" />
                            <button 
                              onClick={() => updateConfig('heroDesktopBg', '')}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                              Supprimer
                            </button>
                          </div>
                        ) : (
                          <div className="pointer-events-none flex flex-col items-center z-0">
                            <Monitor size={24} className="text-neutral-400 mb-2" />
                            <p className="text-xs text-neutral-300 text-center">Glissez l'image ici ou cliquez pour choisir</p>
                            <p className="text-[10px] text-neutral-500 text-center mt-1">1920×600 pixels recommandé - PNG, JPG</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5 flex items-center gap-2">
                        <Smartphone size={14} /> Image d'arrière-plan pour mobile (optionnel)
                      </label>
                      <p className="text-[10px] text-neutral-500 mb-2 flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                        Dimensions recommandées : 600×800 pixels (minimum : 320×200)
                      </p>
                      <div className="border border-dashed border-amber-500/50 rounded-xl p-4 flex flex-col items-center justify-center bg-[#1e1e24]/50 hover:bg-[#1e1e24] hover:border-amber-500 transition-colors relative overflow-hidden group min-h-[140px]">
                        {!config.heroMobileBg && (
                          <label className="absolute inset-0 w-full h-full cursor-pointer flex flex-col items-center justify-center z-10">
                            <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={(e) => handleImageUpload(e, 'heroMobileBg')} />
                          </label>
                        )}
                        {uploadingField === 'heroMobileBg' ? (
                          <div className="flex flex-col items-center justify-center text-amber-500 z-0">
                            <RotateCw className="w-6 h-6 animate-spin mb-2" />
                            <span className="text-xs font-medium">Téléchargement...</span>
                          </div>
                        ) : config.heroMobileBg ? (
                          <div className="relative w-full h-full flex flex-col items-center justify-center z-0">
                            <img src={config.heroMobileBg} alt="Hero Mobile" className="w-full h-32 object-cover rounded mb-2" />
                            <button 
                              onClick={() => updateConfig('heroMobileBg', '')}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                              Supprimer
                            </button>
                          </div>
                        ) : (
                          <div className="pointer-events-none flex flex-col items-center z-0">
                            <Smartphone size={24} className="text-neutral-400 mb-2" />
                            <p className="text-xs text-neutral-300 text-center">Glissez l'image ici ou cliquez pour choisir</p>
                            <p className="text-[10px] text-neutral-500 text-center mt-1">600×800 pixels recommandé - PNG, JPG</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">H1 hero_title</label>
                      <input type="text" value={config.heroTitle} onChange={(e) => updateConfig('heroTitle', e.target.value)} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5 flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg> hero_subtitle</label>
                      <textarea value={config.heroSubtitle} onChange={(e) => updateConfig('heroSubtitle', e.target.value)} rows={3} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5 flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"></path><path d="M22 2L15 22L11 13L2 9L22 2Z"></path></svg> hero_button_text</label>
                      <input type="text" value={config.heroButtonText} onChange={(e) => updateConfig('heroButtonText', e.target.value)} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5 flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> hero_button_link</label>
                      <input type="text" value={config.heroButtonLink} onChange={(e) => updateConfig('heroButtonLink', e.target.value)} className="w-full bg-[#1e1e24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>
                  </div>
                )}
                {activeMenu === "announcement"`;

const result = content.replace(heroBlockRegex, newHeroBlock);
fs.writeFileSync('src/pages/Customize.tsx', result);
console.log("Updated Hero Section UI");
