import { expect, test, vi } from "vitest";
import { api } from "./api";

test("api.page encodes path", async () => {
  const fetchMock = vi.spyOn(global, "fetch" as any).mockResolvedValue({
    ok: true,
    json: async () => ({ path: "a b", title: "a b", content: "" }),
  } as any);
  await api.page("a b");
  const url = (fetchMock.mock.calls[0]?.[0] as string) || "";
  expect(url).toContain("/pages/a%20b");
  fetchMock.mockRestore();
});

test("api.save returns success", async () => {
  const fetchMock = vi.spyOn(global, "fetch" as any).mockResolvedValue({
    ok: true,
    json: async () => ({ success: true }),
  } as any);
  const res = await api.save("Welcome", "# x");
  expect(res.success).toBe(true);
  fetchMock.mockRestore();
});
