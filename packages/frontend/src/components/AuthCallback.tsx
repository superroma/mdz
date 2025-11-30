import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import * as api from "../api/client";

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, checkAuth } = useAuthStore();

  useEffect(() => {
    console.log("[Auth] Callback page loaded");
    const token = searchParams.get("token");
    
    if (token) {
      console.log("[Auth] Token received, length:", token.length);
      login(token);
      
      checkAuth().then(() => {
        console.log("[Auth] Auth check complete, redirecting to home");
        navigate("/");
      }).catch((error) => {
        console.error("[Auth] Auth check failed:", error);
        navigate("/login");
      });
    } else {
      console.error("[Auth] No token in callback URL, redirecting to login");
      navigate("/login");
    }
  }, [searchParams, navigate, login, checkAuth]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-slate-600">Completing authentication...</p>
    </div>
  );
}
