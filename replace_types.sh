#!/bin/bash
sed -i 's/export interface ProductVariant {/export type VariantType = "text" | "color" | "image_text" | "multiple";\n\nexport interface VariantOptionDef {\n  value: string;\n  priceDiff?: number;\n  colorCode?: string;\n  image?: string;\n  hasImageCard?: boolean;\n}\n\nexport interface ProductVariant {/g' src/pages/Products.tsx
sed -i 's/  options: string\[\];/  type?: VariantType;\n  options: any\[\];/g' src/pages/Products.tsx
