const fs = require('fs');
let content = fs.readFileSync('src/pages/Orders.tsx', 'utf8');

const tableStart = '<div className="overflow-x-auto">';
const tableEnd = '</div>\n        )}';

const newTable = `<div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <tbody className="divide-y divide-neutral-800/70">
                {filteredOrders.map((order, index) => {
                  const isSelected = selectedIds.includes(order.id);
                  const badge = getStatusBadge(order.status);
                  
                  // Extract first product image if available, else placeholder
                  const firstProduct = order.items && order.items.length > 0 ? order.items[0] : null;
                  const imageUrl = firstProduct?.image || "https://placehold.co/100x100/1e1e24/404040?text=Item";
                  
                  // Format date and time
                  let dateStr = "";
                  let timeStr = "";
                  if (order.date) {
                    const parts = order.date.split(' ');
                    dateStr = parts[0];
                    timeStr = parts[1] || "";
                  } else {
                     dateStr = "N/A";
                  }
                  
                  // Display ID (just the short number or # + index)
                  const displayId = \`#\${index + 1}\`;

                  return (
                    <tr 
                      key={order.id}
                      onClick={() => setPreviewOrder(order)}
                      className={\`hover:bg-[#16161a]/60 transition-colors cursor-pointer \${isSelected ? "bg-yellow-500/5" : ""}\`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 w-10" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(order.id)}
                          className="rounded border-neutral-700 bg-neutral-900 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-neutral-900 cursor-pointer" 
                        />
                      </td>
                      
                      {/* Product Image & ID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden flex-shrink-0 border border-neutral-700 relative">
                             <img src={imageUrl} alt="Product" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-white text-base">
                             {displayId} <HelpCircle className="w-4 h-4 text-neutral-500" />
                          </div>
                        </div>
                      </td>
                      
                      {/* Client */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white text-base">{order.client}</span>
                          <span className="text-yellow-500 text-xs mt-0.5">{order.phone}</span>
                        </div>
                      </td>
                      
                      {/* Total */}
                      <td className="px-4 py-3 font-bold text-white text-base">
                        {order.total.toLocaleString()} DA
                      </td>
                      
                      {/* Status */}
                      <td className="px-4 py-3">
                        <button
                           className={\`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border transition-all \${badge.cls}\`}
                        >
                           {order.status}
                        </button>
                      </td>
                      
                      {/* Date */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col text-neutral-400 text-sm">
                           <span className="font-medium text-white">{dateStr}</span>
                           <span className="text-xs">{timeStr}</span>
                        </div>
                      </td>
                      
                      {/* Actions (View Full Details) - Desktop only hover or visible */}
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => window.location.href = \`/dashboard/orders/\${order.id}\`}
                            title="Voir les détails complets"
                            className="px-4 py-1.5 rounded-lg bg-[#2b2b36] hover:bg-[#3b3b46] text-white flex items-center gap-2 transition-colors cursor-pointer text-xs font-semibold ml-auto"
                          >
                            <Eye className="w-4 h-4" /> Voir
                          </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>`;

const before = content.substring(0, content.indexOf(tableStart));
const afterIndex = content.indexOf(tableEnd) + tableEnd.length;
const after = content.substring(afterIndex);

let newContent = before + newTable + after;
fs.writeFileSync('src/pages/Orders.tsx', newContent);
