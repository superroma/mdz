/**
 * Utility functions for manipulating markdown checkboxes using remark AST
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';
import type { Root, ListItem } from 'mdast';

/**
 * Toggles a checkbox at the specified index in markdown content using remark AST
 * @param markdown The full markdown content
 * @param checkboxIndex The zero-based index of the checkbox (0 = first checkbox, 1 = second, etc.)
 * @returns Updated markdown content with the checkbox toggled
 */
export function toggleCheckboxAtLine(markdown: string, checkboxIndex: number): string {
  try {
    // Parse markdown to AST
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm);
    
    const tree = processor.parse(markdown) as Root;
    let wasToggled = false;
    let currentIndex = 0;

    // Visit all list items to find the one at the specified checkbox index
    visit(tree, 'listItem', (node: ListItem) => {
      // Check if it's a task list item
      if (typeof node.checked === 'boolean') {
        // Check if this is the checkbox at the target index
        if (currentIndex === checkboxIndex) {
          // Toggle the checked state
          node.checked = !node.checked;
          wasToggled = true;
        }
        currentIndex++;
      }
    });

    // If no checkbox was found at that index, return original markdown
    if (!wasToggled) {
      return markdown;
    }

    // Convert AST back to markdown
    const stringifyProcessor = unified()
      .use(remarkStringify, {
        bullet: '-',
        listItemIndent: 'one',
        emphasis: '_',
        strong: '*',
        rule: '-',
        fences: true,
        incrementListMarker: false,
      })
      .use(remarkGfm);

    let result = stringifyProcessor.stringify(tree);
    
    // Ensure result has the same trailing newline behavior as input
    if (markdown.endsWith('\n') && !result.endsWith('\n')) {
      result += '\n';
    } else if (!markdown.endsWith('\n') && result.endsWith('\n')) {
      result = result.slice(0, -1);
    }
    
    return result;
  } catch (error) {
    console.error('Error toggling checkbox with remark AST:', error);
    // Fall back to returning original markdown on error
    return markdown;
  }
}

/**
 * Finds all checkbox lines in markdown and returns a map of line indices to checked states
 * @param markdown The full markdown content
 * @returns Map of line index to boolean (true = checked, false = unchecked)
 */
export function findCheckboxLines(markdown: string): Map<number, boolean> {
  try {
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm);
    
    const tree = processor.parse(markdown) as Root;
    const checkboxMap = new Map<number, boolean>();

    // Visit all list items to find task list items
    visit(tree, 'listItem', (node: ListItem) => {
      if (node.position && typeof node.checked === 'boolean') {
        const lineIndex = node.position.start.line - 1; // Convert to 0-based
        checkboxMap.set(lineIndex, node.checked);
      }
    });

    return checkboxMap;
  } catch (error) {
    console.error('Error finding checkbox lines with remark AST:', error);
    return new Map();
  }
}

