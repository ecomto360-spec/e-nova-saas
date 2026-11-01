/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthLayout } from "./components/layout/AuthLayout";
import { AuthGuard } from "./components/layout/AuthGuard";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Customize from "./pages/Customize";
import Themes from "./pages/Themes";
import StorefrontView from "./pages/StorefrontView";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Customers from "./pages/Customers";
import Reviews from "./pages/Reviews";
import AbandonedCarts from "./pages/AbandonedCarts";
import WaCartAction from "./pages/WaCartAction";
import WaOrderAction from "./pages/WaOrderAction";
import TrackOrder from "./pages/TrackOrder";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import CreateStore from "./pages/auth/CreateStore";
import ShippingRates from "./pages/ShippingRates";
import ShippingCarriers from "./pages/ShippingCarriers";
import Pixels from "./pages/Pixels";
import Extensions from "./pages/Extensions";
import WhatsAppSettings from "./pages/extensions/WhatsAppSettings";
import StoreSettings from "./pages/settings/StoreSettings";
import AccountSettings from "./pages/settings/AccountSettings";
import NotificationSettings from "./pages/settings/NotificationSettings";
import DomainSettings from "./pages/settings/DomainSettings";
import ReferralProgram from "./pages/settings/ReferralProgram";
import ApiSettings from "./pages/settings/ApiSettings";
import Subscription from "./pages/Subscription";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboardHome from "./pages/admin/AdminDashboardHome";
import AdminAudit from "./pages/admin/AdminAudit";
import AdminPlaceholder from "./pages/admin/AdminPlaceholder";
import LandingPages from "./pages/LandingPages";
import LandingPagePublicView from "./pages/LandingPagePublicView";


import { LanguageProvider } from "./contexts/LanguageContext";

import { ThemeProvider } from "./contexts/ThemeContext";

import { TenantProvider } from "./contexts/TenantContext";

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <TenantProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/admin" element={<AdminLogin />} />
              {/* LOT A — espace Super Admin : layout + modules (le reste arrive aux lots B→E) */}
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboardHome />} />
                <Route path="/admin/audit" element={<AdminAudit />} />
                <Route path="/admin/legacy" element={<AdminDashboard />} />
                <Route path="/admin/members" element={<AdminPlaceholder />} />
                <Route path="/admin/stores" element={<AdminPlaceholder />} />
                <Route path="/admin/subscriptions" element={<AdminPlaceholder />} />
                <Route path="/admin/payments" element={<AdminPlaceholder />} />
                <Route path="/admin/stats" element={<AdminPlaceholder />} />
                <Route path="/admin/themes" element={<AdminPlaceholder />} />
                <Route path="/admin/extensions" element={<AdminPlaceholder />} />
                <Route path="/admin/integrations" element={<AdminPlaceholder />} />
                <Route path="/admin/settings" element={<AdminPlaceholder />} />
                <Route path="/admin/notifications" element={<AdminPlaceholder />} />
                <Route path="/admin/health" element={<AdminPlaceholder />} />
              </Route>
              
              {/* Standalone Public Storefront & Landing Page Routes */}
              <Route path="/store" element={<StorefrontView />} />
              <Route path="/store/:storeSlug" element={<StorefrontView />} />
              <Route path="/landing/:slug" element={<LandingPagePublicView />} />
              <Route path="/store/:storeSlug/landing/:slug" element={<LandingPagePublicView />} />

              {/* WhatsApp (extension Order Automation) + suivi public */}
              <Route path="/wa/order/:orderId" element={<WaOrderAction />} />
              <Route path="/wa/:cartId" element={<WaCartAction />} />
              <Route path="/track/:code" element={<TrackOrder />} />

              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/create-store" element={<CreateStore />} />
              </Route>

              <Route path="/" element={<HomePage />} />

              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<AuthGuard><AppLayout /></AuthGuard>}>
                <Route index element={<Dashboard />} />
                <Route path="themes" element={<Themes />} />
                <Route path="customize" element={<Customize />} />
                <Route path="categories" element={<Categories />} />
                <Route path="products" element={<Products />} />
                <Route path="orders" element={<Orders />} />
                <Route path="orders/:id" element={<OrderDetails />} />
                <Route path="customers" element={<Customers />} />
                <Route path="reviews" element={<Reviews />} />
                <Route path="abandoned-carts" element={<AbandonedCarts />} />
                
                <Route path="shipping" element={<Navigate to="/shipping/rates" replace />} />
                <Route path="shipping/rates" element={<ShippingRates />} />
                <Route path="shipping/carriers" element={<ShippingCarriers />} />
                
                <Route path="landing-pages" element={<LandingPages />} />
                <Route path="landing-pages/new" element={<LandingPages defaultView="new" />} />
                <Route path="landing-pages/:id/edit" element={<LandingPages defaultView="edit" />} />
                <Route path="pages-destination" element={<Navigate to="/landing-pages" replace />} />
                
                <Route path="pixels" element={<Pixels />} />

                {/* Extensions (Apps & Intégrations) */}
                <Route path="extensions" element={<Extensions />} />
                <Route path="extensions/whatsapp" element={<WhatsAppSettings />} />

                {/* Settings */}
                <Route path="settings" element={<StoreSettings />} />
                <Route path="account" element={<AccountSettings />} />
                <Route path="notifications" element={<NotificationSettings />} />
                <Route path="domains" element={<DomainSettings />} />
                <Route path="referral" element={<ReferralProgram />} />
                <Route path="api" element={<ApiSettings />} />

                {/* Subscription */}
                <Route path="subscription" element={<Subscription />} />
                <Route path="subscribe" element={<Navigate to="/subscription" replace />} />

                <Route path="*" element={
                  <div className="flex h-full items-center justify-center text-neutral-400">
                    Page en cours de construction
                  </div>
                } />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TenantProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

