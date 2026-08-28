import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function AuthLayout() {
  const { user, loading } = useAuth();
  
  if (loading) return null; // Or a spinner
  
  // If we are on /login or /register, and already logged in, we could redirect to /
  // However, they might be on /create-store. 
  // Let's just render Outlet so they can see /create-store, 
  // but /login and /register should perhaps redirect if they already have a tenant.
  // Actually, since checkTenantAndRedirect is called in the handlers, they wouldn't easily get stuck.

  return (
    <div className="min-h-screen bg-[#16161a] flex flex-col justify-center items-center p-4">
      <Outlet />
    </div>
  );
}
