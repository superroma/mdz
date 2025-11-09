export const BACKEND_URL =
  process.env.BACKEND_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3201";

export const FRONTEND_URL =
  process.env.FRONTEND_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3202";

export const HEALTH_ENDPOINT = `${BACKEND_URL}/api/health`;

