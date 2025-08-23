import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Editor } from './editor'

const meta: Meta<typeof Editor> = {
  title: 'Editor',
  component: Editor,
}
export default meta
type Story = StoryObj<typeof Editor>

export const Basic: Story = {
  render: () => <Editor path="Welcome" />,
}
