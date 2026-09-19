const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

if (!content.includes('const parseOrderDate = (order: any) => {')) {
  const insertBefore = `export default function Dashboard() {`;
  const parser = `const parseOrderDate = (order: any) => {
  if (order.createdAt?.toDate) return order.createdAt.toDate();
  if (order.date) {
    const parts = order.date.split('/');
    if (parts.length === 3) {
      // Assuming YYYY/MM/DD
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  }
  return new Date();
};\n\n`;
  content = content.replace(insertBefore, parser + insertBefore);
}

fs.writeFileSync('src/pages/Dashboard.tsx', content);
