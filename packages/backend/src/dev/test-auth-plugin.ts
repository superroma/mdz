import { FastifyInstance } from "fastify";
import { TEST_USERS, generateTestUserJWT } from "./test-users.js";

export async function registerTestAuthPlugin(app: FastifyInstance) {
  const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-in-production";

  app.get("/api/dev-auth/select", async (request, reply) => {
    const frontendUrl = request.headers.origin || request.headers.referer?.split("/").slice(0, 3).join("/") || "http://localhost:5173";
    
    const roles = Object.keys(TEST_USERS);
    const buttons = roles.map(role => {
      const user = TEST_USERS[role];
      const loginUrl = `/api/dev-auth/login/${role}?frontend=${encodeURIComponent(frontendUrl)}`;
      return `<a href="${loginUrl}" style="display:block;padding:10px;margin:10px 0;border:1px solid #ccc;text-decoration:none;color:#000;">${user.name} (${user.email})</a>`;
    }).join("");

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Auth - Select User</title>
  <meta charset="utf-8">
</head>
<body>
  <h1>Test Auth - Select User</h1>
  <p>Frontend: ${frontendUrl}</p>
  ${buttons}
</body>
</html>
    `.trim();

    reply.type("text/html").send(html);
  });

  app.get("/api/dev-auth/login/:role", async (request, reply) => {
    const { role } = request.params as { role: string };
    const query = request.query as { frontend?: string };
    
    if (!TEST_USERS[role]) {
      reply.status(400).send({ error: `Unknown role: ${role}` });
      return;
    }

    const frontendUrl = query.frontend || "http://localhost:5173";
    
    const jwtToken = generateTestUserJWT(role, jwtSecret);
    
    const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
    redirectUrl.searchParams.set("token", jwtToken);
    
    reply.redirect(redirectUrl.toString());
  });
}
