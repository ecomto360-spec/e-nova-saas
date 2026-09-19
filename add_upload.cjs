const fs = require('fs');
let content = fs.readFileSync('src/pages/LandingPages.tsx', 'utf8');

// 1. Add storage and firebase/storage imports
content = content.replace(
  'import { db } from "../lib/firebase";',
  'import { db, storage } from "../lib/firebase";\nimport { ref, uploadBytes, getDownloadURL } from "firebase/storage";'
);

// Add ImagePlus to lucide-react imports
if (!content.includes('ImagePlus')) {
  content = content.replace('UploadCloud,', ''); // in case
  content = content.replace('X, HelpCircle', 'X, HelpCircle, ImagePlus, UploadCloud');
}

// 2. Add aiImages state
const stateMarker = 'const [aiPromptNotes, setAiPromptNotes] = useState("");';
content = content.replace(
  stateMarker,
  stateMarker + '\n  const [aiImages, setAiImages] = useState<File[]>([]);'
);

// 3. Update handleGenerateWithAI
const genStart = 'const handleGenerateWithAI = async () => {';
const genReplace = `const handleGenerateWithAI = async () => {
    if (!aiPromptName.trim()) {
      showToast("Veuillez saisir le nom du produit", "error");
      return;
    }
    setIsGeneratingAI(true);
    try {
      // Upload images if any
      const uploadedImageUrls: string[] = [];
      if (aiImages.length > 0) {
        for (const file of aiImages) {
          const fileRef = ref(storage, \`landing-ai/\${tenantData?.id || 'public'}/\${Date.now()}-\${file.name.replace(/[^a-zA-Z0-9.]/g, '')}\`);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          uploadedImageUrls.push(url);
        }
      }

      const generated = await generateAILandingContent(
        aiPromptName,
        aiPromptPrice,
        "Tous publics en Algérie",
        aiPromptNotes
      );

      // Add gallery section if we have images
      if (uploadedImageUrls.length > 0) {
        const gallerySection = {
          id: \`sec-gal-\${Date.now()}\`,
          type: "gallery" as const,
          enabled: true,
          title: "Galerie Photos",
          data: {
            heading: "Aperçu sous tous les angles",
            images: uploadedImageUrls
          }
        };
        // Insert after hero
        generated.sections.splice(1, 0, gallerySection);
      }

      const tempProd: LandingProduct = {
        id: \`ai-prod-\${Date.now()}\`,
        name: aiPromptName.trim(),
        price: aiPromptPrice,
        originalPrice: Math.round(aiPromptPrice * 1.45),
        image: uploadedImageUrls[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
        description: aiPromptNotes || \`Offre spéciale sur \${aiPromptName.trim()}\`
      };`;

// replace up to tempProd declaration
// Actually, it's safer to replace from 'const handleGenerateWithAI = async () => {' to 'const newPage: LandingPage = {'
const fullGenMatch = content.match(/const handleGenerateWithAI = async \(\) => \{[\s\S]*?const newPage: LandingPage = \{/);
if (fullGenMatch) {
  content = content.replace(fullGenMatch[0], genReplace + '\n      const newPage: LandingPage = {');
} else {
  console.log("Could not find handleGenerateWithAI match");
}

// 4. Add UI for file upload
const uiMarker = '</textarea>\n              </div>\n            </div>';
const uiReplace = `</textarea>
              </div>

              {/* Upload Images */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Images du produit (optionnel)
                  <span className="block text-[10px] text-neutral-500 font-normal mt-0.5">Ajoutez jusqu'à 5 photos de votre produit</span>
                </label>
                
                <div 
                  className="w-full border-2 border-dashed border-[#6366f1] rounded-xl p-6 text-center cursor-pointer hover:bg-white/5 transition-colors relative"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      const newFiles = Array.from(e.dataTransfer.files).filter(f => 
                        (f.type === 'image/jpeg' || f.type === 'image/png' || f.type === 'image/webp') && 
                        f.size <= 5 * 1024 * 1024
                      );
                      setAiImages(prev => [...prev, ...newFiles].slice(0, 5));
                    }
                  }}
                  onClick={() => document.getElementById('ai-image-upload')?.click()}
                >
                  <UploadCloud className="w-8 h-8 text-[#6366f1] mx-auto mb-2 opacity-80" />
                  <p className="text-sm text-neutral-300 font-medium">Glissez vos images ici ou cliquez pour parcourir</p>
                  <p className="text-[10px] text-neutral-500 mt-1">JPG, PNG, WEBP (Max 5 MB)</p>
                  <input 
                    id="ai-image-upload" 
                    type="file" 
                    multiple 
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const newFiles = Array.from(e.target.files).filter(f => 
                          f.size <= 5 * 1024 * 1024
                        );
                        setAiImages(prev => [...prev, ...newFiles].slice(0, 5));
                      }
                    }}
                  />
                </div>

                {aiImages.length > 0 && (
                  <div className="flex gap-3 mt-3 overflow-x-auto pb-1">
                    {aiImages.map((file, idx) => (
                      <div key={idx} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-neutral-700 bg-neutral-800">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAiImages(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>`;
content = content.replace(uiMarker, uiReplace);

// Reset image state when modal opens/closes
content = content.replace(
  'const [aiModalOpen, setAiModalOpen] = useState(false);',
  'const [aiModalOpen, setAiModalOpen] = useState(false);\n  useEffect(() => { if(!aiModalOpen) setAiImages([]); }, [aiModalOpen]);'
);

fs.writeFileSync('src/pages/LandingPages.tsx', content);
