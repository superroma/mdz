import { buildServer, startServer } from "./mdz-server.js";

const server = await buildServer();
await startServer(server);
