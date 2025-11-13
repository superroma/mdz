import { describe, it, expect } from 'vitest';
import { toggleCheckboxByTextAndIndex, findCheckboxLines } from './checkbox-updater';

describe('toggleCheckboxByTextAndIndex', () => {
  it('should toggle an unchecked checkbox to checked', () => {
    const markdown = `# Test
- [ ] First task
- [ ] Second task`;

    const result = toggleCheckboxByTextAndIndex(markdown, 'First task', 0);
    
    expect(result).toContain('- [x] First task');
    expect(result).toContain('- [ ] Second task');
  });

  it('should toggle a checked checkbox to unchecked', () => {
    const markdown = `# Test
- [x] First task
- [ ] Second task`;

    const result = toggleCheckboxByTextAndIndex(markdown, 'First task', 0);
    
    expect(result).toContain('- [ ] First task');
    expect(result).toContain('- [ ] Second task');
  });

  it('should toggle the correct checkbox by sequential index', () => {
    const markdown = `# Test
- [ ] First task
- [ ] Second task
- [ ] Third task`;

    const result = toggleCheckboxByTextAndIndex(markdown, 'Second task', 1);
    
    expect(result).toContain('- [ ] First task');
    expect(result).toContain('- [x] Second task');
    expect(result).toContain('- [ ] Third task');
  });

  it('should handle duplicate checkbox text using sequential index', () => {
    const markdown = `# Test
- [ ] Fix bug
- [ ] Fix bug
- [ ] Fix bug`;

    // Toggle the second "Fix bug"
    const result = toggleCheckboxByTextAndIndex(markdown, 'Fix bug', 1);
    
    const lines = result.split('\n');
    expect(lines[1]).toBe('- [ ] Fix bug');
    expect(lines[2]).toBe('- [x] Fix bug');
    expect(lines[3]).toBe('- [ ] Fix bug');
  });

  it('should preserve indentation for nested checkboxes', () => {
    const markdown = `# Test
- [ ] Parent task
  - [ ] Nested task
  - [ ] Another nested task`;

    const result = toggleCheckboxByTextAndIndex(markdown, 'Nested task', 1);
    
    expect(result).toContain('  - [x] Nested task');
    expect(result).toContain('- [ ] Parent task');
  });

  it('should handle multiple rapid toggles on same checkbox', () => {
    const markdown = `# Test
- [ ] First task
- [ ] Second task`;

    // First toggle
    let result = toggleCheckboxByTextAndIndex(markdown, 'First task', 0);
    expect(result).toContain('- [x] First task');
    
    // Second toggle on updated content
    result = toggleCheckboxByTextAndIndex(result, 'First task', 0);
    expect(result).toContain('- [ ] First task');
  });

  it('should handle multiple rapid toggles on different checkboxes', () => {
    const markdown = `# Test
- [ ] First task
- [ ] Second task
- [ ] Third task`;

    // Toggle first checkbox
    let result = toggleCheckboxByTextAndIndex(markdown, 'First task', 0);
    expect(result).toContain('- [x] First task');
    
    // Toggle second checkbox on updated content
    result = toggleCheckboxByTextAndIndex(result, 'Second task', 1);
    expect(result).toContain('- [x] First task');
    expect(result).toContain('- [x] Second task');
    expect(result).toContain('- [ ] Third task');
  });

  it('should preserve extra spaces in checkbox text', () => {
    const markdown = `# Test
- [ ] Task with  extra  spaces`;

    const result = toggleCheckboxByTextAndIndex(markdown, 'Task with  extra  spaces', 0);
    
    expect(result).toContain('- [x] Task with  extra  spaces');
  });

  it('should handle checkbox text with special characters', () => {
    const markdown = `# Test
- [ ] Use MDX components like \`<Progress>\`
- [ ] Fix bug #123`;

    const result = toggleCheckboxByTextAndIndex(markdown, 'Use MDX components like `<Progress>`', 0);
    
    expect(result).toContain('- [x] Use MDX components like `<Progress>`');
  });

  it('should return unchanged markdown for invalid sequential index', () => {
    const markdown = `# Test
- [ ] First task`;

    const result = toggleCheckboxByTextAndIndex(markdown, 'First task', 5);
    
    expect(result).toBe(markdown);
  });

  it('should work with front matter present', () => {
    const markdown = `---
title: Test
---
# Test
- [ ] First task
- [ ] Second task`;

    const result = toggleCheckboxByTextAndIndex(markdown, 'First task', 0);
    
    expect(result).toContain('---');
    expect(result).toContain('title: Test');
    expect(result).toContain('- [x] First task');
  });
});

describe('findCheckboxLines', () => {
  it('should find all checkbox lines and their states', () => {
    const markdown = `# Test
- [ ] Unchecked task
- [x] Checked task
- [ ] Another unchecked task`;

    const result = findCheckboxLines(markdown);
    
    expect(result.size).toBe(3);
    expect(result.get(1)).toBe(false); // Line 1: unchecked
    expect(result.get(2)).toBe(true);  // Line 2: checked
    expect(result.get(3)).toBe(false); // Line 3: unchecked
  });

  it('should handle nested checkboxes', () => {
    const markdown = `# Test
- [ ] Parent task
  - [x] Nested checked
  - [ ] Nested unchecked`;

    const result = findCheckboxLines(markdown);
    
    expect(result.size).toBe(3);
    expect(result.get(1)).toBe(false);
    expect(result.get(2)).toBe(true);
    expect(result.get(3)).toBe(false);
  });

  it('should return empty map when no checkboxes present', () => {
    const markdown = `# Test
This is just text
- Regular list item`;

    const result = findCheckboxLines(markdown);
    
    expect(result.size).toBe(0);
  });
});

describe('Real-world Getting Started page scenario', () => {
  it('should toggle checkbox from actual Getting Started markdown', () => {
    const markdown = `# Getting Started with MDZ

Welcome to MDZ! This guide will help you get started with using the application.

## Quick Start Checklist

- [ ] Read this getting started guide
- [ ] Explore the Markdown Guide
- [ ] Create your first page
- [ ] Try editing a page
- [ ] Test the interactive checkboxes below`;

    // Toggle "Read this getting started guide" (index 0)
    const result = toggleCheckboxByTextAndIndex(markdown, 'Read this getting started guide', 0);
    
    expect(result).toContain('- [x] Read this getting started guide');
    expect(result).toContain('- [ ] Explore the Markdown Guide');
  });

  it('should handle rapid toggles on Getting Started checkboxes', () => {
    const markdown = `# Getting Started with MDZ

Welcome to MDZ! This guide will help you get started with using the application.

## Quick Start Checklist

- [ ] Read this getting started guide
- [ ] Explore the Markdown Guide
- [ ] Create your first page`;

    // First toggle: "Explore the Markdown Guide" (index 1)
    let result = toggleCheckboxByTextAndIndex(markdown, 'Explore the Markdown Guide', 1);
    expect(result).toContain('- [x] Explore the Markdown Guide');
    
    // Second toggle: "Create your first page" (index 2) on the updated content
    result = toggleCheckboxByTextAndIndex(result, 'Create your first page', 2);
    expect(result).toContain('- [x] Explore the Markdown Guide');
    expect(result).toContain('- [x] Create your first page');
  });
});

describe('Checkbox extraction from markdown (like MDXContent does)', () => {
  // This tests the same logic used in MDXContent to extract checkbox info
  it('should extract checkbox text correctly', () => {
    const markdown = `# Getting Started

- [ ] Read this getting started guide
- [ ] Explore the Markdown Guide
- [ ] Create your first page`;

    const lines = markdown.split('\n');
    const checkboxRegex = /^(\s*)-\s+\[([ x])\]\s+(.+)$/;
    const checkboxes: Array<{ text: string; checked: boolean }> = [];

    lines.forEach((line) => {
      const match = line.match(checkboxRegex);
      if (match) {
        const text = match[3].trim();
        const checked = match[2] === 'x';
        checkboxes.push({ text, checked });
      }
    });

    expect(checkboxes).toHaveLength(3);
    expect(checkboxes[0]).toEqual({ text: 'Read this getting started guide', checked: false });
    expect(checkboxes[1]).toEqual({ text: 'Explore the Markdown Guide', checked: false });
    expect(checkboxes[2]).toEqual({ text: 'Create your first page', checked: false });
  });

  it('should extract checkbox with special characters', () => {
    const markdown = `- [ ] Use MDX components like \`<Progress>\``;

    const lines = markdown.split('\n');
    const checkboxRegex = /^(\s*)-\s+\[([ x])\]\s+(.+)$/;
    const match = lines[0].match(checkboxRegex);

    expect(match).toBeTruthy();
    expect(match![3].trim()).toBe('Use MDX components like `<Progress>`');
  });

  it('should handle checkboxes with varying whitespace', () => {
    const markdown = `- [ ] Task one
- [x] Task two
-  [ ]  Task three with extra spaces`;

    const lines = markdown.split('\n');
    const checkboxRegex = /^(\s*)-\s+\[([ x])\]\s+(.+)$/;
    const checkboxes: Array<{ text: string }> = [];

    lines.forEach((line) => {
      const match = line.match(checkboxRegex);
      if (match) {
        checkboxes.push({ text: match[3].trim() });
      }
    });

    expect(checkboxes).toHaveLength(3);
    expect(checkboxes[0].text).toBe('Task one');
    expect(checkboxes[1].text).toBe('Task two');
    expect(checkboxes[2].text).toBe('Task three with extra spaces');
  });
});

