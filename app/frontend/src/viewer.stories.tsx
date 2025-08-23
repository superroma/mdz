import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Viewer } from './viewer'

const meta: Meta<typeof Viewer> = {
  title: 'Viewer',
  component: Viewer,
}
export default meta
type Story = StoryObj<typeof Viewer>

export const Basic: Story = {
  render: () => <Viewer path="Welcome" />,
}
