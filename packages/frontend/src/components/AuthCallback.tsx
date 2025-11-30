import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import * as api from "../api/client";

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, checkAuth } = useAuthStore();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) {
      return;
    }

    console.log("[Auth] Callback page loaded");
    const token = searchParams.get("token");
    
    if (token) {
      console.log("[Auth] Token received, length:", token.length);
      
      const intendedPath = sessionStorage.getItem("auth_redirect");
      sessionStorage.removeItem("auth_redirect");
      
      login(token);
      
      checkAuth().then(() => {
        if (hasRedirected.current) {
          return;
        }
        hasRedirected.current = true;
        
        console.log("[Auth] Auth check complete, redirecting");
        if (intendedPath && intendedPath !== "/login") {
          console.log("[Auth] Redirecting to intended path:", intendedPath);
          navigate(intendedPath);
        } else {
          console.log("[Auth] Redirecting to home");
          navigate("/");
        }
      }).catch((error) => {
        console.error("[Auth] Auth check failed:", error);
        hasRedirected.current = true;
        navigate("/login");
      });
    } else {
      console.error("[Auth] No token in callback URL, redirecting to login");
      hasRedirected.current = true;
      navigate("/login");
    }
  }, [searchParams, navigate, login, checkAuth]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-slate-600">Completing authentication...</p>
    </div>
  );
}
