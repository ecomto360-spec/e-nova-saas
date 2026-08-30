const fs = require('fs');

let content = fs.readFileSync('src/pages/StorefrontView.tsx', 'utf8');

// Add import for getDocs, collection, query, where if needed
content = content.replace(
  'import { doc, getDoc } from "firebase/firestore";',
  'import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";'
);

content = content.replace(
  'const [loading, setLoading] = useState(true);',
  'const [loading, setLoading] = useState(true);\n  const [actualProducts, setActualProducts] = useState<any[]>([]);'
);

// inside loadStoreSettings
let loadSettingsCode = `      if (user) {
        try {
          const docRef = doc(db, "tenants", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.storeName) setStoreName(data.storeName);
            if (data.activeTheme) {
              const found = STORE_THEMES.find(t => t.id === data.activeTheme);
              if (found) setActiveTheme(found);
            }
          }
          
          // Fetch products
          const prodQuery = query(collection(db, "products"), where("userId", "==", user.uid));
          const prodSnap = await getDocs(prodQuery);
          const loadedProducts: any[] = [];
          prodSnap.forEach(docSnap => {
            loadedProducts.push({ id: docSnap.id, ...docSnap.data() });
          });
          setActualProducts(loadedProducts);
        } catch (error) {
          console.error("Error loading store configuration:", error);
        }
      }`;

content = content.replace(
  /if \(user\) \{[\s\S]*?catch \(error\) \{[\s\S]*?console\.error\("Error loading store configuration:", error\);[\s\S]*?\}[\s\S]*?\}/,
  loadSettingsCode
);

content = content.replace(
  '<ThemeStorePreview \n          theme={activeTheme} \n          customStoreName={storeName}\n          isStandaloneView={true}\n        />',
  '<ThemeStorePreview \n          theme={activeTheme} \n          customStoreName={storeName}\n          isStandaloneView={true}\n          actualProducts={actualProducts}\n        />'
);

fs.writeFileSync('src/pages/StorefrontView.tsx', content);
