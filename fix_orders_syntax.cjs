const fs = require('fs');
let content = fs.readFileSync('src/pages/Orders.tsx', 'utf8');

content = content.replace(
  '            </table>\n          </div>\n      </div>',
  '            </table>\n          </div>\n        )}\n      </div>'
);
fs.writeFileSync('src/pages/Orders.tsx', content);
