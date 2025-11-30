import { buildServer, startServer } from "./mdz-server.js";
import { registerTestAuthPlugin } from "./dev/test-auth-plugin.js";

const server = await buildServer(async (app) => {
  await registerTestAuthPlugin(app);
  console.log("Test auth provider registered (development only)");
});
await startServer(server);
