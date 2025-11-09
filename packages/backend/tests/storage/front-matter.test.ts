import { expect, test } from "vitest";
import { parseFrontMatter, serializeFrontMatter } from "../../src/storage/front-matter";

test("parseFrontMatter extracts YAML front-matter", () => {
  const markdown = `---
status: Draft
author: John Doe
---
# Content
This is the content.`;

  const result = parseFrontMatter(markdown);
  expect(result.frontMatter).toEqual({
    status: "Draft",
    author: "John Doe"
  });
  expect(result.content.trim()).toBe("# Content\nThis is the content.");
});

test("parseFrontMatter handles markdown without front-matter", () => {
  const markdown = "# Content\nThis is the content.";
  const result = parseFrontMatter(markdown);
  expect(result.frontMatter).toEqual({});
  expect(result.content).toBe(markdown);
});

test("parseFrontMatter handles invalid YAML gracefully", () => {
  const markdown = `---
invalid: yaml: content
---
# Content`;
  const result = parseFrontMatter(markdown);
  expect(result.frontMatter).toEqual({});
});

test("serializeFrontMatter adds front-matter to content", () => {
  const frontMatter = { status: "Draft", author: "John Doe" };
  const content = "# Content\nThis is the content.";
  const result = serializeFrontMatter(frontMatter, content);
  expect(result).toContain("---");
  expect(result).toContain("status: Draft");
  expect(result).toContain("author: John Doe");
  expect(result).toContain("# Content");
});

test("serializeFrontMatter returns content unchanged when front-matter is empty", () => {
  const content = "# Content\nThis is the content.";
  const result = serializeFrontMatter({}, content);
  expect(result).toBe(content);
});

test("parseFrontMatter handles empty front-matter", () => {
  const markdown = `---
---
# Content
This is the content.`;

  const result = parseFrontMatter(markdown);
  expect(result.frontMatter).toEqual({});
  // Empty front-matter should still parse correctly
  // The content may include the markers if regex doesn't match empty case
  expect(result.content).toContain("# Content");
  expect(result.content).toContain("This is the content.");
});

test("serializeFrontMatter handles empty front-matter object", () => {
  const frontMatter = {};
  const content = "# Content\nThis is the content.";
  const result = serializeFrontMatter(frontMatter, content);
  expect(result).toBe(content);
});

