/**
 * Utility functions for manipulating markdown checkboxes
 */

/**
 * Toggles a checkbox at the specified line index in markdown content
 * @param markdown The full markdown content
 * @param lineIndex The zero-based line index where the checkbox is located
 * @returns Updated markdown content with the checkbox toggled
 */
export function toggleCheckboxAtLine(markdown: string, lineIndex: number): string {
  const lines = markdown.split('\n');
  
  if (lineIndex < 0 || lineIndex >= lines.length) {
    return markdown;
  }
  
  const line = lines[lineIndex];
  
  // Match checkbox pattern: optional whitespace, dash, space, [ ] or [x], space, rest of line
  // Supports nested lists with indentation
  const checkboxRegex = /^(\s*)-\s+\[([ x])\]\s+(.*)$/;
  const match = line.match(checkboxRegex);
  
  if (!match) {
    return markdown;
  }
  
  const [, indent, checkboxState, restOfLine] = match;
  const isChecked = checkboxState === 'x';
  const newState = isChecked ? ' ' : 'x';
  
  // Reconstruct the line with toggled checkbox
  lines[lineIndex] = `${indent}- [${newState}] ${restOfLine}`;
  
  return lines.join('\n');
}

/**
 * Finds all checkbox lines in markdown and returns a map of line indices to checked states
 * @param markdown The full markdown content
 * @returns Map of line index to boolean (true = checked, false = unchecked)
 */
export function findCheckboxLines(markdown: string): Map<number, boolean> {
  const lines = markdown.split('\n');
  const checkboxMap = new Map<number, boolean>();
  
  const checkboxRegex = /^(\s*)-\s+\[([ x])\]\s+/;
  
  lines.forEach((line, index) => {
    const match = line.match(checkboxRegex);
    if (match) {
      const checkboxState = match[2];
      checkboxMap.set(index, checkboxState === 'x');
    }
  });
  
  return checkboxMap;
}

