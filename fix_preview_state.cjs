const fs = require('fs');
let content = fs.readFileSync('src/pages/Orders.tsx', 'utf8');

if (!content.includes('const [previewOrder, setPreviewOrder] = useState<OrderItem | null>(null);')) {
  content = content.replace(
    'const [isModalOpen, setIsModalOpen] = useState(false);',
    'const [isModalOpen, setIsModalOpen] = useState(false);\n  const [previewOrder, setPreviewOrder] = useState<OrderItem | null>(null);'
  );
}

if (!content.includes('HelpCircle')) {
  content = content.replace(
    'import { \n  collection,',
    'import { HelpCircle } from "lucide-react";\nimport { \n  collection,'
  );
}

fs.writeFileSync('src/pages/Orders.tsx', content);
