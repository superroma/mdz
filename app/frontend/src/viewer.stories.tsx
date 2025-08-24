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
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Viewer source={String(formattingMd)} />
      <details>
        <summary>Show source (Formatting.md)</summary>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
          {String(formattingMd)}
        </pre>
      </details>
    </div>
  ),
}
