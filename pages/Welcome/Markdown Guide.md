# Markdown Guide

This guide demonstrates standard markdown syntax and MDX-specific features.

## Headers

# H1

## H2

### H3

#### H4

##### H5

###### H6

## Text Formatting

**Bold text**
_Italic text_
~~Strikethrough~~
`Inline code`

## Lists

### Unordered List

- Item 1
- Item 2
  - Nested item
  - Another nested item
- Item 3

### Ordered List

1. First item
2. Second item
3. Third item

## Links and Images

[Link text](https://example.com)
![Image alt text](./image.png)

## Code Blocks

```javascript
function hello() {
  console.log("Hello, World!");
}
```

## Blockquotes

> This is a blockquote.
> It can span multiple lines.

## Tables

| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |

## Emoji

Emoji: :rocket: :star: :smile:

```md
Emoji: :rocket: :star: :smile:
```

## MDX Components

MDX allows you to use React components in markdown. View components like `<BoardView>`, `<GridView>`, `<CalendarView>`, and `<ListView>` can be used to display child pages in various formats.

See the [Tasks](./Tasks/README.md) page for examples of view components in action.

### Progress Bar Component

Here's an example of a progress bar component:

<Progress value={75} label="Backend Development" color="green" />
