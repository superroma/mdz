# Markdown Formatting Guide

This page demonstrates all supported markdown formatting options in MDZ.

## Headers

# Header 1

## Header 2

### Header 3

#### Header 4

##### Header 5

###### Header 6

## Text Formatting

**Bold text** or **also bold**

_Italic text_ or _also italic_

**_Bold and italic_** or **_also bold and italic_**

~~Strikethrough text~~

`Inline code`

## Lists

### Unordered Lists

- Item 1
- Item 2
  - Nested item A
  - Nested item B
    - Deeply nested item
- Item 3

### Ordered Lists

1. First item
2. Second item
   1. Nested numbered item
   2. Another nested item
3. Third item

### Task Lists

- [x] Completed task
- [ ] Incomplete task
- [ ] Another incomplete task

## Links and Images

### Links

[Basic link](https://example.com)

[Link with title](https://example.com 'This is a title')

<https://auto-link.com>

[Reference-style link][ref-link]

[Another reference][1]

[ref-link]: https://example.com
[1]: https://example.com/reference

### Images

![Alt text](https://via.placeholder.com/300x200/4f46e5/ffffff?text=MDZ+Image)

![Alt text with title](https://via.placeholder.com/200x150/10b981/ffffff?text=Sample 'Image title')

## Code Blocks

### Basic Code Block

```
Plain text code block
with multiple lines
```

### Syntax Highlighted Code Blocks

```javascript
function greet(name) {
  return `Hello, ${name}!`
}

const message = greet('World')
console.log(message)
```

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
```

```json
{
  "name": "mdz",
  "version": "1.0.0",
  "description": "Markdown collaboration tool"
}
```

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Quotes and Blockquotes

> This is a blockquote.
> It can span multiple lines.

> **Nested blockquote:**
>
> > This is a nested quote
> > within another quote.

## Tables

### Basic Table

| Column 1     | Column 2     | Column 3     |
| ------------ | ------------ | ------------ |
| Row 1, Col 1 | Row 1, Col 2 | Row 1, Col 3 |
| Row 2, Col 1 | Row 2, Col 2 | Row 2, Col 3 |

### Aligned Table

| Left Aligned | Center Aligned | Right Aligned |
| :----------- | :------------: | ------------: |
| Left         |     Center     |         Right |
| Text         |      Text      |          Text |
| More         |    Content     |          Here |

### Table with Formatting

| Feature        | Status | Notes                 |
| -------------- | :----: | --------------------- |
| **Headers**    |   ✅   | All H1-H6 supported   |
| _Lists_        |   ✅   | Ordered and unordered |
| `Code`         |   ✅   | Inline and blocks     |
| ~~Deprecated~~ |   ❌   | Not implemented       |

## Horizontal Rules

Text above the rule.

---

Text below the rule.

---

Another rule style.

## Line Breaks and Paragraphs

This is a paragraph with a  
hard line break (two spaces at end).

This is a new paragraph.

This paragraph has
a soft line break.

## Special Characters and Escaping

You can escape special characters:

\*Not italic\*

\`Not code\`

\# Not a header

\[Not a link\]

## HTML Elements

MDZ supports basic HTML elements:

<strong>Strong text</strong>

<em>Emphasized text</em>

<u>Underlined text</u>

<kbd>Ctrl</kbd> + <kbd>S</kbd>

<mark>Highlighted text</mark>

<small>Small text</small>

<sub>Subscript</sub> and <sup>Superscript</sup>

## Emojis and Unicode

Emojis work: 😀 🎉 ✅ ❌ 📝 🔧

Unicode characters: → ← ↑ ↓ ✓ ✗ ★ ♠ ♥ ♦ ♣

## Mathematical Expressions

Inline math: E = mc²

Mathematical symbols: ∑, ∏, ∫, √, ≠, ≤, ≥, ±, ∞

## Complex Example

Here's a complex example combining multiple formatting options:

### Project Setup Checklist

1. **Prerequisites**

   - [x] Node.js 18+ installed
   - [x] pnpm package manager
   - [ ] Optional: Docker for containerization

2. **Installation Steps**

   ```bash
   # Clone the repository
   git clone https://github.com/user/mdz.git
   cd mdz

   # Install dependencies
   pnpm install
   ```

3. **Configuration**

   Create a `.env` file:

   ```env
   STORAGE_ROOT=./pages
   PORT=3000
   ```

4. **Running the Application**

   | Command      | Purpose          |
   | ------------ | ---------------- |
   | `pnpm dev`   | Development mode |
   | `pnpm build` | Production build |
   | `pnpm test`  | Run all tests    |

   > **Note**: The development server runs on port 3000 by default.

---

_This guide covers all major markdown formatting options supported by MDZ. For more advanced features, refer to the [MDX documentation](https://mdxjs.com/)._
