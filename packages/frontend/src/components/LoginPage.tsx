import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
