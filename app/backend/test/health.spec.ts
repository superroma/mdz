import { expect, test } from "vitest";
import { buildServer } from "../src/server";

test("GET /health returns ok", async () => {
  const server = buildServer();
  const res = await server.inject({ method: "GET", url: "/health" });
  expect(res.statusCode).toBe(200);
  expect(res.json()).toEqual({ status: "ok" });
});
