const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const missingIcons = ['MapPin', 'Clock', 'Lock', 'Copy', 'Plus', 'ListTodo', 'Share2', 'ChevronDown', 'Store'];
for (const icon of missingIcons) {
  if (!content.includes(icon + ',')) {
     content = content.replace('XCircle, Package as PackageIcon, PieChart }', `XCircle, Package as PackageIcon, PieChart, ${icon} }`);
  }
}

// Just safely replace it entirely to be sure
const oldImport = /import \{ Rocket, AlertTriangle, RefreshCw, HelpCircle, Sparkles, ChevronRight, ShoppingCart, CheckCircle, Wallet, TrendingUp, ReceiptText, Eye, LineChart as LineChartIcon, Filter, Users, XCircle, Package as PackageIcon, PieChart.*\} from "lucide-react";/;
const newImport = 'import { Rocket, AlertTriangle, RefreshCw, HelpCircle, Sparkles, ChevronRight, ShoppingCart, CheckCircle, Wallet, TrendingUp, ReceiptText, Eye, LineChart as LineChartIcon, Filter, Users, XCircle, Package as PackageIcon, PieChart, MapPin, Clock, Lock, Copy, Plus, ListTodo, Share2, ChevronDown, Store } from "lucide-react";';

content = content.replace(oldImport, newImport);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log("Fixed missing imports");
