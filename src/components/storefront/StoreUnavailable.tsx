import { Link, useNavigate } from "react-router-dom";

export function StoreUnavailable() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900" dir="rtl">عذراً، هذا المتجر غير متاح حالياً.</h1>
        <button 
          onClick={() => window.location.href = "/dashboard"}
          className="inline-block px-8 py-3 bg-[#2d2d2d] text-white rounded-lg font-medium hover:bg-black transition-colors"
          dir="rtl"
        >
          العودة
        </button>
      </div>
    </div>
  );
}
