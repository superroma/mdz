import { FastifyInstance } from "fastify";
import oauthPlugin from "@fastify/oauth2";
import jwtPlugin from "@fastify/jwt";
import { loadUsersConfig, calculateUserGroups } from "../storage/user-access.js";

interface UserProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

const OAUTH_PROVIDERS: Record<string, {
  envPrefix: string;
  auth: typeof oauthPlugin.GOOGLE_CONFIGURATION | { authorizeHost: string; authorizePath: string; tokenHost: string; tokenPath: string };
  scope: string[];
  userInfoURL: string;
  callbackUriParams?: Record<string, string>;
  extractProfile: (data: any) => UserProfile;
}> = {
  google: {
    envPrefix: "GOOGLE",
    auth: oauthPlugin.GOOGLE_CONFIGURATION,
    scope: ["openid", "profile", "email"],
    userInfoURL: "https://www.googleapis.com/oauth2/v2/userinfo",
    callbackUriParams: { prompt: "select_account" },
    extractProfile: (data) => ({
      email: data.email,
      firstName: data.given_name,
      lastName: data.family_name,
      avatar: data.picture,
    }),
  },
  github: {
    envPrefix: "GITHUB",
    auth: oauthPlugin.GITHUB_CONFIGURATION,
    scope: ["user:email", "read:user"],
    userInfoURL: "https://api.github.com/user",
    extractProfile: (data) => {
      const [firstName, ...rest] = (data.name || data.login || "").split(" ");
      return {
        email: data.email || data.login,
        firstName,
        lastName: rest.join(" ") || undefined,
        avatar: data.avatar_url,
      };
    },
  },
  yandex: {
    envPrefix: "YANDEX",
    auth: {
      authorizeHost: "https://oauth.yandex.ru",
      authorizePath: "/authorize",
      tokenHost: "https://oauth.yandex.ru",
      tokenPath: "/token",
    },
    scope: ["login:email", "login:info", "login:avatar"],
    userInfoURL: "https://login.yandex.ru/info",
    extractProfile: (data) => ({
      email: data.default_email || data.emails?.[0],
      firstName: data.first_name,
      lastName: data.last_name,
      avatar: data.default_avatar_id 
        ? `https://avatars.yandex.net/get-yapic/${data.default_avatar_id}/islands-200`
        : undefined,
    }),
  },
};

interface ProviderConfig {
  name: string;
  clientId: string;
  clientSecret: string;
  auth: typeof OAUTH_PROVIDERS.google.auth;
  scope: string[];
  userInfoURL: string;
  callbackUriParams?: Record<string, string>;
  extractProfile: (data: any) => UserProfile;
}

function getProviderConfigs(): ProviderConfig[] {
  const providers: ProviderConfig[] = [];

  for (const [name, config] of Object.entries(OAUTH_PROVIDERS)) {
    const clientId = process.env[`${config.envPrefix}_CLIENT_ID`];
    const clientSecret = process.env[`${config.envPrefix}_CLIENT_SECRET`];
    if (clientId && clientSecret) {
      providers.push({
        name,
        clientId,
        clientSecret,
        auth: config.auth,
        scope: config.scope,
        userInfoURL: config.userInfoURL,
        callbackUriParams: config.callbackUriParams,
        extractProfile: config.extractProfile,
      });
    }
  }

  return providers;
}

async function fetchUserInfo(userInfoURL: string, accessToken: string): Promise<any> {
  console.log(`[OAuth] Fetching user info with token: ${accessToken.substring(0, 20)}...`);
  const response = await fetch(userInfoURL, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.error(`[OAuth] Failed to fetch user info: ${response.status} ${response.statusText}`);
    throw new Error(`Failed to fetch user info: ${response.statusText}`);
  }

  return response.json();
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
      scope: provider.scope,
      credentials: {
        client: {
          id: provider.clientId,
          secret: provider.clientSecret,
        },
        auth: provider.auth,
      },
      startRedirectPath: `/api/auth/${provider.name}`,
      callbackUri: `${backendUrl}/api/auth/${provider.name}/callback`,
      callbackUriParams: provider.callbackUriParams,
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

        console.log(`[OAuth] Fetching user info from: ${provider.userInfoURL}`);
        const rawUserInfo = await fetchUserInfo(provider.userInfoURL, token.access_token);
        console.log(`[OAuth] Raw user info received:`, rawUserInfo);

        const profile = provider.extractProfile(rawUserInfo);
        console.log(`[OAuth] Extracted profile:`, profile);

        const usersConfig = loadUsersConfig();
        const groups = calculateUserGroups(profile.email, usersConfig);
        console.log(`[OAuth] User groups: ${groups.join(", ")}`);

        const jwtToken = app.jwt.sign({
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatar: profile.avatar,
          provider: provider.name,
          groups,
        });
        console.log(`[OAuth] JWT created (length: ${jwtToken.length})`);

        const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
        redirectUrl.searchParams.set("token", jwtToken);
        
        console.log(`[OAuth] Redirecting to: ${redirectUrl.toString()}`);
        reply
          .setCookie("auth_token", jwtToken, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          })
          .redirect(redirectUrl.toString());
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
      const user = decoded as {
        email: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
        provider: string;
        groups?: string[];
      };
      
      return {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        provider: user.provider,
        groups: user.groups || [],
      };
    } catch (error) {
      reply.status(401).send({ error: "Unauthorized" });
    }
  });

  app.post("/api/auth/logout", async (request, reply) => {
    reply.clearCookie("auth_token", { path: "/" });
    return { message: "Logged out" };
  });
}
