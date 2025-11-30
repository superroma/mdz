import { FastifyInstance } from "fastify";
import oauthPlugin from "@fastify/oauth2";
import jwtPlugin from "@fastify/jwt";

interface ProviderConfig {
  name: string;
  clientId: string;
  clientSecret: string;
  authorizationURL: string;
  tokenURL: string;
  userInfoURL?: string;
}

function getProviderConfigs(): ProviderConfig[] {
  const providers: ProviderConfig[] = [];
  
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (googleClientId && googleClientSecret) {
    providers.push({
      name: "google",
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorizationURL: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenURL: "https://oauth2.googleapis.com/token",
      userInfoURL: "https://www.googleapis.com/oauth2/v2/userinfo",
    });
  }

  const yandexClientId = process.env.YANDEX_CLIENT_ID;
  const yandexClientSecret = process.env.YANDEX_CLIENT_SECRET;
  if (yandexClientId && yandexClientSecret) {
    providers.push({
      name: "yandex",
      clientId: yandexClientId,
      clientSecret: yandexClientSecret,
      authorizationURL: "https://oauth.yandex.ru/authorize",
      tokenURL: "https://oauth.yandex.ru/token",
      userInfoURL: "https://login.yandex.ru/info",
    });
  }

  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (githubClientId && githubClientSecret) {
    providers.push({
      name: "github",
      clientId: githubClientId,
      clientSecret: githubClientSecret,
      authorizationURL: "https://github.com/login/oauth/authorize",
      tokenURL: "https://github.com/login/oauth/access_token",
      userInfoURL: "https://api.github.com/user",
    });
  }

  return providers;
}

async function fetchUserInfo(
  userInfoURL: string,
  accessToken: string,
  provider: string
): Promise<{ email?: string; name?: string; login?: string }> {
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (provider === "github") {
    headers.Authorization = `Bearer ${accessToken}`;
  } else {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  console.log(`[OAuth] Fetching user info with token: ${accessToken.substring(0, 20)}...`);
  const response = await fetch(userInfoURL, { headers });

  if (!response.ok) {
    console.error(`[OAuth] Failed to fetch user info: ${response.status} ${response.statusText}`);
    throw new Error(`Failed to fetch user info: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`[OAuth] User info fetched successfully`);
  return data;
}

function getFrontendUrl(request: any): string {
  const origin = request.headers.origin || request.headers.referer?.split("/").slice(0, 3).join("/");
  if (origin) {
    return origin;
  }
  
  const protocol = request.protocol || "http";
  const host = request.headers.host || "localhost:3001";
  return `${protocol}://${host}`;
}

function getBackendUrl(request?: any): string {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  
  if (request) {
    const protocol = request.protocol || "http";
    const host = request.headers.host || "localhost:3001";
    return `${protocol}://${host}`;
  }
  
  return "http://localhost:3001";
}

export async function registerAuthRoutes(app: FastifyInstance) {
  const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-in-production";
  
  await app.register(jwtPlugin, {
    secret: jwtSecret,
  });

  const providers = getProviderConfigs();
  
  if (providers.length === 0) {
    console.log("No OAuth providers configured");
  } else {
    console.log(`OAuth providers: ${providers.map(p => p.name).join(", ")}`);
  }

  app.get("/api/auth/providers", async () => {
    const providerList = providers.map((p) => ({
      name: p.name,
      displayName: p.name.charAt(0).toUpperCase() + p.name.slice(1),
    }));

    // Include any extra providers registered by plugins (e.g., test-auth-plugin)
    if ((app as any).extraAuthProviders) {
      providerList.push(...(app as any).extraAuthProviders);
    }

    return {
      providers: providerList,
    };
  });

  for (const provider of providers) {
    const backendUrl = getBackendUrl();
    
    const oauthConfig: any = {
      name: provider.name,
      credentials: {
        client: {
          id: provider.clientId,
          secret: provider.clientSecret,
        },
        auth: {
          authorizeHost: provider.authorizationURL.split("/").slice(0, 3).join("/"),
          authorizePath: "/" + provider.authorizationURL.split("/").slice(3).join("/"),
          tokenHost: provider.tokenURL.split("/").slice(0, 3).join("/"),
          tokenPath: "/" + provider.tokenURL.split("/").slice(3).join("/"),
        },
      },
      startRedirectPath: `/api/auth/${provider.name}`,
      callbackUri: `${backendUrl}/api/auth/${provider.name}/callback`,
      generateStateFunction: (request: any) => {
        const frontendOrigin = request.headers.origin || request.headers.referer?.split("/").slice(0, 3).join("/") || "http://localhost:5173";
        console.log(`[OAuth] Starting ${provider.name} auth flow, frontend: ${frontendOrigin}`);
        return Buffer.from(JSON.stringify({ 
          random: Math.random().toString(36),
          frontend: frontendOrigin 
        })).toString('base64');
      },
      checkStateFunction: () => true,
    };

    if (provider.name === "github") {
      oauthConfig.scope = ["user:email"];
    } else {
      oauthConfig.scope = ["openid", "profile", "email"];
    }

    await app.register(oauthPlugin, oauthConfig);

    app.get(`/api/auth/${provider.name}/callback`, async (request, reply) => {
      console.log(`[OAuth] Callback received for provider: ${provider.name}`);
      console.log(`[OAuth] Query params:`, request.query);
      
      try {
        const stateParam = (request.query as any).state;
        let frontendUrl = "http://localhost:5173";
        
        if (stateParam) {
          try {
            const stateData = JSON.parse(Buffer.from(stateParam, 'base64').toString());
            if (stateData.frontend) {
              frontendUrl = stateData.frontend;
              console.log(`[OAuth] Frontend URL from state: ${frontendUrl}`);
            }
          } catch (e) {
            console.log(`[OAuth] Could not parse state, using default frontend URL`);
          }
        }
        
        console.log(`[OAuth] Exchanging code for access token...`);
        const { token } = await (app as any)[provider.name].getAccessTokenFromAuthorizationCodeFlow(request);
        console.log(`[OAuth] Access token received (expires in ${token.expires_in}s)`);

        let userInfo: { email?: string; name?: string; login?: string } = {};
        
        if (provider.userInfoURL) {
          console.log(`[OAuth] Fetching user info from: ${provider.userInfoURL}`);
          userInfo = await fetchUserInfo(provider.userInfoURL, token.access_token, provider.name);
          console.log(`[OAuth] User info received:`, userInfo);
        }

        const email = userInfo.email || userInfo.login || "unknown@example.com";
        const name = userInfo.name || email.split("@")[0];
        console.log(`[OAuth] Creating JWT for user: ${email}`);

        const jwtToken = app.jwt.sign({
          email,
          name,
          provider: provider.name,
        });
        console.log(`[OAuth] JWT created (length: ${jwtToken.length})`);

        const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
        redirectUrl.searchParams.set("token", jwtToken);
        
        console.log(`[OAuth] Redirecting to: ${redirectUrl.toString()}`);
        reply.redirect(redirectUrl.toString());
      } catch (error) {
        console.error(`[OAuth] Error during ${provider.name} callback:`, error);
        app.log.error(error);
        reply.status(500).send({ error: "Authentication failed" });
      }
    });
  }

  app.get("/api/auth/me", async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        reply.status(401).send({ error: "Unauthorized" });
        return;
      }

      const token = authHeader.substring(7);
      const decoded = app.jwt.verify(token);
      const user = decoded as { email: string; name: string; provider: string };
      
      return {
        email: user.email,
        name: user.name,
        provider: user.provider,
      };
    } catch (error) {
      reply.status(401).send({ error: "Unauthorized" });
    }
  });

  app.post("/api/auth/logout", async () => {
    return { message: "Logged out" };
  });
}
