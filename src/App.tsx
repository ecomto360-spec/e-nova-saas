/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthLayout } from "./components/layout/AuthLayout";
import { AuthGuard } from "./components/layout/AuthGuard";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Customize from "./pages/Customize";
import Themes from "./pages/Themes";
import StorefrontView from "./pages/StorefrontView";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Reviews from "./pages/Reviews";
import AbandonedCarts from "./pages/AbandonedCarts";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import CreateStore from "./pages/auth/CreateStore";
import ShippingRates from "./pages/ShippingRates";
import ShippingCarriers from "./pages/ShippingCarriers";
import Pixels from "./pages/Pixels";
import StoreSettings from "./pages/settings/StoreSettings";
import AccountSettings from "./pages/settings/AccountSettings";
import NotificationSettings from "./pages/settings/NotificationSettings";
import DomainSettings from "./pages/settings/DomainSettings";
import ReferralProgram from "./pages/settings/ReferralProgram";
import ApiSettings from "./pages/settings/ApiSettings";
import Subscription from "./pages/Subscription";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
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
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              
              {/* Standalone Public Storefront & Landing Page Routes */}
              <Route path="/store" element={<StorefrontView />} />
              <Route path="/landing/:slug" element={<LandingPagePublicView />} />

              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/create-store" element={<CreateStore />} />
              </Route>

              {/* Dashboard Routes */}
              <Route path="/" element={<AuthGuard><AppLayout /></AuthGuard>}>
                <Route index element={<Dashboard />} />
                <Route path="themes" element={<Themes />} />
                <Route path="customize" element={<Customize />} />
                <Route path="categories" element={<Categories />} />
                <Route path="products" element={<Products />} />
                <Route path="orders" element={<Orders />} />
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
            </Routes>
          </BrowserRouter>
        </TenantProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

