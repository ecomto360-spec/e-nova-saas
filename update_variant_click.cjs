const fs = require('fs');

let code = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

const onClickColorOld = `onClick={() => setSelectedVariants(prev => ({ ...prev, [v.name]: value }))}`;
const onClickColorNew = `onClick={() => {
                                      setSelectedVariants(prev => ({ ...prev, [v.name]: value }));
                                      if (optObj.image) {
                                        setCurrentProductImage(optObj.image);
                                      }
                                    }}`;

code = code.replace(onClickColorOld, onClickColorNew);
code = code.replace(onClickColorOld, onClickColorNew); // in case there are 2

fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', code);
console.log("Updated onClick");
