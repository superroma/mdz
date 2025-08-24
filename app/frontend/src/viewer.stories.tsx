import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Viewer } from './viewer'
// @ts-ignore - Vite raw import of markdown outside package
// vite supports raw import of local files inside repo
// @ts-ignore
// Use the real project file
// @ts-ignore
import formattingMd from '../../../pages/Formatting.md?raw'

const meta: Meta<typeof Viewer> = {
  title: 'Viewer',
  component: Viewer,
}
export default meta
type Story = StoryObj<typeof Viewer>

export const Basic: Story = {
  render: () => <Viewer source={`# Hello\nThis is a basic example.`} />,
}

export const Formatting: Story = {
  render: () => {
    const content = `
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
`
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <Viewer source={content} />
        <details>
          <summary>Show source</summary>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{content}</pre>
        </details>
      </div>
    )
  },
}
