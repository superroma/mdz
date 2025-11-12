import yaml from "js-yaml";

export interface FrontMatter {
  [key: string]: unknown;
}

export interface ParsedContent {
  frontMatter: FrontMatter;
  content: string;
}

const FRONT_MATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

export function parseFrontMatter(markdown: string): ParsedContent {
  // Type guard: ensure markdown is a string
  if (typeof markdown !== 'string') {
    console.error('parseFrontMatter received non-string:', typeof markdown, markdown);
    return {
      frontMatter: {},
      content: String(markdown || '')
    };
  }
  
  const match = markdown.match(FRONT_MATTER_REGEX);
  
  if (!match) {
    return {
      frontMatter: {},
      content: markdown
    };
  }
  
  try {
    const frontMatter = yaml.load(match[1]) as FrontMatter;
    return {
      frontMatter: frontMatter || {},
      content: match[2]
    };
  } catch (error) {
    return {
      frontMatter: {},
      content: markdown
    };
  }
}

export function serializeFrontMatter(frontMatter: FrontMatter, content: string): string {
  if (Object.keys(frontMatter).length === 0) {
    return content;
  }
  
  try {
    const yamlStr = yaml.dump(frontMatter, { lineWidth: -1 }).trim();
    return `---\n${yamlStr}\n---\n${content}`;
  } catch (error) {
    return content;
  }
}

