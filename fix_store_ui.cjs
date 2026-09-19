const fs = require('fs');
let content = fs.readFileSync('src/components/storefront/ThemeStorePreview.tsx', 'utf8');

const oldSuccessBlock = `          {orderSuccess ? (
             <div className="bg-white rounded-3xl p-12 text-center space-y-6 shadow-sm border border-gray-100 max-w-3xl mx-auto">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-3xl font-black text-gray-900">تم تسجيل طلبكم بنجاح !</h3>
                <p className="text-gray-600 max-w-md mx-auto leading-relaxed text-lg">
                  شكراً لثقتكم بنا، سيتصل بكم أحد ممثلي خدمة العملاء على الرقم <strong className="text-gray-900" dir="ltr">{customerPhone}</strong> لتأكيد العنوان وشحن طلبيتكم في أسرع وقت.
                </p>
                <div className="bg-gray-50 rounded-2xl p-6 space-y-3 max-w-sm mx-auto text-right border border-gray-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">المنتج :</span>
                    <span className="font-bold text-gray-900">{selectedProduct.nameAr || selectedProduct.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">الكمية :</span>
                    <span className="font-bold text-gray-900">{quantity}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">الولاية :</span>
                    <span className="font-bold text-gray-900">{currentWilaya.name}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 font-black text-lg mt-2">
                    <span>المبلغ الإجمالي :</span>
                    <span className="text-amber-600">{totalPrice.toLocaleString()} د.ج</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setOrderSuccess(false);
                  }}
                  className="px-8 py-4 rounded-xl font-bold text-white shadow-md hover:opacity-90 transition-all bg-[#1c192b] text-lg w-full sm:w-auto"
                >
                  تصفح المزيد من المنتجات
                </button>
              </div>
          ) : (`;


const newSuccessBlock = `          {trackingView ? (
             <div className="bg-gray-50 rounded-3xl pb-12 shadow-sm border border-gray-100 max-w-2xl mx-auto overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-[#1c192b] text-white pt-12 pb-24 px-6 text-center relative">
                   <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                   <div className="relative z-10">
                     <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-lg backdrop-blur-md">
                        <Package className="text-white w-8 h-8" />
                     </div>
                     <h3 className="text-3xl font-black mb-2 tracking-wide">تتبع طلبك</h3>
                     <p className="text-gray-300 opacity-90">تابع حالة طلبك في الوقت الفعلي</p>
                   </div>
                </div>

                <div className="px-6 -mt-12 relative z-20">
                   <div className="bg-white rounded-2xl p-4 shadow-xl border border-gray-100 mb-6">
                      <div className="flex items-center justify-between text-sm relative">
                         <div className="flex items-center p-1 w-full gap-2">
                            <button className="bg-[#1c192b] hover:bg-[#2d2a3f] text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors w-24">
                               لصق <ClipboardList size={16} />
                            </button>
                            <input type="text" value={orderId} readOnly className="flex-1 bg-white text-gray-800 px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none text-left font-mono tracking-wider" dir="ltr" />
                         </div>
                      </div>
                      <p className="text-center text-xs text-gray-400 mt-4 mb-2 flex items-center justify-center gap-1"><CheckCircle2 size={12}/> ستجد رقم الطلب في رسالة التأكيد المرسلة إليك</p>
                   </div>

                   <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-6 relative overflow-hidden">
                      <div className="flex justify-between items-start mb-10">
                         <div className="text-right flex-1 pt-1">
                            <span className="text-gray-500 text-xs block mb-1">رقم الطلب</span>
                            <div className="font-mono font-bold text-gray-900 text-sm flex items-center justify-end" dir="ltr">
                               # {orderId}
                            </div>
                            <div className="text-gray-400 text-xs flex items-center gap-1 justify-end mt-1">
                               <Clock size={12} /> {new Date().toLocaleDateString('fr-CA')}
                            </div>
                         </div>
                         <div className="bg-amber-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-md h-fit whitespace-nowrap">
                            <Clock size={16} /> قيد الانتظار
                         </div>
                      </div>
                      
                      <div className="text-center mb-8">
                         <div className="flex items-center justify-center gap-2 mb-8 border-b border-gray-100 pb-4">
                           <span className="text-sm font-bold text-gray-700">مراحل الطلب</span>
                           <Package size={16} className="text-gray-400"/> 
                         </div>
                         
                         <div className="relative flex justify-between items-start w-full px-2 max-w-md mx-auto">
                            <div className="absolute top-5 left-8 right-8 h-[2px] bg-gray-200 -z-10"></div>
                            
                            <div className="flex flex-col items-center gap-2 flex-1">
                               <div className="w-10 h-10 rounded-full bg-[#1c192b] text-white flex items-center justify-center shadow-md relative z-10">
                                 <Clock size={18} />
                               </div>
                               <span className="text-[10px] font-bold text-gray-900 text-center">قيد الانتظار</span>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2 flex-1">
                               <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 text-gray-300 flex items-center justify-center relative z-10">
                                 <Check size={18} />
                               </div>
                               <span className="text-[10px] text-gray-400 text-center">تم التأكيد</span>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2 flex-1">
                               <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 text-gray-300 flex items-center justify-center relative z-10">
                                 <Box size={18} />
                               </div>
                               <span className="text-[10px] text-gray-400 text-center">جاري التجهيز</span>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2 flex-1">
                               <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 text-gray-300 flex items-center justify-center relative z-10">
                                 <Truck size={18} />
                               </div>
                               <span className="text-[10px] text-gray-400 text-center">في الطريق</span>
                            </div>

                            <div className="flex flex-col items-center gap-2 flex-1">
                               <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 text-gray-300 flex items-center justify-center relative z-10">
                                 <Home size={18} />
                               </div>
                               <span className="text-[10px] text-gray-400 text-center">تم التسليم</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                         <div className="flex justify-end items-center text-sm font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200 gap-2">
                           المنتجات المطلوبة <ShoppingBag size={16} /> 
                         </div>
                         <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <div className="font-bold text-gray-900">{selectedProduct.price.toLocaleString()} دج</div>
                            <div className="flex items-center gap-4 text-right">
                               <div>
                                  <div className="font-medium text-gray-800 text-sm mb-1">{selectedProduct.nameAr || selectedProduct.name}</div>
                                  <div className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded-full">الكمية: {quantity}</div>
                               </div>
                               <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                                  {selectedProduct.image ? (
                                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <ImageIcon className="w-6 h-6 text-gray-400 m-auto mt-3" />
                                  )}
                               </div>
                            </div>
                         </div>
                      </div>

                   </div>
                   
                   <div className="bg-[#1c192b] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden mb-8">
                     <div className="space-y-4 relative z-10 text-sm font-medium">
                        <div className="flex justify-between text-gray-300">
                           <span>{selectedProduct.price.toLocaleString()} دج</span>
                           <span>المجموع الفرعي</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                           <span>{(totalPrice - (selectedProduct.price * quantity)).toLocaleString()} دج</span>
                           <span>الشحن</span>
                        </div>
                        <div className="flex justify-between font-black text-xl pt-4 border-t border-white/20 mt-4">
                           <span>{totalPrice.toLocaleString()} دج</span>
                           <span>الإجمالي</span>
                        </div>
                     </div>
                   </div>
                   
                   <div className="text-center">
                     <button
                       onClick={() => {
                         setSelectedProduct(null);
                         setOrderSuccess(false);
                         setTrackingView(false);
                       }}
                       className="text-[#64748b] bg-[#f1f5f9] hover:bg-[#e2e8f0] px-6 py-3.5 rounded-xl font-bold transition-colors inline-flex items-center justify-center gap-2 text-sm w-48 shadow-sm"
                     >
                       العودة للمتجر <ArrowLeft size={16} />
                     </button>
                   </div>
                </div>
             </div>
          ) : orderSuccess ? (
             <div className="bg-white rounded-3xl pb-8 shadow-2xl border border-gray-100 max-w-xl mx-auto overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-emerald-500 text-white text-center py-16 relative overflow-hidden rounded-t-3xl">
                   <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 0%, transparent 50%)', backgroundSize: '150% 150%', backgroundPosition: 'center' }}></div>
                   <div className="w-24 h-24 bg-white text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl relative z-10 border-4 border-emerald-400">
                     <Check size={48} strokeWidth={3} />
                   </div>
                   <h3 className="text-3xl font-black mt-6 mb-2 relative z-10 tracking-wide">تم تأكيد طلبك!</h3>
                   <p className="text-emerald-50 opacity-90 relative z-10">سيتم التواصل معك قريباً لتأكيد الطلب</p>
                </div>
                
                <div className="px-6 -mt-6 relative z-20">
                   <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
                      
                      <div className="text-right border-b border-gray-100 pb-4">
                         <span className="text-gray-400 text-xs block mb-1 font-medium">رقم الطلب</span>
                         <div className="flex items-center justify-between">
                            <button 
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors"
                              onClick={() => navigator.clipboard.writeText(orderId)}
                            >
                               <Copy size={14} /> نسخ
                            </button>
                            <span className="font-mono font-bold text-[#1c192b] text-base">{orderId}</span>
                         </div>
                      </div>

                      <div className="text-right border-b border-gray-100 pb-4">
                         <span className="text-gray-400 text-xs block mb-3 font-medium">المنتجات</span>
                         <div className="flex justify-between items-center">
                            <div className="text-left font-bold text-gray-900 text-sm">
                               {selectedProduct.price.toLocaleString()} دج <span className="text-gray-400 text-xs mr-1 font-normal">x{quantity}</span>
                            </div>
                            <div className="text-right">
                               <div className="text-sm font-bold text-gray-800">{selectedProduct.nameAr || selectedProduct.name}</div>
                               <div className="flex items-center gap-1 justify-end mt-1">
                                  <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                     couleur: noir <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                  </span>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                         <div className="text-left">
                            <span className="text-gray-400 text-xs block mb-1 font-medium">المجموع</span>
                            <span className="text-2xl font-black text-emerald-500 block leading-none">{totalPrice.toLocaleString()}</span>
                            <span className="text-gray-400 text-xs">دج</span>
                         </div>
                         <div className="text-right">
                            <span className="text-gray-400 text-xs block mb-2 font-medium">التوصيل</span>
                            <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5 justify-end">
                               {deliveryType === "home" ? "التوصيل للمنزل" : "التوصيل للمكتب"} <Home size={14} className="text-gray-400" />
                            </span>
                         </div>
                      </div>
                      
                   </div>
                </div>

                <div className="px-6 mt-6 space-y-3">
                  <button
                    onClick={() => setTrackingView(true)}
                    className="w-full bg-[#1c192b] hover:bg-[#2d2a3f] text-white py-4 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    تتبع الطلب <MapPin size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      setOrderSuccess(false);
                      setTrackingView(false);
                    }}
                    className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-4 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    المتجر <Home size={18} />
                  </button>
                </div>
              </div>
          ) : (`;

if (content.includes('          {orderSuccess ? (')) {
   content = content.replace(oldSuccessBlock, newSuccessBlock);
}

fs.writeFileSync('src/components/storefront/ThemeStorePreview.tsx', content);
console.log("Updated success UI block");
