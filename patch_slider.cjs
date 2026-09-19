const fs = require('fs');
let code = fs.readFileSync('src/pages/LandingPagePublicView.tsx', 'utf8');

// 1. Add currentImageIndex state
const stateMarker = 'const [isExpired, setIsExpired] = useState(false);';
code = code.replace(stateMarker, stateMarker + '\n  const [currentImageIndex, setCurrentImageIndex] = useState(0);');

// 2. Add heroImages logic right before return (after order logic)
const returnMarker = 'return (\n    <div className="min-h-screen';
const imagesLogic = `
  const gallerySection = page.sections?.find(s => s.type === "gallery");
  const heroImages = gallerySection?.data?.images || (page.product?.image ? [page.product.image] : ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"]);
  
  return (
    <div className="min-h-screen`;
code = code.replace(returnMarker, imagesLogic);

// 3. Replace the img tag with the slider
const heroMarker = `<div className="relative bg-neutral-100 aspect-square sm:aspect-[4/3] w-full overflow-hidden group">
          <img 
            src={page.product?.image || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"} 
            alt={page.product?.name || page.title}
            className="w-full h-full object-cover"
          />`;

const heroSlider = `<div className="relative bg-neutral-100 aspect-square sm:aspect-[4/3] w-full overflow-hidden group">
          <div className="w-full h-full relative">
            {heroImages.map((img, idx) => (
              <img 
                key={idx}
                src={img} 
                alt={page.product?.name || page.title}
                className={\`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 \${idx === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}\`}
              />
            ))}
            
            {/* Slider Controls */}
            {heroImages.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.preventDefault(); setCurrentImageIndex((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1)); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-neutral-900 p-2 rounded-full shadow-md backdrop-blur-sm"
                >
                  <ChevronDown className="w-5 h-5 rotate-90" />
                </button>
                <button 
                  onClick={(e) => { e.preventDefault(); setCurrentImageIndex((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1)); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-neutral-900 p-2 rounded-full shadow-md backdrop-blur-sm"
                >
                  <ChevronDown className="w-5 h-5 -rotate-90" />
                </button>
                
                <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-1.5">
                  {heroImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.preventDefault(); setCurrentImageIndex(idx); }}
                      className={\`h-1.5 rounded-full transition-all \${idx === currentImageIndex ? 'w-6 bg-emerald-500' : 'w-1.5 bg-white/70'}\`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>`;

code = code.replace(heroMarker, heroSlider);

fs.writeFileSync('src/pages/LandingPagePublicView.tsx', code);
