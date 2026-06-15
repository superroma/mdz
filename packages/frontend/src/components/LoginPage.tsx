import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaGoogle, FaGithub, FaYandex } from "react-icons/fa";
import { MdBugReport } from "react-icons/md";
import { Button } from "./ui/button";
import * as api from "../api/client";
import { useAuthStore } from "../store/useAuthStore";

const providerIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  google: FaGoogle,
  github: FaGithub,
  yandex: FaYandex,
  test: MdBugReport,
};

export function LoginPage() {
  const [providers, setProviders] = useState<api.AuthProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dismissedError, setDismissedError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth()
      .then((isAuthed) => {
        if (isAuthed) {
          navigate("/");
        }
      })
      .catch(() => {});
  }, [checkAuth, navigate]);

  useEffect(() => {
    const raw = sessionStorage.getItem("auth_error");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { type?: string; email?: string };
        if (parsed.type === "no_access" && parsed.email) {
          setErrorMessage(`${parsed.email} doesn't have access to this app.`);
        }
      } catch {
        setErrorMessage("You don't have access to this app.");
      }
      sessionStorage.removeItem("auth_error");
      return;
    }

    const params = new URLSearchParams(location.search);
    const errorParam = params.get("error");
    const emailParam = params.get("email");
    if (errorParam === "no-access") {
      setErrorMessage(
        emailParam
          ? `${emailParam} doesn't have access to this app.`
          : "You don't have access to this app."
      );
    } else if (errorParam === "expired-link") {
      setErrorMessage(
        "Your sign-in link has expired or is invalid. Ask an admin for a new one."
      );
    } else if (errorParam === "invalid-login") {
      setErrorMessage("Unable to complete login. Please try again.");
    }
  }, [location.search]);

  useEffect(() => {
    if (errorMessage) {
      setDismissedError(false);
    }
  }, [errorMessage]);

  useEffect(() => {
    api.getAuthProviders()
      .then((data) => {
        setProviders(data.providers);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const handleLogin = (providerName: string) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";
    const authUrl = providerName === "test" 
      ? `${API_BASE_URL}/api/dev-auth/select`
      : `${API_BASE_URL}/api/auth/${providerName}`;
    console.log(`[Auth] Redirecting to OAuth provider: ${providerName}`);
    console.log(`[Auth] URL: ${authUrl}`);
    window.location.href = authUrl;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-600 mb-4">No authentication providers configured</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-sm border border-slate-200">
        <h1 className="text-2xl font-semibold text-slate-900 mb-6 text-center">
          Sign in to MDZ
        </h1>
        {!dismissedError && errorMessage && (
          <div
            className="mb-4 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 flex items-start justify-between gap-2"
            role="alert"
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              className="text-rose-700 hover:text-rose-900"
              aria-label="Dismiss error"
              onClick={() => setDismissedError(true)}
            >
              ×
            </button>
          </div>
        )}
        <div className="space-y-3">
          {providers.map((provider) => {
            const Icon = providerIcons[provider.name];
            return (
              <Button
                key={provider.name}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleLogin(provider.name)}
              >
                {Icon && <Icon className="mr-3 h-5 w-5" />}
                Continue with {provider.displayName}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
